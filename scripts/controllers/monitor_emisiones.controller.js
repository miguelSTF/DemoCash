/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('MonitorEmisionController', MonitorEmisionController);

  /* @ngInject */
  function MonitorEmisionController($filter, Parametros, Ordenes,Utils,Sender,Log, Catalogos, CuentasInstitucion,$mdMedia, $mdDialog, $scope, ValidateSession) {
    var vm = this;
    vm.loading = false;
    vm.dataset = [];

    vm.init = function() {
      var validate = ValidateSession.validate(28);
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
        'name': 'CuentaCorriente',
        'IdDivisa': vm.divisa
      })
      .$promise
      .then(function(resultado) {
        vm.cuentas = resultado;
        vm.cuentas.sort(sortCuentas);
        if(vm.cuentas.length === 0){
          vm.cuentaselect = undefined;
        }
      })
      .catch(function(){
        Utils.showToast('Error al buscar las cuentas!');
      });
    };

    function sortCuentas(a,b){
      if (a.Alias < b.Alias){
        return -1;
      }
      if (a.Alias > b.Alias) {
        return 1;
      }
        return 0;
    }

    vm.reloadData = function() {
      vm.dataset = [];
      vm.loading = true;
      if(vm.cuentaSelect !== undefined){
        Ordenes.query({
            'name': 'emitir',
            'FechaValor': vm.fecha,
            'IdCuentaCorriente': vm.cuentaSelect
          }).$promise.then(function(data) {
            if (data.length === 0) {
              Utils.showToast('No hay registros!');
            } else {
              vm.dataset = data;
            }
            guardarFiltro();
            vm.loading = false;
          })
          .catch(function() {
            Utils.showToast('No se encontro el servicio');
            vm.loading = false;
          });
      }else{
        Utils.showToast('Selecciona una divisa y una cuenta');
        vm.loading = false;
      }
    };

    vm.loadGeneralData = function(){
      vm.loading = true;

        Ordenes.query({
            'name': 'emitir',
            'FechaValor': vm.fecha,
            'IdCuentaCorriente': vm.cuentaSelect,
            'FiltroTodos': true
          }).$promise.then(function(data) {
            if (data.length > 0) {
                vm.datasetGral = data.sort(sortOpers);
                $mdDialog.show({
                clickOutsideToClose: false,
                escapeToClose: false,
                templateUrl: './views/templates/detalleMonitorEmision.html',
                scope: $scope,
                preserveScope: true,
                parent: angular.element(document.body),
                fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
                controller: function(){
                  $scope.datasetGral = vm.datasetGral;
                  $scope.datasetGralCollection = vm.datasetGral;
                  $scope.viewDialog = function viewDialog(){
                    $mdDialog.show({
                      skipHide: true,
                      scope: $scope,
                      preserveScope: true
                    });
                  };
            }
          });
        } else {
          Utils.showToast('No hay registros!');
        }
        guardarFiltro();
        vm.loading = false;
      })
          .catch(function() {
            Utils.showToast('No se encontró el servicio');
            vm.loading = false;
          });
    }

    function sortOpers(a,b){
      if (a.CuentaCorriente < b.CuentaCorriente){
        return -1;
      }
      if (a.CuentaCorriente > b.CuentaCorriente) {
        return 1;
      }
        return 0;
    }

    function guardarFiltro(){
      var filtro = {
        'divisa' : vm.divisa,
        'cuenta' : vm.cuentaSelect
      };
      sessionStorage.filtroMoniEmisiones = JSON.stringify(filtro);
    }

    function asignarFiltro(){
      if(sessionStorage.filtroMoniEmisiones !== undefined){
        vm.Filtro = JSON.parse(sessionStorage.filtroMoniEmisiones);
        vm.divisa = vm.Filtro.divisa;
        vm.BuscarCuentas();
        vm.cuentaSelect = vm.Filtro.cuenta;
        vm.reloadData();
      }
    }

    vm.Send = function() {
         var countTotal = 0;
         var mensaje = '';
         var errorEmision = false;
         var errores = [];
         if (vm.ops.length) {
           vm.loading = true;
           Sender.send(vm.ops, function(data) {
             data.map(function(d) {
               vm.dataset.map(function(o) {
                 if (d.payId === o.IdSolicitud) {
                   if (d.sended) {
                    countTotal++;
                    Log.storeData('La operacion con Id: ' +d.payId + ' pasa a Status T', 'Monitor de Operaciones', o, 'Operación', 'Emisión');
                   } else {
                     o.Status = d.message;
                     errores.push(d);
                     Log.storeData('Error con la emision: ' + d.payId, 'Monitor de Operaciones', o, 'Operación', 'Emisión');
                   }
                   o.sended = false;
                 }
                 else if(d.payId === '0'){
                   mensaje = 'Error: ' + d.message;
                   errorEmision = true;
                 }
               });
               if(!errorEmision){
                 var message = countTotal >= 1 ? 'Operaciones emitidas correctamente: ' + countTotal : '';
                 var operErro = vm.ops.length - countTotal;
                 mensaje = operErro === 0 ? message : message !== '' ? message + ',' + ' Operaciones con error: ' + operErro : message + 'Operaciones con error: ' + operErro;
               }
             });

             Utils.showToast(mensaje);
             errores.forEach(function (m) {
               Utils.showToastFijo(m.payId + ': ' + m.message);
             });
             setTimeout(function(){
               vm.ops.length = 0;
               vm.loading = false;
               vm.reloadData();
             },3000);

           });
         } else {
           Utils.showToast('Selecciona órdenes para enviar');
         }
       };

    vm.ChangeSelection = function(op) {
      if (op.sended === true && !containsObject(op.IdSolicitud, vm.ops)) {
        vm.ops.push(op.IdSolicitud);
      }
      if (op.sended === false) {
        removeObject(op.IdSolicitud, vm.ops);
      }
    };

    function containsObject(obj, list) {
      var i;
      for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
          return true;
        }
      }
      return false;
    }

    function removeObject(obj, list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i] === obj) {
          vm.ops.splice(i, 1);
        }
      }
    }

    vm.ConsultarDetalle = function(registro) {
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

    vm.Consultar = function (descripcion, idMotivo) {

      if((idMotivo >= 13 && idMotivo <= 15) || idMotivo === 22){
        vm.registro = descripcion;
      }
      else{
        vm.registro = '';
      }
      var templateUriPage = './views/templates/detalleMonEmision.html';
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

    vm.retrasoStyle = function (IdMotivosEmision) {
      if(IdMotivosEmision === 14 || IdMotivosEmision=== 13 || IdMotivosEmision === 22){
          return 'rgba(252, 122, 122)';
      }
      else if(IdMotivosEmision === 15){
        return 'rgba(89, 253, 111)';
      }
      else{
          return 'inherit';
      }
    };

  }
})();
