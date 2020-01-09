/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('TableroPosicionController', TableroPosicionController);

  /* @ngInject */
  function TableroPosicionController($filter, Parametros, Ordenes, Utils, Sender, Log, Catalogos, CuentasInstitucion, $mdMedia, $mdDialog, $scope, MonitorTeso, CuentaCorriente, ValidateSession) {
    var vm = this;
    vm.loading = false;
    vm.dataset = [];
    vm.hasInformation = false;

    vm.init = function() {
      var validate = ValidateSession.validate(39);
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

          Catalogos.query({
            'name': 'divisa',
            'orderby': 'NombreCorto'
          })
          .$promise.then(function(resultado){
            if(resultado.length <= 0){
              Utils.showToast('No hay divisas registradas!');
              vm.loading = false;
            }
            vm.divisas = resultado;
            asignarFiltro();
            vm.BuscarCuentas();
            vm.loading = false;
          });
        });
        vm.ops = [];
      }else{
        location.href = '#/login';
      }
    };

    vm.BuscarCuentas = function () {
      vm.cuentas= null;
      vm.cuentaSelect = undefined;
      CuentasInstitucion.query({
        'name': 'CuentaCorriente'
      })
      .$promise
      .then(function(resultado) {
        vm.cuentasGeneral = resultado;
      })
      .catch(function(){
        Utils.showToast('Error al buscar las cuentas!');
      });
    };

    vm.reloadData = function() {
      vm.hasInformation = false;
      vm.dataset = [];
      vm.loading = true;
      if(vm.divisaSelect !== undefined){
        MonitorTeso.query({
          'name': 'tableroPosicion',
          'FechaOperacion': vm.fecha,
          'Divisa': vm.divisaSelect
        }).$promise.then(function(data) {
          if (data.length === 0) {
            Utils.showToast('No hay registros!');
          } else {
            vm.dataset = data;
            vm.totalObj = vm.dataset[vm.dataset.length -1];
            vm.hasInformation = true;
          }
          guardarFiltro();
          vm.loading = false;
        })
        .catch(function() {
          Utils.showToast('No se encontro el servicio');
          vm.loading = false;
        });
      }else{
        Utils.showToast('Selecciona una divisa');
        vm.loading = false;
      }
    };

    function guardarFiltro(){
      var filtro = {
        'divisa' : vm.divisaSelect,
      };
      sessionStorage.filtroMoniEmisiones = JSON.stringify(filtro);
    }

    function asignarFiltro(){
      if(sessionStorage.filtroMoniEmisiones !== undefined){
        vm.Filtro = JSON.parse(sessionStorage.filtroMoniEmisiones);
        vm.divisaSelect = vm.Filtro.divisa;
        vm.reloadData();
      }
    }

    vm.Consultar = function (detalle, cuenta) {
      vm.detalle = detalle;
      vm.nombreCuenta = cuenta;

      var templateUriPage = './views/templates/detalleMonitorPosicion.html';
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

    vm.GeneraTraspaso = function(cuentaNombre){
      vm.cuentasDestino = [];

      var viaLiq = 0;

      vm.cuentasGeneral.forEach(function(item){
        if(item.Alias === cuentaNombre){
          viaLiq = item.IdViaLiquidacion;
          return viaLiq;
        }
      });

      vm.cuentasGeneral.forEach(function(item) {
        if(item.Alias !== cuentaNombre && item.IdDivisa === vm.divisaSelect){

          if((viaLiq === 1 || viaLiq === 7) && (item.IdViaLiquidacion === 1 || item.IdViaLiquidacion === 2 || item.IdViaLiquidacion === 7))
          {
            vm.cuentasDestino.push(item);
          }
          if (viaLiq === 2 && item.CuentaClave !== null) {
            vm.cuentasDestino.push(item);
          }
          else if ((viaLiq >= 3 && viaLiq <= 6 || viaLiq === 8) && (item.IdViaLiquidacion >= 3 && item.IdViaLiquidacion <= 6 || item.IdViaLiquidacion === 2 || item.IdViaLiquidacion === 8))
          {
            vm.cuentasDestino.push(item);
          }
        }

        if(item.Alias === cuentaNombre){
          vm.cuentaSelect = item.IdCuentaCorriente;
        }
      });

      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/traspasosCuentaCorriente.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function(){
          $scope.cuentasDestino = vm.cuentasDestino;
          $scope.cuentaSelect = vm.cuentaSelect;
          $scope.GenerarTraspaso = function(){
            vm.loading = true;
            CuentaCorriente.save({'name':'generarTraspasos'},{
              'CtaCteOrigen':$scope.cuentaSelect,
              'CtaCteDestino':$scope.ctaCteDestino,
              'Monto': $scope.monto,
              'Usuario': sessionStorage.getItem('IdUsuario'),
              'NombreUsuario':sessionStorage.getItem('Nombre')
            }).$promise.then(function(respuesta){
              if(respuesta.ErrorCode !== 0){
                Utils.showToast(respuesta.ErrorMsg);
                vm.loading = false;
              }else{
                $scope.ctaCteDestino = null;
                $scope.monto = null;
                vm.loading = false;
                Utils.showToast('Traspaso generado de manera correcta!');
                setTimeout(function(){
                  vm.Close();
                  vm.reloadData();
                },1500);
              }
            })
            .catch(function(error){
              Utils.showToast('Error al generar traspaso!');
              vm.loading = false;
              console.log('Error:' + error);
            });
          };

          $scope.viewDialog = function viewDialog(){
            $mdDialog.show({
              skipHide: true,
              scope: $scope,
              preserveScope: true
            });
          };

          $scope.handleKeyup = function(ev) {
            ev.stopPropagation();
          };
        }
      });
    };

    vm.Close = function () {
      $mdDialog.hide();
    };

    vm.ConsultarTraspasos = function () {
      vm.loading = true;
      vm.dateInfo = getDateString(vm.fecha);
      vm.divisas.forEach(function (div){
        if (div.IdDivisa === vm.divisaSelect) {
          vm.divisaName = div.NombreCorto;
        }
      });
      MonitorTeso.query({
        'name': 'tableroPosicionTraspasos',
        'FechaOperacion': vm.fecha,
        'Divisa': vm.divisaSelect
      }).$promise.then(function(data) {
        if (data.length === 0) {
          Utils.showToast('No hay registros de traspasos!');
        } else {
          vm.traspasos = data;
          
          var templateUriPage = './views/templates/consultaTraspasos.html';
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
        }
        vm.loading = false;
      })
      .catch(function() {
        Utils.showToast('No se encontro el servicio');
        vm.loading = false;
      });
    };

    function getDateString (date){
      return date.toLocaleDateString('es-ES',{
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  }
})();