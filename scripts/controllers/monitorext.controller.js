/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('MonitorControllerExt', MonitorControllerExt);
  MonitorControllerExt.$inject = ['$scope', 'Utils', 'MonitorExt', 'rabbitServerUrl','rabbitUser','rabbitPasword', '$mdDialog', '$mdMedia', 'Parametros', 'ViaLiquidacion','CuentasInstitucion','EnumVia', 'ValidateSession','CancelEdoCta'];
  /* @ngInject */
  function MonitorControllerExt($scope, Utils, MonitorExt, rabbitServerUrl, rabbitUser, rabbitPasword, $mdDialog, $mdMedia, Parametros, ViaLiquidacion, CuentasInstitucion, EnumVia, ValidateSession, CancelEdoCta) {
    var vm = this;
    vm.estatus = 'Todos';
    vm.tipoMensaje = 'Todos';
    vm.loading = true;

    vm.init = function() {
      var validate = ValidateSession.validate(20);
      if (validate){
        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data) {
          vm.FechaOperacion = data.filter(function(n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
          vm.fecha = new Date(vm.FechaOperacion.Valor);
          vm.maxDate = new Date(
            vm.fecha.getFullYear(),
            vm.fecha.getMonth(),
            vm.fecha.getDate()
          );
          connectToRabbit($scope);
          vm.operaciones = [];
          ViaLiquidacion.query({
            'name' : 'ViaLiquidacion',
            'orderby': 'Descripcion'
            }).$promise.then(function(via){
              vm.vias = via;
              asignarFiltros();
              vm.loading = false;
          });
        });
      }else{
        location.href = '#/login';
      }
    };

    vm.BuscarCuentas = function () {
      vm.cuentas= null;
      vm.cuentaselect = undefined;
      CuentasInstitucion.query({
        'name': 'CuentaCorriente',
        'IdViaLiquidacion': vm.via,
        'orderby':'Alias'
      })
      .$promise
      .then(function(resultado) {
        vm.cuentas = resultado;
        if(vm.cuentas.length === 0){
          vm.cuentaselect = undefined;
        }
      })
      .catch(function(){
        Utils.showToast('Error al buscar las cuentas!');
      });
    };

    vm.reloadData = function() {
      vm.loading = true;
      vm.operaciones = [];
      var listOper = [];
      if (vm.cuentaselect !== undefined) {
        MonitorExt.query({
          'Fecha': vm.fecha,
          'Status': vm.estatus,
          'IdCuentaCorriente': vm.cuentaselect
        })
        .$promise
        .then(function(data) {
          if (data.length <= 0) {
            Utils.showToast('No hay registros!');
            vm.operaciones = [];
          } else {
            vm.operaciones = data;
            vm.operaciones.forEach(function(item){
              item.PayloadString = JSON.parse(item.PayloadString);
            });
          }
          guardarFiltro();
          vm.loading = false;
        })
        .catch(function() {
          Utils.showToast('No se encontró el Servicio!!');
          vm.loading = false;
        });
      }else{
        Utils.showToast('Selecciona una vía de liquidación y una cuenta corriente');
        vm.loading = false;
      }
    };

    function guardarFiltro() {
      vm.Filtros = {
        'via': vm.via,
        'cuentaCorriente': vm.cuentaselect,
        'estatusConcil': vm.estatus,
      };
      sessionStorage.filtrosMoniExt = JSON.stringify(vm.Filtros);
    }

    function asignarFiltros() {
      if (sessionStorage.filtrosMoniExt !== undefined) {
        vm.Filtros = JSON.parse(sessionStorage.filtrosMoniExt);
        vm.via = vm.Filtros.via;
        vm.BuscarCuentas();
        vm.cuentaselect = vm.Filtros.cuentaCorriente;
        vm.estatus = vm.Filtros.estatusConcil;
        vm.reloadData();
      }
    }

    vm.Consultar = function(registro) {
      $scope.registro = registro.PayloadString;
      $scope.fechaStr = registro.FechaOperacionF;
      var nombreVia = EnumVia.stringOfEnum(vm.via);
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

    vm.Close = function() {
      $mdDialog.hide();
    };

    // RabbitMQ connection
    function connectToRabbit(scope) {
      var ws = new SockJS(rabbitServerUrl);
      var client = Stomp.over(ws);

      scope.ws = ws;
      scope.client = client;

      // SockJS does not support heart-beat: disable heart-beats
      client.heartbeat.outgoing = 0;
      client.heartbeat.incoming = 0;

      var onConnect = function() {
        client.subscribe('/topic/CASH_EVENTS_EXT_TOPIC', function(message) {
          if (message.body) {
            vm.reloadData();
          }
        });
      };

      var onError = function(err) {
        console.error('error connecting to RabbitMQ:', err);
        Utils.showToast('Imposible conectarse al servidor de notificaciones');
      };
      client.connect(rabbitUser, rabbitPasword, onConnect, onError, '/');
    }

    vm.estatusDisponibles = ['Todos', 'N', 'C', 'T', 'P'];

    vm.cancelEdoCta = function (IdSolicitud) {
      var listOper = [];
      var confirm = createConfirm('¿Realmente quiere eliminar el registro seleccionado?', 'Aceptar', 'Cancelar');
      $mdDialog.show(confirm).then(function() {
        vm.loading = true;
        var idUser = sessionStorage.getItem('IdUsuario');
        listOper.push({'IdSolicitud':IdSolicitud, 'IdUsuario':idUser});
        CancelEdoCta.send({
          'name': 'cancelarEdoCta'
        }, listOper).$promise.then(function (respuesta) {
          if (respuesta[0].Code !== undefined) {
            Utils.showToast(respuesta[0].ErrorMesage);
          } else {
            Utils.showToast('Registro correctamente eliminado.');
            vm.reloadData();
          }
          vm.loading = false;
        });
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
  }
})();
