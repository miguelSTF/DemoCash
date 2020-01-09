/*jshint latedef: nofunc */
(function () {
  'use strict';

  angular.module('appCash')
        .controller('MonitorConfirmacionController', MonitorConfirmacionController);

    /* @ngInject */
  function MonitorConfirmacionController($mdMedia, $mdDialog, $scope, Catalogos, Parametros, Utils, Ordenes, Recepcion, OrdenesConfir, ValidateSession) {
    var vm = this;
    vm.loading = true;
    vm.incluirConfirm = false;
    vm.select = false;
    vm.action = null;

    JSON.parse(sessionStorage.getItem('Menu')).forEach(function(item){
      item.SubMenus.forEach(function(sub){
        if(sub.IdPermiso === 38)
        {
          vm.permisos = sub.Permiso;
        }
      });
    });

    vm.permisoValidar = vm.permisos.indexOf(17) >= 0;
    vm.permisoConfirmar = vm.permisos.indexOf(18) >= 0;

    vm.init = function () {
      var validate = ValidateSession.validate(38);
      if (validate){
        Parametros.query({
          'name': 'Configuracion'
        }).$promise
          .then(function (data) {
            vm.FechaOperacion = data.filter(function (n) {
              return n.Nombre === 'FechaOperacion';
            })[0];
            vm.fecha = new Date(vm.FechaOperacion.Valor);
            vm.fechaOper = vm.fecha;
            vm.maxDate = new Date(vm.fecha.getFullYear(), vm.fecha.getMonth(), vm.fecha.getDate());
            vm.reloadData();
          })
          .catch(function (error) {
            console.log(error);
          });
        Catalogos.query({
          'name': 'MotivosSistema'
        }).$promise.then(function (data) {
          vm.motivosSistema = data;
          vm.motivosCancelacion = [];
          vm.motivosSistema.forEach(function (data) {
            if (data.Categoria === 'Cancelacion') {
              vm.motivosCancelacion.push(data);
            }
          });
        });
      }else{
        location.href = '#/login';
      }
    };

    vm.addConfirm = function(){
      vm.incluirConfirm = vm.incluirConfirm ? false : true;
      vm.reloadData();
    };

    vm.selectedAll = function(){
      vm.select = !vm.select;
      if (vm.busquedaGlobal === undefined || vm.busquedaGlobal === ''){
        var operToValidate = vm.dataset.filter(function (item) {
          return item.Status === 'C';
        });
      }else{
        var operToValidate = vm.datasetCollection.filter(function (item) {
          return item.Status === 'C';
        });
      }
      if (vm.busquedaGlobal === undefined || vm.busquedaGlobal === ''){
        var operToConfirm = vm.dataset.filter(function (item) {
          return item.Status === 'V';
        });
      }else{
        var operToConfirm = vm.datasetCollection.filter(function (item) {
          return item.Status === 'V';
        });
      }

      if (vm.select) {
        if (operToConfirm.length > 0 && operToValidate.length > 0 && vm.permisoValidar && vm.permisoConfirmar) {
          vm.ValidateOrConfirm();
        }else{
          vm.selectOpers(operToConfirm.length > 0 && vm.permisoConfirmar ? 'V' : operToValidate.length > 0 && vm.permisoValidar ? 'C' : null);
        }
      }else{
        vm.action = null;
        vm.dataset.forEach(function (oper) {
          oper.sended = false;
        });
      }

      if(operToConfirm.length === 0 && operToValidate.length === 0){
        vm.select = false;
        Utils.showToast('No hay operaciones para validar o confirmar');
      }

    };

    vm.ValidateOrConfirm = function () {
      $mdDialog.show({
        skipHide: true,
        templateUrl: './views/templates/dialog-validacion.html',
        scope: $scope,
        preserveScope: true
      });
    };

    vm.selectOpers = function(status){
      if(status !== ''){
        vm.action = status;
        if (vm.busquedaGlobal === undefined || vm.busquedaGlobal === '') {
          vm.dataset.forEach(function (oper) {
            if (oper.Status === status){
              oper.sended = true;
            }
          });
        }else{
          vm.datasetCollection.forEach(function (oper) {
            if (oper.Status === status) {
              oper.sended = true;
            }
          });
        }
      }else{
        vm.dataset.forEach(function (oper) {
            oper.sended = false;
        });
        vm.action = null;
        vm.select = false;
      }
      $mdDialog.hide();
    };

    vm.closeModal = function (){
      $mdDialog.hide();
    };

    vm.ChangeSelection = function(op) {
      var selected = vm.dataset.filter(function(item){
        return item.sended;
      });
      vm.action = selected.length === 0 ? null : op.Status;
    };

    vm.reloadData = function () {
      vm.dataset = [];
      vm.select = false;
      vm.action = null;
      vm.loading = true;
      var idUsuario = sessionStorage.getItem('IdUsuario');
      Ordenes.query({
        'name': 'confirmacion',
        'FechaValor': vm.fecha,
        'IdUsuario': idUsuario,
        'IncluirConfirm': vm.incluirConfirm
      }).$promise.then(function (data) {
        if (data.length === 0) {
          Utils.showToast('No hay registros!');
          vm.loading = false;
        } else {
          vm.dataset = data;
          vm.loading = false;
        }
      })
      .catch(function () {
        Utils.showToast('No se encontro el servicio');
        vm.loading = false;
      });
    };

    vm.OpenCancelacion = function (ordenPago) {
      var operToDelete = [];
      operToDelete.push(ordenPago);
      if (ordenPago.IdMotivosSistema === 21) {
        vm.dataset.forEach(function (item) {
          if (item.Referencia === ordenPago.IdSolicitud) {
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
        controller: function () {
          $scope.width = '430px';
          $scope.motivosCancelacion = vm.motivosCancelacion;
          $scope.detailInstruccion = ordenPago.Instruccion;
          $scope.detailImporte = ordenPago.Importe;
          $scope.viewDialog = function viewDialog() {
            $mdDialog.show({
              skipHide: true,
              scope: $scope,
              preserveScope: true,
              controller: function ($scope) {
                $scope.message = ordenPago.IdMotivosSistema === 21 ? 'La operación fue generada por un traspaso entre cuentas. Esta acción cancelará las operaciones de ambas cuentas. ¿Desea continuar?'
                   : 'Se cancelará la operación seleccionada, ¿Deseas continuar?';
                $scope.viewDialog = function () {
                  $mdDialog.hide();
                };
                $scope.deleteOper = function () {
                  vm.datos = [];
                  operToDelete.forEach(function (oper) {
                    vm.datos.push({
                      'IdSolicitud': oper.IdSolicitud,
                      'Importe': oper.Importe,
                      'IdSistemaExterno': oper.IdSistemaExterno,
                      'Usuario': oper.IdUsuario,
                      'IdMotivo': $scope.motivo,
                      'Descripcion': $scope.descripcion
                    });
                  });
                  Recepcion.delete({}, vm.datos).$promise.then(function (data) {
                    $mdDialog.hide();
                    if (data[0].Code === -2) {
                      Utils.showToast(data[0].ErrorMesage);
                    } else {
                      var message = data[0].ErrorMesage === '' ? 'Operación correctamente cancelada' : data[0].ErrorMesage;
                      Utils.showToast(message);
                      setTimeout(function () {
                        vm.Close();
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

    vm.Close = function () {
      $mdDialog.hide();
      vm.datos = [];
      $scope.descripcion = '';
      $scope.motivo = 0;
    };

    vm.validate = function () {
      var listOper = [];
      var idUser = sessionStorage.getItem('IdUsuario');

      vm.dataset.forEach(function(item){
        if(item.sended){
          listOper.push({'IdSolicitud':item.IdSolicitud, 'IdUsuario':idUser});
        }
      });

      var toast = listOper.length === 1 ? ' operación' : ' operaciones';
      var confirm = createConfirm('¿Desea validar ' + listOper.length + toast + '?', 'Aceptar', 'Cancelar');
      $mdDialog.show(confirm)
        .then(function() {
          vm.loading = true;
          OrdenesConfir.send({
            'name': 'validar'
          }, listOper).$promise.then(function (respuesta) {
            var containPrevValid = respuesta.filter(function(ans){
              return ans.Code === -12;
            });
            if (containPrevValid.length === 0 && respuesta[0].ErrorMesage !== undefined) {
              Utils.showToast(respuesta[0].ErrorMesage);
              vm.reloadData();
            } else if (containPrevValid.length >= 1) {
              var previouslyValid = 0;
              var idsPreValid = [];
              respuesta.forEach(function(r){
                if(r.Code !== undefined){
                  previouslyValid = previouslyValid + 1;
                  idsPreValid.push(r.IdSolicitud);
                }
              });
              var toasToPrevValid = idsPreValid.length === 1 ? 'La Operación: ' + idsPreValid.toString() + ' se validó anteriormente' :
                'Las operaciones: ' + idsPreValid.toString() + ' se validaron anteriormente';
              Utils.showToast(toasToPrevValid);
              var desOper = listOper.length === 1 ? ' operación' : ' operaciones';
              var opersValidCount = respuesta.length - previouslyValid;
              var toastP = opersValidCount === 1 ? 'Se validó ' + opersValidCount + '/' + listOper.length + desOper :
                'Se validaron ' + opersValidCount + '/' + listOper.length + desOper;
              Utils.showToast(toastP);
              vm.reloadData();
            }else {
              var toast = respuesta.length === 1 ? 'Se validó ' +  respuesta.length + '/' + listOper.length + ' operación' 
              : 'Se validaron ' + respuesta.length + '/' + listOper.length + ' operaciones';
              Utils.showToast(toast);
              vm.reloadData();
            }
            vm.loading = false;
          });
        });
    };

    vm.confirmation = function() {
      var dataToConfirm = [];
      vm.dataset.forEach(function(item){
        if(item.sended){
          dataToConfirm.push(item.IdSolicitud);
        }
      });
      var toast = dataToConfirm.length === 1 ? ' operación' : ' operaciones';
      var confirm = createConfirm('¿Desea confirmar ' + dataToConfirm.length + toast + '?', 'Aceptar', 'Cancelar');
      $mdDialog.show(confirm)
        .then(function() {
          vm.loading = true;
          OrdenesConfir.send(
            {
              'name': 'confirmar',
              'IdUsuario': sessionStorage.getItem('IdUsuario')
            }, {'IdsSolicitud':dataToConfirm.toString()})
          .$promise
          .then(function (respuesta) {
            if (respuesta.length > 0 && respuesta[0].ErrorCode !== undefined && respuesta[0].ErrorCode !== 0) {
              Utils.showToast(respuesta[0].ErrorMsg);
              vm.reloadData();
            } else {
              var operToAuthorize = respuesta.filter(function(ans){
                return ans.Code === 6 || ans.Code === 7 || ans.Code === 8 || ans.Code === 9 || ans.Code === 11;
              });
              var desOper = dataToConfirm.length === 1 ? ' operación' : ' operaciones';
              var toast = respuesta.length === 1 ? 'Se confirmó ' + respuesta.length + '/' + dataToConfirm.length + desOper
                : 'Se confirmaron ' + respuesta.length + '/' + dataToConfirm.length + desOper;
              var toastAuthorize = operToAuthorize.length > 0 && operToAuthorize.length === 1
                ? ', ' + operToAuthorize.length + ' necesita autorización de límites'
                : operToAuthorize.length > 0 && operToAuthorize.length > 1
                  ? ', ' + operToAuthorize.length + ' necesitan autorización de límites'
                  : '' ;
              if (respuesta.length !== dataToConfirm.length){
                var operPrevConfirm = [];
                dataToConfirm.forEach(function (operS) {
                  var dataOper = respuesta.filter(function (ansId) {
                    return ansId.IdSolicitud === operS;
                  });
                  if (dataOper.length === 0) {
                    operPrevConfirm.push(operS);
                  }
                });
                var messageToShow = operPrevConfirm.length === 1 ? 'La Operación: ' + operPrevConfirm.toString() + ' se confirmó anteriormente'
                  : 'Las operaciones: ' + operPrevConfirm.toString() + ' se confirmaron anteriormente';
                Utils.showToast(messageToShow);
              }
              Utils.showToast(toast + toastAuthorize);
              vm.reloadData();
            }
            vm.loading = false;
          });
        });
    };

    vm.ConsultarDetalle = function(registro) {
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

    function createConfirm(dialog, btnOk, btnNot) {
      return $mdDialog
        .confirm()
        .title('Atención')
        .textContent(dialog)
        .ariaLabel('Lucky day')
        .ok(btnOk)
        .cancel(btnNot);
    }
    
    vm.UnSelectAll = function(){
      vm.action = null;
      vm.select = false;
      vm.dataset.forEach(function(oper){
        oper.sended = false;
      });
    };

  }
})();
