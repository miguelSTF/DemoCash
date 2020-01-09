(function() {
  'use strict';

  angular.module('appCash')
    .controller('ConfigTrasController', ConfigTrasController);

  /* @ngInject */
  function ConfigTrasController(CuentasInstitucion,Relaciones,Catalogos,Utils,Traspaso,Log,$mdDialog,$scope,$mdMedia) {
    var vm = this;
    var objetoPreUpdate;
    vm.traspasos = [];
    vm.cuentas = [];
    vm.departamentos = [];
    vm.conceptoPorDepartamentoOrigen = [];
    vm.conceptoPorDepartamentoDestino = [];
    
    vm.init = function(){
      CuentasInstitucion.query({
        'name': 'CuentaCorriente',
        'orderby':'Alias'
      })
      .$promise
      .then(function(resultado) {
        vm.cuentas = resultado;
        Catalogos.query({
          'name': 'departamento',
          'orderby':'Nombre'
        }).$promise.then(function(response) {
          vm.departamentos = response;
          Catalogos.query({
            'name': 'Concepto',
            'orderby':'Nombre'
          }).$promise.then(function(conceptos) {
            vm.conceptos = conceptos;
            Traspaso.query({
              'name': 'ConfiguracionTraspasos',
              'Activo': 3,
              'orderby': 'Nombre'
            })
            .$promise.then(function(traspasos) {
              vm.traspasos = traspasos;
              if (traspasos.length <= 0) {
                Utils.showToast('No hay configuraciones de traspasos registradas!');
                vm.loading = false;
              } else {
                vm.traspasos = traspasos;
                vm.traspasos.forEach(function(c){
                  vm.cuentas.forEach(function(cuenta){
                    vm.departamentos.forEach(function(depto){
                      vm.conceptos.forEach(function(cepto){
                        if(c.IdCuentaOrigen === cuenta.IdCuentaCorriente){
                          c.NombreCuentaOrigen = cuenta.Alias;
                        }if(c.IdCuentaDestino === cuenta.IdCuentaCorriente){
                          c.NombreCuentaDestino = cuenta.Alias;
                        }if(c.IdDepartamentoOrigen === depto.IdDepartamento){
                          c.NombreDepaOrigen = depto.Nombre;
                        }if(c.IdDepartamentoDestino === depto.IdDepartamento){
                          c.NombreDepaDestino = depto.Nombre;
                        }if(c.IdConceptoOrigen === cepto.IdConcepto){
                          c.NombreCeptoOrigen = cepto.Nombre;
                        }if(c.IdConceptoDestino === cepto.IdConcepto){
                          c.NombreCeptoDestino = cepto.Nombre;
                        }
                      });
                    });
                  });
                });
                vm.loading = false;
                vm.BuscarInfo();
              }
            })
            .catch(function(error) {
              Utils.showToast('Error al obtener informacion!!');
              console.error('Error: ' + error);
              vm.loading = false;
            });
          }).catch(function(error) {
            Utils.showToast('Error al obtener conceptos!!');
            console.error('Error: ' + error);
            vm.loading = false;
          });
        })
        .catch(function(error){
          console.log('Error: ' + error);
          Utils.showToast('Error al buscar los departamento!');
          vm.loading = false;
        });
      })
      .catch(function(error){
        console.log('Error: ' + error);
        Utils.showToast('Error al buscar las cuentas!');
        vm.loading = false;
      });
    };

    vm.BuscarInfo = function () {
      if (sessionStorage.length > 0) {
        Relaciones.query({
          'name': 'usuario',
          'id': sessionStorage.getItem('IdUsuario'),
          'relation': 'Departamento'
        }).$promise.then(function(data) {
          vm.departamentoPorUsuario = data;
          if (vm.departamentoPorUsuario.length === 0) {
            Utils.showToast('El usuario no tiene departamentos asignados!!');
          }
          vm.loading = false;
        }).catch(function(error) {
          console.log('Error: ' + JSON.stringify(error));
          Utils.showToast('Error al obtener departamento del usuario!!');
          vm.loading = false;
        });
      }
    };


    vm.DepartamentoChange = function(idDepto,from,reset) {
      vm.loading = true;
      Relaciones.query({
        'name': 'Departamento',
        'id': idDepto,
        'relation': 'Concepto'
      })
      .$promise.then(function(data) {
        if(data.length === 0){
          Utils.showToast('El departamento no tiene conceptos asociados!');
        }
        if (from === 'Origen') {
          vm.configTraspadoEdit.IdConceptoOrigen = vm.configTraspadoEdit.IdConceptoOrigen !== null && reset === false ? vm.configTraspadoEdit.IdConceptoOrigen : null;
          vm.conceptoPorDepartamentoOrigen = data;
        }else{
          vm.configTraspadoEdit.IdConceptoDestino = vm.configTraspadoEdit.IdConceptoDestino !== null && reset === false ? vm.configTraspadoEdit.IdConceptoDestino : null;
          vm.conceptoPorDepartamentoDestino = data;
        }
      }).catch(function(error) {
        Utils.showToast('Error al obtener conceptos del departamento!!');
        console.error('Error: ' + JSON.stringify(error));
        vm.loading = false;
      });

      Relaciones.query({
        'name': 'Us4301R1731',
        'id': sessionStorage.getItem('IdUsuario'),
        'relation': 'Concepto'
      })
      .$promise.then(function(data) {
        if(data.length === 0){
          Utils.showToast('El usuario no tiene conceptos asociados!');
        }
        if (from === 'Origen') {
          vm.conceptoPorUsuarioOrigen = data;
        }else{
          vm.conceptoPorUsuarioDestino = data;
        }
      }).catch(function(error) {
        Utils.showToast('Error al obtener conceptos del usuario!!');
        console.error('Error: ' + JSON.stringify(error));
        vm.loading = false;
      });
      vm.loading = false;
    };

    vm.newEdit = function() {
      resetForm(false);
      vm.Consultar();
      vm.insert = 1;
    };
    
    vm.edit = function(row) {
      vm.readOnlyEditDiv = false;
      vm.configTraspadoEdit = row;
      vm.DepartamentoChange(vm.configTraspadoEdit.IdDepartamentoOrigen,'Origen',false);
      vm.DepartamentoChange(vm.configTraspadoEdit.IdDepartamentoDestino,'Destino',false);
      vm.Consultar();
      objetoPreUpdate = {'Nombre':row.Nombre,'Cuenta Origen': row.NombreCuentaOrigen,'Departamento Origen': row.NombreDepaOrigen,'Concepto Origen': row.NombreCeptoOrigen,
                         'Cuenta Destino': row.NombreCuentaDestino,'Depatamento Destino': row.NombreDepaDestino,'Concepto Destino': row.NombreCeptoDestino,'Activo':row.Activo};
      vm.insert = 0;
    };

    vm.watch = function(row) {
      vm.configTraspadoEdit = row;
      vm.readOnlyEditDiv = true;
      vm.DepartamentoChange(vm.configTraspadoEdit.IdDepartamentoOrigen,'Origen',false);
      vm.DepartamentoChange(vm.configTraspadoEdit.IdDepartamentoDestino,'Destino',false);
      vm.Consultar();
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

    function confirmDelete(row) {
      var objDelete = {'Nombre':row.Nombre,'Cuenta Origen': row.NombreCuentaOrigen,'Departamento Origen': row.NombreDepaOrigen,'Concepto Origen': row.NombreCeptoOrigen,
                         'Cuenta Destino': row.NombreCuentaDestino,'Depatamento Destino': row.NombreDepaDestino,'Concepto Destino': row.NombreCeptoDestino,'Activo':row.Activo}
      resetForm(false);
      Traspaso.delete({
        'name': 'ConfiguracionTraspasos',
        'id': row.IdTraspaso
      }, function(data) {
        var response = data;
        Utils.showToast(response.Message);
        vm.init();
        vm.loading = false;
      });
      Log.storeData('Deleted: Se elimino la configuración de traspaso: ' + row.Nombre, 'Configuración de Traspaso', objDelete, 'Auditoria', 'Delete');
    }

    vm.saveEdit = function() {
      if (vm.configTraspadoEdit.Activo === undefined) {
        vm.configTraspadoEdit.Activo = 0;
      }
      Traspaso.save({
        'name': 'ConfiguracionTraspasos'
      }, vm.configTraspadoEdit, function(data) {
        if (data) {
          vm.loading = false;
        }
      });
      var nombreCuentaOrigen,nombreCuentaDestino,nombreDeptoOrigen,nombreDeptoDestino,nombreCeptoOrigen,nombreCeptoDestino;
      vm.cuentas.forEach(function(cuenta){
        if(cuenta.IdCuentaCorriente === vm.configTraspadoEdit.IdCuentaOrigen){
          nombreCuentaOrigen = cuenta.Alias;
        }else if(cuenta.IdCuentaCorriente === vm.configTraspadoEdit.IdCuentaDestino){
          nombreCuentaDestino = cuenta.Alias;
        }
      });
      vm.departamentos.forEach(function(depa){
        if(depa.IdDepartamento === vm.configTraspadoEdit.IdDepartamentoOrigen){
          nombreDeptoOrigen = depa.Nombre;
        }else if(depa.IdDepartamento === vm.configTraspadoEdit.IdDepartamentoDestino){
          nombreDeptoDestino = depa.Nombre;
        }
      });
      vm.conceptos.forEach(function(cepto){
        if(cepto.IdConcepto === vm.configTraspadoEdit.IdConceptoOrigen){
          nombreCeptoOrigen = cepto.Nombre;
        }else if(cepto.IdConcepto === vm.configTraspadoEdit.IdConceptoDestino){
          nombreCeptoDestino = cepto.Nombre;
        }
      });
      var configSave = {'Nombre': vm.configTraspadoEdit.Nombre, 'Cuenta Origen': nombreCuentaOrigen,'Departamento Origen': nombreDeptoOrigen, 'Concepto Origen': nombreCeptoOrigen,
                        'Cuenta Destino': nombreCuentaDestino, 'Departamento Destino': nombreDeptoDestino, 'Concepto Destino': nombreCeptoDestino,'Activo':vm.configTraspadoEdit.Activo};
      if (vm.insert === 1) {
        Log.storeData('Insert: Se inserto la configuración de traspaso: ' + vm.configTraspadoEdit.Nombre, 'Configuración de Traspaso', configSave, 'Auditoria', 'Insert').then(function(){
          Utils.showToast('Registro almacenado correctamente!');
          setTimeout(function(){
            resetForm(true);
          },1500);
        });
      } else {
        Log.storeData('PreUpdate: Se hara update a la configuración de traspaso: ' + objetoPreUpdate.Nombre, 'Configuración de Traspaso', objetoPreUpdate, 'Auditoria', 'Update').then(function() {
          Log.storeData('Update: La configuración de traspaso ' + vm.configTraspadoEdit.Nombre + ' ha sido modificada', 'Configuración de Traspaso', configSave, 'Auditoria', 'Update').then(function(){
            Utils.showToast('Registro almacenado correctamente!');
            setTimeout(function(){
              resetForm(true);
            },1500);
          });
        });
      }
    };

    function resetForm(reload) {
      vm.readOnlyEditDiv = false;
      $mdDialog.hide();
      vm.configTraspadoEdit = {};
      vm.conceptoPorDepartamentoOrigen = [];
      vm.conceptoPorDepartamentoDestino = [];
      if (reload) {
        vm.init();
      }
    }

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/configuracion_traspasos-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.ConfigTraspasoForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'configTrasCtrl',
                  controller: function($scope) {
                    $scope.viewDialog = function() {
                      $mdDialog.hide();
                    };
                    $scope.close = function() {
                      resetForm(true);
                      $mdDialog.hide();
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

    vm.handleKeyup = function(ev) {
      ev.stopPropagation();
    };
  }
})();
