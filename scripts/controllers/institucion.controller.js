(function() {
  'use strict';

  angular.module('appCash')
    .controller('InstitucionController', InstitucionController);

  /* @ngInject */
  function InstitucionController($scope, $mdDialog, $mdMedia, Instituciones, Log, Utils, VerificarReg, ValidateSession) {

    var objetoPreUpdate;
    var vm = this;
    vm.catalogo = {
      id: 3,
      name: 'Banco',
      catalogId: 'IdInstitucion',
      orderby: 'NombreCorto'
    };

    vm.loading = true;
    vm.readOnlyEditDiv = false;
    vm.disabledSave = false;
    vm.newEdit = newEdit;
    vm.saveEdit = saveEdit;
    vm.watch = watch;
    vm.del = del;
    vm.edit = edit;
    vm.insert = 0;
    vm.instituciones = [];
    vm.btnTipo = [{
      label: 'Bancaria',
      value: 'B'
    }, {
      label: 'Institucional',
      value: 'I'
    }];

    vm.init = function() {
      var validate = ValidateSession.validate(8);
      if (validate) {
        Instituciones.query({
          'name': vm.catalogo.name,
          'Activo': 3,
          'orderby': vm.catalogo.orderby
        })
        .$promise.then(function(resultado) {
          if (resultado.length <= 0) {
            Utils.showToast('No hay instituciones registradas!');
            vm.loading = false;
          } else {
            vm.instituciones = resultado;
            vm.loading = false;
          }
        }).catch(function(response) {
          Utils.showToast('No se encontró el Servicio!!');
          console.error('Error: ' + JSON.stringify(response));
          vm.loading = false;
        });
      }else {
        location.href = '#/login';
      }
    };

    function resetForm(reload) {
      vm.readOnlyEditDiv = false;
      $mdDialog.hide();
      vm.institucionEdit = null;
      vm.disabledSave = false;
      if (reload) {
        vm.init();
      }
    }

    function confirmDelete(row) {
      resetForm(false);
      Instituciones.delete({
        'name': vm.catalogo.name,
        'id': row.IdBanco
      },  function(data) {
        var response = data;
        Utils.showToast(response.Message);
        vm.init();
        vm.loading = false;
      });
      Log.storeData('Delete: Se elimino el banco: ' + row.Nombre, 'Bancos', row, 'Auditoria', 'Delete').then(function(){
      }).catch(function() {
        Utils.showToast('No se encontró el Servicio de Bitácora!!');
      });
    }

    function newEdit() {
      resetForm(false);
      vm.Consultar();
      vm.insert = 1;
    }

    vm.checkDataReg = function() {
      vm.disabledSave = true;
      vm.loading = true;
      vm.idsRegistros = [];
      var paramsToSearch = {
        'filtro': 'NombreCorto',
        'valor': vm.institucionEdit.NombreCorto
      };
      VerificarReg.query({
        'name': 'Banco'
      }, paramsToSearch).$promise.then(function(respuesta) {
        vm.institucionExist = respuesta;

        if (vm.institucionEdit.IdBanco !== undefined) {
          if (vm.institucionExist.length > 0) {
            vm.institucionExist.forEach(function(data){
              vm.idsRegistros.push(data.IdBanco);
            });
            var index = vm.idsRegistros.indexOf(vm.institucionEdit.IdBanco);
            if (index > -1) {
              saveEdit();
            }else{
              Utils.showToast('El Nombre Corto para la Institución ya existe, verifique por favor!');
              vm.loading = false;
              vm.disabledSave = false;
            }
          }else{
            saveEdit();
          }
        }else {
          if (vm.institucionExist.length > 0) {
          Utils.showToast('El Nombre Corto para la Institución ya existe, verifique por favor!');
          vm.loading = false;
          vm.disabledSave = false;
          }else {
            saveEdit();
          }
        }
      });
    };


    function saveEdit() {
      Instituciones.save({
        'name': vm.catalogo.name
      }, vm.institucionEdit).$promise.then(function() {
      if (vm.institucionEdit.Activo === undefined) {
        vm.institucionEdit.Activo = 0;
      }
      if (vm.insert === 1) {
        vm.loading = true;
        Log.storeData('Insert: Se inserto el banco: ' + vm.institucionEdit.Nombre, 'Bancos', vm.institucionEdit, 'Auditoria', 'Insert').then(function(){
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
        Log.storeData('PreUpdate: Se hara update al banco: ' + objetoPreUpdate.NombreCorto, 'Bancos', objetoPreUpdate, 'Auditoria', 'Update').then(function() {
          Log.storeData('Update: El banco ' + vm.institucionEdit.NombreCorto + ' ha sido modificada', 'Bancos', vm.institucionEdit, 'Auditoria', 'Update').then(function(){
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
    });
    }

    function timeoutValidacion() {
      Utils.showToast('No se encontró el Servicio de Bitácora!!');
      Utils.showToast('Registro almacenado correctamente!');
      setTimeout(function(){
        resetForm(true);
        vm.loading = false;
      },1500);
    }

    $scope.$on('$locationChangeStart', function(event) {
      if (vm.InstitucionForm.$dirty && sessionStorage.CerrandoSesion === undefined) {
        var answer = window.confirm('Hay cambios pendientes de guardar ¿Deseas descartarlos?');
        if (!answer) {
          event.preventDefault();
        }
      }
      return;
    });

    function watch(row) {
      vm.readOnlyEditDiv = true;
      vm.Consultar();
      vm.institucionEdit = row;
    }

    function edit(row) {
      vm.readOnlyEditDiv = false;
      vm.Consultar();
      vm.institucionEdit = row;
      objetoPreUpdate = Utils.cloneObject(row);
      vm.insert = 0;
    }

    function del(row) {
      var confirm = $mdDialog.confirm()
        .title('Atención')
        .textContent('¿Realmente quiere eliminar el registro seleccionado?')
        .ariaLabel('Lucky day')
        .ok('Eliminar')
        .cancel('Regresar');
      $mdDialog.show(confirm).then(function() {
        confirmDelete(row);
      });
    }

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/institucion-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.InstitucionForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'institucionCtrl',
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
