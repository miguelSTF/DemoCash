(function() {
  'use strict';

  angular.module('appCash')
    .controller('PerfilesController', PerfilesController);

  /* @ngInject */
  function PerfilesController($scope, $mdDialog, $mdMedia, Perfiles, Log, Utils, CatalogosRelacion, VerificarReg, ValidateSession) {
    var vm = this;
    vm.objectUpdate = [];
    vm.objectPreUpdate = [];
    vm.formDirty = false;
    vm.tipoPerfiles = [];
    vm.readOnlyEditDiv = false;
    vm.disabledSave = false;
    vm.insert = 0;
    vm.loading = true;    

    vm.init = function() {
      var validate = ValidateSession.validate(25);
      if (validate){
        Perfiles.query({
          'name': 'Permiso'
        }).$promise.then(function(respuesta) {
          vm.permisos = respuesta;
          Perfiles.query({
            'name': 'TipoPerfil',
            'Activo': 3
          }).$promise.then(function(resultado) {
            vm.tipoPerfiles = resultado;
            Perfiles.query({
              'name': 'PantallaOperacion'
            }).$promise.then(function(res) {
              vm.pantallaOperacion = res;
              Perfiles.query({
                'name': 'TipoPermisoPantalla'
              }).$promise.then(function(data) {
                vm.tipoPermisoPantalla = data;
                vm.menu = vm.permisos.filter(function(permiso) {
                  return permiso.Contenedor === 0;
                });
                var subMenus = vm.permisos.filter(function(item) {
                  return item.Contenedor > 0;
                });
                if(vm.menu.length > 0){
                  vm.menu.sort(sortMenu);
                }
                vm.menu.forEach(function(item) {
                  item.Selected = false;
                  item.SubMenus = [];
                  subMenus.forEach(function(sub) {
                    sub.Selected = false;
                    if (item.IdPermiso === sub.Contenedor) {
                      item.SubMenus.push(sub);
                    }
                  });
                  if(item.SubMenus.length > 0){
                    item.SubMenus.sort(sortMenu);
                  }
                });
                var pantallaOper = vm.pantallaOperacion;
                pantallaOper.forEach(function(permiso){
                  vm.tipoPermisoPantalla.forEach(function(tipo){
                    if (permiso.IdTipoPermisoPantalla === tipo.IdTipoPermisoPantalla) {
                      permiso.Clave = tipo.Clave;
                      permiso.Selected = false;
                    }
                  });
                });
                vm.menu.forEach(function(menu) {
                  menu.SubMenus.forEach(function(subM) {
                    subM.Selected = false;
                    subM.PermisoPantalla = [];
                    pantallaOper.forEach(function(data){
                      if (subM.IdPermiso  === data.IdPermiso) {
                        subM.PermisoPantalla.push(data);
                      }
                    });
                  });
                });
              });
            });
          });
          vm.loading = false;
        })
        .catch(function() {
          Utils.showToast('No se encontró el Servicio!!');
          vm.loading = false;
        });
      }else {
        location.href = '#/login';
      }
    };

    function sortMenu(a,b){
      if (a.Ordenamiento < b.Ordenamiento)
      return -1;
      if (a.Ordenamiento > b.Ordenamiento)
      return 1;
      return 0;
    }

    vm.buscarPermisos = function(idTipoPerfil) {
      vm.objectPreUpdate = [];
      if (idTipoPerfil !== undefined) {
        vm.menu.forEach(function(menu) {
          menu.Selected = false;
          menu.SubMenus.forEach(function(subM) {
            subM.Selected = false;
            subM.PermisoPantalla.forEach(function(test) {
              test.Selected = false;
            });
          });
        });
        Perfiles.query({
          'name': 'Perfil',
          'IdTipoPerfil': idTipoPerfil
        }).$promise.then(function(respuesta) {
          vm.menu.forEach(function(opciones) {
            respuesta.forEach(function(item) {
              if (opciones.IdPermiso === item.Permisos) {
                opciones.Selected = true;
                vm.objectPreUpdate.push({
                  'Permiso Menu': opciones.NombreObjeto
                });
              }
            });
            Perfiles.query({
              'name': 'PermisoPantalla',
              'IdTipoPerfil': idTipoPerfil
            }).$promise.then(function(permiso) {
              vm.permisoPantalla = permiso;
              opciones.SubMenus.forEach(function(elem) {
                elem.Selected = false;
                respuesta.forEach(function(item) {
                  if (elem.IdPermiso === item.Permisos) {
                    elem.Selected = true;
                    vm.objectPreUpdate.push({
                      'Permiso SubMenu': elem.NombreObjeto
                    });
                  }
                });
                elem.PermisoPantalla.forEach(function(data){
                  data.Selected = false;
                  vm.permisoPantalla.forEach(function(tipo){
                    if (data.IdPantallaOperacion === tipo.IdPantallaOperacion && tipo.IdTipoPerfil === idTipoPerfil) {
                      data.Selected = true;
                      vm.objectPreUpdate.push({
                        'Permiso Pantalla': data.Clave
                      });
                    }
                  });
                });
              });
            });
          });
        });
      } else {
        vm.menu.forEach(function(menu) {
          menu.Selected = false;
          menu.SubMenus.forEach(function(subM) {
            subM.Selected = false;
            subM.PermisoPantalla.forEach(function(test) {
              test.Selected = false;
            });
          });
        });
      }
    };

    vm.checkDataReg = function() {
      vm.disabledSave = true;
      vm.loading = true;
      vm.idsRegistros = [];
      var paramsToSearch = {
        'filtro': 'Clave',
        'valor': vm.perfilEdit.Clave
      }
      VerificarReg.query({
        'name': 'TipoPerfil'
      }, paramsToSearch).$promise.then(function(respuesta) {
        vm.perfilesExist = respuesta;

        if (vm.perfilEdit.IdTipoPerfil !== undefined) {
          if (vm.perfilesExist.length > 0) {
            vm.perfilesExist.forEach(function(data){
              vm.idsRegistros.push(data.IdTipoPerfil);
            });
            var index = vm.idsRegistros.indexOf(vm.perfilEdit.IdTipoPerfil);
            if (index > -1) {
              vm.saveRelaciones();
            }else{
              Utils.showToast('El Nombre de Perfil ya existe, verifique por favor!');
              vm.loading = false;
              vm.disabledSave = false;
            }
          }else{
            vm.saveRelaciones();
          }
        }else {
          if (vm.perfilesExist.length > 0) {
          Utils.showToast('El Nombre de Perfil ya existe, verifique por favor!');
          vm.loading = false;
          vm.disabledSave = false;
          }else {
            vm.saveRelaciones();
          }
        }
      });
    };

    vm.saveRelaciones = function() {
      vm.objectUpdate = [];
      vm.listToSave = {};
      if (vm.perfilEdit === null || vm.perfilEdit.Clave === undefined) {
        Utils.showToast('Introduce un nombre de perfil valido');
      } else {
        vm.listToSave.TipoPerfil = {
          'IdTipoPerfil': vm.perfilEdit.IdTipoPerfil,
          'Clave': vm.perfilEdit.Clave,
          'Activo': vm.perfilEdit.Activo
        };
        vm.listToSave.Perfil = [];
        vm.listToSave.PermisoPantalla = [];
        vm.menu.forEach(function(item) {
          if (item.Selected) {
            vm.objectUpdate.push({
              'Permiso Menu': item.NombreObjeto
            });
            vm.listToSave.Perfil.push({
              'IdTipoPerfil': vm.tipoPerfil,
              'Permisos': item.IdPermiso
            });
          }
          item.SubMenus.forEach(function(permiso) {
            if (permiso.Selected) {
              vm.listToSave.Perfil.push({
                'IdTipoPerfil': vm.tipoPerfil,
                'Permisos': permiso.IdPermiso
              });
              vm.objectUpdate.push({
                'Permiso SubMenu': permiso.NombreObjeto
              });
            }
            permiso.PermisoPantalla.forEach(function(data) {
              if (data.Selected) {
                vm.listToSave.PermisoPantalla.push({
                  'IdTipoPerfil': vm.tipoPerfil,
                  'IdPantallaOperacion': data.IdPantallaOperacion
                });
                vm.objectUpdate.push({
                  'Permiso Pantalla': data.Clave
                });
              }
            });
          });
        });
        CatalogosRelacion.send({
          'name': 'perfiles',
          'id': 'permisos'
        }, vm.listToSave).$promise.then(function(respuesta) {
          if (respuesta.length === 0 || angular.isUndefined(respuesta[0].ErrorCode)) {
            var objetoPermisosPreUpdate = vm.objectPreUpdate.length === 0 ? {
              'Permisos': 'Sin permisos asignados'
            } : vm.objectPreUpdate;
            var objetoPermisosUpdate = vm.objectUpdate.length === 0 ? {
              'Permisos': 'Sin permisos asignados'
            } : vm.objectUpdate;
            if (vm.insert === 1) {
              vm.loading = true;
              Log.storeData('Insert: Se inserto el perfil: ' + vm.perfilEdit.Clave, 'Perfiles', objetoPermisosUpdate, 'Auditoria', 'Insert').then(function(){
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
              Log.storeData('PreUpdate: Al Tipo Perfil: ' + vm.perfilEdit.Clave, 'Perfiles', objetoPermisosPreUpdate, 'Auditoria', 'Update').then(function() {
                Log.storeData('Update: El Tipo Perfil: ' + vm.perfilEdit.Clave + ' ha sido modificado', 'Perfiles', objetoPermisosUpdate, 'Auditoria', 'Update').then(function() {
                  vm.objectPreUpdate = vm.objectUpdate;
                  vm.objectUpdate = [];
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
          } else {
            Utils.showToast('Error al guardar el Registo!!');
            vm.loading = false;
            vm.disabledSave = false;
          }
        })
        .catch(function() {
          Utils.showToast('No se encontró el Servicio!!');
          vm.loading = false;
          vm.disabledSave = false;
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

    vm.selectAll = function(idMenu) {
      if (!vm.readOnlyEditDiv) {
        var nSubmenus = getNSubmenus(idMenu);
        var nSelected = getNSelected(idMenu);
        if (nSubmenus === nSelected) {
          selectAllChange(idMenu, false);
        } else {
          selectAllChange(idMenu, true);
        }
      }
    };

    function selectAllChange(idMenu, valor) {
      vm.menu.forEach(function(menu) {
        if (menu.IdPermiso === idMenu) {
          menu.SubMenus.forEach(function(sub) {
            sub.Selected = valor;
            sub.PermisoPantalla.forEach(function(test){
              test.Selected = valor;
            });
          });
        }
      });
    }

    vm.isChecked = function(idMenu) {
      var nSubmenus = getNSubmenus(idMenu);
      var nSelected = getNSelected(idMenu);
      return nSelected > 0 && nSelected <= nSubmenus;
    };

    function getNSubmenus(idMenu) {
      var nSubmenus = 0;
      vm.menu.forEach(function(item) {
        if (item.IdPermiso === idMenu) {
          nSubmenus = item.SubMenus.length;
        }
      });
      return nSubmenus;
    }

    function getNSelected(idMenu) {
      var nSelected = 0;
      vm.menu.forEach(function(item) {
        if (item.IdPermiso === idMenu) {
          item.SubMenus.forEach(function(obj) {
            if (obj.Selected) {
              nSelected = nSelected + 1;
            }
          });
        }
      });
      return nSelected;
    }

    vm.selectAllY = function(idMenu,status) {
      if (!vm.readOnlyEditDiv) {
        var nSubmenusY = getNSubmenusY(idMenu);
        var nSelectedY = getNSelectedY(idMenu);
        if(nSubmenusY === nSelectedY) {
          if(status){
            selectAllChangeY(idMenu, false);
          }else{
            selectAllChangeY(idMenu, true);
          }
        } else {
          selectAllChangeY(idMenu, true);
        }
      }
    };

    function selectAllChangeY(idMenu, valor) {
      vm.menu.forEach(function(menu) {
        menu.SubMenus.forEach(function(sub) {
          if (sub.IdPermiso === idMenu) {
            if(sub.PermisoPantalla.length > 0){
              sub.PermisoPantalla.forEach(function(PermisoPantalla) {
                PermisoPantalla.Selected = valor;
              });
            }else{
              sub.Selected = valor;
            }
          }
        });
      });
    }

    vm.isCheckedY = function(idMenu,status) {
      var nSubmenusY = getNSubmenusY(idMenu);
      var nSelectedY = getNSelectedY(idMenu);
      if(nSubmenusY >= 1){
        return nSelectedY > 0 && nSelectedY <= nSubmenusY;
      }else{
        return status;
      }
    };

    function getNSubmenusY(idMenu) {
      var nSubmenusY = 0;
      vm.menu.forEach(function(item) {
        item.SubMenus.forEach(function(data) {
          if (data.IdPermiso === idMenu) {
            nSubmenusY = data.PermisoPantalla.length;
          }
        });
      });
      return nSubmenusY;
    }

    function getNSelectedY(idMenu) {
      var nSelectedY = 0;
      vm.menu.forEach(function(item) {
        item.SubMenus.forEach(function(data){
          if (data.IdPermiso === idMenu) {
            data.PermisoPantalla.forEach(function(obj) {
              if (obj.Selected) {
                nSelectedY = nSelectedY + 1;
              }
            });
          }
        });
      });
      return nSelectedY;
    }

    vm.watch = function(row) {
      vm.readOnlyEditDiv = true;
      vm.Consultar();
      vm.perfilEdit = row;
      vm.buscarPermisos(row.IdTipoPerfil);
    };

    vm.edit = function(row) {
      vm.readOnlyEditDiv = false;
      vm.Consultar();
      vm.perfilEdit = row;
      vm.insert = 0;
      vm.buscarPermisos(row.IdTipoPerfil);
    };

    vm.newEdit = function() {
      if (vm.formDirty) {
        var confirm = $mdDialog.confirm()
          .title('Atención')
          .textContent('Hay cambios sin guardar en la página, ¿Deseas descartarlos?')
          .ariaLabel('Lucky day')
          .ok('Continuar')
          .cancel('Regresar');
        $mdDialog.show(confirm).then(function() {
          resetForm(true);
          vm.Consultar();
        });
      } else {
        resetForm(false);
        vm.Consultar();
        vm.insert = 1;
        vm.buscarPermisos();
      }
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
      resetForm(false);
      CatalogosRelacion.delete({
        'name': 'perfiles',
        'id': row.IdTipoPerfil
      }).$promise.then(function(respuesta) {
        var response = respuesta;
        Utils.showToast(response.Message);                
        if(response.Sended){
          Log.storeData('Deleted: Se elimino el Perfil: ' + row.Clave, 'Perfiles', row, 'Auditoria', 'Delete')
          .then(function() {
            vm.loading = false;
          })
          .catch(function() {
            Utils.showToast('No se encontró el Servicio de Bitácora!!');
          });
        }
        vm.init();
      });
    }

    function resetForm(reload) {
      vm.formDirty = false;
      vm.readOnlyEditDiv = false;
      vm.perfilEdit = null;
      vm.disabledSave = false;
      if (reload) {
        vm.init();
        $mdDialog.hide();
      }
    }

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/perfiles-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.formDirty || vm.PerfilForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'perfilCtrl',
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
