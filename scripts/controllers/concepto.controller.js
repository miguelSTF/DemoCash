(function() {
  'use strict';

  angular.module('appCash')
    .controller('ConceptoController', ConceptoController);

  /* @ngInject */
  function ConceptoController($scope, $mdDialog, $mdMedia, Conceptos, VerificarReg, CuentasInstitucion, Log, Utils, Catalogos, Ordenes, ValidateSession) {
    var vm = this;
    var objetoPreUpload;
    var maskChar = '-';
    vm.departamentoRelacion = 0;

    vm.catalogo = {
      id: 3,
      name: 'Concepto',
      catalogId: 'IdConcepto',
      catalogRelation: 'CuentaCorriente',
      orderby: 'Nombre'
    };

    vm.loading = true;
    vm.readOnlyEditDiv = false;
    vm.listCuentaInstitucion = 0;
    vm.insert = 0;
    vm.DropVisible = true;
    vm.conceptos = [];
    vm.tiposMensaje = [];
    vm.searchTipo = '';
    vm.searchMensaje = '';
    vm.searchMensajeOper = '';
    vm.searchMensajeCuentaCorr = '';
    vm.showSelectOperacionBanxico = false;
    vm.disabledSave = false;
    vm.tipos = [
      {
        label: 'ENTRADA',
        value: 0
      },
      {
        label: 'SALIDA',
        value: 1
      }
    ];
    vm.autorizacion = [
      {
        label:'INACTIVO',
        value: 0,
      },
      {
        label: 'POR AUTORIZAR',
        value: 1
      },
      {
        label: 'AUTORIZADO',
        value: 2
      }
    ];

    vm.permisoGeneral = true;
    vm.permisoContable = true;
    vm.permisoEstatus = true;

    vm.init = function() {
      var validate = ValidateSession.validate(10);
      if (validate){
        vm.conceptos= [];
        Catalogos.query({
          'name': 'Configuracion',
          'Nombre': 'MascaraCuentaContable'
        })
        .$promise.then(function(resultado) {
          if (resultado.length <= 0) {
            Utils.showToast('No hay mascara para la cuenta contable');
          }
          vm.mascara = resultado[0].Valor;

          Conceptos.query({
            'name': 'relaciones/DepartamentoConcepto'
          }).$promise.then(function(respuesta) {
            if (respuesta.length === 0) {
              Utils.showToast('No hay departamentos registrados!');
            } else {
              vm.departamentosTodos = respuesta;
              vm.departamentos = [];
              vm.departamentosTodos.forEach(function(item){
                if(item.Departamento.Activo > 0){
                  vm.departamentos.push(item);
                }
              });
            }

            Conceptos.query({
              'name': vm.catalogo.name,
              'Activo': 3,
              'orderby': vm.catalogo.orderby
            })
            .$promise
            .then(function(resultado) {
              if (resultado <= 0) {
                Utils.showToast('No hay conceptos registrados!');
                vm.loading = false;
              }
              resultado.forEach(function(item){
                if(item.Categoria === 2 || item.Categoria === 3){
                  vm.conceptos.push(item);
                }
              });

              vm.conceptos.forEach(function(item){
                vm.departamentosTodos.forEach(function(depto){
                  depto.IdConceptos.forEach(function(ceptoRelacionado){
                    if(item.IdConcepto === ceptoRelacionado){
                      item.Departamento = depto.Departamento.Nombre;
                    }
                    return;
                  });
                });

                vm.autorizacion.forEach(function(aut){
                  if(item.Activo === aut.value){
                    item.EstatusActivo = aut.label;
                  }
                });
              });

              CuentasInstitucion.query({
                'name': vm.catalogo.catalogRelation
              })
              .$promise.then(function(resultado) {
                vm.cuentas = resultado;
                vm.cuentas.sort(sortCuentas);
                vm.conceptos.map(function(cepto) {
                  vm.cuentas.map(function(cuenta) {
                    if (cepto.IdCuentaCorriente === cuenta.IdCuentaCorriente) {
                      cepto.CuentaN = cuenta.Alias;
                    }
                  });
                });
                vm.IdsCuentas = vm.cuentas.map(function(resp) {
                  return resp.IdCuentaCorriente;
                });
                vm.loading = false;
              });
              vm.permisoGeneral = vm.getPermisos(10,21);
              vm.permisoContable = vm.getPermisos(10,22);
              vm.permisoEstatus = vm.getPermisos(10,23);

            });
          }).catch(function(response) {
            Utils.showToast('No se encontró el Servicio!!');
            console.error('Error: ' + JSON.stringify(response));
            vm.loading = false;
          });
        });
      }else {
        location.href = '#/login';
      }
    };

    vm.getPermisos = function(idPantalla,permiso) {
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
      return indexOf<0;
    };

    function sortCuentas(a,b){
      if (a.Alias < b.Alias){
        return -1;
      }
      if (a.Alias > b.Alias)
      {
        return 1;
      }
        return 0;
    }

    vm.newEdit = function() {
      vm.departamentoRelacion= 0;
      vm.hasOperaciones = false;
      vm.listCuentaInstitucion = 0;
      resetForm(false);
      vm.Consultar();
      vm.conceptoEdit= {};
      vm.insert = 1;
      vm.conceptoEdit.Activo = 1;
    };

    vm.checkDataReg = function() {
      vm.disabledSave = true;
      vm.loading = true;
      vm.idsRegistros = [];
      var paramToSearch = {
        'filtro': 'Nombre', 
        'valor': vm.conceptoEdit.Nombre        
      };
      VerificarReg.query({
        'name': 'Concepto'
      },paramToSearch).$promise.then(function(respuesta) {
        vm.conceptosExist = respuesta;

        if (vm.conceptoEdit.IdConcepto !== undefined) {
          if (vm.conceptosExist.length > 0) {
            vm.conceptosExist.forEach(function(data){
              vm.idsRegistros.push(data.IdConcepto);
            });
            var index = vm.idsRegistros.indexOf(vm.conceptoEdit.IdConcepto);
            if (index > -1) {
              vm.validaCuentaContable();
            }else{
              Utils.showToast('El Nombre Corto del concepto ya existe, verifique por favor!');
              vm.loading = false;
              vm.disabledSave = false;
            }
          }else{
            vm.validaCuentaContable();
          }
        }else {
          if (vm.conceptosExist.length > 0) {
          Utils.showToast('El Nombre Corto del concepto ya existe, verifique por favor!');
          vm.loading = false;
          vm.disabledSave = false;
          }else {
            vm.validaCuentaContable();
          }
        }
      });
    };

    vm.validaCuentaContable = function(){
      if(vm.conceptoEdit.Activo === 2){
        var departamento = {};

        vm.departamentos.forEach(function(item){
        if(item.Departamento.IdDepartamento === vm.departamentoRelacion){
            departamento = item.Departamento;
          }
        });

        if(departamento.CuentaContable === '' || departamento.CuentaContable === null || departamento.CuentaContableAjuste === '' || departamento.CuentaContableAjuste === null){
          if(vm.conceptoEdit.CuentaContable === '' ||vm.conceptoEdit.CuentaContable === undefined || vm.conceptoEdit.CuentaContable === null || vm.conceptoEdit.CuentaContableAjuste === undefined || vm.conceptoEdit.CuentaContableAjuste === null || vm.conceptoEdit.CuentaContableAjuste === ''){
            Utils.showToast('Favor de configurar las cuentas contables del Concepto');
            vm.loading = false;
            vm.disabledSave = false;
          }
          else{
            vm.saveEdit();
          }
        }
        else{
          vm.saveEdit();
        }
      }
      else{
        vm.saveEdit();
      }

    };

    vm.saveEdit = function() {
      if (vm.listCuentaInstitucion > 0) {
        if (vm.conceptoEdit.CuentaContable !== undefined && vm.conceptoEdit.CuentaContable !== null) {
          var reFinal = new RegExp('\\' + maskChar, 'g');
          vm.conceptoEdit.CuentaContable = vm.conceptoEdit.CuentaContable.replace(reFinal, '');
        }
        if (vm.conceptoEdit.CuentaContableAjuste !== undefined && vm.conceptoEdit.CuentaContableAjuste !== null) {
          var reFinal = new RegExp('\\' + maskChar, 'g');
          vm.conceptoEdit.CuentaContableAjuste = vm.conceptoEdit.CuentaContableAjuste.replace(reFinal, '');
        }

        vm.conceptoEdit.IdCuentaCorriente = vm.listCuentaInstitucion;

        if(vm.showSelectOperacionBanxico){
          vm.conceptoEdit.Atributos = JSON.stringify([{'TipoOperacion' : vm.conceptoEdit.selectOperacionBanxico.IdOperacion }]);
        }else{
          vm.conceptoEdit.Atributos = '[{}]';
        }

        vm.conceptoEdit.Categoria = vm.conceptoEdit.Categoria === undefined ? 3 : vm.conceptoEdit.Categoria;

        vm.relaciones = {
          Concepto: vm.conceptoEdit,
          IdDepartamento: vm.departamentoRelacion
        };

        Conceptos.save({
          'name': 'relaciones/ConceptoDepartamento'
        }, vm.relaciones, function(data) {

          if(data.Sended === true){
            if (vm.conceptoEdit.Activo === undefined) {
              vm.conceptoEdit.Activo = 0;
            }
            if (vm.conceptoEdit.Emite === undefined) {
              vm.conceptoEdit.Emite = 0;
            }

            if (vm.insert === 1) {
              vm.loading = true;
              Log.storeData('Insert: Se inserto el concepto: ' + vm.conceptoEdit.Clave, 'Conceptos', vm.conceptoEdit, 'Auditoria', 'Insert').then(function(){
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
              Log.storeData('PreUpdate: Se hara update al concepto: ' + objetoPreUpload.Clave, 'Conceptos', objetoPreUpload, 'Auditoria', 'Update').then(function() {
                Log.storeData('Update: El Concepto ' + vm.conceptoEdit.Clave + ' ha sido modificado', 'Conceptos', vm.conceptoEdit, 'Auditoria', 'Update').then(function(){
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
          }else{
            Utils.showToast(data.Message);
            vm.loading = false;
          }
        });
      }
      else {
        Utils.showToast('Asignar una Cuenta Corriente!');
        vm.disabledSave = false;
        vm.loading = false;
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
      if (vm.ConceptoForm.$dirty && sessionStorage.CerrandoSesion === undefined) {
        var answer = window.confirm('Hay cambios pendientes de guardar ¿Deseas descartarlos?');
        if (!answer) {
          event.preventDefault();
        }
      }
      return;
    });

    vm.watch = function(row) {
      vm.readOnlyEditDiv = true;
      vm.ObtienDepartamentoId(row);
      vm.Consultar();
      vm.conceptoEdit = row;
      if(vm.conceptoEdit.IdTipoMensaje === 7){
        filtraOperacionesBanxico();
      }
      vm.listCuentaInstitucion = row.IdCuentaCorriente;
      filtraTiposMensaje(true);
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
      vm.ObtienDepartamentoId(row);

      Ordenes.query({
        'name': 'header',
        'IdConceptoLiq': row.IdConcepto
      })
      .$promise
      .then(function(data){
        vm.hasOperaciones = data.length === 0 ? false : true;
        vm.Consultar();
        vm.conceptoEdit = row;
        vm.estatusAutorizado = vm.conceptoEdit.Activo;
        if(vm.conceptoEdit.IdTipoMensaje === 7){
          filtraOperacionesBanxico();
        }
        objetoPreUpload = Utils.cloneObject(row);
        vm.listCuentaInstitucion = row.IdCuentaCorriente;
        vm.IdsCuentas = vm.cuentas.map(function(resp) {
          return resp.IdCuentaCorriente;
        });
        var index = vm.IdsCuentas.indexOf(vm.conceptoEdit.IdCuentaCorriente);
        vm.IdsCuentas.splice(index, 1);
        vm.insert = 0;
        filtraTiposMensaje(true);
      });
    };

    vm.BuscaTipoMensaje = function(){
      vm.showSelectOperacionBanxico = false;
      if(vm.listCuentaInstitucion > 0){
         filtraTiposMensaje();
      }
      if (vm.conceptoEdit.IdTipoMensaje !== 5) {
        vm.conceptoEdit.PermiteCargaMasiva = 0;
      }
    };

    vm.ObtienDepartamentoId = function(row){
      vm.departamentoRelacion= 0;
      vm.departamentosTodos.forEach(function(item){
        if(item.Departamento.Nombre === row.Departamento){
          vm.departamentoRelacion = item.Departamento.IdDepartamento;
        }
      });
    };

    function resetForm(reload) {
      vm.readOnlyEditDiv = false;
      vm.showSelectOperacionBanxico = false;
      $mdDialog.hide();
      vm.conceptoEdit = null;
      vm.listCuentaInstitucion = [];
      vm.tiposmensajesFilter = null;
      vm.disabledSave = false;
      vm.estatusAutorizado = 0;
      if (reload) {
        vm.init();
      }
    }

    function confirmDelete(row) {
      resetForm(false);
      Conceptos.delete({
        'name': vm.catalogo.name,
        'id': row.IdConcepto
      }, function(data) {
        var response = data;
        Utils.showToast(response.Message);
        vm.init();
        vm.loading = false;
      });
      Log.storeData('Deleted: Se elimino el concepto: ' + row.Clave, 'Conceptos', row, 'Auditoria', 'Delete').then(function(){
      }).catch(function() {
        Utils.showToast('No se encontró el Servicio de Bitácora!!');
      });
    }

    function filtraTiposMensaje(watching) {
      if(!watching){
      vm.tiposmensajesFilter = [];
      vm.conceptoEdit.IdTipoMensaje = null;
      }
      var IdViaCuenta = 0;
         vm.cuentas.forEach(function(cuenta) {
        if (vm.listCuentaInstitucion === cuenta.IdCuentaCorriente) {
          vm.conceptoEdit.IdCuentaCorriente = cuenta.IdCuentaCorriente;
          vm.conceptoEdit.CuentaN = cuenta.Alias;
          IdViaCuenta = cuenta.IdViaLiquidacion;
        }
      });

      Catalogos.query({
        'name': 'PayloadViaConfiguracion',
        'IdVia': IdViaCuenta
      })
      .$promise
      .then(function(resultado) {
        vm.tiposmensajesFilter = resultado;
        vm.conceptoEdit.IdTipoMensaje = vm.tiposmensajesFilter.length === 1 ? vm.tiposmensajesFilter[0].Tipo : vm.conceptoEdit.IdTipoMensaje !== undefined ? vm.conceptoEdit.IdTipoMensaje : undefined;
      });

    }

    function filtraOperacionesBanxico(){
      vm.showSelectOperacionBanxico = true;
      vm.loading = true;

      Catalogos.query({
        'name': 'OperacionesBanxico',
      })
      .$promise.then(function(data) {
        vm.operacionesBanxico = data;

        var conceptoEditAtributes = JSON.parse(vm.conceptoEdit.Atributos);
        vm.operacionesBanxico.forEach(function(item){
          if(item.IdOperacion === conceptoEditAtributes[0].TipoOperacion){
            vm.conceptoEdit.selectOperacionBanxico = item;
          }
        });
        vm.loading = false;
      }).catch(function(response){
        Utils.showToast('No se encontró el Servicio!!');
        console.error('Error: ' + JSON.stringify(response));
        vm.loading = false;
      });
    }

    vm.handleKeyup = function(ev) {
      ev.stopPropagation();
    };

    vm.tipoMensajeOnClose = function(){
      vm.searchMensaje = '';
      vm.conceptoEdit.selectOperacionBanxico = {};
      if(vm.conceptoEdit.IdTipoMensaje === 7){
        vm.showSelectOperacionBanxico = true;
        vm.loading = true;
        Catalogos.query({
          'name': 'OperacionesBanxico',
        })
        .$promise.then(function(data) {
          vm.operacionesBanxico = data;
          vm.loading = false;
        }).catch(function(response){
          Utils.showToast('No se encontró el Servicio!!');
          console.error('Error: ' + JSON.stringify(response));
          vm.loading = false;
        });
      }else{
        vm.showSelectOperacionBanxico = false;
      }
      if (vm.conceptoEdit.IdTipoMensaje !== 5) {
        vm.conceptoEdit.PermiteCargaMasiva = 0;
      }
    };

    vm.Consultar = function() {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/concepto-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function() {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.ConceptoForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'conceptoCtrl',
                  controller: function($scope) {
                    $scope.viewDialog = function() {
                      $mdDialog.hide();
                    };
                    $scope.close = function() {
                      $mdDialog.hide();
                      resetForm(true);
                    };
                  },
                  templateUrl:'./views/templates/dialog-confirm.html'
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
