(function(){
  'use strict';
  angular.module('appCash')
    .controller('inicioFinDiaController', inicioFinDiaController);

  function inicioFinDiaController($scope, $mdMedia, $mdDialog, Utils, Parametros, ConciliadorService, ValidateSession) {
    
    var vm = this;
    vm.loading = true;
    vm.operacion = {};
    vm.statusFinDia = -5;
    vm.procesos = [{'Proceso':'Pagos en espera de Autorización de Límites', 'Value':'listOperSinAutorizar', 'Status':'Incorrecto'},
      {'Proceso':'Operaciones por Validar, Confirmar', 'Value':'listOperSinConfirmar', 'Status':'Incorrecto'},
      {'Proceso':'Conciliaciones Parciales', 'Value':'listConciliacionParcial','Status':'Incorrecto'},
      {'Proceso':'Pagos en Proceso de Emisión', 'Value':'listOperSinEmitir', 'Status':'Incorrecto'},
      {'Proceso':'Operaciones sin Conciliar', 'Value':'listOperSinConciliar', 'Status':'Incorrecto'}];

    vm.init = function (idPantalla){
      var validate = ValidateSession.validate(idPantalla);
      if (validate){
        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data) {
          vm.FechaOperacion = data.filter(function(n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
          vm.fechaOper = getDateString(new Date(vm.FechaOperacion.Valor));
          vm.statusDias = obitieneStatusDia(data);
          vm.loading = false;
        });
      }else{
        location.href = '#/login';
      }
    };

    vm.viewDetail = function(value){
      vm.registro = vm.operacion[value.Value];
      vm.nameDetalle = value.Proceso;
      var templateUriPage = './views/templates/detalle-fin-dia.html';
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

    vm.ConfirmAction = function(operacion){
      var dialog = operacion === 'findia' ? '¿Realmente desea ejecutar el cierre del día ' +  vm.fechaOper + '?'
        : '¿Realmente desea ejecutar la apertura del día ' +  vm.fechaOper + '?';

      var confirm = $mdDialog.confirm()
        .title('Atención')
        .textContent(dialog)
        .ariaLabel('Lucky day')
        .ok('Confirmar')
        .cancel('Regresar');

      $mdDialog.show(confirm).then(function() {
        if(operacion === 'findia'){
          vm.EjecutarFinDia(operacion);
        }else{
          vm.EjecutarInicioDia(operacion);
        }
      });
    };

    vm.EjecutarFinDia = function(operacion) {
      vm.loading = true;
      var isValidate = operacion === 'findia' ? 'false' : 'true'
      ConciliadorService.send({
        'operacion': 'findia'
      }, {'Validate': isValidate})
      .$promise.then(function(dataReturn) {
        if (dataReturn.PayId === undefined) {
          vm.operacion = dataReturn;
          vm.procesos[0].Status = vm.operacion.listOperSinAutorizar !== null ? 'Incorrecto' : 'Correcto';
          vm.procesos[1].Status = vm.operacion.listOperSinConfirmar !== null ? 'Incorrecto' : 'Correcto';
          vm.procesos[2].Status = vm.operacion.listConciliacionParcial !== null ? 'Incorrecto' : 'Correcto';
          vm.procesos[3].Status = vm.operacion.listOperSinEmitir !== null ? 'Incorrecto' : 'Correcto';
          vm.procesos[4].Status = vm.operacion.listOperSinConciliar !== null ? 'Incorrecto' : 'Correcto';
          vm.validate = false;
          vm.procesos.forEach(function(item) {
            if (item.Status === 'Incorrecto') {
              vm.validate = true;
            }
          });
          if (isValidate === 'false' && vm.validate === true) {
            Utils.showToast('No se puede realizar el cierre de día, revise las validaciones previas.');
          }
          vm.loading = false;
        }else{
          vm.statusFinDia = dataReturn.PayId;
          sessionStorage.setItem('StatusFinDia',vm.statusFinDia);
          Parametros.query({
            'name': 'Configuracion'
          }).$promise.then(function(data) {
            vm.FechaOperacion = data.filter(function(n) {
              return n.Nombre === 'FechaOperacion';
            })[0];
            vm.fechaOper = getDateString(new Date(vm.FechaOperacion.Valor));
            obitieneStatusDia(data);
          });
          Utils.showToast(dataReturn.Message);
          vm.loading = false;
        }
      })
      .catch(function(error) {
        console.log('Error: ' + JSON.stringify(error));
        Utils.showToast(JSON.stringify(error));
      });
    };

    vm.EjecutarInicioDia = function(operacion){
      vm.loading = true;
      ConciliadorService.send({
        'operacion': operacion
      })
      .$promise
      .then(function(dataReturn) {
        vm.statusFinDia = dataReturn.PayId;
        sessionStorage.setItem('StatusFinDia',vm.statusFinDia);
        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data) {
          vm.FechaOperacion = data.filter(function(n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
          vm.fechaOper = getDateString(new Date(vm.FechaOperacion.Valor));
          obitieneStatusDia(data);
        });
        vm.loading = false;
        location.reload(true);
      })
      .catch(function(error) {
        console.log('Error: ' + JSON.stringify(error));
      });
    };

    function obitieneStatusDia(data){
      var status = data.filter(function(n){
        return n.Nombre === 'StatusDia';
      })[0];
      vm.statusDia = status.Valor === 'A' ? 'Abierto' : status.Valor === 'E' ? 'En espera de apertura' : '' ;
    }

    function getDateString (date){
      return date.toLocaleDateString('es-ES',{
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  }
})();