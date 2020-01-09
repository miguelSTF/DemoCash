(function() {
  'use strict';

  angular.module('appCash')
    .controller('DiasInhabilesController', DiasInhabilesController);

  /* @ngInject */
  function DiasInhabilesController(DiasInhabiles, Log, Utils, VerificarReg, Parametros, $scope, $mdDialog, $mdMedia, ValidateSession) {
    var vm = this;
    var objetoPreUpdate;
    vm.loading = true;
    vm.readOnlyEditDiv = false;
    vm.disabledSave = false;
    vm.insert = 0;
    vm.diasInhabiles = [];
    vm.diasDisabled = [];
    vm.catalogo = {
      id: 3,
      name: 'DiasInhabiles',
      catalogId: 'Fecha',
      orderby: 'Fecha'
    };
    vm.editRow = false;
    vm.disabledAgregar = false;

    vm.initial = function () {
      var validate = ValidateSession.validate(54);
      if (validate){
        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data) {
          console.log(data);
          vm.FechaOperacion = data.filter(function(n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
          vm.fechaOperacion = new Date(vm.FechaOperacion.Valor);
          vm.year = parseInt(vm.FechaOperacion.Valor.toString().substring(0,4));
          vm.yearActual = vm.year;
          vm.init();
        })
        .catch(function (error) {
          console.error(error);
          vm.loading = false;
        });
      }else{
        location.href = '#/login';
      }
    };

    vm.init = function() {
      if (vm.year.toString().length === 4){
        vm.diasInhabiles = [];
        DiasInhabiles.query({
          'name': vm.catalogo.name,
          'orderby': vm.catalogo.orderby,
          'year': vm.year
        })
          .$promise.then(function(resultado) {
          if (resultado.length <= 0) {
            Utils.showToast('No hay días festivos registrados!');
            vm.loading = false;
          } else {
            vm.diasInhabiles = resultado;
            vm.diasDisabled = [];
            vm.diasInhabiles.forEach(function(item){
              vm.diasDisabled.push(new Date(item.Fecha).toString());
            });
            vm.loading = false;
          }
        })
          .catch(function(response) {
            Utils.showToast('No se encontró el Servicio!!');
            console.error('Error: ' + JSON.stringify(response));
            vm.loading = false;
          });
      }else {
        Utils.showToast('Seleccione un año válido');
      }
      vm.disabledAgregar = vm.year < vm.yearActual;
    };

    vm.newEdit = function() {
      vm.editRow = false;
      resetForm(false);
      vm.Consultar();
      vm.insert = 1;
      vm.diaInhabilEdit = {};
      vm.diaInhabilEdit.Fecha = new Date(vm.fechaOperacion);
    };

    vm.checkDataReg = function() {
      vm.disabledSave = true;
      vm.loading = true;
      vm.idsRegistros = [];
      var paramsToSearch = {
        'filtro': 'Descripcion',
        'valor': vm.diaInhabilEdit.Descripcion
      };
      VerificarReg.query({
        'name': 'DiasInhabiles'
      }, paramsToSearch).$promise.then(function(respuesta) {
        vm.diaInhabilExist = respuesta;

        if (vm.diaInhabilExist.Descripcion !== undefined) {
          if (vm.diaInhabilExist.length > 0) {
            vm.diaInhabilExist.forEach(function(data){
              vm.idsRegistros.push(data.Descripcion);
            });
            var index = vm.idsRegistros.indexOf(vm.diaInhabilEdit.Descripcion);
            if (index > -1) {
              vm.saveEdit();
            }else{
              Utils.showToast('La Descripción para el Dia Festivo ya existe, verifique por favor!');
              vm.loading = false;
              vm.disabledSave = false;
            }
          }else{
            vm.saveEdit();
          }
        }else {
          if (vm.diaInhabilExist.length > 0) {
            Utils.showToast('La Descripción para el Dia Festivo ya existe, verifique por favor!');
            vm.loading = false;
            vm.disabledSave = false;
          }else {
            vm.saveEdit();
          }
        }
      });
    };

    vm.saveEdit = function() {
      DiasInhabiles.save({
        'name': vm.catalogo.name
      }, vm.diaInhabilEdit, function() {
      });
      if (vm.insert === 1) {
        vm.loading = true;
        Log.storeData('Insert: Se inserto el Dia Festivo: ' + vm.diaInhabilEdit.Descripcion, 'Días Festivos', vm.diaInhabilEdit, 'Auditoria', 'Insert').then(function(){
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
        Log.storeData('PreUpdate: Se hara update al Dia Festivo: ' + objetoPreUpdate.Descripcion, 'Días Festivos', objetoPreUpdate, 'Auditoria', 'Update').then(function() {
          Log.storeData('Update: El Dia Festivo ' + vm.diaInhabilEdit.Descripcion + ' ha sido modificada', 'Días Festivos', vm.diaInhabilEdit, 'Auditoria', 'Update').then(function(){
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
      if (vm.DiaInhabilForm.$dirty && sessionStorage.CerrandoSesion === undefined) {
        if (window.confirm('Hay cambios pendientes de guardar ¿Deseas descartarlos?')) {
          event.preventDefault();
        }
      }
    });

    vm.watch = function(row) {
      vm.readOnlyEditDiv = true;
      vm.Consultar();
      vm.diaInhabilEdit = row;
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
      vm.editRow = true;
      vm.Consultar();
      vm.diaInhabilEdit = row;
      vm.diaInhabilEdit.Fecha = new Date(vm.diaInhabilEdit.FechaForPicker);
      objetoPreUpdate = Utils.cloneObject(row);
      vm.insert = 0;
    };

    function resetForm(reload) {
      vm.readOnlyEditDiv = false;
      $mdDialog.hide();
      vm.diaInhabilEdit = null;
      vm.disabledSave = false;
      if (reload) {
        vm.init();
      }
    }

    function confirmDelete(row) {
      resetForm(false);
      DiasInhabiles.delete({
        'name': vm.catalogo.name,
        'id': row.Descripcion
      }, function(data) {
        Utils.showToast(data.Message);
        vm.init();
        vm.loading = false;
      });
      Log.storeData('Deleted: Se elimino el Dia Festivo: ' + row.Descripcion, 'Días Festivos', row, 'Auditoria', 'Delete').then(function(){
      }).catch(function() {
        Utils.showToast('No se encontró el Servicio de Bitácora!!');
      });
    }

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/diaInhabil-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.DiaInhabilForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'diasInhabilesCtrl',
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
        }
      });
    };

    vm.onlyWeekendsPredicate = function(date) {
      return Utils.disableDays(date,vm.diasDisabled);
    };

    vm.addOrSubstractYear = function(action){
      if(action === 'add'){
        vm.year = parseInt(vm.year) + 1;
      }else{
        vm.year = parseInt(vm.year) - 1;
      }
      vm.init();
    }

    vm.filterValue = function($event){
      if(isNaN(String.fromCharCode($event.keyCode))){
        $event.preventDefault();
      }else{
        vm.year = vm.year.toString().length > 3 ? parseInt(vm.year.toString().substring(0,3)) : vm.year;
      }
    }
  }
})();
