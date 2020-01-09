(function(){
  'use strict';

  angular.module('appCash')
  .controller('PlazaController', PlazaController);
  /* @ngInject */

  function PlazaController($scope, $mdDialog, $mdMedia, Plaza, Log, Utils, VerificarReg, ValidateSession){
    var vm = this;
    var objetoPreUpdate;
    vm.loading = true;
    vm.disabledSave = false;
    vm.readOnlyEditDiv = false;

    vm.catalogo = {
      'name' : 'plaza',
      'orderby' : 'Nombre'
    };

    vm.init = function(){
      var validate = ValidateSession.validate(48);
      if (validate){
        Plaza.query({
          'name': vm.catalogo.name,
          'Activo': 3,
          'orderby': vm.catalogo.orderby
        })
        .$promise.then(function(resultado) {
          vm.plazas = resultado;
          if (vm.plazas.length <= 0) {
            Utils.showToast('No hay Plazas registradas!');
            vm.loading = false;
          } 
          vm.loading = false;
        })
        .catch(function(response) {
          Utils.showToast('No se encontró el Servicio!!');
          console.error('Error: ' + JSON.stringify(response));
          vm.loading = false;
        });
      }else {
        location.href = '#/login';
      }
    }

    vm.newEdit = function() {
      resetForm(false);
      vm.Consultar();
      vm.insert = 1;
    };
    
    function resetForm(reload) {
      vm.readOnlyEditDiv = false;
      $mdDialog.hide();
      vm.plazaEdit = null;
      vm.disabledSave = false;
      if (reload) {
        vm.init();
      }
    }

    vm.checkDataReg = function() {       
      vm.disabledSave = true;
      vm.loading = true;
      vm.idsRegistros = [];
      var paramsToSearch = {
        'FiltroNumero': 'Numero',
        'ValorNumero': vm.plazaEdit.Numero,
        'FiltroNombre': 'Nombre',
        'ValorNombre': vm.plazaEdit.Nombre
      }
      VerificarReg.query({
        'name': 'Plaza', 
      }, paramsToSearch).$promise.then(function(respuesta) {
        vm.plazassExist = respuesta;
        if (vm.plazaEdit.IdPlaza !== undefined) {
          if (vm.plazassExist.length > 0) {
            vm.plazassExist.forEach(function(data){
              vm.idsRegistros.push(data.IdPlaza);
            });
            var index = vm.idsRegistros.indexOf(vm.plazaEdit.IdPlaza);
            if (index > -1) {
              vm.saveEdit();
            }else{
              Utils.showToast('El Número o Nombre para la Plaza ya existe, verifique por favor!');
              vm.loading = false;
              vm.disabledSave = false;
            }
          }else{
            vm.saveEdit();
          }
        }else {
          if (vm.plazassExist.length > 0) {
            Utils.showToast('El Número o Nombre para la Plaza ya existe, verifique por favor!');
            vm.loading = false;
            vm.disabledSave = false;
          }else {
            vm.saveEdit();
          }
        }
      });
    };

    vm.saveEdit = function() {
      Plaza.save({
        'name': vm.catalogo.name
      }, vm.plazaEdit, function() {});
      if (vm.plazaEdit.Activo === undefined) {
        vm.plazaEdit.Activo = 0;
      }
      if (vm.insert === 1) {
        vm.loading = true;
        Log.storeData('Insert: Se inserto la plaza: ' + vm.plazaEdit.Nombre, 'Plaza', vm.plazaEdit, 'Auditoria', 'Insert').then(function(){
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
        Log.storeData('PreUpdate: Se hara update a la plaza: ' + objetoPreUpdate.Nombre, 'Plazas', objetoPreUpdate, 'Auditoria', 'Update').then(function() {
          Log.storeData('Update: La plaza ' + vm.plazaEdit.Nombre + ' ha sido modificada', 'Plazas', vm.plazaEdit, 'Auditoria', 'Update').then(function(){
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

    vm.edit = function(row) {
      vm.readOnlyEditDiv = false;
      vm.Consultar();
      vm.plazaEdit = row;
      objetoPreUpdate = Utils.cloneObject(row);
      vm.insert = 0;
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

    function timeoutValidacion() {
      Utils.showToast('No se encontró el Servicio de Bitácora!!');
      Utils.showToast('Registro almacenado correctamente!');
      setTimeout(function(){
        resetForm(true);
        vm.loading = false;
      },1500);
    }

    function confirmDelete(row) {
      resetForm(false);
      Plaza.delete({
        'name': vm.catalogo.name,
        'id': row.IdPlaza
      }, function(data) {
        var response = data;
        Utils.showToast(response.Message);
        vm.init();
        vm.loading = false;
      });
      Log.storeData('Deleted: Se elimino la plaza: ' + row.Nombre, 'Plazas', row, 'Auditoria', 'Delete').then(function(){
      }).catch(function() {
        Utils.showToast('No se encontró el Servicio de Bitácora!!');
      });
    }

    vm.watch = function(row) {
      vm.readOnlyEditDiv = true;
      vm.Consultar();
      vm.plazaEdit = row;
    };

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/plaza-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.PlazaForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'plazaCtrl',
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