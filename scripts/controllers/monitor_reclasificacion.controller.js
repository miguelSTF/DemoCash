/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('MonitorReclaController', MonitorReclaController);

  /* @ngInject */
  function MonitorReclaController(Parametros, CuentaCorriente, Utils, EnumVia, Contraparte, Ordenes, $mdMedia, $mdDialog, $scope, ValidateSession) {
    var vm = this;
    vm.loading = false;
    vm.ingresosNI = [];
    vm.mostrarTodo = false;
    vm.departamentos = [];
    vm.conceptos = [];
    vm.idSolicitud = null;
    vm.mostrarR = false;
    vm.statusToMonitorReclasif = [{'Id':1,'Nombre':'Por Reclasificar'},{'Id':2,'Nombre':'Reclasificados'}];
    vm.filterFor = 1;


    vm.init = function() {
      var validate = ValidateSession.validate(33);
      if (validate){  
        vm.loading = true;
        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data){
          vm.FechaOperacion = data.filter(function (n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
          vm.fechaHasta = new Date(vm.FechaOperacion.Valor);
          vm.maxDate = new Date(vm.FechaOperacion.Valor);
          vm.getIngresosNI();
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

    vm.getIngresosNI = function(){
      if(sessionStorage.getItem('IdUsuario') !== null){
        vm.fechaHasta = vm.filterFor === 1 ? vm.fechaHasta : vm.maxDate;
        vm.loading = true;
        CuentaCorriente.getCta({
          'name': 'monitorReclasificacion',
          'IdUsuario':sessionStorage.getItem('IdUsuario'),
          'FechaHasta':vm.fechaHasta,
          'MostrarR': vm.filterFor !== 1
        })
        .$promise
        .then(function(respuesta) {
          console.log(respuesta);
          if(respuesta.length > 0 && respuesta[0].ErrorMsg !== undefined && respuesta[0].ErrorMsg !== null){
            Utils.showToast(respuesta[0].ErrorMsg);
          }else{
            if(respuesta.length < 1){
              var message = vm.filterFor !== 1 ? 'No se encontraron ingresos reclasificados!!' : 'No se enconcontraron ingresos por reclasificar !!';
              Utils.showToast(message);
            }
            vm.ingresosNI = respuesta;
            vm.ingresosNI.forEach(function(element) {
              element.Check=false;
            });
          }
          vm.loading = false;
        })
        .catch(function(error){
          Utils.showToast('No se encontró el servicio!!');
          console.log(error);
          vm.loading = false;
        });
      }else{
        Utils.showToast('Se requiere inicio se sesion!!');
      }
    };

    vm.consultar = function(registro,via) {
      $scope.registro = JSON.parse(registro);
      var nombreVia = EnumVia.stringOfEnum(via);
      var templateUriPage = './views/templates/detallesVias/detalleMensajeExterno' + nombreVia +'.html';
      var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && customFullscreen;
      $mdDialog.show({
        controller: function() {
          $scope.Close = function() {
            $mdDialog.hide();
          };
        },
        templateUrl: templateUriPage,
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        clickOutsideToClose: false,
        fullscreen: useFullScreen
      });
    };

    vm.openDetail = function(oper){
      vm.fecha = new Date(oper.FechaMovEdoCta);
      if (oper.Estatus === 'R'){
        Contraparte.query({'IdContraparte':oper.IdContraparte}).$promise.then(function(data){
          vm.Contraparte = data[0].NombreCorto + ' (' + data[0].IdClaveExterna + ')';
        });
      }
      vm.infoIngresoNI = oper;
      vm.GetOpers();
    };

    vm.close = function () {
      $mdDialog.hide();
      vm.ingresosNI.forEach(function(element) {
        element.Check = false;
      });
      resetAll(true);
    };

    function resetAll (resetIdOper){
      vm.departamento = {};
      vm.concepto = {};
      vm.cliente = null;
      vm.departamentos = [];
      vm.conceptos = [];
      vm.clientes = [];
      if(resetIdOper){
        vm.infoIngresoNI = {};
        vm.mostrarTodo = false;
      }
    }

    vm.reclasificar = function(){
      vm.loading = true;
      var infoOper = {
        'IdSolicitud' : vm.infoIngresoNI.IdSolicitud,
        'IdDepartamento' : vm.departamento.IdDepartamento,
        'IdConcepto' : vm.concepto.IdConcepto,
        'IdContraparte' : vm.cliente,
        'Who': sessionStorage.getItem('Nombre'),
        'IsHistorico' : vm.infoIngresoNI.Historico,
        'Estatus' : vm.infoIngresoNI.Estatus
      };
      CuentaCorriente.save({
        'name': 'reclasificarIngreso'
      }, infoOper).$promise.then(function(respuesta){
        if(respuesta.ErrorCode !== undefined || respuesta.errorCode !== undefined){
          Utils.showToast('Error al guardar información!!');
        }else{
          Utils.showToast('Se reclasificó el ingreso de manera correcta!');
          setTimeout(function(){
            vm.getIngresosNI();
            vm.close();
          },1500);
        }
        vm.loading = false;
      }).catch(function(error){
        Utils.showToast('Error al guardar información!!');
        console.log(error);
        vm.loading = false;
      });
    };

    vm.confirmDesRecla = function(ingreso){
      var confirm = createConfirm('¿Desea deshacer esta reclasificación?', 'SI', 'NO');
      $mdDialog.show(confirm)
        .then(function() {
          deshacerReclasif(ingreso);
        });
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

    function deshacerReclasif(ingreso){
      vm.loading = true;
      var infoOper = {'IdSolicitud': ingreso.IdSolicitud,'Who': sessionStorage.getItem('Nombre'),'BornOfHistorico':ingreso.BornOfHistorico};
      CuentaCorriente.save({
        'name': 'deshacerReclasificacion'
      }, infoOper).$promise.then(function(respuesta){
        if(respuesta.ErrorMsg !== null && respuesta.ErrorMsg !== undefined && respuesta.ErrorCode === 1){
          Utils.showToast('Error: ' + respuesta.ErrorMsg);
          vm.loading = false;
        }else if(respuesta.ErrorCode === 2){
          Utils.showToast('Error al intentar registrar el ingreso!!!');
          console.log(respuesta);
          vm.loading = false;
        }else{
          vm.loading = false;
          Utils.showToast('La reclasificación se canceló correctamente.');
          setTimeout(function(){
            vm.getIngresosNI();
            vm.close();
          },1500);
        }
        vm.loading = false;
      }).catch(function(error){
        Utils.showToast('Error al guardar información!!');
        console.log(error);
        vm.loading = false;
      });
    }

    vm.handleKeyup = function(ev) {
      ev.stopPropagation();
    };

    vm.GetOpers = function(){
      Ordenes.query({
        'name': 'reclasificacion',
        'FechaValor': vm.maxDate,
        'Via': vm.infoIngresoNI.Via,
        'Importe':vm.infoIngresoNI.Importe
      }).$promise.then(function(data) {
        vm.opersToReclasif = data;
        if(vm.opersToReclasif.length === 0){
          Utils.showToast('No existen operaciones para la reclasificación');
        }else{
          vm.showOpersToReclas();
        }
      })
      .catch(function() {
        Utils.showToast('No se encontró el servicio');
        vm.loading = false;
      });
    };

    vm.showOpersToReclas = function(){
      var templateUriPage = './views/templates/showOpersToReclasific.html';
      var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && customFullscreen;
      $mdDialog.show({
        controller: function() {
          $scope.consultaDetalle = function(registro) {
            $mdDialog.hide();
              $scope.registro = JSON.parse(registro.Payload);
              var nombreVia = EnumVia.stringOfEnum(registro.Via);
              var templateUriPageDetalle = './views/templates/detallesVias/detalleMensajeExterno' + nombreVia +'.html';
              var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
              var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && customFullscreen;
              $mdDialog.show({
                controller: function() {
                  $scope.Close = function() {
                    $mdDialog.hide();
                    var templateUriPageReclasif = './views/templates/showOpersToReclasific.html';
                    $mdDialog.show({
                      templateUrl: templateUriPageReclasif,
                      scope: $scope,
                      preserveScope: true,
                      parent: angular.element(document.body),
                      clickOutsideToClose: false,
                      fullscreen: useFullScreen
                    });
                  };
                },
                templateUrl: templateUriPageDetalle,
                scope: $scope,
                preserveScope: true,
                parent: angular.element(document.body),
                clickOutsideToClose: false,
                fullscreen: useFullScreen
              });
            };

            $scope.CloseShowCuentas = function(){
              $mdDialog.hide();
            };
        },
        templateUrl: templateUriPage,
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        clickOutsideToClose: false,
        fullscreen: useFullScreen
      });
    };

    vm.ReclasifWithOperExist = function(){
      var idsSolicitud = vm.opersToReclasif.filter(function(oper){
        return oper.Check;
      });
      if(idsSolicitud.length === 0){
        Utils.showToast('Seleccione una operación para la reclasificación');
      }else if(idsSolicitud.length > 1){
        Utils.showToast('Seleccione sólo una operación para la reclasificación');
      }else{
        vm.loading = true;
        var infoOper = {
          'IdSolicitudINI' : vm.infoIngresoNI.IdSolicitud,
          'Who': sessionStorage.getItem('Nombre'),
          'IdSolicitudOper' : idsSolicitud[0].IdSolicitud,
          'IdUsuario' : sessionStorage.IdUsuario,
          'BornOfHistorico': vm.infoIngresoNI.BornOfHistorico
        };
        CuentaCorriente.save({
          'name': 'reclasificarWithOper'
        }, infoOper).$promise.then(function(respuesta){
          if(respuesta.ErrorMsg !== null){
            Utils.showToast('Error al guardar información!!');
            vm.loading = false;
          }else{
            Utils.showToast('El ingreso se reclasificó correctamente.');
            setTimeout(function(){
              vm.getIngresosNI();
              vm.close();
            },1500);
          }
          vm.loading = false;
        }).catch(function(error){
          Utils.showToast('Error al guardar información!!');
          console.log(error);
          vm.loading = false;
        });
      }
    };

    vm.confirmDesEnvioINI = function(ingreso){
      var confirm = createConfirm('¿Desea deshacer este envío a No Identificado?', 'SI', 'NO');
      $mdDialog.show(confirm)
        .then(function() {
          deshacerEnvioINI(ingreso);
        });
    };

    function deshacerEnvioINI(ingreso){
      vm.loading = true;
      var infoOper = {'IdSolicitud': ingreso.IdSolicitud,'IdUsuario': sessionStorage.getItem('IdUsuario'), 'BornOfConcil':ingreso.BornOfConcil};
      CuentaCorriente.save({
        'name': 'deshacerEnvioIni'
      }, infoOper).$promise.then(function(respuesta){
        if(respuesta.ErrorMsg !== null && respuesta.ErrorMsg !== undefined && respuesta.ErrorCode === 1){
          Utils.showToast('Error: ' + respuesta.ErrorMsg);
          vm.loading = false;
        }else if(respuesta.ErrorCode === 2){
          Utils.showToast('Error al deshacer el envío a No Identificado!!');
          console.log(respuesta);
          vm.loading = false;
        }else{
          vm.loading = false;
          Utils.showToast('La cancelación del envío a no identificados se realizó correctamente.');
          setTimeout(function(){
            vm.getIngresosNI();
            vm.close();
          },1500);
        }
        vm.loading = false;
      }).catch(function(error){
        Utils.showToast('Error al guardar información!!');
        console.log(error);
        vm.loading = false;
      });
    }
  }
})();
