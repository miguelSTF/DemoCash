(function() {
  'use strict';
  angular.module('appCash')
    .controller('CuentasInstitucionController', CuentasInstitucionController);

  /* @ngInject */
  function CuentasInstitucionController($scope, $mdDialog, $mdMedia, CuentasInstitucion, SaveRelation, Log, Utils, VerificarReg, Divisa, ViaLiquidacion, Catalogos, ValidateSession) {
    var vm = this;
    var objetoPreUpdate;
    var maskChar = '-';

    vm.catalogo = {
      name: 'CuentaCorriente',
      catalogRelation: 'Banco',
      id: 'Id',
      orderby: 'Cuenta'
    };

    vm.loading = true;
    vm.readOnlyEditDiv = false;
    vm.insert = 0;
    vm.bancos = [];
    vm.cuentasInstitucion = [];
    vm.searchBanco = '';
    vm.searchDivisa = '';
    vm.searchVia = '';
    vm.viaLongitudMax = null;
    vm.disabledSave = false;

    vm.init = function() {
      var validate = ValidateSession.validate(12);
      if (validate) {
        Catalogos.query({
          'name': 'Configuracion',
          'Nombre': 'MascaraCuentaContable'
        })
        .$promise.then(function(resultado) {
          if (resultado.length <= 0) {
            Utils.showToast('No hay mascara para la cuenta contable');
          }
          vm.mascara = resultado[0].Valor;
          CuentasInstitucion.query({
            'name': vm.catalogo.name,
            'Activo': 3,
            'orderby': vm.catalogo.orderby
          })
          .$promise.then(function(resultado) {
            if (resultado.length <= 0) {
              Utils.showToast('No hay cuentas registradas!');
              vm.loading = false;
            }
            vm.cuentasInstitucion = resultado;
            Divisa.query({
              'name': 'Divisa'
            }).$promise.then(function(data) {
              vm.divisas = data;
            });
            CuentasInstitucion.query({
              'name': vm.catalogo.catalogRelation,
              'Activo': 1,
              'orderby': 'NombreCorto'
            })
            .$promise.then(function(response) {
              vm.bancos = response;
              ViaLiquidacion.query({
                'name': 'ViaLiquidacion',
                'orderby': 'Descripcion'
              }).$promise.then(function(data) {
                vm.viasLiquidacion = data;
                vm.cuentasInstitucion.forEach(function(cuentInst){
                  vm.bancos.forEach(function(bank){
                    if(cuentInst.IdBanco === bank.IdBanco){
                      cuentInst.NombreBanco = bank.Nombre;
                    }
                  });
                  vm.divisas.forEach(function(divisa){
                    if(cuentInst.IdDivisa === divisa.IdDivisa){
                      cuentInst.NombreDivisa = divisa.NombreCorto;
                    }
                  });
                  vm.viasLiquidacion.forEach(function(viaLiq){
                    if(cuentInst.IdViaLiquidacion === viaLiq.IdViaLiquidacion){
                      cuentInst.NombreViaLiq = viaLiq.Descripcion;
                    }
                  });
                });
              });
            });
            vm.permisoGeneral = vm.getPermisos(21);
            vm.permisoContable = vm.getPermisos(22);
            vm.loading = false;
          })
          .catch(function(response) {
            Utils.showToast('No se encontró el Servicio!!');
            console.error('Error: ' + JSON.stringify(response));
            vm.loading = false;
          });
        });
      }else {
        location.href = '#/login';
      }
    };


    vm.getPermisos = function(permiso) {
      var idPantalla = 12;
      var permisos = [];
      JSON.parse(sessionStorage.getItem('Menu')).forEach(function(item){
        item.SubMenus.forEach(function(sub){
          if(sub.IdPermiso === idPantalla)
          {
            permisos = sub.Permiso;
          }
        });
      });
      var indexOf = permisos.indexOf(permiso);
      return indexOf >= 0;
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
        'filtro': 'Alias',
        'valor': vm.cuentasEdit.Alias
      };
      VerificarReg.query({
        'name': 'CuentaCorriente'
      }, paramsToSearch).$promise.then(function(respuesta) {
        vm.cuentasExist = respuesta;

        if (vm.cuentasEdit.IdCuentaCorriente !== undefined) {
          if (vm.cuentasExist.length > 0) {
            vm.cuentasExist.forEach(function(data){
              vm.idsRegistros.push(data.IdCuentaCorriente);
            });
            var index = vm.idsRegistros.indexOf(vm.cuentasEdit.IdCuentaCorriente);
            if (index > -1) {
              vm.saveEdit();
            }else{
              Utils.showToast('El Alias para la cuenta ya existe, verifique por favor!');
              vm.loading = false;
              vm.disabledSave = false;
            }
          }else{
            vm.saveEdit();
          }
        }else {
          if (vm.cuentasExist.length > 0) {
          Utils.showToast('El Alias para la cuenta ya existe, verifique por favor!');
          vm.loading = false;
          vm.disabledSave = false;
          }else {
            vm.saveEdit();
          }
        }
      });
    };

    vm.saveEdit = function() {
      if (vm.cuentasEdit.CuentaContable !== undefined && vm.cuentasEdit.CuentaContable !== null) {
        var reFinal = new RegExp('\\' + maskChar, 'g');
        vm.cuentasEdit.CuentaContable = vm.cuentasEdit.CuentaContable.replace(reFinal, '');
      }
      
      SaveRelation.save({
        'name': vm.catalogo.name
      }, vm.cuentasEdit, function(data) {
        if (data.Message !== null) {
          Utils.showToast(data.Message);
        }
      });
      if (vm.cuentasEdit.Activo === undefined) {
        vm.cuentasEdit.Activo = 0;
      }
      if (vm.insert === 1) {
        vm.loading = true;
        Log.storeData('Insert: Se inserto la cuenta: ' + vm.cuentasEdit.Cuenta, 'Cuentas', vm.cuentasEdit, 'Auditoria', 'Insert').then(function(){
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
        Log.storeData('PreUpdate: Se hara update a la cuenta: ' + objetoPreUpdate.Cuenta, 'Cuentas', objetoPreUpdate, 'Auditoria', 'Update').then(function() {
          Log.storeData('Update: La cuenta' + vm.cuentasEdit.Cuenta + 'ha sido modificada', 'cuentas', vm.cuentasEdit, 'Auditoria', 'Update').then(function(){
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

    $scope.$on('$locationChangeStart', function(event) {
      if (vm.CuentasForm.$dirty && sessionStorage.CerrandoSesion === undefined) {
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
      vm.cuentasEdit = row;
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
      vm.cuentasEdit = row;
      objetoPreUpdate = Utils.cloneObject(row);
      vm.insert = 0;
    };

    vm.getMaxLength = function() {
      vm.viasLiquidacion.forEach(function(via) {
        if (via.IdViaLiquidacion === vm.cuentasEdit.IdViaLiquidacion) {
          vm.viaLongitudMax = via.LongitudMaxima;
        }
      });
    };

    function resetForm(reload) {
      vm.readOnlyEditDiv = false;
      $mdDialog.hide();
      vm.cuentasEdit = null;
      vm.viaLongitudMax = null;
      vm.disabledSave = false;
      if (reload) {
        vm.init();
      }
    }

    function confirmDelete(row) {
      resetForm(false);
      CuentasInstitucion.delete({
        'name': vm.catalogo.name,
        'id': row.IdCuentaCorriente
      }, function(data) {
        var response = data;
        Utils.showToast(response.Message);
        vm.init();
        vm.loading = false;
      });
      Log.storeData('Delete: Se elimino la cuenta: ' + row.Cuenta, 'Cuentas', row, 'Auditoria', 'Delete').then(function(){
      }).catch(function() {
        Utils.showToast('No se encontró el Servicio de Bitácora!!');
      });
    }

    vm.handleKeyup = function(ev) {
      ev.stopPropagation();
    };

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/cuentasInstitucion-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.CuentasForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'cuentasInstitucionCtrl',
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
