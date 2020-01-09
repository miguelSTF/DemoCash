(function () {
  'use strict';

  angular.module('appCash')
    .controller('CuentaCorrienteController', CuentaCorrienteController);

  function CuentaCorrienteController(CuentasInstitucion,Parametros,Catalogos,Utils,CuentaCorriente,Traspaso,$mdDialog, $mdMedia, $scope, ValidateSession) {
    var vm = this;
    vm.catalogo = {
      name: 'Cuentacorriente'
    };

    vm.loading = true;
    vm.estatus = 'Todos';
    vm.operaciones = [];
    vm.via = 'INDEVAL';
    vm.cuentaVia = '020349001';
    vm.saldoInicial = null;
    vm.monto = null;

    vm.init = function(){
      var validate = ValidateSession.validate(21);
      if (validate){
        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data){
          vm.FechaOperacion = data.filter(function (n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
          vm.fecha = new Date(vm.FechaOperacion.Valor);
          vm.maxDate = new Date(vm.fecha.getFullYear(), vm.fecha.getMonth(), vm.fecha.getDate());
          Catalogos.query({
            'name': 'divisa',
            'orderby': 'NombreCorto'
          }).$promise.then(function(resultado){
            if(resultado.length <= 0){
              Utils.showToast('No hay divisas registradas!');
              vm.loading = false;
            }
            vm.divisas = resultado;
            obtenerCuentasCtes();
            asignarFiltro();
            vm.loading = false;
          })
          .catch(function(error){
            Utils.showToast('Error al obtener divisas!');
            console.log('Error: ' + error);
            vm.loading = false;
          });
        }).catch(function(error){
          Utils.showToast('No se encontró el servicio!');
          console.log('Error: ' + error);
          vm.loading = false;
        });
      }else{
        location.href = '#/login';
      }
    };

    vm.loadData = function () {
      vm.saldoInicial = 0.0;
      vm.operaciones = [];
      vm.loading = true;
      CuentaCorriente.getList({
        'name': vm.catalogo.name,
        'Fecha': vm.fecha,
        'StatusConciliacion': vm.estatus,
        'IdCuentaCorriente': vm.cuentaSelect
      })
        .$promise
        .then(function (resultado) {
          if (angular.isUndefined(resultado.errorMsg)) {
            vm.numeroRegistros = resultado.Tabla.length;
            vm.saldoInicial = resultado.SaldoInicial;
            if (resultado.Tabla.length <= 0) {
              vm.saldoFinal = vm.saldoInicial;
              Utils.showToast('No hay registros!');
              vm.loading = false;
            } else {
              vm.operaciones = resultado.Tabla;
              vm.loading = false;
              vm.saldoFinal = vm.operaciones[vm.operaciones.length-1].SaldoLibros;
            }
            guardarFiltro();
          } else {
            if (vm.cuentaSelect === undefined) {
              Utils.showToast('Selecciona una divisa y una cuenta');
            }
            else {
              Utils.showToast('Error: ' + resultado.errorMsg);
            }
            vm.loading = false;
          }
        })
        .catch(function () {
          Utils.showToast('No se encontró el Servicio!!');
          vm.loading = false;
        });
    };

    function guardarFiltro(){
      var filtro = {
        'divisa' : vm.divisa,
        'cuenta' : vm.cuentaSelect,
        'estatus' : vm.estatus
      };
      sessionStorage.filtroMoniCtaCte = JSON.stringify(filtro);
    }

    function asignarFiltro(){
      if(sessionStorage.filtroMoniCtaCte !== undefined){
        vm.Filtro = JSON.parse(sessionStorage.filtroMoniCtaCte);
        vm.divisa = vm.Filtro.divisa;
        vm.cuentaSelect = vm.Filtro.cuenta;
        vm.estatus = vm.Filtro.estatus;
        vm.loadData();
      }
    }

    vm.estatusDisponibles = ['Todos', 'N', 'C', 'T', 'P'];

    vm.Consultar = function (registro) {
      if(registro !== ''){
        vm.registro = JSON.parse(registro);
        var templateUriPage = './views/templates/detalleCuentaCorriente.html';
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
        Utils.showToast('El registro no contiene detalle!!');
      }
    };

    vm.Close = function () {
      $mdDialog.hide();
      vm.tipoTraspaso = {};
    };

    vm.retrasoStyle = function (dias) {
      if(dias === 0){
        return 'inherit';
      } else {
        if(dias >= 10){
          dias = '1';
        } else {
          dias = '0.' + dias;
        }
        return 'rgba(255, 0, 0, ' + dias +')';
      }
    };

    vm.openTraspasos = function(){
      vm.cuentasDestino = [];
      var viaLiq = 0;

      vm.cuentasGeneral.forEach(function(item){
        if(item.IdCuentaCorriente === vm.cuentaSelect){
          viaLiq = item.IdViaLiquidacion;
          return viaLiq;
        }
      });

      vm.cuentasGeneral.forEach(function(item){
        if(item.IdCuentaCorriente !== vm.cuentaSelect && item.IdDivisa === vm.divisa){
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
                  vm.loadData();
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

    function obtenerCuentasCtes (){
      vm.loading = true;
      CuentasInstitucion.query({
        'name': 'CuentaCorriente',
        'orderby':'Alias'
      })
      .$promise
      .then(function(cuentasCorrientes) {
        vm.cuentasGeneral = cuentasCorrientes;
        vm.loading = false;
      })
      .catch(function(){
        vm.loading = false;
        Utils.showToast('Error al buscar las cuentas!');
      });
    }

    vm.handleKeyup = function(ev) {
      ev.stopPropagation();
    };
  }
})();
