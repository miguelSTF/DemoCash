(function() {
  'use strict';

  angular.module('appCash')
    .controller('ViaLiquidacionController', ViaLiquidacionController);

  /* @ngInject */
  function ViaLiquidacionController($scope, $mdDialog, $mdMedia, $filter, NgTableParams, ViaLiquidacion, ViasUtils, Log, Utils, ValidateSession) {
    var vm = this;
    var objetoPreUpdate;

    vm.catalogo = {
      id: 6,
      name: 'ViaLiquidacion',
      catalogId: 'IdViaLiquidacion',
      orderby: 'Clave'
    };
    vm.readOnlyEditDiv = false;
    vm.loading = true;
    vm.disabledSave = false;
    vm.validaClave = validaClave;
    vm.watch = watch;
    vm.insert = 0;
    vm.viasLiquidacion = [];

    vm.init = function() {
      var validate = ValidateSession.validate(13);
      if (validate) {
        ViaLiquidacion.query({
          'name': vm.catalogo.name,
          'Activo': 3,
          'orderby': vm.catalogo.orderby
        })
        .$promise.then(function(resultado) {
          if (resultado.length <= 0) {
            Utils.showToast('No hay vias de liquidación registradas!');
            vm.loading = false;
          } else {
            vm.viasLiquidacion = resultado;
            vm.loading = false;
          }
        })
        .catch(function(response) {
          Utils.showToast('No se encontro el Servicio!!');
          console.error('Error: ' + JSON.stringify(response));
          vm.loading = false;
        });
      }else {
        location.href = '#/login';
      }
    };

    function validaClave() {
      ViasUtils.validaCve(vm.viaEdit.Clave)
        .then(function(response) {
          if (response.length > 0) {
            vm.ViaForm.Clave.$setValidity('required', false);
          }
        });
    }

    function resetForm(reload) {
      vm.readOnlyEditDiv = false;
      $mdDialog.hide();
      vm.disabledSave = false;
      vm.viaEdit = null;
      if (reload) {
        vm.init();
      }
    }

    function watch(row) {
      vm.readOnlyEditDiv = true;
      vm.Consultar();
      vm.viaEdit = row;
    }

    vm.saveEdit = function() {
      vm.disabledSave = true;
      vm.loading = true;
      ViaLiquidacion.save({
        'name': vm.catalogo.name
      }, vm.viaEdit, function() {
      });
      if (vm.insert !== 1) {
        Log.storeData('PreUpdate: Se hara update a la via: ' + objetoPreUpdate.Descripcion, 'Vias', objetoPreUpdate, 'Auditoria', 'Update').then(function() {
          Log.storeData('Update: La via ' + vm.viaEdit.Descripcion + ' ha sido modificada', 'Vias', vm.viaEdit, 'Auditoria', 'Update').then(function(){
            Utils.showToast('Registro almacenado correctamente!');
              setTimeout(function(){
                resetForm(true);
                vm.loading = false;
              },1500);
          })
          .catch(function() {
            timeoutValidacion();
          });
        })
        .catch(function() {
          timeoutValidacion();
        });
      }
    };

    function timeoutValidacion() {
      Utils.showToast('No se encontró el Servicio de Bitácora!!');
      Utils.showToast('Registro almacenado correctamente!');
      setTimeout(function(){
        resetForm(true);
        vm.loading = false;
      },1500);
    }

    vm.edit = function(row) {
      vm.readOnlyEditDiv = false;
      vm.Consultar();
      vm.viaEdit = row;

      objetoPreUpdate = Utils.cloneObject(row);
      vm.insert = 0;

    };

    $scope.$on('$locantionChangeStart', function(event) {
      if (vm.ViaForm.$dirty && sessionStorage.CerrandoSesion === undefined) {
        var answer = window.confirm('Hay cambios pendientes de guardar ¿Deseas descartarlos?');
        if (!answer) {
          event.preventDefault();
        }
      }
      return;
    });

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/via-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.ViaForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'viaCtrl',
                  controller: function($scope) {
                    $scope.viewDialog = function() {
                      $mdDialog.hide();
                    };
                    $scope.close = function() {
                      $mdDialog.hide();
                      resetForm(true);
                    };
                  },
                  templateUrl: './views/templates/dialog-confirm.html'
                });
              } else {
                $mdDialog.hide();
                resetForm(false);
              }
            } else {
              $mdDialog.hide();
              resetForm(false);
            }
          };
        },
      });
    };
  }
})();
