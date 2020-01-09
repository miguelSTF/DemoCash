/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('MensajeController', MensajeController);

  /* @ngInject */
  function MensajeController($scope, $filter, Parametros, Catalogos, Relaciones, Limites, Api, CatalogosCli, CatalogosContraparte, Utils, EnumVia, Ordenes, ValidateSession) {

    var vm = this;
    vm.maxLengthContra = 120;
    vm.maxLengthCuenta = 30;
    vm.contraparteNExist = false;
    vm.loading = true;
    vm.searchDepa = '';
    vm.searchCepto = '';
    vm.searchTerm = '';
    vm.usuario = {};
    vm.clientesPorDepto = [];
    vm.departamentos = [];
    vm.departamentoPorUsuario = [];
    vm.usuario.IdUsuario = sessionStorage.getItem('IdUsuario');
    vm.contraparteNExist = false;

    vm.Payload = {};
    vm.TipoPago = {};
    vm.conceptoPorUsuario = [];
    vm.diasInhabiles = [];
    vm.Iva = 0;
    vm.tiposCuentasBen = [{Id:'40',Nombre:'CLABE'},{Id:'3',Nombre:'Tarjeta Débito'},{Id:'10',Nombre:'Telefonia Movil'}];

    Parametros.query({
      'name': 'Configuracion'
    }).$promise.then(function(data) {
      vm.FechaOperacion = data.filter(function(n) {
        return n.Nombre === 'FechaOperacion';
      })[0];
      vm.fecha = new Date(vm.FechaOperacion.Valor.substring(0,10));
      vm.fechaValor = new Date(vm.FechaOperacion.Valor.substring(0,10));
      vm.minDate = new Date(
        vm.fecha.getFullYear(),
        vm.fecha.getMonth(),
        vm.fecha.getDate()
      );
      vm.IvaObj = data.filter(function(n){
        return n.Nombre === 'PorcentajeIVA';
      })[0];
      vm.Iva = parseFloat(vm.IvaObj.Valor);

    });

    Catalogos.query({
      'name': 'DiasInhabiles'
    }).$promise.then(function(data) {
      vm.diasIn = data;
      vm.diasIn.forEach(function(item){
        vm.diasInhabiles.push(new Date(item.Fecha).toString());
      });
    });

    vm.init = function() {
      var validate = ValidateSession.validate(18);
      if (validate){
        if (sessionStorage.length > 0) {
          Relaciones.query({
            'name': 'usuario',
            'id': vm.usuario.IdUsuario,
            'relation': 'Departamento'
          }).$promise.then(function(data) {
            vm.departamentoPorUsuario = data;
            Catalogos.query({
              'name': 'departamento',
              'orderby':'Nombre'
            }).$promise.then(function(response) {
              vm.departamentos = response;
              if (vm.departamentoPorUsuario.length === 0) {
                Utils.showToast('El usuario no tiene departamentos asignados!!');
              } else {
                vm.departamento = vm.departamentos[0];
                vm.DepartamentoChange(true);
              }
            });
            vm.loading = false;
          }).catch(function(error) {
            console.log('Error: ' + JSON.stringify(error));
            Utils.showToast('Error al obtener departamento del usuario!!');
            vm.loading = false;
          });
        }
      }else{
        location.href = '#/login';
      }
    };

    vm.onlyWeekendsPredicate = function(date) {
      return Utils.disableDays(date, vm.diasInhabiles);
    };

    vm.clearSearchTerm = function() {
      vm.cuenta = null;
      vm.searchTerm = '';
      if(vm.cliente !== null && vm.cliente !== undefined){
        Limites.query({
          'IdCatalogo': 4,
          'IdEspecifico': vm.cliente.IdContraparte
        })
        .$promise.then(function(data) {
          vm.clienteLimites = data;
        });
        vm.clientes.map(function(item) {
          if (item !== undefined) {
            if (item.IdContraparte === vm.cliente.IdContraparte) {
              vm.clienteInfo = item;
            }
          }
        });
      }
      if (vm.clienteInfo !== undefined || vm.idContraTer !== undefined) {
        CatalogosCli.query({
          'prefix': 'CuentasContraparte',
          'name': 'IdContraparte',
          'id': vm.contraparteNExist ? vm.idContraTer : vm.clienteInfo.IdContraparte
        }).$promise.then(function(data) {
            if(vm.contraparteNExist){
              if(data.length === 0){
                Utils.showToast('La contraparte Terceros no tiene cuentas registradas');
                vm.contraparteNExist = false;
              }else{
                vm.cuentaTerc = data[0].Cuenta;
              }
            }else{
              vm.payloadString.forEach(function(payloadItem){
                if(payloadItem.title === 'MuestraCuenta' && payloadItem.default === '1'){
                  vm.showCuenta = vm.concepto.Emite === 1;
                }
              });
              vm.clienteInfo.Cuentas = data;
              vm.cuentas = data;
              if(vm.showCuenta){
                if(vm.clienteInfo.Cuentas.length === 1){
                  vm.cuenta = vm.clienteInfo.Cuentas[0];
                  if(vm.contraparteNExist === false){
                    vm.Payload.CtaBen = vm.cuenta.Cuenta;
                    vm.Payload.InstitucionBen = vm.cuenta.IdBanco;
                    vm.Payload.TipoCtaBen = vm.cuenta.TipoCuenta;
                  }
                }
              }else{
                if (vm.clienteInfo.Cuentas.length > 0){
                  vm.cuenta = vm.clienteInfo.Cuentas[0];
                  if(vm.contraparteNExist === false){
                    vm.Payload.CtaBen = vm.cuenta.Cuenta;
                    vm.Payload.InstitucionBen = vm.cuenta.IdBanco;
                    vm.Payload.TipoCtaBen = vm.cuenta.TipoCuenta;
                  }
                }
              }
            vm.Payload.NomBen = vm.clienteInfo.Nombre.length > vm.maxLengthContra ? vm.clienteInfo.Nombre.substring(0,vm.maxLengthContra) : vm.clienteInfo.Nombre;
            vm.Payload.RfcBen = vm.clienteInfo.Rfc;
          }
        });
      }
    };

    vm.handleKeyup = function(ev) {
      ev.stopPropagation();
    };

    vm.actualizarInfoCuenta = function(){
      vm.Payload.InstitucionBen = vm.cuenta.IdBanco;
      vm.Payload.CtaBen = vm.cuenta.Cuenta;
      vm.Payload.TipoCtaBen = vm.cuenta.TipoCuenta;
    };

    vm.Create = function(){
      if(vm.Payload === undefined){
        vm.Payload = {};
      }
      vm.loading = true;
      vm.Payload.ClaveRastreo = '';
      if (vm.TipoPago.Id !== undefined) {
        vm.Payload.TipoPago = vm.TipoPago.Id;
      }
      var ErrorMesage = '';

      if((vm.Spei1 || vm.Spei99o5) && vm.showCuenta){
        ErrorMesage = validarCuentas();
        llenaCamposOpcionalesSpei();
      }

      if(vm.Swift202 || vm.Swift210){
        llenaCamposOpcionalesSwift202();
      }

      if(vm.Spei1 || vm.Swift202 || vm.Swift210){
        if(vm.clientes !== null && vm.clientes.length > 0){
          vm.clientes.map(function(cliente){
            if(cliente.IdClaveExterna === 'SPEI_TERCEROS'){
              vm.cliente = cliente;
              vm.clienteInfo = vm.cliente;
            }
          });

          CatalogosCli.query({
            'prefix': 'CuentasContraparte',
            'name': 'IdContraparte',
            'id': vm.clienteInfo.IdContraparte
          }).$promise.then(function(data) {
            vm.clienteInfo.Cuentas = data;
            vm.cuentas = data;
            if (vm.clienteInfo.Cuentas.length > 0){
              vm.cuenta = vm.clienteInfo.Cuentas[0];
            }
            if(ErrorMesage === ''){
              vm.CreateOpe();
            }else{
              Utils.showToast(ErrorMesage);
              vm.loading = false;
            }
          });
        }else{
          Utils.showToast('No se puede registrar la operación, no se encontró contraparte relacionada al concepto');
          vm.loading = false;
        }
      }else{
        if(ErrorMesage === ''){
          vm.CreateOpe();
        }else{
          Utils.showToast(ErrorMesage);
          vm.loading = false;
        }
      }
    };

    vm.CreateOpe = function() {
      vm.loading = true;
      vm.orden = [{
        'Header': {
          'IdUsuario': vm.usuario.IdUsuario,
          'IdDepartamento': vm.departamento.IdDepartamento,
          'IdConcepto': vm.concepto.IdConcepto,
          'ClaveCliente': vm.clienteInfo === undefined ||  vm.clienteInfo === null ? 'SPEI_TERCEROS' : vm.clienteInfo.IdClaveExterna,
          'Cuenta': vm.cuenta === undefined || vm.cuenta === null ? vm.contraparteNExist ? vm.cuentaTerc : vm.concepto.Emite === 1 ? 0 : '' : vm.cuenta.Cuenta,
          'FechaOperacion': vm.fecha,
          'FechaValor': vm.fechaValor,
          'ViaPago': vm.via,
          'Monto': vm.monto,
          'Referencia': vm.referenciaNum,
          'ConceptoPago': vm.concepto.Nombre,
          'Origen':'M'
        },
        'Payload': vm.Payload
      }];

      Api.getList({
        'name': 'recepcion/message'
      }, vm.orden)
      .$promise
      .then(function(data) {
        data.forEach(function(elem) {
          if (elem.Code === 0) {
            vm.loading = false;
            Utils.showToast('Operación registrada correctamente.');
            vm.clienteInfo = undefined;
            vm.cuenta = undefined;
          } else {
            vm.loading = false;
            Utils.showToast(elem.ErrorMesage);
          }
        });
      }).catch(function(error) {
        Utils.showToast('Error al insertar la operación!!');
        console.log('Error' + JSON.stringify(error));
      });
      vm.limpiarPantalla(4);
    };

    function llenaCamposOpcionalesSwift202(){
      if(vm.Payload.IndicacionFecha === undefined){
        vm.Payload.IndicacionFecha = '';
      }
      if(vm.Payload.PlazaOrd === undefined){
        vm.Payload.PlazaOrd = '';
      }

      if(vm.Payload.PlazaEmisor === undefined){
        vm.Payload.PlazaEmisor = '';
      }
      if(vm.Payload.PlazaInter === undefined){
        vm.Payload.PlazaInter = '';
      }
      if(vm.Payload.CtaBancoPlaza === undefined){
        vm.Payload.CtaBancoPlaza = '';
      }
      if(vm.Payload.PlazaBen === undefined){
        vm.Payload.PlazaBen = '';
      }
      if(vm.Payload.PlazaRecept === undefined){
        vm.Payload.PlazaRecept = '';
      }

    }

    function llenaCamposOpcionalesSpei(){
      if(vm.Spei1){
        if(vm.Payload.RfcOrd === undefined){
          vm.Payload.RfcOrd = '';
        }
      }
      if(vm.Payload.RfcBen === undefined){
          vm.Payload.RfcBen = '';
      }
    }

    function validarCuentas() {
      var errorMessage = '';
      if(vm.Spei1){
        errorMessage = validaCuentaOrdenante();
      }
      if(errorMessage === ''){
        errorMessage = validaCuentaBeneficiario();
      }
      return errorMessage;
    }

    function validaCuentaOrdenante() {
      var bancoToSearch = {
        'Id': 0,
        'Casfin': vm.CesifLocal};

         var generarOrden= validaCuenta(vm.Payload.TipoCtaOrd, vm.Payload.CtaOrd,bancoToSearch);
        if(generarOrden !== ''){
          return 'Error en la cuenta del ordenante,' + generarOrden + ', no se puede aceptar la operación';
        }
        return '';
    }

    function validaCuentaBeneficiario(){
      var bancoToSearch={};
      for(var x = 0; x<vm.listBancos.length; x++){
        if(vm.listBancos[x].Id === parseInt(vm.Payload.InstitucionBen)){
          bancoToSearch = vm.listBancos[x];
          break;
        }
      }

      var generarOrden= validaCuenta(vm.Payload.TipoCtaBen, vm.Payload.CtaBen,bancoToSearch);
      if(generarOrden !== ''){
        return 'Error en la cuenta del beneficiario,' + generarOrden + ', no se puede aceptar la operación';
      }
      return '';
    }

    function validaCuenta (tipoCuenta, cuenta, banco){
      var errorTamano = ' el tamaño de la cuenta no corresponde al tipo de cuenta';

      if(tipoCuenta == '10'){
        if(/^[0-9]{10}$/.test(cuenta)){
          return '';
        }
        return errorTamano;
      }
      else if(tipoCuenta == '3'){
        if(/^[0-9]{16}$/.test(cuenta)){
          return '';
        }
        return errorTamano;
      }
      else{
        if(/^[0-9]{18}$/.test(cuenta) === false){
          return errorTamano;
        }
         var digitosCuenta = validaCesif(cuenta, banco);
         if(!digitosCuenta){
           return ' la cuenta no corresponde con la institución ';
         }

         var digitoVerificador = validaDigitoVerificador(cuenta);
         if(!digitoVerificador){
           return ' el dígito verificador es incorrecto';
         }
         return '';
      }
    }

    function validaCesif(cuenta, banco){
      var digitosCuenta = cuenta.substr(0,3);
      var digitosCasfin = banco.Casfin.substr(3,3);
      return digitosCuenta === digitosCasfin;
    }

    function validaDigitoVerificador(cuenta){
      var ponderacion = [3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7];
      var cuentaArray = cuenta.split('');
      var digitoVerificador= 0;

      for(var x= 0; x<17; x++){
        var resultadoMultiplicacion = 0;
        resultadoMultiplicacion = ponderacion[x] * cuentaArray[x];
        resultadoMultiplicacion = resultadoMultiplicacion % 10;
        digitoVerificador += resultadoMultiplicacion;
      }
      digitoVerificador = (10 - (digitoVerificador % 10)) % 10;

      if(String(digitoVerificador) === cuentaArray[17]){
        return true;
      }
      return false;
    }

    vm.limpiarPantalla = function(limpiar) {
      switch (limpiar) {
        case 1:
          //limpiar de departamento para abajo
          vm.cuentas = null;
          vm.cliente = null;
          vm.concepto = null;
          vm.monto = null;
          vm.montoSinIva = null;
          vm.referenciaNum = null;
          vm.TipoPago = {};
          vm.payloadString = [];
          vm.showCuenta = false;
          vm.clientes = null;
          vm.requiereIva = false;
          vm.RequiereSucursal = false;
          vm.RequierePlaza = false;
          break;
        case 2:
          //limpia de concepto para abajo
          vm.cuentas = null;
          vm.cliente = null;
          vm.monto = null;
          vm.montoSinIva = null;
          vm.Payload.Iva = null;
          vm.referenciaNum = null;
          vm.TipoPago = {};
          vm.payloadString = [];
          vm.showCuenta = false;
          vm.clientes = null;
          vm.requiereIva = false;
          vm.contraparteNExist = false;
          break;
        case 3:
          //limpia de beneficiario para abajo
          vm.monto = null;
          vm.montoSinIva = null;
          vm.Payload.Iva = null;
          vm.referenciaNum = null;
          break;
        case 4:
          //limpia pantalla completa
          vm.departamento = null;
          vm.vialiquidacion = null;
          vm.cuentas = null;
          vm.cliente = null;
          vm.concepto = null;
          vm.monto = null;
          vm.referenciaNum = null;
          vm.showCuenta = false;
          vm.payloadString = [];
          vm.requiereIva = false;
          vm.RequiereSucursal = false;
          vm.RequierePlaza = false;
          break;
        case 5:
        vm.cuentas = [];
        vm.cliente = null;
        vm.clienteInfo = null;
        vm.cuenta = null;
        vm.Payload.NomBen = null;
        vm.Payload.InstitucionBen = null;
        vm.Payload.TipoCtaBen = null;
        vm.Payload.CtaBen = null;
        vm.Payload.RfcBen = null;
        if(vm.contraparteNExist === false){
          Catalogos.query({
            'name': 'Contraparte',
            'IdClaveExterna':'SPEI_TERCEROS'
          }).$promise.then(function(infoContra) {
            if(infoContra.length === 0){
              Utils.showToast('No existe la contraparte Terceros');
              vm.contraparteNExist = false;
            }else{
              vm.idContraTer = infoContra[0].IdContraparte;
              vm.clearSearchTerm();
            }
          });
        }
      }
    };

    vm.DepartamentoChange = function(init) {
      vm.loading = true;
      Catalogos.query({
        'name': 'Concepto',
        'Activo': 3,
        'orderby':'Nombre'
      }).$promise.then(function(respuesta) {
        vm.conceptos = [];
        respuesta.forEach(function(item){
          if(item.Activo === 2){
            vm.conceptos.push(item);
          }
        });


      }).catch(function(response) {
        Utils.showToast('Error al obtener conceptos!!');
        console.error('Error: ' + JSON.stringify(response));
        vm.loading = false;
      });

      Relaciones.query({
          'name': 'Departamento',
          'id': vm.departamento.IdDepartamento,
          'relation': 'Concepto'
        })
        .$promise.then(function(data) {
          vm.conceptoPorDepartamento = data;
          if (data.length === 0  && !init) {
            Utils.showToast('El departamento no tiene conceptos asociados');
          }
        }).catch(function(error) {
          Utils.showToast('Error al obtener conceptos del departamento!!');
          console.error('Error: ' + JSON.stringify(error));
          vm.loading = false;
        });

      Relaciones.query({
          'name': 'Usuario',
          'id': vm.usuario.IdUsuario,
          'relation': 'Concepto'
        })
        .$promise.then(function(data) {
          if (data !== undefined && data.length > 0) {
            vm.conceptoPorUsuario = data;
            if (vm.conceptoPorUsuario.length === 0) {
              Utils.showToast('El usuario no tiene conceptos asociados');
            }
          }
        }).catch(function(error) {
          Utils.showToast('Error al obtener conceptos del usuario!!');
          console.error('Error: ' + JSON.stringify(error));
          vm.loading = false;
        });
      vm.limpiarPantalla(1);
      vm.loading = false;
    };

    vm.ConceptoChange = function() {
      if(vm.concepto.CapturaMismoDia === 0){
        vm.diasInhabiles.push(vm.fecha.toString());
        vm.onlyWeekendsPredicate(vm.fecha);
        Catalogos.query({
          'name': 'calcularFechaMinima',
          'Fecha':vm.fecha
        }).$promise.then(function(respuesta) {
          vm.fechaValor = new Date(respuesta[0]);
        }).catch(function(response) {
          Utils.showToast('Error al obtener fecha minima!!');
          console.error('Error: ' + JSON.stringify(response));
        });
      }else{
        var index = vm.diasInhabiles.indexOf(vm.fecha.toString());
        if(index > -1){
          vm.diasInhabiles.splice(index);
          vm.onlyWeekendsPredicate(vm.fecha);
          vm.fechaValor = new Date(vm.fecha);
        }
      }
      vm.Payload = {};
      vm.loading = true;
      CatalogosCli.query({
          'prefix': 'catalogos',
          'name': 'CuentaCorriente',
          'IdCuentaCorriente': vm.concepto.IdCuentaCorriente
        })
        .$promise.then(function(data) {
          vm.cuentaCorriente = data;
          if (vm.cuentaCorriente.length > 0) {
            vm.via = vm.cuentaCorriente[0].IdViaLiquidacion;
            vm.maxLengthContra = vm.via === 2 ? 40 : 120;
            vm.maxLengthCuenta = vm.via === 2 ? 20 : 30;
          }
          vm.requiereIva = vm.concepto.DesglosaIva > 0;
          vm.ViasChange();
        }).catch(function(error) {
          Utils.showToast('Error al obtener via de liquidación!!');
          console.error('Error: ' + JSON.stringify(error));
        });
      vm.buscaRelacionContraparte();
      vm.loading = false;
      vm.limpiarPantalla(2);
    };

    vm.buscaRelacionContraparte = function() {
      CatalogosContraparte.query({
          'idConcepto': vm.concepto.IdConcepto,
          'emite': vm.concepto.Emite
        }).$promise.then(function(data) {
          if (data.length === 0 && vm.concepto.PermiteContraNoRegistrada === 0) {
            Utils.showToast('No hay contrapartes asociadas al concepto seleccionado!!');
          } else {
            vm.clientes = data;
            vm.clientes.map(function(cli){
              cli.show = cli.IdClaveExterna === 'SPEI_TERCEROS';
            });
            vm.loading = false;
          }
        })
        .catch(function(error) {
          Utils.showToast('Error al obtener contrapartes!!');
          console.error('Error: ' + JSON.stringify(error));
        });
    };

    vm.GetSucursales = function(){
      vm.Payload.SucursalBen = 0;
      Catalogos.query({
          'name': 'Sucursal',
          'orderby': 'Nombre'
        }).$promise.then(function(respuestaSucursal){
          vm.Sucursales = respuestaSucursal;
        });
    };

    vm.GetPlazas = function(){
      vm.Payload.PlazaBen = 0;
      Catalogos.query({
        'name': 'Plaza',
        'orderby': 'Nombre'
      }).$promise.then(function(respuestaPlaza){
        vm.Plazas = respuestaPlaza;
      });
    };

    vm.CambioSucursalPlaza = function(){
      var sucursalElegida = '';
      if (vm.RequiereSucursal) {
        vm.Sucursales.forEach(function(item){
          if(item.IdSucursal === vm.Payload.SucursalBen){
            sucursalElegida = item.Nombre;
          }
        });
      }

      var plazaElegida = '';
      if (vm.RequierePlaza) {
        vm.Plazas.forEach(function(item){
          if(item.IdPlaza === vm.Payload.PlazaBen){
            plazaElegida = item.Nombre;
          }
        });
      }

      if(vm.TieneConceptoPago){
        vm.Payload.ConceptoPago = vm.concepto.Descripcion + ' ' + sucursalElegida + ' ' +  plazaElegida;
      }
    };

    vm.ViasChange = function() {
      delete vm.Payload;
      vm.Payload = {};
      vm.payloadString = [];
      Ordenes.get({
          'name': 'payloads',
          'via': vm.via,
          'tipo': vm.concepto.IdTipoMensaje
        })
        .$promise.then(function(respuesta) {
          vm.listBancos = [];
          if(respuesta.IdVia !== 1){
            vm.Spei99o5 = (respuesta.Tipo === 99 || respuesta.Tipo === 5) && respuesta.IdVia === 2;
            vm.Spei1 = respuesta.Tipo === 1 && respuesta.IdVia === 2;

            vm.Swift202 = respuesta.Tipo === 1 && respuesta.IdVia === 9;
            vm.Swift210 = respuesta.Tipo === 2 && respuesta.IdVia === 9;

            if(respuesta.IdVia === 2){
              vm.TieneConceptoPago = true;
            }
            else
            {
              vm.TieneConceptoPago = false;
            }


            Catalogos.query({
                'name': 'banco',
                'orderby': 'NombreCorto'
              }).$promise.then(function(respuestaBanco){
                if(respuestaBanco.length >0){
                    respuestaBanco.forEach(function(item){
                      vm.bancoToPayload = {};
                      vm.bancoToPayload.Id = item.IdBanco;
                      vm.bancoToPayload.Nombre = item.NombreCorto;
                      vm.bancoToPayload.Casfin = item.Casfin;
                      vm.listBancos.push(vm.bancoToPayload);
                  });

                  vm.payloadToApply= JSON.parse(respuesta.EstructuraString);

                  vm.payloadToApply.forEach(function(item){
                    if(item.element === 'select' && item.ngModel.indexOf('Payload.Institucion')> 0){
                      item.options = vm.listBancos;
                    }
                  });
                  vm.payloadString = vm.payloadToApply;
                  vm.payloadString.forEach(function(payloadItem){
                      vm.showCuenta = false;
                      if(payloadItem.title === 'MuestraCuenta' && payloadItem.default === '1'){
                        vm.showCuenta = vm.concepto.Emite === 1;
                      }
                  });
                }
              });

              Catalogos.query({
                'name': 'configuracion'
              }).$promise.then(function(respuesta){
                respuesta.forEach(function(item){
                  if(item.Nombre === 'ClaveInstitucion'){
                    vm.CesifLocal = item.Valor;
                  }
                });
              });

              if(respuesta.IdVia === 2){
                vm.Payload.ConceptoPago = vm.concepto.Descripcion;
              }

          }else{
          vm.payloadString = JSON.parse(respuesta.EstructuraString);
          vm.payloadString.forEach(function(payloadItem){
              vm.showCuenta = false;
              if(payloadItem.title === 'MuestraCuenta' && payloadItem.default === '1'){
                vm.showCuenta = true;
              }
          });
          vm.Spei1= false;
          vm.Spei99o5= false;
          vm.Swift202 = false;
          vm.Swift210 = false;
        }

        if(vm.concepto.RequiereSucursal === 1){
          vm.GetSucursales();
          vm.RequiereSucursal = true;
        }
        else{
            vm.RequiereSucursal = false;
        }
        if(vm.concepto.RequierePlaza === 1){
          vm.GetPlazas();
          vm.RequierePlaza = true;
        }
        else{
          vm.RequierePlaza = false;
        }
        }).catch(function(error) {
          Utils.showToast('Error al obtener información!!');
          console.error('Error: ' + JSON.stringify(error));
        });
    };

    vm.DesglosaIva = function (){
      if(vm.Payload === undefined){
        vm.Payload = {};
      }
      if(vm.requiereIva === true){
        vm.montoSinIva = parseFloat((Math.abs(vm.monto) / (1 + (vm.Iva / 100))).toFixed(2));
        vm.Payload.Iva = parseFloat((Math.abs(vm.monto) - vm.montoSinIva).toFixed(2));
      }
      else{
        vm.Payload.Iva = '0';
      }
    };

    vm.CalculaIva = function (){
      if(vm.Payload === undefined){
        vm.Payload = {};
      }
      if(vm.requiereIva === true){
        vm.Payload.Iva = parseFloat((Math.abs(vm.montoSinIva) * (vm.Iva / 100)).toFixed(2));
        vm.monto = parseFloat((parseFloat(Math.abs(vm.montoSinIva)) + parseFloat(vm.Payload.Iva)).toFixed(2));
      }
      else{
        vm.Payload.Iva = '0';
      }
    };

    $scope.$on('$locationChangeStart', function(event) {
      if (vm.departamento && sessionStorage.CerrandoSesion === undefined) {
        var answer = window.confirm('Hay cambios pendientes de guardar ¿Deseas descartarlos?');
        if (!answer) {
          event.preventDefault();
        }
      }
      return;
    });
  }
})();
