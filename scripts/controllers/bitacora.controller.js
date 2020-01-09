(function() {
'use strict';
    angular.module('appCash')
        .controller('BitacoraController', BitacoraController);

  /* @ngInject */

  function BitacoraController($scope, $mdDialog, $mdMedia, Bitacora, Log, Utils, fechaHoraFormat, Parametros, ValidateSession) {

    var vm = this;
    vm.loading = true;
    vm.cat = null;
    vm.ori = null;
    vm.acc = null;
    vm.formatoFecha = fechaHoraFormat;
    vm.fechaElegida = '';
    vm.fechas = [
      {name:'Fecha Operación', value:'FechaOperacion'},
      {name:'Fecha Registro', value:'FechaRegistro'}];

    vm.init = function() {
      var validate = ValidateSession.validate(24);
      if (validate){
        Bitacora.getList({
          'id':'filter'
        }).$promise.then(function(data){
          vm.bitacorafilter = data;
          vm.categoria = vm.bitacorafilter.Categoria;
          vm.accion = vm.bitacorafilter.Accion;
          vm.origen = vm.bitacorafilter.Origen;
          vm.loading = false;
        });
        vm.obtenFechas();
      }else{
        location.href = '#/login';
      }
    };

    vm.obtenFechas = function(){
      Parametros.query({
        'name': 'Configuracion'
      }).$promise.then(function(data) {
        vm.FechaOperacion = data.filter(function(n) {
          return n.Nombre === 'FechaOperacion';
        })[0];
        vm.fecha = new Date(vm.FechaOperacion.Valor);
        vm.maxDate =  vm.fecha;
        vm.maxDate1 = new Date(
          vm.maxDate.getFullYear(),
          vm.maxDate.getMonth(),
          vm.maxDate.getDate() + 1
        );
      });
    };

    vm.obtenerBitacora = function() {
      vm.loading = true;
      if(vm.fechaElegida === ''){
        vm.loading = false;
        Utils.showToast('Elige un filtro de fecha');
      }
      else{
        Bitacora.query({
          'FechaInicio': vm.maxDate,
          'FechaFin': vm.maxDate1,
          'Categoria': vm.cat,
          'Accion': vm.acc,
          'Desde': vm.ori,
          'TipoFecha': vm.fechaElegida
        })
        .$promise
        .then(function(data) {
          vm.bitacora = data;
          vm.loading = false;
          if (vm.bitacora <= 0) {
            Utils.showToast('No se encontrarón registros');
          }
        })
        .catch(function() {
          Utils.showToast('No se encontró el Servicio!!');
          vm.loading = false;
        });
      }
    };

    vm.Consultar = function (registro) {
      vm.registro = JSON.parse(registro);

      for(var member in vm.registro){
        if(vm.registro[member] === null){
          delete vm.registro[member];
        }
        if(vm.registro.Payload || vm.registro.PayloadString){
          delete vm.registro.Payload;
          delete vm.registro.PayloadString;
        }
      }

      var templateUriPage = './views/templates/detalleBitacora.html';
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
    };

    vm.Close = function () {
      $mdDialog.hide();
    };
  }
})();
