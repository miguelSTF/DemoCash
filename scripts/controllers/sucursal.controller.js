(function(){
    'use strict';

    angular.module('appCash')
    .controller('SucursalController', SucursalController);
    /* @ngInject */

  function SucursalController($scope, $mdDialog, $mdMedia, Sucursal, Log, Utils, VerificarReg, ValidateSession){
    var vm = this;
    var objetoPreUpdate;
    vm.loading = true;
    vm.disabledSave = false;
    vm.readOnlyEditDiv = false;

    vm.catalogo = {
      'name' : 'sucursal',
      'orderby' : 'Nombre'
    };

    vm.init = function(){
      var validate = ValidateSession.validate(41);
      if (validate){
        Sucursal.query({
          'name': vm.catalogo.name,
          'Activo': 3,
          'orderby': vm.catalogo.orderby
        })
        .$promise.then(function(resultado) {
          vm.sucursales = resultado;
          if (vm.sucursales.length <= 0) {
            Utils.showToast('No hay Sucursales registradas!');
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
      vm.sucursalEdit = null;
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
        'ValorNumero': vm.sucursalEdit.Numero,
        'FiltroNombre': 'Nombre',
        'ValorNombre': vm.sucursalEdit.Nombre
      }
      VerificarReg.query({
        'name': 'Sucursal', 
      }, paramsToSearch).$promise.then(function(respuesta) {
        vm.sucursalesExist = respuesta;
        if (vm.sucursalEdit.IdSucursal !== undefined) {
          if (vm.sucursalesExist.length > 0) {
            vm.sucursalesExist.forEach(function(data){
              vm.idsRegistros.push(data.IdSucursal);
            });
            var index = vm.idsRegistros.indexOf(vm.sucursalEdit.IdSucursal);
            if (index > -1) {
              vm.saveEdit();
            }else{
              Utils.showToast('El Número o Nombre para la Sucursal ya existe, verifique por favor!');
              vm.loading = false;
              vm.disabledSave = false;
            }
          }else{
            vm.saveEdit();
          }
        }else {
          if (vm.sucursalesExist.length > 0) {
            Utils.showToast('El Número o Nombre para la Sucursal ya existe, verifique por favor!');
            vm.loading = false;
            vm.disabledSave = false;
          }else {
            vm.saveEdit();
          }
        }
      });
    };

    vm.saveEdit = function() {
      Sucursal.save({
        'name': vm.catalogo.name
      }, vm.sucursalEdit, function() {
      });
      if (vm.sucursalEdit.Activo === undefined) {
        vm.sucursalEdit.Activo = 0;
      }
      if (vm.insert === 1) {
        vm.loading = true;
        Log.storeData('Insert: Se inserto la sucursal: ' + vm.sucursalEdit.Nombre, 'Sucursal', vm.sucursalEdit, 'Auditoria', 'Insert').then(function(){
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
        Log.storeData('PreUpdate: Se hara update a la sucursal: ' + objetoPreUpdate.Nombre, 'Sucursales', objetoPreUpdate, 'Auditoria', 'Update').then(function() {
          Log.storeData('Update: La sucursal ' + vm.sucursalEdit.Nombre + ' ha sido modificada', 'Sucursales', vm.sucursalEdit, 'Auditoria', 'Update').then(function(){
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
      vm.sucursalEdit = row;
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
      Sucursal.delete({
        'name': vm.catalogo.name,
        'id': row.IdSucursal
      }, function(data) {
        var response = data;
        Utils.showToast(response.Message);
        vm.init();
        vm.loading = false;
      });
      Log.storeData('Deleted: Se elimino la sucursal: ' + row.Nombre, 'Sucursales', row, 'Auditoria', 'Delete').then(function(){
      }).catch(function() {
        Utils.showToast('No se encontró el Servicio de Bitácora!!');
      });
    }

    vm.watch = function(row) {
      vm.readOnlyEditDiv = true;
      vm.Consultar();
      vm.sucursalEdit = row;
    };

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/sucursal-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.SucursalForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'sucursalCtrl',
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