(function() {
  'use strict';

  angular.module('appCash')
    .controller('DivisaController', DivisaController);

  /* @ngInject */
  function DivisaController($scope, $mdDialog, $mdMedia, Divisa, Log, Utils, VerificarReg, ValidateSession) {
    var vm = this;
    var objetoPreUpdate;
    vm.loading = true;
    vm.readOnlyEditDiv = false;
    vm.disabledSave = false;
    vm.insert = 0;
    vm.divisas = [];
    vm.catalogo = {
      id: 3,
      name: 'divisa',
      catalogId: 'IdDivisa',
      orderby: 'NombreCorto'
    };

    vm.init = function() {
      var validate = ValidateSession.validate(9);
      if (validate) {
        Divisa.query({
          'name': vm.catalogo.name,
          'Activo': 3,
          'orderby': vm.catalogo.orderby
        })
        .$promise.then(function(resultado) {
          if (resultado.length <= 0) {
            Utils.showToast('No hay divisas registradas!');
            vm.loading = false;
          } else {
            vm.divisas = resultado;
            vm.loading = false;
          }
        })
        .catch(function(response) {
          Utils.showToast('No se encontró el Servicio!!');
          console.error('Error: ' + JSON.stringify(response));
          vm.loading = false;
        });
      }else {
        location.href = '#/login';
      }
    };

    vm.newEdit = function() {
      resetForm(false);
      vm.Consultar();
      vm.insert = 1;
    };

    vm.checkDataReg = function() {
      vm.disabledSave = true;
      vm.loading = true;
      vm.idsRegistros = [];
      var paramsToSearch = {
        'filtro': 'NombreCorto',
        'valor': vm.divisaEdit.NombreCorto
      };
      VerificarReg.query({
        'name': 'Divisa', 
      }, paramsToSearch).$promise.then(function(respuesta) {
        vm.divisasExist = respuesta;

        if (vm.divisaEdit.IdDivisa !== undefined) {
          if (vm.divisasExist.length > 0) {
            vm.divisasExist.forEach(function(data){
              vm.idsRegistros.push(data.IdDivisa);
            });
            var index = vm.idsRegistros.indexOf(vm.divisaEdit.IdDivisa);
            if (index > -1) {
              vm.saveEdit();
            }else{
              Utils.showToast('El Nombre Corto para divisa ya existe, verifique por favor!');
              vm.loading = false;
              vm.disabledSave = false;
            }
          }else{
            vm.saveEdit();
          }
        }else {
          if (vm.divisasExist.length > 0) {
          Utils.showToast('El Nombre Corto para divisa ya existe, verifique por favor!');
          vm.loading = false;
          vm.disabledSave = false;
          }else {
            vm.saveEdit();
          }
        }
      });
    };

    vm.saveEdit = function() {
      Divisa.save({
        'name': vm.catalogo.name
      }, vm.divisaEdit, function() {
      });
      if (vm.divisaEdit.Activo === undefined) {
        vm.divisaEdit.Activo = 0;
      }
      if (vm.insert === 1) {
        vm.loading = true;
        Log.storeData('Insert: Se inserto la divisa: ' + vm.divisaEdit.Nombre, 'Divisas', vm.divisaEdit, 'Auditoria', 'Insert').then(function(){
          Utils.showToast('Registro almacenado correctamente!');
            setTimeout(function(){
              resetForm(true);
              vm.loading = false;
            },1500);
        })
        .catch(function() {
          timeoutValidacion();
        });
      } else {
        vm.loading = true;
        Log.storeData('PreUpdate: Se hara update a la divisa: ' + objetoPreUpdate.NombreCorto, 'Divisas', objetoPreUpdate, 'Auditoria', 'Update').then(function() {
          Log.storeData('Update: La divisa ' + vm.divisaEdit.NombreCorto + ' ha sido modificada', 'Divisas', vm.divisaEdit, 'Auditoria', 'Update').then(function(){
            Utils.showToast('Registro almacenado correctamente!');
              setTimeout(function(){
                resetForm(false);
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

    $scope.$on('$locationChangeStart', function(event) {
      if (vm.DivisaForm.$dirty && sessionStorage.CerrandoSesion === undefined) {
        var answer = window.confirm('Hay cambios pendientes de guardar ¿Deseas descartarlos?');
        if (!answer) {
          event.preventDefault();
        }
      }
      return;
    });

    vm.watch = function(row) {
      vm.readOnlyEditDiv = true;
      vm.Consultar();
      vm.divisaEdit = row;
    };

    vm.del = function(row) {
      var confirm = $mdDialog.confirm()
        .title('Atención')
        .textContent('¿Realmente quiere eliminar el registro seleccionado?')
        .ariaLabel('Lucky day')
        .ok('Eliminar')
        .cancel('Regresar');

      $mdDialog.show(confirm).then(function() {
        confirmDelete(row);
      });
    };

    vm.edit = function(row) {
      vm.readOnlyEditDiv = false;
      vm.Consultar();
      vm.divisaEdit = row;
      objetoPreUpdate = Utils.cloneObject(row);
      vm.insert = 0;
    };

    function resetForm(reload) {
      vm.readOnlyEditDiv = false;
      $mdDialog.hide();
      vm.divisaEdit = null;
      vm.disabledSave = false;
      if (reload) {
        vm.init();
      }
    }

    function confirmDelete(row) {
      resetForm(false);
      Divisa.delete({
        'name': vm.catalogo.name,
        'id': row.IdDivisa
      }, function(data) {
        var response = data;
        Utils.showToast(response.Message);
        vm.init();
        vm.loading = false;
      });
      Log.storeData('Deleted: Se elimino la divisa: ' + row.NombreCorto, 'Divisas', row, 'Auditoria', 'Delete').then(function(){
      }).catch(function() {
        Utils.showToast('No se encontró el Servicio de Bitácora!!');
      });
    }

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/divisa-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.DivisaForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'divisaCtrl',
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
