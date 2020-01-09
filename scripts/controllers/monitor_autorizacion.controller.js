/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('MonitorAutController', MonitorAutController);

  /* @ngInject */
  function MonitorAutController(Ordenes, Utils, Parametros, OrdenesAut, Catalogos, CuentasInstitucion,$mdMedia, $mdDialog, $scope, ValidateSession) {
    var vm = this;

    vm.loading = true;
    vm.init = function() {
      var validate = ValidateSession.validate(26);
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
        vm.Originator = {};
      }else{
        location.href = '#/login';
      }
    };

    vm.BuscarCuentas = function () {
      vm.cuentas= null;
      CuentasInstitucion.query({
        'name': 'CuentaCorriente',
        'IdDivisa': vm.divisa
      })
      .$promise
      .then(function(resultado) {
        vm.cuentas = resultado;
        vm.cuentas.sort(sortCuentas);

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
      if(vm.cuentaSelect !== undefined)
      {
        var idUsuario = sessionStorage.getItem('IdUsuario');
        vm.dataset = [];
        vm.loading = true;
        Ordenes.query({
          'name': 'autorizacion',
          'FechaValor': vm.fecha,
          'IdCuentaCorriente': vm.cuentaSelect,
          'IdUsuario': idUsuario,
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
          Utils.showToast('No se encontró el servicio');
          vm.loading = false;
        });
      }
      else{
        Utils.showToast('Elige una divisa y cuenta corriente');
        vm.loading = false;
      }
    };

    function guardarFiltro(){
      var filtro = {
        'divisa' : vm.divisa,
        'cuenta' : vm.cuentaSelect
      };
      sessionStorage.filtroMoniAutori = JSON.stringify(filtro);
    }

    function asignarFiltro(){
      if(sessionStorage.filtroMoniAutori !== undefined){
          vm.Filtros = JSON.parse(sessionStorage.filtroMoniAutori);
          vm.divisa = vm.Filtros.divisa;
          vm.BuscarCuentas();
          vm.cuentaSelect = vm.Filtros.cuenta;
          vm.reloadData();
      }
    }

    vm.Send = function() {
      if (vm.ops.length) {
        vm.loading = true;
        OrdenesAut.send({
          'name': 'autorizar'
        }, vm.ops)
        .$promise
        .then(function(data) {
          if (data) {
            vm.dataset = [];
            vm.ops = [];
            Utils.showToast('Órdenes Autorizadas');
            vm.loading = false;
            vm.reloadData();
          }
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

    vm.Close = function() {
      $mdDialog.hide();
      vm.datos = [];
      vm.descripcion = '';
      vm.motivo = 0;
    };


  }
})();
