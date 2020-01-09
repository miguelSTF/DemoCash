(function () {
  'use strict';

  angular.module('appCash')
    .controller('ClienteCeptodeptoController', ClienteCeptodeptoController);

  /* @ngInject */
  function ClienteCeptodeptoController($scope, $timeout, $q, $mdMedia, $mdDialog, CatalogosRelacion, CatalogosCli, Catalogos, RelacionesCliente, Utils, Log, ValidateSession) {

    var vm = this;

    vm.catalogo = {
      id: 1,
      name: 'Contraparte',
      catalogId: 'IdContraparte',
      catalogDepartamentos: 'Departamento',
      catalogUsuario: 'Cliente',
      departamentoConceptoRelation: 'DepartamentoConcepto',
      clienteConceptoRelation: 'ConceptoContraparte',
      clienteDepartamentoRelation: 'DepartamentoContraparte',
      conceptos: 'Concepto',
      cliente: 'Contraparte',
      general: 'ClienteRelaciones'
    };

    vm.loading = false;
    vm.simulateQuery = false;
    vm.isDisabled = false;
    vm.validaCierre = false;
    vm.Originator = {};
    vm.Memento= {};
    vm.selectedItem = null;
    var lista = [];

    var selectedClient;
    vm.clientes;
    var deptos;
    var ceptos;
    vm.searchTerm = '';

    vm.init = function () {
      var validate = ValidateSession.validate(15);
      if (validate){
        loadAll();
        loadDeptos();
      }else{
        location.href = '#/login';
      }
    };

    vm.cambioEstado = function (){
      vm.validaCierre = true;
    };

    vm.selectedItemChange = function (item) {
      if (angular.isUndefined(item)) {
        vm.datosCliente = [];
        return;
      }
      vm.loading = true;
      selectedClient = item.IdContraparte;
      lista = [];
      Catalogos.query({
        'name': vm.catalogo.clienteDepartamentoRelation,
        'IdContraparte': selectedClient
      }).$promise.then(function (data) {
        var relacionDepartamentoContraparte = data;
        if (data.length === 0) {
          Utils.showToast('No hay departamentos asignados para este cliente!!');
          vm.loading = false;
          relacionDepartamentoContraparte = [{
            'IdContraparte': selectedClient,
            'IdDepartamento': 0
          }];
        }
        Catalogos.query({
          'name': vm.catalogo.departamentoConceptoRelation
        }).$promise.then(function (respuesta) {
          var relacionCeptosDeptos = respuesta;
          ceptos = [];
          Catalogos.query({
            'name': vm.catalogo.conceptos,
            'Activo': 3,
            'orderby':'Nombre'
          }).$promise.then(function (res) {
            res.forEach(function(ans){
              if((ans.Categoria === 2 || ans.Categoria === 3) && ans.Activo === 2){
                ceptos.push(ans);
              }
            });
            Catalogos.query({
              'name': vm.catalogo.clienteConceptoRelation,
              'IdContraparte': selectedClient
            }).$promise.then(function (relacionClienteCepto) {
              var ConceptoContraparte = relacionClienteCepto;
              vm.datosCliente = [];
              vm.Originator = {};
              vm.Originator.Contraparte = item.Nombre;
              vm.datosCliente.Departamentos = [];
              vm.Originator.Departamentos = [];
              vm.Originator.Conceptos = [];
              vm.ConceptosAsociadosDepto = '';
              deptos.map(function (depa) {
                depa.ceptosAsignadosUsuarioTool ='';
                depa.ceptosAsignadosUsuarioToolCopy ='';
                depa.Status = false;
                relacionDepartamentoContraparte.map(function (clienteDepto) {
                  if (depa.IdDepartamento === clienteDepto.IdDepartamento) {
                    depa.ceptosAsignadosUsuarioTool ='';
                    depa.Status = true;
                    vm.datosCliente.Departamentos.push(depa);
                    vm.Originator.Departamentos.push({'Departamento':depa.Nombre});
                  }
                });
                depa.conceptos = JSON.parse(JSON.stringify(ceptos));
                depa.conceptos.forEach(function (cepto) {
                  relacionCeptosDeptos.forEach(function (deptoCepto) {
                    if (depa.IdDepartamento === deptoCepto.IdDepartamento && cepto.IdConcepto === deptoCepto.IdConcepto) {
                      cepto.relacionDepa = true;
                      ConceptoContraparte.map(function (clienteCepto) {
                        if (cepto.IdConcepto === clienteCepto.IdConcepto) {
                          cepto.relacionCliente = true;
                          vm.Originator.Conceptos.push(cepto.Nombre);
                        }
                      });
                    }
                  });
                });

                if(depa.ceptosAsignadosUsuarioTool !== undefined){
                  depa.conceptos.forEach(function(cepto,index){
                     if(cepto.relacionDepa && cepto.relacionCliente ){
                      depa.ceptosAsignadosUsuarioTool += cepto.Nombre + ', ';
                    }
                    if(index === depa.conceptos.length - 1){
                      depa.ceptosAsignadosUsuarioTool = depa.ceptosAsignadosUsuarioTool.substring(0, depa.ceptosAsignadosUsuarioTool.length -2);
                     }
                  });
                  depa.ceptosAsignadosUsuarioToolCopy = depa.ceptosAsignadosUsuarioTool.replace(/, /g, '\n');
                }
                vm.ConceptosAsociadosDepto = vm.Originator.Conceptos.toString();
                if (depa.Status === false) {
                  depa.conceptos.map(function (cepto) {
                    cepto.relacionCliente = false;
                  });
                }
                vm.datosCliente.push(depa);
              });
            });
          });
        });
      });
      vm.loading = false;
    };

    vm.save = function () {
      var objetoSave = {
        IdDepartamentoContra: [],
        IdConceptosContra: []
      };
      var objectUpdate = {};
      objectUpdate.DatosContraparte = [];
      vm.datosCliente.Departamentos.map(function (depa) {
        objetoSave.IdDepartamentoContra.push(depa.IdDepartamento);
      });
      vm.Memento.Departamentos = lista;

      if (vm.datosCliente.Departamentos.length === 0) {
        vm.datosCliente.forEach(function(item){
          item.conceptos.forEach(function(icepto){
            icepto.relacionCliente = false;
          });
        });
      }
      else {
        vm.datosCliente.Departamentos.forEach(function (depto) {
          depto.conceptos.forEach(function (cepto) {
            if (cepto.relacionCliente === true) {
              if (objetoSave.IdConceptosContra.indexOf(cepto.IdConcepto) === -1) {
                objetoSave.IdConceptosContra.push(cepto.IdConcepto);
              }
            }
          });
        });
      }
      objectUpdate.Contraparte = vm.Originator.Contraparte;
      vm.datosCliente.Departamentos.forEach(function (datosDepto) {
        var ceptoNew = '';
        datosDepto.conceptos.forEach(function (datosCepto) {
          if (datosCepto.relacionDepa && datosCepto.relacionCliente) {
              ceptoNew += datosCepto.Nombre + ',';
          }
        });
        objectUpdate.DatosContraparte.push({ 'Departamento':datosDepto.Nombre, 'Concepto' : ceptoNew });
      });

      RelacionesCliente.send({
        'IdContraparte': selectedClient
      }, objetoSave).$promise.then(function (data) {
        if (data.errorMsg === undefined) {
          resetForm();
          Utils.showToast('Registros almacenados correctamente!');
          Log.storeData('PreUpdate: La relacion:'+ vm.Originator.Contraparte,'ClientesConcepto', vm.Originator, 'Auditoria', 'Update')
          .then(function(){
            Log.storeData('Update: La relacion: ' + vm.Originator.Contraparte, 'ClientesConcepto', objectUpdate, 'Auditoria', 'Update');
          });
        } else {
          Utils.showToast(data.errorMsg);
        }
      });
    };

    function loadAll() {
      vm.loading = true;
      CatalogosCli.query({
        'name': vm.catalogo.name
      })
        .$promise
        .then(function (response) {
          vm.clientes = response;
          vm.clientes.forEach(function(element){
            element.display = element.NombreCorto + ' (' + element.IdClaveExterna+ ')';
          });
          if (vm.clientes.length <= 0) {
            Utils.showToast('No hay clientes registrados!');
            vm.loading = false;
          }
          vm.loading = false;
        })
        .catch(function (response) {
          Utils.showToast('No se encontro el Servicio!!');
          console.error('Error: ' + JSON.stringify(response));
          vm.loading = false;
        });
    }

    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(state) {
        return (state.value.indexOf(lowercaseQuery) === 0);
      };
    }

    function loadDeptos() {
      CatalogosCli.query({
        'prefix': 'catalogos',
        'name': vm.catalogo.catalogDepartamentos,
        'orderby':'Nombre'
      }).$promise.then(function (response) {
        deptos = response;
      });
    }

    function resetForm() {
      vm.selectedItem = null;
      vm.searchTerm = '';
      vm.searchText = '';
      vm.validaCierre = false;
      vm.cli = {};
      vm.datosCliente = {};
    }

    vm.clearSearchTerm = function () {
      vm.searchTerm = '';
    };

    vm.handleKeyup = function (ev) {
      ev.stopPropagation();
    };

    vm.isChecked = function(depto) {
      var nCeptosR = getNCeptosR(depto);
      var nSelected = getNSelected(depto);
      return nCeptosR > 0 && nCeptosR === nSelected;
    };

    vm.haveCeptos = function(depto) {
      var nCeptosR = getNCeptosR(depto);
      return nCeptosR > 0;
    };

    vm.selectAll = function(depto){
      var nCeptosR = getNCeptosR(depto);
      var nSelected = getNSelected(depto);
      if (nCeptosR === nSelected) {
        selectAllChange(depto, false);
      } else {
        selectAllChange(depto, true);
      }
    };

    function selectAllChange(depto, valor) {
      depto.conceptos.forEach(function(item) {
        if (item.relacionDepa) {
            item.relacionCliente = valor;
        }
      });
    }

    function getNCeptosR(depto) {
      var nCeptosN = 0;
      depto.conceptos.forEach(function(item) {
        if (item.relacionDepa) {
          nCeptosN = nCeptosN + 1;
        }
      });
      return nCeptosN;
    }

    function getNSelected(depto) {
      var nSelected = 0;
      depto.conceptos.forEach(function(item) {
        if (item.relacionDepa) {
          if (item.relacionCliente) {
            nSelected = nSelected + 1;
          }
        }
      });
      return nSelected;
    }

    vm.SearchCuentas = function(idContraparte){
      if(idContraparte !== undefined){
        CatalogosCli.query({
          'prefix': 'CuentasContraparte',
          'name': 'IdContraparte',
          'id': idContraparte
        }).$promise.then(function(data) {
          vm.cuentas = data;
          if (vm.cuentas.length > 0) {
            var templateUriPage = './views/templates/cuentas-contraparte.html';
            var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && customFullscreen;
            $mdDialog.show({
              templateUrl: templateUriPage,
              scope: $scope,
              preserveScope: true,
              parent: angular.element(document.body),
              clickOutsideToClose: false,
              fullscreen: useFullScreen
            });
          }else{
            Utils.showToast('La contraparte seleccionada no tiene cuentas asociadas.');
          }
        });
      }
    };

    $scope.$on('$locationChangeStart', function( event ) {
      if (vm.validaCierre && vm.searchText !== '' && sessionStorage.CerrandoSesion === undefined){
        var answer = window.confirm('Hay cambios pendientes de guardar ¿Deseas descartarlos?');
        if (!answer) {
        event.preventDefault();
        }
      } return;
    });
  }
})();
