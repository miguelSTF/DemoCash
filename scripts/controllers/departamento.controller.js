(function() {
  'use strict';

  angular.module('appCash')
    .controller('DepartamentoController', DepartamentoController);

  /* @ngInject */
  function DepartamentoController($scope, $mdDialog, $mdMedia, $filter, Departamentos, Log, Utils, Catalogos, VerificarReg, ValidateSession) {

    var objetoPreUpload;
    var vm = this;
    var maskChar = '-';
    vm.disabledSave = false;

    vm.catalogo = {
      id: 1,
      name: 'relaciones/DepartamentoConcepto',
      catalogId: 'IdDepartamento',
      catalogRelation: 'Concepto',
      orderby: 'Nombre'
    };

    vm.loading = true;
    vm.readOnlyEditDiv = false;
    $scope.readOnlyEditDiv = false;
    vm.DropVisible = true;
    $scope.listConceptos = [];
    vm.conceptoss = [];
    $scope.conceptosMap =[];
    vm.insert = 0;
    vm.permisoGeneral = false;
    vm.permisoContable = false;

    vm.init = function() {
      var validate = ValidateSession.validate(11);
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
          Departamentos.query({
            'name': vm.catalogo.catalogRelation,
            'Activo': 3
          })
          .$promise
          .then(function(response) {
            response.forEach(function(item){
              if(item.Categoria === 2 || item.Categoria === 3){
                vm.conceptos.push(item);
              }
            });
            vm.conceptos.sort(sortConceptos);
            Departamentos.query({
              'name': 'ConceptosNoAsignados'
            }).$promise.then(function(respuesta) {
              vm.conceptoss = respuesta.map(function(resp) {
                return resp.idConcepto;
              });
              vm.conceptos.forEach(function(ceptoObj){
                vm.conceptoss.forEach(function(ceptoId){
                  if(ceptoObj.IdConcepto === ceptoId){
                    $scope.conceptosMap.push(ceptoObj);
                  }
                });
              });
            });
            loadDepartamentos();
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
      var idPantalla = 11;
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

    function sortConceptos(a,b){
        if (a.Nombre < b.Nombre){
        return -1;
      }
        if (a.Nombre > b.Nombre){
          return 1;
        }
          return 0;
    }

    function loadDepartamentos() {
      Departamentos.query({
        'name': vm.catalogo.name,
        'orderby': vm.catalogo.orderby
      }).$promise.then(function(respuesta) {
        if (respuesta.length === 0) {
          Utils.showToast('No hay departamentos registrados!');
        } else {
          respuesta.forEach(function(item){
            if(item.Departamento.Clave === 'ADMIN_LIQ' || item.Departamento.Clave === 'RP_INI'){
              item.Departamento.editable = false;
            }
            else{
              item.Departamento.editable = true;
            }
          });
          vm.departamentos = respuesta;
          vm.departamentos.forEach(function(depa){
            depa.listConceptos = [];
            depa.IdConceptos.forEach(function (idConcepto) {
              vm.conceptos.forEach(function(objConcepto){
                if(objConcepto.IdConcepto === idConcepto){
                  depa.listConceptos.push(objConcepto);
                }
              });
            });
          });
        }
      });
    }

    vm.newEdit = function() {
      resetForm(false);
      vm.Consultar();
      vm.insert = 1;
    };

    vm.checkDataReg = function() {
      vm.disabledSave = true;
      vm.loading = true;
      vm.idsRegistros = [];
      var paramsToSearch ={
        'filtro': 'Nombre',
        'valor': vm.deptoEdit.Departamento.Nombre
      };
      VerificarReg.query({
        'name': 'Departamento'
      },paramsToSearch).$promise.then(function(respuesta) {
        vm.deptoExist = respuesta;

        if (vm.deptoEdit.Departamento.IdDepartamento !== undefined) {
          if (vm.deptoExist.length > 0) {
            vm.deptoExist.forEach(function(data){
              vm.idsRegistros.push(data.IdDepartamento);
            });
            var index = vm.idsRegistros.indexOf(vm.deptoEdit.Departamento.IdDepartamento);
            if (index > -1) {
              vm.saveEdit();
            }else{
              Utils.showToast('El Nombre Corto del Departamento ya existe, verifique por favor!');
              vm.loading = false;
              vm.disabledSave = false;
            }
          }else{
            vm.saveEdit();
          }
        }else {
          if (vm.deptoExist.length > 0) {
          Utils.showToast('El Nombre Corto del Departamento ya existe, verifique por favor!');
          vm.loading = false;
          vm.disabledSave = false;
          }else {
            vm.saveEdit();
          }
        }
      });
    };

    vm.saveEdit = function() {
      vm.loading = true;

      if (vm.deptoEdit.Departamento.CuentaContable !== undefined && vm.deptoEdit.Departamento.CuentaContable !== null) {
        var reFinal = new RegExp('\\' + maskChar, 'g');
        vm.deptoEdit.Departamento.CuentaContable = vm.deptoEdit.Departamento.CuentaContable.replace(reFinal, '');
      }
      if (vm.deptoEdit.Departamento.CuentaContableAjuste !== undefined && vm.deptoEdit.Departamento.CuentaContableAjuste !== null) {
        var reFinal = new RegExp('\\' + maskChar, 'g');
        vm.deptoEdit.Departamento.CuentaContableAjuste = vm.deptoEdit.Departamento.CuentaContableAjuste.replace(reFinal, '');
      }

      Departamentos.send({
        'name': 'Departamento'
      }, vm.deptoEdit.Departamento, function() {
        return;
      });
      if (vm.deptoEdit.Departamento.Activo === undefined) {
        vm.deptoEdit.Departamento.Activo = 0;
      }

      if(vm.deptoEdit.IdConceptos === undefined){
        vm.deptoEdit.IdConceptos = '';
      }
      var objetoBitacora = {
        'Departamento': vm.deptoEdit.Departamento,
        'Conceptos': vm.deptoEdit.IdConceptos.toString()
      };

      if (vm.insert === 1) {
        vm.loading = true;
        Log.storeData('Insert: Se inserto el Departamento: ' + vm.deptoEdit.Departamento.Nombre, 'Departamentos', vm.deptoEdit.Departamento, 'Auditoria', 'Insert').then(function(){
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
        Log.storeData('PreUpdate: Al Departamento: ' + objetoPreUpload.Departamento.Descripcion, 'Departamentos', objetoPreUpload, 'Auditoria', 'Update').then(function() {
          Log.storeData('Update: El departamento ' + vm.deptoEdit.Departamento.Nombre + ' ha sido modificado', 'Departamentos', objetoBitacora, 'Auditoria', 'Update').then(function(){
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
      if (vm.DepartamentoForm.$dirty && sessionStorage.CerrandoSesion === undefined) {
        var answer = window.confirm('Hay cambios pendientes de guardar ¿Deseas descartarlos?');
        if (!answer) {
          event.preventDefault();
        }
      }
      return;
    });

    vm.watch = function(row) {
      vm.readOnlyEditDiv = true;
      $scope.readOnlyEditDiv = true;
      vm.Consultar();
      vm.deptoEdit = row;
      vm.conceptos.forEach(function(objConcepto){
        row.IdConceptos.forEach(function(idConcepto){
          if(objConcepto.IdConcepto === idConcepto){
            $scope.listConceptos.push(objConcepto);
          }
        });
      });

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
      $scope.readOnlyEditDiv = false;
      vm.Consultar();
      vm.deptoEdit = row;
      objetoPreUpload = Utils.cloneObject(row);
      vm.insert = 0;

      var ceptAll = vm.conceptos.map(function(resp) {
        return resp.IdConcepto;
      });

      vm.conceptos.forEach(function(objConcepto){
        row.IdConceptos.forEach(function(idConcepto){
          if(objConcepto.IdConcepto === idConcepto){
            $scope.listConceptos.push(objConcepto);
          }
        });
      });

      row.IdConceptos.filter(function(resp) {
        return ceptAll.indexOf(resp) >= 0;
      });

    };

    function resetForm(reload) {
      vm.readOnlyEditDiv = false;
      $scope.readOnlyEditDiv = false;
      $mdDialog.hide();
      vm.deptoEdit = null;
      $scope.listConceptos = [];
      vm.showDiv = false;
      vm.disabledSave = false;
      if (reload) {
        loadDepartamentos();
      }
    }

    function confirmDelete(row) {

      var idsCeptosDelete = row.IdConceptos;
      vm.conceptos.forEach(function(ceptoObj){
        idsCeptosDelete.forEach(function(idCepto){
            if(ceptoObj.IdConcepto === idCepto){
              $scope.conceptosMap.push(ceptoObj);
            }
        });
      });

      resetForm(false);
      Departamentos.delete({
        'name': 'Departamento',
        'id': row.Departamento.IdDepartamento
      }, function(data) {
        var response = data;
        Utils.showToast(response.Message);
        loadDepartamentos();
        vm.loading = false;
        return;
      });
      Log.storeData('Deleted: Se elimino al departamento: ' + row.Departamento.Clave, 'Departamentos', row.Departamento, 'Auditoria', 'Delete').then(function(){
      }).catch(function() {
        Utils.showToast('No se encontró el Servicio de Bitácora!!');
      });
    }


    vm.Consultar = function()
    {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/departamento-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function()
        {
          vm.viewDialog = function viewDialog()
          {
            if (!vm.readOnlyEditDiv) {
              if (vm.DepartamentoForm.$dirty) {
                $mdDialog.show({
                  skipHide: true,
                  scope: $scope,
                  preserveScope: true,
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


          vm.viewConceptos = function viewDialog()
          {
            $mdDialog.show({
              skipHide: true,
              templateUrl: './views/templates/departamentosConceptosEdit.html',
              scope: $scope,
              preserveScope:true,
              controller: function($scope)
              {
                $scope.ceptosAsignados = JSON.parse(JSON.stringify($scope.listConceptos));

                $scope.closeDialog = function()
                {
                  $mdDialog.hide();
                };
              }
            });
          };

        },
      });
    };
  }
})();
