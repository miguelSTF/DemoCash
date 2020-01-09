/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('CapturaMasivaController', CapturaMasivaController);

  /* @ngInject */
  function CapturaMasivaController($scope, Api, CatalogosCli, Utils, Parametros, Catalogos, Recepcion, Log, $mdMedia, $mdDialog, Relaciones, ValidateSession) {
    var vm = this;
    vm.loading = true;
    vm.searchDepa = '';
    vm.searchCepto = '';
    vm.usuario = {};
    vm.departamentos = [];
    vm.departamentoPorUsuario = [];
    vm.listOperExcel = [];
    vm.usuario.IdUsuario = sessionStorage.getItem('IdUsuario');

    vm.init = function() {
      var validate = ValidateSession.validate(52);
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
                vm.loading = false;
              }
            });
            vm.loading = false;
          }).catch(function(error) {
            console.log('Error: ' + JSON.stringify(error));
            Utils.showToast('Error al obtener departamento del usuario!!');
            vm.loading = false;
          });

          Catalogos.query({
            'name': 'banco',
            'orderby': 'NombreCorto'
          }).$promise.then(function(respuestaBanco){
            vm.listBancos = respuestaBanco;
          });

          Catalogos.query({
            'name': 'Contraparte',
            'IdClaveExterna':'SPEI_TERCEROS'
          }).$promise.then(function(infoContra) {
            if(infoContra.length === 0){
              Utils.showToast('No existe la contraparte Terceros');
              vm.contraparteNExist = false;
            }else{
              vm.contraTercetos = infoContra[0];

              CatalogosCli.query({
                'prefix': 'CuentasContraparte',
                'name': 'IdContraparte',
                'id': vm.contraTercetos.IdContraparte
              }).$promise.then(function(data) {
                if(data.length === 0){
                  Utils.showToast('La contraparte Terceros no tiene cuentas registradas');
                }else{
                  vm.cuentaTerceros = data;
                }
              });
            }
          });

          Parametros.query({
            'name': 'Configuracion'
          }).$promise.then(function(data) {
            vm.FechaOperacion = data.filter(function(n) {
              return n.Nombre === 'FechaOperacion';
            })[0];
            vm.fecha = new Date(vm.FechaOperacion.Valor.substring(0,10));
            vm.fechaValor = new Date(vm.FechaOperacion.Valor.substring(0,10));
          });
        }
      }else{
        location.href = '#/login';
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
      vm.loading = false;
    };

    $scope.ExcelExport= function (event) {
      vm.loading = true;
      var input = event.target;
      var reader = new FileReader();
      if (input.files[0] !== undefined) {
        vm.nameArchivo = input.files[0].name;
        var valueExt = input.value;
        if(valueExt.match(/\.(xlsx)|(xls)$/) ){
          reader.onload = function(){
            var fileData = reader.result;
            var arr = String.fromCharCode.apply(null, new Uint8Array(fileData));
            var cfb = XLS.read(btoa(arr), {type: 'base64'});
            cfb.SheetNames.forEach(function(sheetName){
              vm.listOperExcel = XLSX.utils.sheet_to_row_object_array(cfb.Sheets[sheetName]);
            });
            Utils.showToast('Archivo cargado correctamente');
            vm.validateOpers();
          };
          reader.readAsArrayBuffer(input.files[0]);
        }else{
          vm.loading = false;
          Utils.showToast('El archivo no tiene una extensión valida');
        }
      }
      vm.loading = false;
    };

    vm.validateOpers = function(){
      vm.loading = true;
      vm.error = false;
      vm.textError = '';
      vm.totalImport = 0.00;
      vm.numLine = 1;
      vm.NumErrors = 0;
      vm.bancoSelect = {};
      vm.listOperExcel.forEach(function (oper){
        vm.numLine++;
        if (oper.Monto === undefined || Number(oper.Monto) === 0.00 || Number(oper.Monto) < 0.00 || isNaN(Number(oper.Monto))) {
          vm.error = true;
          vm.NumErrors++;
          vm.textError = vm.textError + 'Error en la línea ' + vm.numLine + ':' + ' Monto inválido. \n';
        }
        if (oper.Beneficiario === undefined || oper.Beneficiario === '' ) {
          vm.error = true;
          vm.NumErrors++;
          vm.textError = vm.textError + 'Error en la línea ' + vm.numLine + ':' + ' El beneficiario es requerido. \n';
        }
        if (oper.Banco_Beneficiario === undefined || oper.Banco_Beneficiario === '') {
          vm.error = true;
          vm.NumErrors++;
          vm.textError = vm.textError + 'Error en la línea ' + vm.numLine + ':' + ' El banco beneficiario es requerido. \n';
        }else{
          vm.existBancoBeneficiario = false;
          vm.listBancos.forEach(function (banco){
            if (banco.NombreCorto === oper.Banco_Beneficiario) {
              vm.existBancoBeneficiario = true;
              oper.IdBancoBene = banco.IdBanco;
              vm.bancoSelect = banco;
            }
          })
          if (vm.existBancoBeneficiario === false) {
            vm.error = true;
            vm.NumErrors++;
            vm.textError = vm.textError + 'Error en la línea ' + vm.numLine + ':' + ' Banco beneficiario no registrado. \n';
          }else{
            if (oper.Clabe === undefined || oper.Clabe === '') {
              vm.error = true;
              vm.NumErrors++;
              vm.textError = vm.textError + 'Error en la línea ' + vm.numLine + ':' + ' La clabe es requerida. \n';
            }else{
              var result = validaCuentaBeneficiario(vm.bancoSelect, oper.Clabe);
              if (result !== '') {
                vm.error = true;
                vm.NumErrors++;vm.NumErrors++;
                vm.textError = vm.textError + 'Error en la línea ' + vm.numLine + ':' + result + ' \n'
              }
            }
          }
        }
        if (oper.Descripcion === undefined || oper.Descripcion === '') {
          vm.error = true;
          vm.NumErrors++;
          vm.textError = vm.textError + 'Error en la línea ' + vm.numLine + ':' + ' La descripción es requerida. \n';
        }
        if (oper.Referencia_Numerica === undefined || oper.Referencia_Numerica === '') {
          vm.error = true;
          vm.NumErrors++;
          vm.textError = vm.textError + 'Error en la línea ' + vm.numLine + ':' + ' La referencia numérica es requerida. \n';
        }else if (isNaN(Number(oper.Referencia_Numerica)) || Number(oper.Referencia_Numerica) > 9999999){
          vm.error = true;
          vm.NumErrors++;
          vm.textError = vm.textError + 'Error en la línea ' + vm.numLine + ':' + ' Referencia numérica inválida. \n';
        }
        vm.totalImport = oper.Monto === undefined || Number(oper.Monto) > 0.00 ? vm.totalImport + Number(oper.Monto) : vm.totalImport;
      });
      vm.NumErrors++;
      vm.textError = vm.textError === '' ? 'El archivo es correcto, para continuar con la carga de operaciones presione el botón de ENVIAR.' : vm.textError + 'Verifique el archivo y vuelva a realizar la carga.';
      vm.totalOpers = vm.listOperExcel.length;
      vm.viewResult();
    };

    vm.createListOper = function() {
      vm.loading = true;
      vm.orden = [];
      vm.Payload = {};
      vm.numOperCorrect = 0;
      vm.numOperIncorrect = 0;
      vm.listOperExcel.forEach(function (oper){
        vm.Payload = {};
        vm.Payload.ClaveRastreo = '';
        vm.Payload.ConceptoPago = oper.Descripcion;
        vm.Payload.CtaBen = oper.Clabe;
        vm.Payload.InstitucionBen = oper.IdBancoBene;
        vm.Payload.Iva = 0.00;
        vm.Payload.MuestraCuenta = 1;
        vm.Payload.NomBen = oper.Beneficiario;
        vm.Payload.RfcBen = '';
        vm.Payload.Sistema = 'IKOS CASH';
        vm.Payload.SucursalBen = 0;
        vm.Payload.TipoCtaBen = 40;
        vm.Payload.TipoOperacion = 1;
        vm.Payload.TipoPago = 5;
        vm.Payload.Topologia = 'T';
        vm.Payload.Usuario = 'Apesa';
        vm.orden.push({
          'Header': {
            'IdUsuario': vm.usuario.IdUsuario,
            'IdDepartamento': vm.departamento.IdDepartamento,
            'IdConcepto': vm.concepto.IdConcepto,
            'ClaveCliente': vm.contraTercetos.IdClaveExterna,
            'Cuenta': vm.cuentaTerceros[0].Cuenta,
            'IdCuentaContraparte': vm.cuentaTerceros[0].IdCuentaContraparte,
            'FechaOperacion': vm.fecha,
            'FechaValor': vm.fechaValor,
            'ViaPago': 2,
            'Monto': oper.Monto,
            'Referencia': oper.Referencia_Numerica,
            'ConceptoPago': vm.concepto.Nombre,
            'Origen':'M'
          },
          'Payload': vm.Payload
        });
      });

      Api.getList({
        'name': 'recepcion/message'
      }, vm.orden)
      .$promise
      .then(function(data) {
        data.forEach(function(elem) {
          if (elem.Code === 0) {
            vm.loading = false;
            vm.numOperCorrect++;
            vm.Close();
          } else {
            vm.loading = false;
            vm.numOperIncorrect++
            console.log(elem.ErrorMesage);
            vm.Close();
          }
        });
        var toast = vm.numOperIncorrect === 0 ? 'Se registraron ' + vm.numOperCorrect + ' operaciones correctas' : 'Se registraron ' + vm.numOperCorrect + 'operaciones correctas' + 'y ' + vm.numOperIncorrect + ' incorrectas';
        Utils.showToast(toast);
      }).catch(function(error) {
        Utils.showToast('Error al insertar la operación!!');
        console.log('Error' + JSON.stringify(error));
        vm.loading = false;
      });
    };

    function validaCuentaBeneficiario(banco, ctaBen){
      var generarOrden= validaCuenta(40, ctaBen, banco);
      if(generarOrden !== ''){
        return generarOrden;
      }
      return '';
    }

    function validaCuenta (tipoCuenta, cuenta, banco){
      var errorTamano = ' El tamaño de la cuenta no corresponde al tipo de cuenta';
      
      if(/^[0-9]{18}$/.test(cuenta) === false){
        return errorTamano;
      }
      var digitosCuenta = validaCesif(cuenta, banco);
      if(!digitosCuenta){
        return ' La cuenta no corresponde con el banco beneficiario';
      }

      var digitoVerificador = validaDigitoVerificador(cuenta);
      if(!digitoVerificador){
        return ' El dígito verificador es incorrecto';
      }
      return '';
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

    vm.viewResult = function () {
      vm.loading = true;
      var templateUriPage = './views/templates/viewResultExcel.html';
      var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && customFullscreen;
      $mdDialog.show({
        templateUrl: templateUriPage,
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        clickOutsideToClose: false,
        fullscreen: useFullScreen
      });
      vm.loading = false;
    };

    vm.Close = function () {
      $mdDialog.hide();
    };
  }
})();
