(function() {
  'use strict';

  angular.module('appCash')
    .controller('GrupocuentasController', GrupocuentasController);

  /* @ngInject */
  function GrupocuentasController($scope, $mdDialog, $mdMedia, Utils, GrupoCuentas, CuentasInstitucion, Divisa, GrupoCuentasP, Log, VerificarReg, ValidateSession) {
    var vm = this;
    vm.catalogo = {
      name: 'GrupoCuentaCorriente',
      relacion: 'GrupoCuenta',
      catalogCuentas: 'CuentaCorriente'
    };
    vm.readOnlyEditDiv = true;
    vm.insert = 0;
    vm.cuentasFiltradas = [];
    vm.Grupos = [];
    vm.relaciongrupos = [];
    vm.CuentasInstitucion = [];
    vm.divisas = [];
    vm.insert = 0;
    vm.DropVisible = true;
    var enableBtnDeleteChip = true;
    vm.cuentasAsignadas = [];
    vm.searchDivisa = '';
    vm.disabledSave = false;

    vm.init = function() {
      var validate = ValidateSession.validate(17);
      if (validate){
        vm.cuentasAsignadas = [];
        GrupoCuentas.query({
          'name': vm.catalogo.name,
          'Activo': 3,
          'orderby': 'Nombre'
        }).$promise.then(function(resultado) {
          vm.Grupos = resultado;
          GrupoCuentas.query({
            'name': vm.catalogo.relacion
          }).$promise.then(function(relacion) {
            vm.relaciongrupos = relacion;
            CuentasInstitucion.query({
              'name': vm.catalogo.catalogCuentas
            }).$promise.then(function(institucion) {
              vm.CuentasInstitucion = institucion;
              Divisa.query({
                'name': 'Divisa'
              }).$promise.then(function(div) {
                vm.divisas = div;
                vm.Grupos.forEach(function(item) {
                  item.cuenta = [];
                  item.ncuenta = [];
                  vm.relaciongrupos.forEach(function(itemr) {
                    if (item.IdGrupo === itemr.IdGrupo) {
                      item.cuenta.push(itemr.IdCuentaCorriente);
                    }
                  });
                  item.cuenta.forEach(function(relacioncuenta) {
                    vm.CuentasInstitucion.forEach(function(obj) {
                      if (relacioncuenta === obj.IdCuentaCorriente) {
                        item.ncuenta.push(obj.Alias + ' ' + obj.Cuenta);
                      }
                    });
                  });
                });
                vm.Grupos.forEach(function(grup) {
                  vm.divisas.forEach(function(div) {
                    if (grup.IdDivisa === div.IdDivisa) {
                      grup.divisa = div.NombreCorto;
                    }
                  });
                });
              });
            });
          });
        });
      }else{
        location.href = '#/login';
      }
    };

    vm.filtraCuentas = function() {
      vm.editGrupo.cuenta = [];
    };

    vm.divisaChange = function() {
      vm.cuentasFiltradas = [];
      vm.cuentasAsignadas = [];
      vm.CuentasInstitucion.forEach(function(cuenta) {
        if (cuenta.IdDivisa === vm.editGrupo.IdDivisa) {
          vm.cuentasFiltradas.push(cuenta.IdCuentaCorriente);
        }
      });
      if (vm.editGrupo.cuenta !== undefined) {
        vm.cuentasAsignadas = vm.editGrupo.cuenta;
        vm.cuentasAsignadas.forEach(function(item) {
          vm.cuentasFiltradas.splice(vm.cuentasFiltradas.indexOf(item), 1);
        });
      }
    };

    $scope.$on('$locationChangeStart', function(event) {
      if (vm.GrupocuentasForm.$dirty && sessionStorage.CerrandoSesion === undefined) {
        var answer = window.confirm('Hay cambios pendientes de guardar ¿Deseas descartarlos?');
        if (!answer) {
          event.preventDefault();
        }
      }
      return;
    });

    vm.newEdit = function() {
      vm.editGrupo = null;
      vm.cuentasFiltradas = [];
      vm.cuentasAsignadas = [];
      resetForm(false);
      vm.Consultar();
      vm.insert = 1;
    };

    vm.checkDataReg = function() {
      vm.disabledSave = true;
      vm.loading = true;
      vm.idsRegistros = [];
      var paramsToSearch = {
        'filtro': 'Nombre',
        'valor': vm.editGrupo.Nombre
      };
      VerificarReg.query({
        'name': 'GrupoCuentaCorriente', 
      }, paramsToSearch).$promise.then(function(respuesta) {
        vm.grupoExist = respuesta;

        if (vm.editGrupo.IdGrupo !== undefined) {
          if (vm.grupoExist.length > 0) {
            vm.grupoExist.forEach(function(data){
              vm.idsRegistros.push(data.IdGrupo);
            });
            var index = vm.idsRegistros.indexOf(vm.editGrupo.IdGrupo);
            if (index > -1) {
              vm.saveEdit();
            }else{
              Utils.showToast('El Nombre del Grupo ya existe, verifique por favor!');
              vm.loading = false;
              vm.disabledSave = false;
            }
          }else{
            vm.saveEdit();
          }
        }else {
          if (vm.grupoExist.length > 0) {
          Utils.showToast('El Nombre del Grupo ya existe, verifique por favor!');
          vm.loading = false;
          vm.disabledSave = false;
          }else {
            vm.saveEdit();
          }
        }
      });
    };

    vm.saveEdit = function() {
      var objetoGrupo = {
        'IdGrupo': vm.editGrupo.IdGrupo,
        'Nombre': vm.editGrupo.Nombre,
        'IdDivisa': vm.editGrupo.IdDivisa,
        'Activo': vm.editGrupo.Activo
      };
      vm.idRelaciones = [];
      vm.cuentasAsignadas.map(function(cuenta) {
        vm.idRelaciones.push(cuenta);
      });

      var objetoSave = {
        Grupo: objetoGrupo,
        IdCuentas: vm.idRelaciones
      };
      GrupoCuentasP.send(objetoSave)
        .$promise
        .then(function() {
          vm.editGrupo = null;
          if (objetoSave.Grupo.Activo === undefined) {
            objetoSave.Grupo.Activo = 0;
          }
          objetoSave.Cuentas = objetoSave.IdCuentas.toString();
          if (vm.insert === 1) {
            vm.loading = true;
            Log.storeData('Insert: Se inserto al Grupo: ' + objetoSave.Grupo.Nombre, 'Grupo Cuentas', objetoSave, 'Auditoria', 'Insert').then(function(){
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
            Log.storeData('PreUpdate: Se hara update al Grupo: ' + objetoSave.Grupo.Nombre, 'Grupo Cuentas', vm.preUpdate, 'Auditoria', 'Update').then(function() {
              Log.storeData('Update: El Grupo ' + objetoSave.Grupo.Nombre + ' ha sido modificado', 'Grupo Cuentas', objetoSave, 'Auditoria', 'Update').then(function(){
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

    function resetForm(reload) {
      vm.readOnlyEditDiv = false;
      $mdDialog.hide();
      vm.cuentasFiltradas = [];
      vm.cuentasAsignadas = [];
      vm.disabledSave = false;
      if (reload) {
        vm.init();
      }
    }

    vm.watch = function(row) {
      vm.readOnlyEditDiv = true;
      vm.Consultar();
      vm.editGrupo = row;
      vm.divisaChange();
    };

    vm.del = function(row) {
      var confirm = $mdDialog.confirm()
        .title('Atención')
        .textContent('¿Esta seguro de eliminar el grupo?')
        .ariaLabel('Lucky day')
        .ok('Eliminar')
        .cancel('Regresar');
      $mdDialog.show(confirm).then(function() {
        confirmDelete(row);
      });
    };

    vm.OnDrop = function() {
      vm.GrupocuentasForm.$dirty = true;
      $scope.$apply(function() {
        vm.dropSelected = false;
      });
      enableBtnDeleteChip = true;
    };

    vm.OnDropList = function() {
      vm.GrupocuentasForm.$dirty = true;
      $scope.$apply(function() {
        vm.DropVisible = true;
        vm.dropList = false;
        vm.dropSelected = false;
      });
      enableBtnDeleteChip = true;
    };

    vm.OnDragStartList = function() {
      $scope.$apply(function() {
        vm.dropSelected = true;
      });
    };

    vm.OnDragStart = function() {
      enableBtnDeleteChip = false;
      $scope.$apply(function() {
        vm.DropVisible = false;
        vm.dropList = true;
      });
    };

    vm.OnDragStop = function() {
      $scope.$apply(function() {
        vm.DropVisible = true;
        vm.dropSelected = false;
        vm.dropList = false;
      });
    };

    vm.OnDragStopList = function() {
      $scope.$apply(function() {
        vm.DropVisible = true;
        vm.dropList = false;
        vm.dropSelected = false;
      });
    };

    vm.DeleteChip = function(item) {
      if (enableBtnDeleteChip) {
        vm.GrupocuentasForm.$dirty = true;
        vm.cuentasAsignadas.splice(vm.cuentasAsignadas.indexOf(item), 1);
        vm.cuentasFiltradas.push(item);
      }
      enableBtnDeleteChip = true;
    };

    function confirmDelete(row) {
      GrupoCuentas.delete({
        'name': vm.catalogo.name,
        'id': row.IdGrupo
      }, function() {
        Utils.showToast('Registro eliminado correctamente!');
        Log.storeData('Deleted: Se elimino al grupo: ' + row.Nombre, 'Grupos Cuentas', row, 'Auditoria', 'Delete').then(function(){
        }).catch(function() {
          Utils.showToast('No se encontró el Servicio de Bitácora!!');
        });
        vm.loading = false;
        resetForm(true);
      });
    }

    vm.edit = function(row) {
      vm.preUpdate = {
        'IdGrupo': row.IdGrupo,
        'Nombre': row.Nombre,
        'Divisa': row.IdDivisa,
        'Activo': row.Activo,
        'Cuentas': row.cuenta.toString()
      };
      vm.insert = 0;
      vm.Consultar();
      vm.readOnlyEditDiv = false;
      vm.editGrupo = row;
      vm.divisaChange();
    };

    vm.handleKeyup = function(ev) {
      ev.stopPropagation();
    };

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/grupocuentas-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.GrupocuentasForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'grupocuentasCtrl',
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
