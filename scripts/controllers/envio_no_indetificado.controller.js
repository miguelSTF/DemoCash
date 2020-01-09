/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
      .controller('EnvioNoIdentController', EnvioNoIdentController);

    /* @ngInject */
  function EnvioNoIdentController(Parametros, CuentaCorriente, Utils, Catalogos, $mdMedia, $mdDialog, $scope, ValidateSession) {
    var vm = this;
    vm.loading = false;
    vm.ingresosNI = [];
    vm.mostrarTodo = false;
    vm.departamentos = [];
    vm.cuentasCorrientes = [];
    vm.conceptos = [];
    vm.idSolicitud = null;
    vm.mostrarR = false;
    vm.statusToMonitorReclasif = [{'Id':1,'Nombre':'Conciliados'},{'Id':2,'Nombre':'Reclasificados'}];
    vm.filterFor = 1;
    vm.departamento = 0;
    vm.cuentaCorriente = 0;

    vm.init = function() {
      var validate = ValidateSession.validate(53);
      if (validate){
        vm.loading = true;
        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data){
          vm.UltimaFechaOperacion = data.filter(function (n) {
            return n.Nombre === 'UltimaFechaOperacion';
          })[0];
          vm.fechaHasta = new Date(vm.UltimaFechaOperacion.Valor);
          vm.maxDate = new Date(vm.UltimaFechaOperacion.Valor);
          Catalogos.query({
            'name': 'departamento',
            'orderby':'Nombre'
          }).$promise.then(function(response) {
            vm.departamentos = response;
            vm.departamentos.unshift({'Nombre':'Todos', 'IdDepartamento':0});
            Catalogos.query({
              'name': 'CuentaCorriente',
              'orderby':'Alias'
            }).$promise.then(function(cuentas) {
              vm.loading = false;
              vm.cuentasCorrientes = cuentas;
              vm.cuentasCorrientes.unshift({'Alias':'Todas', 'IdCuentaCorriente':0});
            }).catch(function (error) {
              vm.loading = false;
              console.error(error);
              Utils.showToast('Error al obtener las cuentas corrientes');
            });
          })
          .catch(function (error) {
            vm.loading = false;
            console.error(error);
            Utils.showToast('Error al obtener los departamentos');
          });
        })
        .catch(function(error){
          Utils.showToast('No se encontro el servicio!!');
          vm.loading = false;
          console.log(error);
        });
      }else{
        location.href = '#/login';
      }
    };

    vm.getOperToINI = function(){
      if(sessionStorage.getItem('IdUsuario') !== null){
        vm.loading = true;
        vm.opersToNoI = [];
        if((vm.filterFor === 1  && vm.departamento !== null && vm.departamento !== undefined && vm.cuentaCorriente !== null && vm.cuentaCorriente !== undefined) || (vm.filterFor !== 1 && vm.cuentaCorriente !== null && vm.cuentaCorriente !== undefined)){
          vm.fechaHasta = vm.filterFor === 1 ? vm.fechaHasta : vm.maxDate;
          CuentaCorriente.getCta({
            'name': 'envioNoIdentificado',
            'IdUsuario':sessionStorage.getItem('IdUsuario'),
            'FechaHasta':vm.fechaHasta,
            'MostrarR': vm.filterFor !== 1,
            'IdDepartamento': vm.departamento,
            'IdCuentaCorriente' : vm.cuentaCorriente
          })
          .$promise
          .then(function(respuesta) {
            if(respuesta.length > 0 && respuesta[0].ErrorMsg !== undefined && respuesta[0].ErrorMsg !== null){
              Utils.showToast(respuesta[0].ErrorMsg);
            }else{
              if(respuesta.length < 1){
                var message = vm.filterFor === 1 ? 'No se encontraron ingresos conciliados!!' : 'No se enconcontraron ingresos reclasificados!!';
                Utils.showToast(message);
              }
              vm.opersToNoI = [];
              vm.opersToNoI = respuesta;
              vm.opersToNoI.forEach(function(element) {
                element.Check=false;
              });
            }
            vm.loading = false;
          })
          .catch(function(error){
            Utils.showToast('No se encontro el servicio!!');
            console.log(error);
            vm.loading = false;
          });
        }else{
          vm.loading = false;
          Utils.showToast('Seleccione una Cuenta Corriente y un Departamento!!');
        }
      }else{
        Utils.showToast('Se requiere inicio se sesion!!');
        vm.loading = false;
      }
    };

    function createConfirm(dialog, btnOk, btnNot) {
      return $mdDialog
        .confirm()
        .title('Atención')
        .textContent(dialog)
        .ariaLabel('Lucky day')
        .ok(btnOk)
        .cancel(btnNot);
    }

    vm.handleKeyup = function(ev) {
      ev.stopPropagation();
    };

    vm.SendToIni = function(oper){
      var confirm = createConfirm('¿Desea enviar a no Indentificado?', 'SI', 'NO');
      $mdDialog.show(confirm)
        .then(function() {
          vm.loading = true;
          var infoOper = {'IdSolicitud': oper.IdSolicitud,'IdUsuario': sessionStorage.IdUsuario, 'From': vm.filterFor === 1 ? 'C' : 'R'};
          CuentaCorriente.save({
            'name': 'envioIngresoNoIdentificado'
          }, infoOper).$promise.then(function(respuesta){
            if(respuesta.ErrorMsg !== null && respuesta.ErrorMsg !== undefined && respuesta.ErrorCode === 1){
              Utils.showToast('Error: ' + respuesta.ErrorMsg);
              vm.loading = false;
            }else if(respuesta.ErrorCode === 2){
              Utils.showToast('Error al intentar registrar el ingreso!!!');
              console.log(respuesta);
              vm.loading = false;
            }else if(respuesta.ErrorCode === 4){
              vm.confirmDeleteConcilGroup(oper);
              Utils.showToast(respuesta.ErrorMsg);
            }else{
              vm.loading = false;
              Utils.showToast('El envío a no identificados se realizó correctamente.');
                setTimeout(function(){
                vm.getOperToINI();
                vm.close();
              },1500);
            }
            vm.loading = false;
          }).catch(function(error){
            Utils.showToast('Error al guardar información!!');
            console.log(error);
            vm.loading = false;
          });
        });
    };

    vm.confirmDeleteConcilGroup = function(oper){
      var templateUriPage = './views/templates/detalle_concil_bloque.html';
      var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && customFullscreen;
      CuentaCorriente.getList({
        'name': 'detalleConciliacion',
        'IdSolicitud': oper.IdSolicitud
      }).$promise.then(function(respuesta){
        vm.listConcil = [];
        vm.listConcil = respuesta;
        vm.showButtons = true;
        vm.message = '¿Desea deshacer la conciliación en bloque?';
        vm.loading = false;
        $mdDialog.show({
          controller: function() {
            vm.CloseDeleteConcilGroup = function(){
              $mdDialog.hide();
              vm.listConcil = [];
            };

            vm.DeleteConcil = function(){
              vm.DeleteConcilGroup(oper);
            };
          },
          templateUrl: templateUriPage,
          scope: $scope,
          preserveScope: true,
          parent: angular.element(document.body),
          clickOutsideToClose: false,
          fullscreen: useFullScreen
        });
      });
    };

    vm.DeleteConcilGroup = function(oper){
      vm.loading = true;
      var infoOper = {'IdSolicitud': oper.IdSolicitud,'IdUsuario': sessionStorage.IdUsuario};
      CuentaCorriente.save({
        'name': 'deshacerConciliacionGrupo'
      }, infoOper).$promise.then(function(respuesta){
        if(respuesta.ErrorMsg !== null && respuesta.ErrorMsg !== undefined && respuesta.ErrorCode === 1){
          Utils.showToast('Error: ' + respuesta.ErrorMsg);
          vm.loading = false;
        }else if(respuesta.ErrorCode === 2){
          Utils.showToast('Error al intentar deshacer la conciliación en bloque!!');
          console.log(respuesta);
          vm.loading = false;
        }else{
          vm.loading = false;
          Utils.showToast('La conciliación del bloque se separó correctamente.');
          setTimeout(function(){
            $mdDialog.hide();
            vm.getOperToINI();
          },1500);
        }
        vm.loading = false;
      }).catch(function(error){
        Utils.showToast('Error al guardar información!!');
        console.log(error);
        vm.loading = false;
      });
    };

    vm.Consultar = function(registro) {
      vm.registro = JSON.parse(registro);
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/detalleOperacion.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function(){
          $scope.registro = vm.registro;
          $scope.viewDialog = function viewDialog(){
            $mdDialog.show({
              skipHide: true,
              scope: $scope,
              preserveScope: true
            });
          };
        }
      });
    };

    vm.ConsultarConcil = function(oper){
      vm.loading = true;
      var templateUriPage = './views/templates/detalle_concil_bloque.html';
      var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && customFullscreen;
      CuentaCorriente.getList({
        'name': 'detalleConciliacion',
        'IdSolicitud': oper.IdSolicitud
      }).$promise.then(function(respuesta){
        vm.message = 'Detalle de Conciliación';
        vm.listConcil = respuesta;
        vm.showButtons = false;
        vm.loading = false;
        $mdDialog.show({
          controller: function() {
            vm.CloseDeleteConcilGroup = function(){
              $mdDialog.hide();
              vm.listConcil = [];
            };
          },
          templateUrl: templateUriPage,
          scope: $scope,
          preserveScope: true,
          parent: angular.element(document.body),
          clickOutsideToClose: false,
          fullscreen: useFullScreen
        });
      });
    };

  }
})();
