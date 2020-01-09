/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('LimitesController', LimitesController);

  /* @ngInject */
  function LimitesController($mdDialog, $mdMedia, $scope, Catalogos, Relaciones, Limites, Utils, LimitesService, Log, ValidateSession) {
    var vm = this;
    vm.loading = true;

    vm.catalogoDescripcion = {
      name: 'LimiteCatalogo',
      catalogId: 'IdLimiteCatalogo'
    };
    vm.limitesEdit = {};
    vm.insert = 0;
    vm.watch = watch;
    vm.edit = edit;
    vm.newEdit = newEdit;
    vm.del = del;
    vm.catalogo = null;
    vm.searchCatalogo = '';
    vm.searchElemento = '';
    vm.searchLimite = '';

    var limiteMaximo;
    var idEspecifico;

    vm.init = function() {
      var validate = ValidateSession.validate(14);
      if (validate){
        Catalogos.query({
          'name': 'LimiteTipo',
          'orderby': 'Descripcion'
        }).$promise.then(function(limites) {
          vm.limites = limites;
          Catalogos.query({
            'name': 'catalogo',
            'orderby': 'Nombre'
          }).$promise.then(function(response) {
            vm.catalogos = response;
            Catalogos.query({
              'name': vm.catalogoDescripcion.name
            }).$promise.then(function(resultado) {
              if (resultado.length <= 0) {
                vm.limiteCatalogo = [];
                Utils.showToast('No hay limites registrados!');
              } else {
                vm.limiteCatalogo = resultado;
                vm.limites.forEach(function(limite) {
                  limite.visible = true;
                  vm.limiteCatalogo.forEach(function(item){
                    if(item.IdLimiteTipo === limite.IdLimiteTipo){
                      item.Descripcion = limite.Descripcion;
                    }
                    if (item.IdLimiteTipo === 1 || item.IdLimiteTipo === 2) {
                      item.Format = 'Numerico';
                    } else if (item.IdLimiteTipo === 4) {
                      item.Format = 'Hora';
                    } else if (item.IdLimiteTipo === 3) {
                      item.Format = 'Number';
                    }
                    vm.catalogos.forEach(function(c) {
                      if (item.IdCatalogo === c.IdCatalogo) {
                        item.Catalogo = c.Nombre;
                      }
                    });
                    if (item.IdCatalogo === 1) {
                      getData('Usuario', item);
                    } else if (item.IdCatalogo === 2) {
                      getData('Departamento', item);
                    } else if (item.IdCatalogo === 3) {
                      getData('Concepto', item);
                    }
                  });
                  if (item.IdCatalogo === 1) {
                    getData('Us4301R1731', item);
                  } else if (item.IdCatalogo === 2) {
                    getData('Departamento', item);
                  } else if (item.IdCatalogo === 3) {
                    getData('Concepto', item);
                  }
                });
              }
            })
            .catch(function(error) {
              Utils.showToast('No se encontro el Servicio!!');
              console.error('Error: ' + error);
              vm.loading = false;
            });
          });
        });
        vm.loading = false;
      }else{
        location.href = '#/login';
      }
    };

    function getData(catalogo, obj) {
      Catalogos.query({
        'name': catalogo,
        'Activo': 3
      }).$promise.then(function(resp) {
        vm.infoCat = resp;
        vm.infoCat.forEach(function(item) {
          var Id = 'Id' + catalogo;
          if (item[Id] === obj.IdEspecifico) {
            obj.Elemento = item.Nombre;
          }
        });
      });
    }

    function getDataView(nombre, row) {
      var dict = nombre === 'Concepto'
        ? {'name': nombre,'orderby': 'Nombre','Emite': '1','Tipo': '1', 'Activo':3}
        : {'name': nombre,'orderby': 'Nombre'};
      Catalogos.query(dict).$promise.then(function(response) {
        vm.conceptos = [];
        if(nombre === 'Concepto'){
          response.forEach(function(item){
            if(item.Activo === 2){
              vm.conceptos.push(item);
            }
          });
        }else{
          vm.conceptos = response;
        }
        var Id = 'Id' + nombre;
        vm.conceptos.forEach(function(res) {
          if (res[Id] === row.IdEspecifico) {
            vm.concepto = res;
          }
        });
      });
      vm.limites.forEach(function(lim) {
        if (lim.IdLimiteTipo === row.IdLimiteTipo) {
          vm.limite = lim;
        }
      });
      idEspecifico = row.IdEspecifico;
      vm.LimiteChange();
    }

    function watch(row) {
      vm.readOnlyEditDiv = true;
      vm.Consultar();
      vm.limitesEdit = row;
      vm.limite = null;

      vm.catalogos.forEach(function(element) {
        if (element.IdCatalogo === row.IdCatalogo) {
          vm.nombre = element.Nombre;
          vm.catalogo = element;
        }
      });
      if (vm.nombre === 'Usuario') {
        getDataView(vm.nombre, row);
      } else if (vm.nombre === 'Departamento') {
        getDataView(vm.nombre, row);
      } else if (vm.nombre === 'Concepto') {
        getDataView(vm.nombre, row);
      }
    }

    function edit(row) {
      vm.readOnlyEditDiv = false;
      vm.Consultar();
      vm.limitesEdit = row;

      vm.catalogos.forEach(function(element) {
        if (element.IdCatalogo === row.IdCatalogo) {
          vm.nombre = element.Nombre;
          vm.catalogo = element;
        }
      });

      if (vm.nombre === 'Usuario') {
        getDataView(vm.nombre, row);
      } else if (vm.nombre === 'Departamento') {
        getDataView(vm.nombre, row);
      } else if (vm.nombre === 'Concepto') {
        getDataView(vm.nombre, row);
      }
    }

    function newEdit() {
      vm.limitesEdit.IdLimiteCatalogo = 0;
      resetForm(false);
      vm.limpiarPantalla(1);
      vm.Consultar();
      vm.insert = 1;
      vm.catalogo = null;
    }

    function del(row) {
      var confirm = $mdDialog.confirm()
        .title('Atención')
        .textContent('¿Esta seguro de eliminar el registro?')
        .ariaLabel('Lucky day')
        .ok('Eliminar')
        .cancel('Regresar');
      $mdDialog.show(confirm).then(function() {
        confirmDelete(row);
      });
    }

    function confirmDelete(row) {
      resetForm(false);
      Catalogos.delete({
        'name': vm.catalogoDescripcion.name,
        'id': row.IdLimiteCatalogo
      }, function() {
        vm.init();
        Utils.showToast('Registro eliminado correctamente!');
        vm.loading = false;
      });
      Log.storeData('Deleted: Se elimino el límite: ' + row.Descripcion, 'Limites', row, 'Auditoria', 'Delete');
    }

    function resetForm(reload) {
      vm.readOnlyEditDiv = false;
      $mdDialog.hide();
      if (reload) {
        vm.init();
      }
    }

    vm.saveEdit = function() {
      if (vm.limite.IdLimiteTipo === 1 || vm.limite.IdLimiteTipo === 2) {
        limiteMaximo = vm.monto;
      } else {
        limiteMaximo = vm.opAcumulada;
      }
      vm.loading = true;
      vm.model = {
        'IdLimiteCatalogo': vm.limitesEdit.IdLimiteCatalogo,
        'IdCatalogo': vm.catalogo.IdCatalogo,
        'IdLimiteTipo': vm.limite.IdLimiteTipo,
        'LimiteMin': 0,
        'LimiteMax': limiteMaximo,
        'Descripcion': vm.limite.Descripcion,
        'IdEspecifico': idEspecifico,
        'Deleted': 0
      };
      if (vm.IdLimiteCatalogo !== null) {
        vm.model.IdLimiteCatalogo = vm.IdLimiteCatalogo;
      }

      LimitesService.save({
        'name': vm.catalogoDescripcion.name
      }, vm.model, function(data) {
        if (data) {
          vm.loading = false;
        }
      });

      if (vm.insert === 1) {
        Log.storeData('Insert: Se inserto un nuevo Limite', 'Limites', vm.model, 'Auditoria', 'Insert').then(function(){
          Utils.showToast('Registro almacenado correctamente!');
          setTimeout(function(){
            resetForm(true);
          },1500);
        });
      } else {
        Log.storeData('PreUpdate: Se actualizara un Limite', 'Limites', vm.preUpdate, 'Auditoria', 'Update').then(function() {
          Log.storeData('Update: Se actualizo un Limite', 'Limites', vm.model, 'Auditoria', 'Update').then(function(){
            Utils.showToast('Registro almacenado correctamente!');
            setTimeout(function(){
              resetForm(true);
            },1500);
          });
        });
      }
      vm.limpiarPantalla(4);
    };

    vm.limpiarPantalla = function(limpiar) {
      switch (limpiar) {
      case 1:
        //limpia catalogo para abajo
        vm.limite = null;
        vm.concepto = null;
        vm.monto = null;
        vm.opAcumulada = null;
        vm.showAcumuladas = false;
        vm.showMonto = false;
        vm.showHorario = false;
        break;

      case 2:
        //limpia concepto para abajo
        vm.limite = null;
        vm.cuentas = null;
        vm.monto = null;
        vm.opAcumulada = null;
        vm.showAcumuladas = false;
        vm.showMonto = false;
        vm.showHorario = false;
        break;

      case 3:
        //limpia tipoLimite para abajo
        vm.monto = null;
        vm.opAcumulada = null;
        break;

      case 4:
        //limpia pantalla
        vm.catalogo = null;
        vm.limite = null;
        vm.concepto = null;
        vm.monto = null;
        vm.opAcumulada = null;
        vm.showAcumuladas = false;
        vm.showMonto = false;
        vm.showHorario = false;
      }
    };

    vm.CatalogoChange = function() {
      vm.loading = true;
      var tipoCatalogo = vm.catalogo.Nombre;
      var dict = tipoCatalogo === 'Concepto'
        ? {'name': tipoCatalogo,'orderby': 'Nombre','Emite': '1','Tipo': '1', 'Activo':3}
        : {'name': tipoCatalogo,'orderby': 'Nombre'};
      Catalogos.query(dict).$promise.then(function(respuesta) {
        vm.conceptos = [];
        if(tipoCatalogo === 'Concepto'){
          respuesta.forEach(function(item){
            if(item.Activo === 2){
              vm.conceptos.push(item);
            }
          });
        }else{
          vm.conceptos = respuesta;
        }
        vm.loading = false;
      });
      vm.limpiarPantalla(1);
    };

    vm.ConceptoChange = function() {
      if (vm.catalogo.IdCatalogo === 1) {
        idEspecifico = vm.concepto.IdUsuario;
      } else if (vm.catalogo.IdCatalogo === 2) {
        idEspecifico = vm.concepto.IdDepartamento;
      } else if (vm.catalogo.IdCatalogo === 3) {
        idEspecifico = vm.concepto.IdConcepto;
      }
      var limitesIds = [];
      vm.limites.forEach(function(elem) {
        limitesIds.push(elem.IdLimiteTipo);
      });
      var limitesUsed = [];
      vm.limites.forEach(function(lim) {
        vm.limiteCatalogo.forEach(function(data) {
          if (lim.IdLimiteTipo === data.IdLimiteTipo && idEspecifico === data.IdEspecifico && data.IdCatalogo === vm.catalogo.IdCatalogo) {
            limitesUsed.push(data.IdLimiteTipo);
          }
        });
      });

      limitesUsed.forEach(function(elemnt) {
        var index = limitesIds.indexOf(elemnt);
        if (index > -1) {
          limitesIds.splice(index, 1);
        }
      });

      vm.limites.forEach(function(limite) {
        var index = limitesIds.indexOf(limite.IdLimiteTipo);
        if (index > -1) {
          limite.visible = true;
        } else {
          limite.visible = false;
        }
      });
      vm.limpiarPantalla(2);
    };

    vm.LimiteChange = function() {
      LimitesService.query({
        'name': vm.catalogoDescripcion.name,
        'IdCatalogo': vm.catalogo.IdCatalogo,
        'IdEspecifico': idEspecifico,
        'IdLimiteTipo': vm.limite.IdLimiteTipo,
      }).$promise.then(function(data) {
        vm.preUpdate = data;
        if (data.length > 0) {
          vm.insert = 0;
          if (data[0].IdLimiteTipo === 1 || data[0].IdLimiteTipo === 2) {
            vm.monto = data[0].LimiteMax;
          } else if (data[0].IdLimiteTipo === 3) {
            vm.opAcumulada = parseInt(data[0].LimiteMax);
          } else {
            vm.opAcumulada = data[0].LimiteMax;
          }
          vm.IdLimiteCatalogo = data[0].IdLimiteCatalogo;
          vm.loading = false;
        } else {
          vm.insert = 1;
          vm.IdLimiteCatalogo = null;
          vm.loading = false;
        }
      });
      if (vm.limite.IdLimiteTipo === 1 || vm.limite.IdLimiteTipo === 2) {
        vm.showMonto = true;
        vm.showHorario = false;
        vm.showAcumuladas = false;
      } else if (vm.limite.IdLimiteTipo === 3) {
        vm.showMonto = false;
        vm.showHorario = false;
        vm.showAcumuladas = true;
      } else {
        vm.showMonto = false;
        vm.showAcumuladas = false;
        vm.showHorario = true;
      }
    };

    $scope.$on('$locationChangeStart', function(event) {
      if (vm.LimitesForm.$dirty && sessionStorage.CerrandoSesion === undefined) {
        var answer = window.confirm('Hay cambios pendientes de guardar ¿Deseas descartarlos?');
        if (!answer) {
          event.preventDefault();
        }
      }
      return;
    });

    vm.handleKeyup = function(ev) {
      ev.stopPropagation();
    };

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/limites-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.LimitesForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'limiteCtrl',
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
