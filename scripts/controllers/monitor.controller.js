/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('MonitorController', MonitorController);

  /* @ngInject */
  function MonitorController($scope, Sender, Ordenes, Utils, Parametros, Catalogos, Recepcion, Log, $mdMedia, $mdDialog, Relaciones, CatalogosCli, ValidateSession) {
    var vm = this;
    vm.loading = true;
    vm.fechaHistorico = false;
    vm.datos = [];
    $scope.descripcion = '';
    $scope.motivo = 0;
    vm.Iva = 0;
    vm.incluirCancel = false;
    vm.idUser = parseInt(sessionStorage.getItem('IdUsuario'));
    vm.tiposCuentasBen = [{Id:'40',Nombre:'CLABE'},{Id:'3',Nombre:'Tarjeta Débito'},{Id:'10',Nombre:'Telefonia Movil'}];

    Catalogos.query({
      'name': 'DiasInhabiles'
    }).$promise.then(function(data) {
      vm.diasInhabiles = [];
      data.forEach(function(item){
        vm.diasInhabiles.push(new Date(item.Fecha).toString());
      });
    });

    vm.init = function() {
      var validate = ValidateSession.validate(19);
      if (validate){
        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data) {
          vm.FechaOperacion = data.filter(function(n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
          vm.fecha = new Date(vm.FechaOperacion.Valor);
          vm.fechaOper = vm.fecha;
          vm.maxDate = new Date(
            vm.fecha.getFullYear(),
            vm.fecha.getMonth(),
            vm.fecha.getDate()
          );
          vm.IvaObj = data.filter(function(n){
            return n.Nombre === 'PorcentajeIVA';
          })[0];
          vm.Iva = parseFloat(vm.IvaObj.Valor);
          vm.reloadData();
        });
        Catalogos.query({
          'name': 'MotivosSistema'
        }).$promise.then(function(data) {
          vm.motivosSistema = data;
          vm.motivosCancelacion = [];
          vm.motivosSistema.forEach(function(data) {
            if (data.Categoria === 'Cancelacion') {
              vm.motivosCancelacion.push(data);
            }
          });
        });
        vm.ops = [];
        vm.Originator = {};
      }else{
        location.href = '#/login';
      }
    };

    vm.reloadData = function() {
      vm.dataset = [];
      vm.loading = true;
      var idUsuario = sessionStorage.getItem('IdUsuario');
      vm.tipoUsuario = sessionStorage.getItem('TipoUsuario');
      vm.fechaHistorico = vm.fecha < vm.fechaOper;
      Ordenes.query({
        'FechaValor': vm.fecha,
        'IdUsuario': idUsuario,
        'IncluirCanceladas': vm.incluirCancel
      }).$promise.then(function(data) {
        if (data.length === 0) {
          Utils.showToast('No hay registros!');
          vm.loading = false;
        } else {
          vm.dataset = data;
          vm.dataset.forEach(function(oper){
            oper.PayloadExport = JSON.parse(oper.PayloadString);
          });
          vm.loading = false;
        }
      })
      .catch(function() {
        Utils.showToast('No se encontro el servicio');
        vm.loading = false;
      });
    };

    vm.Consultar = function(registro) {
      vm.registro = JSON.parse(registro);
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/detalleOperacion.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function(){
          $scope.registro = vm.registro;
          $scope.viewDialog = function viewDialog(){
            $mdDialog.show({
              skipHide: true,
              scope: $scope,
              preserveScope: true
            });
          };
        }
      });
    };

    $scope.Close = function() {
      $mdDialog.hide();
      vm.datos = [];
      $scope.descripcion = '';
      $scope.motivo = 0;
    };

    vm.OpenCancelacion = function(ordenPago) {
      var operToDelete = [];
      operToDelete.push(ordenPago);
      if(ordenPago.IdMotivosSistema === 21){
        vm.dataset.forEach(function(item){
          if(item.Referencia === ordenPago.IdSolicitud){
            operToDelete.push(item);
          }
        });
      }
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/cancelOperacion.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          $scope.width = '430px';
          $scope.motivosCancelacion = vm.motivosCancelacion;
          $scope.detailInstruccion = ordenPago.Instruccion;
          $scope.detailImporte = ordenPago.Importe;
          $scope.viewDialog = function viewDialog() {
            $mdDialog.show({
              skipHide: true,
              scope: $scope,
              preserveScope: true,
              controller: function($scope) {
                $scope.message = ordenPago.IdMotivosSistema === 21
                  ? 'La operación fue generada por un traspaso entre cuentas. Esta acción cancelará las operaciones de ambas cuentas. ¿Desea continuar?'
                  : 'Se cancelará la operación seleccionada, ¿Deseas continuar?';
                $scope.viewDialog = function() {
                  $mdDialog.hide();
                };
                $scope.deleteOper = function() {
                  vm.datos = [];
                  operToDelete.forEach(function(oper){
                    vm.datos.push({
                      'IdSolicitud': oper.IdSolicitud,
                      'Importe': oper.Importe,
                      'IdSistemaExterno': oper.IdSistemaExterno,
                      'Usuario': oper.IdUsuario,
                      'IdMotivo': $scope.motivo,
                      'Descripcion': $scope.descripcion
                    });
                  });
                  Recepcion.delete({}, vm.datos).$promise.then(function(data) {
                    $mdDialog.hide();

                    var error = false;
                    var dataErr = {};
                    var res = data.forEach(function(val){
                      if(val.Code !== undefined && val.Code !== null &&  val.Code === -2){
                        error = true;
                        dataErr = val;
                      }
                    });

                    if (error) {
                      Utils.showToast(dataErr.ErrorMesage);
                    } else {
                      var message = 'Operación correctamente cancelada';
                      Utils.showToast(message);
                      setTimeout(function() {
                        $scope.Close();
                        vm.reloadData();
                      }, 1500);
                    }
                  });
                };
              },
              templateUrl: './views/templates/dialog-cancelOper.html'
            });
          };
        },
      });
    };

    vm.ChangeVia = function(oper){
      vm.loading = true;
      vm.OriginalOper = oper;
      vm.IdContraparte = JSON.parse(JSON.stringify(vm.OriginalOper)).IdContraparte;
      vm.OriginalOper.Referencia = parseInt(oper.Referencia);
      Catalogos.query({
        'name': 'Concepto',
        'Activo': 3,
        'IdConcepto': oper.IdConceptoLiq
      }).$promise.then(function(data) {
        vm.ceptoInfo = data;
        Catalogos.query({
          'name':'cuentaCorriente'
        }).$promise.then(function(cuentasCorrientes){
          vm.cuentasCorrientes = cuentasCorrientes;
          Catalogos.query({
            'name': 'conceptosCambioVia',
            'IdConcepto': oper.IdConceptoLiq,
            'IdContraparte': oper.IdContraparte,
            'IdUsuario' : sessionStorage.getItem('IdUsuario')
          }).$promise.then(function(dataCeptos) {
            if(dataCeptos.length === 0){
              Utils.showToast('No se encontraron conceptos para el cambio de vía');
            }else{
              vm.conceptos = dataCeptos;
              vm.conceptos.forEach(function(cepto){
                vm.cuentasCorrientes.forEach(function(ctaCte){
                  if(cepto.IdCuentaCorriente === ctaCte.IdCuentaCorriente){
                    cepto.IdCuentaCorriente = ctaCte.IdCuentaCorriente;
                    cepto.IdViaLiquidacion = ctaCte.IdViaLiquidacion;
                  }
                });
              });
            }
            var cuentaCte = vm.cuentasCorrientes.filter(function(cuenta){
              return cuenta.IdCuentaCorriente === vm.ceptoInfo[0].IdCuentaCorriente;
            })[0];
            vm.ceptoInfo[0].IdCuentaCorriente = cuentaCte.IdCuentaCorriente;
            vm.ceptoInfo[0].IdViaLiquidacion = cuentaCte.IdViaLiquidacion;
            vm.cuentaCorriente = cuentaCte.IdCuentaCorriente;
            Catalogos.query({
              'name': 'banco',
              'orderby': 'NombreCorto'
            }).$promise.then(function(respuestaBanco){
              vm.listBancos = respuestaBanco;
              Catalogos.query({
                'name': 'contraparte',
                'id': vm.OriginalOper.IdContraparte
              }).$promise.then(function(dataContrapartes) {
                vm.clientes = dataContrapartes;
                CatalogosCli.query({
                  'prefix': 'CuentasContraparte',
                  'name': 'IdContraparte',
                  'id': vm.OriginalOper.IdContraparte
                }).$promise.then(function(dataCuentaContra) {
                  vm.cuentas = dataCuentaContra;
                  Catalogos.query({
                    'name':'viaLiquidacion'
                  }).$promise.then(function(viasLiq){
                    vm.viasLiquidacion = viasLiq;
                    vm.GetPaylodOfOper(vm.ceptoInfo[0]);
                    OpenChangeVia();
                  });
                });
              });
            });
          });
        });
      });
    };

    vm.handleKeyup = function(ev) {
      ev.stopPropagation();
    };

    vm.GetPaylodOfOper = function(concepto){
      vm.loading = true;
      vm.newViaLiq = concepto.IdViaLiquidacion;
      vm.cuentaCorriente = concepto.IdCuentaCorriente;
      Ordenes.get({
        'name': 'payloads',
        'via': concepto.IdViaLiquidacion,
        'tipo': concepto.IdTipoMensaje
      })
      .$promise.then(function(respuesta) {
        Catalogos.query({
          'name': 'configuracion'
        }).$promise.then(function(respuestaConfig){
          respuestaConfig.forEach(function(item){
            if(item.Nombre === 'ClaveInstitucion'){
              vm.CesifLocal = item.Valor;
              vm.Spei1 = false;
              vm.Spei1 = respuesta.Tipo === 1 && respuesta.IdVia === 2;
              vm.AsigInfoPayload();
              if(vm.Spei1){
                var bancosToSpei1 = [];
                vm.listBancos.forEach(function(banco){
                  bancosToSpei1.push({'Id':banco.IdBanco,'Nombre':banco.NombreCorto,'Casfin':banco.Casfin});
                });
                vm.payloadToApply= JSON.parse(respuesta.EstructuraString);
                vm.payloadToApply.forEach(function(item){
                  item.ngModel = item.ngModel.replace('mensajeCtrl','monitorCtrl');
                  var model = item.ngModel.replace('monitorCtrl.Payload','');
                  item.disable = vm.Payload[model] === undefined;
                  if(item.element === 'select' && item.ngModel==='monitorCtrl.Payload.InstitucionBen'){
                    item.options = bancosToSpei1;
                  }
                });
                vm.payloadString = JSON.stringify(vm.payloadToApply);
              }
              vm.payloadString = vm.Spei1 ? JSON.parse(vm.payloadString) : JSON.parse(respuesta.EstructuraString);
              vm.payloadString.forEach(function(payloadItem){
                payloadItem.ngModel = payloadItem.ngModel.replace('mensajeCtrl','monitorCtrl');
                var model = payloadItem.ngModel.replace('monitorCtrl.Payload.','');
                payloadItem.disable = vm.Payload[model] !== undefined;
                vm.showCuenta = false;
                if(payloadItem.title === 'MuestraCuenta' && payloadItem.default === '1'){
                  vm.showCuenta = concepto.Emite === 1;
                }
              });
              vm.AsigInfoPayload();
              vm.loading = false;
            }
          });
        });
      });
    };

    function OpenChangeVia (){
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        scope: $scope,
        preserveScope: true,
        templateUrl: './views/templates/cambioViaLiq.html',
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
        },
      });
    }

    vm.AsigInfoPayload = function (){
      vm.Payload = {};
      var infoPayload = JSON.parse(vm.OriginalOper.PayloadString);
      for (var propPay in infoPayload) {
        if(propPay === 'InstitucionBen'){
          var banco = vm.listBancos.filter(function(bancoItem){
            return bancoItem.NombreCorto === infoPayload[propPay];
          });
          vm.Payload[propPay] = banco[0].IdBanco;
        }else if(propPay === 'TipoCtaBen' || propPay === 'TipoCtaOrd'){
          switch (infoPayload[propPay]) {
          case 'Clabe':
            vm.Payload[propPay] = '40';
            break;
          case 'Debito':
            vm.Payload[propPay] = '3';
            break;
          case 'TelefoniaMovil':
            vm.Payload[propPay] = '10';
            break;
          }
        }else{
          vm.Payload[propPay] = infoPayload[propPay];
        }
      }

      vm.disabledInfoBen = vm.Payload.NomBen !== undefined;
      vm.disabledTipoCtaBen = vm.Payload.TipoCtaBen !== undefined;
      vm.disableRfcBen = vm.Payload.RfcBen !== undefined;

      vm.IdContraparte = JSON.parse(JSON.stringify(vm.OriginalOper)).IdContraparte;

      if(vm.Spei1){
        vm.Payload.InstitucionBen = vm.Payload.InstitucionBen.toString();
      }
    };

    vm.DesglosaIva = function (oper){
      if(vm.requiereIva === true){
        vm.montoSinIva = parseFloat((oper.Importe / (1 + (vm.Iva / 100))).toFixed(2));
        vm.Payload.Iva = parseFloat((oper.Importe - vm.montoSinIva).toFixed(2));
        vm.IvaOper = vm.Payload.Iva;
        vm.Payload.Iva = vm.IvaOper.toString();
      }else{
        vm.Payload.Iva = '0';
      }
    };

    vm.CloseChangeVia = function(){
      delete vm.Payload;
      vm.UsuarioForm = null;
      vm.PayLoad = null;
      $mdDialog.hide();
    };

    vm.ConfirmChangeVia = function () {
      $mdDialog.show({
        skipHide: true,
        scope: $scope,
        preserveScope: true,
        controller: function($scope) {
          $scope.width = '430px';
          $scope.message = '¿Realmente desea cambiar la vía de liquidación de la operación?';

          $scope.viewDialog = function() {
            $mdDialog.hide();
          };

          $scope.deleteOper = function(){
            $mdDialog.hide();
            vm.loading = true;
            var operUpdate = JSON.parse(JSON.stringify(vm.OriginalOper));
            operUpdate.IdConceptoLiq = vm.concepto.IdConcepto;
            operUpdate.IdConceptoOriginal = vm.concepto.IdConcepto;
            operUpdate.PayloadString = JSON.stringify(vm.Payload);
            vm.orden = [vm.OriginalOper,operUpdate];
            Ordenes.send({
              'name':'changevialiq'
            },vm.orden).$promise.then(function(resChange){
              if(resChange.length > 0 && resChange[0].ErrorCode !== undefined){
                Utils.showToast('Error al cambiar vía de liquidación');
                vm.loading = false;
              }else{
                Utils.showToast('El cambio de vía se realizó de manera correcta');
                vm.CloseChangeVia();
                vm.reloadData();
                vm.loading = false;
              }
            });
          };
        },
        templateUrl: './views/templates/dialog-cancelOper.html'
      });
    };

    vm.ConfirmDesliquidar= function(registro){
      var oper = {"IdSolicitud": registro.IdSolicitud};
      var dialog = '¿Realmente desea cancelar la liquidación de la operación?';
      var confirm = $mdDialog.confirm()
      .title('Atención')
      .textContent(dialog)
      .ariaLabel('Lucky day')
      .ok('Continuar')
      .cancel('Cancelar');

      $mdDialog.show(confirm).then(function () {
        vm.DesliquidarOper(oper);
      });
    }

    vm.DesliquidarOper = function(oper){
      Ordenes.send({
        'name':'desliquidar'
      },oper).$promise.then(function(resChange){
        if(resChange.length > 0 && resChange[0].ErrorCode !== undefined){
          Utils.showToast('Error al cancelar la liquidacion de la operación');
          vm.loading = false;
        }else{
          Utils.showToast('Liquidación cancelada correctamente');
          $mdDialog.hide();
          vm.reloadData();
          vm.loading = false;
        }
      });
    }

    vm.ChangeDate = function(oper){
      vm.different = false;
      vm.loading = true;
      vm.OperChangeDate = oper;
      vm.OperChangeDate.FechaValor = new Date(vm.OperChangeDate.FechaValor);
      vm.DatePrevious = vm.OperChangeDate.FechaValor;
      vm.DatePreviousS = getDateString(new Date(vm.OperChangeDate.FechaValor));
      vm.Payload = JSON.parse(oper.PayloadString);
      Catalogos.query({
        'name': 'departamento',
        'IdDepartamento': oper.IdDepartamento
      }).$promise.then(function(ansDepto){
        vm.departamentos = ansDepto;
        Catalogos.query({
          'name': 'concepto',
          'IdConcepto': oper.IdConceptoOriginal,
          'Activo':3
        }).$promise.then(function(ansCepto){
          vm.conceptos = ansCepto;
          vm.requiereIva = vm.conceptos[0].DesglosaIva > 0;
          vm.DesglosaIva(vm.OperChangeDate);
          Catalogos.query({
            'name': 'contraparte',
            'IdContraparte': oper.IdContraparte
          }).$promise.then(function(ansContraparte){
            vm.clientes = ansContraparte;
            CatalogosCli.query({
              'prefix': 'CuentasContraparte',
              'name': 'IdContraparte',
              'id': oper.IdContraparte
            }).$promise.then(function(data) {
              vm.cuentas = data;

              $mdDialog.show({
                clickOutsideToClose: false,
                escapeToClose: false,
                scope: $scope,
                preserveScope: true,
                templateUrl: './views/templates/cambioFecha.html',
                parent: angular.element(document.body),
                fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
                controller: function() {
                },
              });
              vm.loading = false;
            });
          });
        });
      });
    };

    vm.CloseChangeDate = function(){
      $mdDialog.hide();
    };

    vm.onlyWeekendsPredicate = function(date) {
      return Utils.disableDays(date,vm.diasInhabiles);
    };

    vm.ConfirmChangeDate = function(){
      $mdDialog.show({
        skipHide: true,
        scope: $scope,
        preserveScope: true,
        controller: function($scope) {
          $scope.width = '570px';
          $scope.message = '¿Realmente desea cambiar la fecha de la operación del ' + getDateString( new Date(vm.DatePrevious))  + ' al ' +  getDateString( new Date(vm.OperChangeDate.FechaValor)) + '?';

          $scope.viewDialog = function() {
            $mdDialog.hide();
          };

          $scope.deleteOper = function(){
            $mdDialog.hide();
            vm.loading = true;
            Ordenes.send({
              'name':'changeDate'
            },{'IdSolicitud':vm.OperChangeDate.IdSolicitud,'FechaValor':vm.OperChangeDate.FechaValor}).$promise.then(function(resChange){
              if(resChange.length > 0 && resChange[0].ErrorCode !== undefined){
                Utils.showToast('Error al cambiar fecha valor');
                vm.loading = false;
              }else{
                Utils.showToast('El cambio de fecha se realizó de manera correcta');
                vm.CloseChangeDate();
                vm.reloadData();
                vm.loading = false;
              }
            });
          };
        },
        templateUrl: './views/templates/dialog-cancelOper.html'
      });
    }

    function getDateString (date){
      return date.toLocaleDateString('es-ES',{
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }

    vm.compareDate = function(){
      var newDateValor = getDateString(vm.OperChangeDate.FechaValor);
      vm.different = newDateValor !== vm.DatePreviousS;
    }

    vm.incluirCanceladas = function(){
      vm.incluirCancel = !vm.incluirCancel;
      vm.reloadData();
    }
  }
})();
