(function() {
  'use strict';
  angular.module('appCash')
    .controller('BitacoraEmisionController', BitacoraEmisionController);

  /* @ngInject */

  function BitacoraEmisionController(Parametros, $mdDialog, $mdMedia, $scope, Utils, ValidateSession) {

    var vm = this;
    vm.loading = true;
    vm.bitacora = [];

    vm.init = function() {
      var validate = ValidateSession.validate(55);
      if (validate){
        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data) {
          vm.FechaOperacion = data.filter(function(n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
          vm.fecha = new Date(vm.FechaOperacion.Valor);
          vm.maxDate =  vm.fecha;
          vm.GetInfo();
        });
      }else{
        location.href = '#/login';
      }
    };

    vm.GetInfo = function () {
      vm.loading = true;
      Parametros.query({
        'name':'BitacoraEmision',
        'Fecha':vm.fecha
      }).$promise.then(function (ans) {
        vm.bitacora = ans;
        if(vm.bitacora.length === 0){
          Utils.showToast('No se encontraron registros');
        }
        vm.loading = false;
      })
      .catch(function (error) {
        console.error(error);
        vm.loading = false;
      });
    };

    vm.Consultar = function (message, tipoMessage) {
      vm.textError = message;
      vm.tipoMensaje = tipoMessage;
      vm.loading = true;
      var templateUriPage = './views/templates/viewMessageBE.html';
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
      vm.loading = false;
    };
  }
})();
