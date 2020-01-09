(function() {
  'use strict';
  angular.module('appCash')
    .controller('generaPolizaController', generaPolizaController);

  function generaPolizaController($scope, $mdMedia, $mdDialog, Utils, Parametros, Catalogos, generaPoliza, CuentasInstitucion, ValidateSession) {
    var vm = this;
    vm.loading = true;

    vm.init = function() {
      var validate = ValidateSession.validate(32);
      if (validate){
        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data) {
          vm.FechaOperacion = data.filter(function(n) {
            return n.Nombre === 'FechaOperacion';
          })[0];

          vm.mascara = data.filter(function(n) {
            return n.Nombre === 'MascaraCuentaContable';
          })[0].Valor;

          vm.fecha = new Date(vm.FechaOperacion.Valor);
          vm.maxDate = new Date(
            vm.fecha.getFullYear(),
            vm.fecha.getMonth(),
            vm.fecha.getDate()
          );
        });

        vm.buscarUsuarios();
        vm.buscarCuentas();
        vm.loading = false;
      }else{
        location.href = '#/login';
      }
    };

    vm.buscarUsuarios = function() {
      Catalogos.query({
        'name': 'Us4301R1731'
      })
      .$promise
      .then(function(info) {
        vm.usuariosCollection = info;
      }).catch(function() {
        Utils.showToast('Error al buscar usuarios!');
      });
    };

    vm.buscarCuentas = function() {
      vm.cuentas = null;
      CuentasInstitucion.query({
        'name': 'CuentaCorriente',
        'orderby': 'Alias'
      })
      .$promise
      .then(function(resultado) {
        vm.cuentas = resultado;
      })
      .catch(function() {
        Utils.showToast('Error al buscar las cuentas!');
      });
    };

    vm.generatePoliza = function() {
      vm.loading = true;
      var idUsuario = sessionStorage.getItem('IdUsuario');
      var paramsToSave = {
        'FechaOperacion': vm.FechaOperacion.Valor,
        'IdCuentaCorriente': vm.cuentaSelect,
        'IdUsuario': idUsuario,
        'Nocturno' : true
      };
      generaPoliza.send({
        'entry': 'generapoliza'
      }, paramsToSave, function(data) {
        if (data[0].errorMsg === undefined) {
          Utils.showToastFijo('Total de Pólizas Correctas: '+ data[0].poliCorrectas + ' Total de Pólizas Erróneas: ' + data[1].poliErroneas);
          vm.loading = false;
        } else {
          Utils.showToastFijo(data[0].errorMsg);
          vm.loading = false;
        }
      });
    };

    vm.polizaComplement = function() {
      var idUsuario = sessionStorage.getItem('IdUsuario');
      var paramsToSave = {
        'FechaOperacion': vm.FechaOperacion.Valor,
        'IdCuentaCorriente': vm.cuentaSelect,
        'IdUsuario': idUsuario
      };
      generaPoliza.send({
        'entry': 'generapoliza'
      }, paramsToSave, function(data) {
        if (data[0].errorMsg === undefined) {
          Utils.showToastFijo('Total de Pólizas Correctas: '+ data[0].poliCorrectas + ' Total de Pólizas Erróneas: ' + data[1].poliErroneas);
        } else {
          Utils.showToastFijo(data[0].errorMsg);
        }
      });
    };

    vm.exportContable = function() {
      generaPoliza.query({
        'entry': 'estatuspolizas',
        'FechaOperacion': vm.FechaOperacion.Valor,
        'IdCuentaCorriente': vm.cuentaSelect
      })
      .$promise
      .then(function(data) {
        var errorMessageN = 'No existen pólizas para exportar. Verifique por favor';
        var errorMessageE = 'Hay pólizas con errores, no se puede realizar la exportación. Verifique por favor';
        var errorMessageX = 'Existen polizas exportadas para la fecha seleccionada. ¿Desea realizar de nuevo la exportación?';
        var messageC = '¿Desea realizar la exportación de las pólizas de la fecha ' + getDateString( new Date(vm.FechaOperacion.Valor)) + '?';

        vm.estatusPolizas = data;
        var status = 'C';
        if(vm.estatusPolizas.length > 0){
          vm.estatusPolizas.forEach(function(detail) {
            status = detail.PolizaError;
          });
        }
        switch(status){
        case'N':
          Utils.showToastFijo(errorMessageN);
          break;
        case'E':
          Utils.showToastFijo(errorMessageE);
          break;
        case'X':
          vm.realizarExportacion(errorMessageX);
          break;
        case'C':
          vm.realizarExportacion(messageC);
          break;
        }
      }).catch(function() {
        Utils.showToast('No se encontró el servicio!');
        vm.loading = false;
      });
    };

    vm.realizarExportacion = function(message){
      vm.loading = false;
      var confirm = $mdDialog.confirm()
      .title('Atención')
      .textContent(message)
      .ariaLabel('Lucky day')
      .ok('Continuar')
      .cancel('Regresar');
      $mdDialog.show(confirm).then(function() {
        $mdDialog.hide();
        vm.loading = true;

        var paramsToSend = {'FechaOperacion': vm.FechaOperacion.Valor};
        generaPoliza.sendExp({'entry': 'exportacioncontable'}, paramsToSend, function(info)
        {
          Utils.showToastFijo(info.ErrorMsg);
          vm.loading = false;
        });
        vm.loading = false;
      });
    };

    vm.loadData = function() {
      vm.loading = true;
      generaPoliza.query({
        'FechaOperacion': vm.FechaOperacion.Valor,
        'IdCuentaCorriente': vm.cuentaSelect
      })
      .$promise
      .then(function(data) {
        vm.polizasCollection = data;
        if (vm.polizasCollection.length > 0) {
          vm.polizasCollection.forEach(function(poliza) {
            vm.usuariosCollection.forEach(function(usuario) {
              if (poliza.Poliza.IdUsuario === usuario.IdUsuario) {
                poliza.Poliza.NombreUsuario = usuario.Nombre;
              }
            });
          });
          vm.polizaExport = [];
          vm.polizasCollection.forEach(function(poliza) {

            var totalAbono = 0, totalCargo = 0;
            poliza.PolizaDetalle.forEach(function(detailPoliza){
              totalAbono += detailPoliza.Abono;
              totalCargo += detailPoliza.Cargo;
              vm.polizaExport.push(detailPoliza);
            });
            poliza.Poliza.Importe = totalAbono > totalCargo ? totalAbono : totalCargo;
          });
          vm.loading = false;
        } else {
          Utils.showToast('No se encontraron registros!');
          vm.loading = false;
        }
      })
      .catch(function() {
        Utils.showToast('No se encontró el servicio!');
        vm.loading = false;
      });
    };

    vm.consultarPolizas = function() {
      if(new Date(vm.fecha).toString() === new Date(vm.maxDate).toString()){
        $mdDialog.show({
          skipHide: true,
          controller: function ($scope) {
            $scope.close = function () {
              $mdDialog.hide();
            };
          },
          templateUrl: './views/templates/dialog-contabilidad.html'
        });
      }else{
        vm.loading = true;
        generaPoliza.query({
          'entry': 'estatuspolizas',
          'FechaOperacion': vm.FechaOperacion.Valor,
          'IdCuentaCorriente': vm.cuentaSelect
        })
          .$promise
          .then(function (data) {
            vm.resultPoliza = data;
            var estatusPoliza = '';
            vm.loading = true;
            var confirmE = createConfirm('Las pólizas ya han sido generadas para todas las cuentas corrientes y la fecha ' + getDateString(new Date(vm.FechaOperacion.Valor)) + '. Si se repite el proceso se perderán las pólizas anteriores. ¿Realmente  desea  continuar?', 'Continuar', 'Cancelar');
            var confirmN = createConfirm('¿Desea generar las pólizas de todas las cuentas corrientes para la fecha ' + getDateString(new Date(vm.FechaOperacion.Valor)) + '?', 'Continuar', 'Cancelar');
            var confirmX = createConfirm('Las pólizas ya han sido generadas y exportadas para todas las cuentas corrientes y la fecha ' + getDateString(new Date(vm.FechaOperacion.Valor)) + '. Si se repite el proceso se perderán las pólizas anteriores y será necesario volver a realizar su exportación. ¿Realmente  desea  continuar?', 'Continuar', 'Cancelar');
            if (vm.resultPoliza.length > 0) {
              vm.resultPoliza.forEach(function (detail) {
                estatusPoliza = detail.PolizaError;
              });
              switch (estatusPoliza) {
                case 'N':
                  $mdDialog.show(confirmN).then(function () {
                    vm.generatePoliza();
                  });
                  break;
                case 'E':
                  $mdDialog.show(confirmE).then(function () {
                    vm.generatePoliza();
                  });
                  break;
                case 'X':
                  $mdDialog.show(confirmX).then(function () {
                    vm.generatePoliza();
                  });
                  break;
              }
              vm.loading = false;
            } else {
              $mdDialog.show(confirmE).then(function () {
                vm.generatePoliza();
              });
              vm.loading = false;
            }
          })
          .catch(function () {
            Utils.showToast('No se encontraron pólizas!');
            vm.loading = false;
          });
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

    vm.onDateChange = function() {
      vm.FechaOperacion.Valor = new Date(vm.fecha);
    };

    vm.Consultar = function(idSolicitud) {
      vm.detallePoliza = [];
      vm.polizasCollection.forEach(function(item){
        item.PolizaDetalle.forEach(function(detalle){
          if(detalle.IdSolicitud === idSolicitud){
            vm.detallePoliza.push(detalle);
          }
        });
      });
      var templateUriPage = './views/templates/detallePoliza.html';
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

    function getDateString (date){
      return date.toLocaleDateString('es-ES',{
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  }
})();
