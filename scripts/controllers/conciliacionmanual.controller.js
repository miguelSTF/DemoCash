/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('ConciliacionManualController', ConciliacionManualController);

  ConciliacionManualController.$inject = ['$scope', 'Utils', '$mdDialog', '$mdMedia', '$timeout', '$mdSidenav', '$mdBottomSheet', 'CuentaCorriente', 'ViaLiquidacion', 'CuentasInstitucion', 'EnumVia', 'Catalogos', 'ConciliadorMasProService', 'Parametros', 'ValidateSession'];
  /* @ngInject */
  function ConciliacionManualController($scope, Utils, $mdDialog, $mdMedia, $timeout, $mdSidenav, $mdBottomSheet, CuentaCorriente, ViaLiquidacion, CuentasInstitucion, EnumVia, Catalogos, ConciliadorMasProService, Parametros, ValidateSession) {
    var vm = this;
    vm.loading = true;
    vm.movimientosA = 0;
    vm.importeA = 0;
    vm.movimientosB = 0;
    vm.importeB = 0;
    vm.dataDetailA = [];
    vm.dataDetailB = [];
    vm.isOpenDetail = false;
    vm.tablesHeight = 'div-two-table-scroll-expand';
    vm.internCorrectionCheck = false;
    vm.tipoCuenta = '';
    vm.cuentaCorriente = '';
    vm.origenA = '';
    vm.origenB = '';
    vm.filtro = ['N'];
    vm.checkAyuda = false;
    vm.ayudaCeptoA = '';
    vm.ayudaFiltroConcilManual = '';
    vm.ayudaCeptoB = '';
    vm.ceptosDepositoCli = ['RETE','RETE1','RETE2'];
    vm.enableAjuste = false;
    vm.viasToConciliation = [];
    vm.fechaHistorico = false;
    vm.reverseB = '';
    vm.lastElementB = '';
    vm.reverseA = '';
    vm.lastElementA = '';

    vm.init = function() {
      var validate = ValidateSession.validate(23);
      if (validate){    
        initial();
        asignarFiltros();
      }else{
        location.href = '#/login';
      }    
    };

    vm.buscaViaLiq = function() {
      var idViaLiq = 0;
      vm.cuentas.forEach(function(item) {
        if (item.IdCuentaCorriente === vm.cuentaCorriente) {
          idViaLiq = item.IdViaLiquidacion;
          vm.limiteAjuste = item.LimiteAjuste;
        }
      });
      vm.NombreVia = EnumVia.stringOfEnum(idViaLiq);
      vm.viaLiquidacion = idViaLiq;
      guardarFiltro();
    };

    vm.checkFiltro = function(status) {
      var index = vm.filtro.indexOf(status);
      return index >= 0;
    };

    function guardarFiltro() {
      vm.Filtros = {
        'divisa': vm.divisa,
        'cuentaCorriente': vm.cuentaCorriente,
        'nombreVia': vm.NombreVia,
        'limiteAjuste':vm.limiteAjuste
      };
      sessionStorage.filtroConcilManu = JSON.stringify(vm.Filtros);
    }

    function asignarFiltros() {
      if (sessionStorage.filtroConcilManu !== undefined) {
        vm.Filtros = JSON.parse(sessionStorage.filtroConcilManu);
        vm.divisa = vm.Filtros.divisa;
        vm.cuentaCorriente = vm.Filtros.cuentaCorriente;
        vm.NombreVia = vm.Filtros.nombreVia;
        vm.buscarCuentas();
        vm.refreshAll();
      }
    }

    function initial() {
      ViaLiquidacion.query({
          'name': 'ViaLiquidacion'
        })
        .$promise
        .then(function(resultado) {
          vm.viasLiquidacion = resultado;
          vm.viasLiquidacion.map(function(item) {
            if (item.NombreCorto === 'INDEVAL') {
              vm.via = item.IdVialiquidacion;
            }
          });
          vm.loading = false;
        })
        .catch(function(error) {
          console.log(error);
          Utils.showToast('No se encontró el Servicio!!');
          vm.loading = false;
        });
      vm.loading = false;
      Catalogos.query({
          'name': 'divisa',
          'orderby': 'NombreCorto'
        })
        .$promise
        .then(function(resultado) {
          if (resultado.length <= 0) {
            Utils.showToast('No hay divisas registradas!');
            vm.loading = false;
          }
          vm.divisas = resultado;
        })
        .catch(function(error) {
          console.log(error);
          Utils.showToast('No se encontró el Servicio!!');
          vm.loading = false;
        });

        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data) {
          vm.FechaOperacion = data.filter(function(n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
          vm.fecha = new Date(vm.FechaOperacion.Valor);
          vm.fechaOper = vm.fecha;
          vm.maxDate = new Date(
            vm.fecha.getFullYear(),
            vm.fecha.getMonth(),
            vm.fecha.getDate()
          );

        });
    }

    vm.CheckFunction = function(operacion, crearAjuste) {
      if (operacion === 'Conciliar') {
        vm.ConciliarSeleccion(crearAjuste);
      } else {
        vm.Desconciliar();
      }
    };

    vm.ConciliarSeleccion = function(crearAjuste) {
      var concilConfirmMenssage = '';
      var concilConfirmButton = '';
      if (crearAjuste) {
        var diffAjuste = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(vm.importeA - vm.importeB);
        concilConfirmMenssage = 'Se generará un ajuste por: ' + diffAjuste;
        concilConfirmButton = 'Ajustar';
      } else {
        concilConfirmMenssage = 'Se conciliarán los pagos seleccionados';
        concilConfirmButton = 'Conciliar';
      }

      var confirm = createConfirm(concilConfirmMenssage, concilConfirmButton, 'Regresar');
      $mdDialog.show(confirm)
        .then(function() {
          var aConciliar = {
            'ListGrupoA': generateDetailToConcilArray(vm.dataDetailA),
            'ListGrupoB': generateDetailToConcilArray(vm.dataDetailB),
            'Ajuste': vm.viasToConciliation.length === 0 ? crearAjuste : true,
            'ConcilOtherVia' : vm.viasToConciliation
          };
          CuentaCorriente.save({
              'name': 'conciliacion'
            }, aConciliar)
            .$promise
            .then(function(respuesta) {
              if (respuesta.ErrorCode !== 0) {
                vm.refreshAll();
                Utils.showToast(respuesta.ErrorMsg);
              } else {
                vm.refreshAll();
                Utils.showToast('Se conciliaron los pagos seleccionados');
                vm.viasToConciliation = [];
              }
            })
            .catch(function(error) {
              console.log(error);
              Utils.showToast('No se encontró el Servicio!!');
            });
        });
    };

    function closeBottomSheet() {
      if(vm.respaldoInformationA !== undefined){
        vm.informacionA = Utils.cloneObject(vm.respaldoInformationA);
        vm.respaldoInformationA = undefined;
      }
      vm.origenA = '';
      vm.origenB = '';
      vm.informacionA.forEach(function(dataA) {
        dataA.Check = false;
      });
      vm.informacionB.forEach(function(dataB) {
        dataB.Check = false;
      });
      $mdBottomSheet.hide();
      if (angular.element('md-bottom-sheet').length > 0) {
        angular.element('md-bottom-sheet').remove();
      }
      resetAyuda();
    }

    vm.addStatus = function(statusConcil) {
      if (statusConcil === 'T') {
        var indexT = vm.filtro.indexOf('T');
        if (indexT >= 0) {
          vm.filtro.splice(indexT, 2);
        } else {
          vm.filtro.push('T');
          vm.filtro.push('P');
        }
      } else if (statusConcil === 'C') {
        var indexC = vm.filtro.indexOf('C');
        if (indexC >= 0) {
          vm.filtro.splice(indexC, 2);
        } else {
          vm.filtro.push('C');
          vm.filtro.push('R');
        }
      } else {
        var index = vm.filtro.indexOf(statusConcil);
        if (index >= 0) {
          vm.filtro.splice(index, 1);
        } else {
          vm.filtro.push(statusConcil);
        }
      }
      vm.refreshAll();
    };

    vm.Desconciliar = function() {
      var contieneDepositos = false;
      vm.dataDetailA.filter(function(item){
        var index = vm.ceptosDepositoCli.indexOf(item.ClaveConcepto);
        contieneDepositos = index >= 0;
      });
      if(!contieneDepositos){
        vm.dataDetailB.filter(function(item){
          var index = vm.ceptosDepositoCli.indexOf(item.ClaveConcepto);
          contieneDepositos = index >= 0;
        });
      }
      var msg = contieneDepositos ? 'Los recursos de esta operación podrían haberse utilizado. ¿Realmente desea continuar?': 'Se eliminará la conciliación';

      var confirm = createConfirm(msg, 'Desconciliar', 'Regresar');
      $mdDialog.show(confirm)
        .then(function() {
          desconciliarPagos();
        });
    };

    function asignarOrigenes(side, registro) {
      if (vm.origenA === '' && vm.origenB === '') {
        if (side === 'sideA' && registro.Origen === 'Ikos') {
          vm.origenA = 'Ikos';
          vm.origenB = 'EdoCta';
        } else if (side === 'sideA' && registro.Origen === 'EdoCta') {
          vm.origenA = 'EdoCta';
          vm.origenB = 'Ikos';
        } else if (side === 'sideB' && registro.Origen === 'Ikos') {
          vm.origenB = 'Ikos';
          vm.origenA = 'EdoCta';
        } else if (side === 'sideB' && registro.Origen === 'EdoCta') {
          vm.origenB = 'EdoCta';
          vm.origenA = 'Ikos';
        }
      }
    }

    vm.AddDetail = function(side, registro) {
      if (vm.origenA === '' && vm.origenB === '' && vm.internCorrectionCheck) {
        vm.origenA = registro.Origen;
        vm.origenB = vm.origenA;
      } else if (vm.internCorrectionCheck && vm.origenB === '' && vm.origenA !== '') {
        vm.checkCorreccionesInternas();
      } else if (vm.origenA === '' && vm.origenB === '' && vm.internCorrectionCheck === false) {
        asignarOrigenes(side, registro);
      }

      if (vm.internCorrectionCheck === false && vm.checkAyuda === true) {
        vm.ayuda();
      }

      vm.loading = true;
      vm.instruccionRegistro = registro.Descripcion;
      if (!validarStatusRegistro(registro)) {
        vm.loading = false;
        return;
      }
      var consulta = [{
        'Id': registro.Id,
        'Origen': registro.Origen,
        'FechaDict' : vm.fecha
      }];
      CuentaCorriente.save({
          'name': 'consultaPorPago',
          'idCuentaCorriente': vm.cuentaCorriente
        }, consulta)
        .$promise
        .then(function(data) {
          if (registro.Check === true) {
            addToList(vm.dataDetailA, vm.dataDetailB, data);
            calculaMovimientos();
          } else {
            removeFromList(vm.dataDetailA, vm.dataDetailB, data);
            calculaMovimientos();
          }
          openBottomSheet();
          vm.loading = false;
        })
        .catch(function(error) {
          console.log(error);
          Utils.showToast('No se encontró el Servicio!!');
          vm.loading = false;
        });
    };

    vm.checkCorreccionesInternas = function() {
      vm.loading = true;
      vm.checkAyuda = false;
      vm.dataDetailA = [];
      vm.dataDetailB = [];
      vm.informacionA.forEach(function(item) {
        item.Check = false;
      });
      vm.informacionB.forEach(function(item) {
        item.Check = false;
      });
      closeBottomSheet();
      vm.origenB = vm.origenA === 'Ikos' && vm.origenB === '' ? 'Ikos' :
        vm.origenA === 'Ikos' && vm.origenB === 'EdoCta' ? 'Ikos' :
        vm.origenA === 'Ikos' && vm.origenB === 'Ikos' ? 'EdoCta' :
        vm.origenA === 'EdoCta' && vm.origenB === 'Ikos' ? 'EdoCta' :
        vm.origenA === 'EdoCta' && vm.origenB === 'EdoCta' ? 'Ikos' : '';
      vm.loading = false;
    };

    function validarStatusRegistro(registro) {
      if (registro.Check === true && (vm.dataDetailA.length > 0 || vm.dataDetailB.length > 0)) {
        var conciliated = vm.previousIsConciliated();
        if (conciliated) {
          registro.Check = false;
          Utils.showToast('No se pueden seleccionar mas operaciones!');
          return false;
        }
        var partial = previousIsPartial();
        if (partial) {
          if (registro.Status !== 'N') {
            registro.Check = false;
            Utils.showToast('Solo se pueden seleccionar registros en estatus N!');
            return false;
          }
        }
        if (registro.Status !== 'N') {
          registro.Check = false;
          Utils.showToast('Solo se pueden seleccionar registros en estatus N!');
          return false;
        }
      }
      return true;
    }

    vm.previousIsConciliated = function() {
      var regCount = vm.dataDetailA.filter(function(val) {
        return val.Status === 'C' || val.Status === 'R';
      }).length;
      regCount += vm.dataDetailB.filter(function(val) {
        return val.Status === 'C' || val.Status === 'R';
      }).length;
      return regCount > 0;
    };

    function previousIsPartial() {
      var regCount = vm.dataDetailA.filter(function(val) {
        return val.Status === 'T' || val.Status === 'P';
      }).length;
      regCount += vm.dataDetailB.filter(function(val) {
        return val.Status === 'T' || val.Status === 'P';
      }).length;
      return regCount > 0;
    }

    vm.buscarCuentas = function() {
      vm.informacionA = [];
      vm.informacionB = [];
      //vm.cuentaCorriente = '';
      vm.cuentas = null;
      vm.loading = true;
      Catalogos.query({
          'name': 'CuentaCorriente',
          'IdDivisa': vm.divisa,
          'orderby': 'Alias'
        })
        .$promise
        .then(function(response) {
          vm.cuentas = response;
          vm.buscaViaLiq();
          vm.loading = false;
        })
        .catch(function(error) {
          console.log(error);
          Utils.showToast('No se encontró el Servicio!!');
          vm.loading = false;
        });
    };

    function openBottomSheet() {
      if (vm.dataDetailA.length > 0 || vm.dataDetailB.length > 0) {
        vm.tablesHeight = 'div-two-table-scroll-bottom';
        if (angular.element('md-bottom-sheet').length === 0) {
          $mdBottomSheet.show({
              templateUrl: './views/templates/conciliacion-manual-bottom-' + vm.NombreVia.toString().toLowerCase() + '.html',
              scope: $scope,
              preserveScope: true,
              clickOutsideToClose: false,
              escapeToClose: false,
              disableBackdrop: true,
              disableParentScroll: true
            })
            .then(function() {
              vm.tablesHeight = 'div-two-table-scroll-expand';
              vm.dataDetailA = [];
              vm.dataDetailB = [];
            });
        }
      } else {
        closeBottomSheet();
      }
    }

    function createConfirm(dialog, btnOk, btnNot) {
      return $mdDialog
        .confirm()
        .title('Atención')
        .textContent(dialog)
        .ariaLabel('Lucky day')
        .ok(btnOk)
        .cancel(btnNot);
    }

    function generateDetailToConcilArray(detailList) {
      var listGrupo = [];
      detailList.forEach(function(detail) {
        var det = {
          'Id': detail.Id,
          'Origen': detail.Origen,
          'Who': sessionStorage.getItem('Nombre'),
          'CuentaCorriente': vm.cuentaCorriente,
          'Status': detail.Status
        };
        listGrupo.push(det);
      });
      return listGrupo;
    }

    function desconciliarPagos() {
      vm.loading = true;
      var aDeconciliar = [{
        'Id': vm.dataDetailA.length > 0 ? vm.dataDetailA[0].Id : vm.dataDetailB.length > 0 ? vm.dataDetailB[0].Id : '',
        'Origen': vm.dataDetailA.length > 0 ? vm.dataDetailA[0].Origen : vm.dataDetailB.length > 0 ? vm.dataDetailB[0].Origen : '',
        'Who': sessionStorage.getItem('Nombre')
      }];
      CuentaCorriente.save({
          'name': 'desconciliacion'
        }, aDeconciliar)
        .$promise
        .then(function(respuesta) {
          if (respuesta.errorMsg !== undefined) {
            Utils.showToast('Error al desconciliar operaciones');
            vm.loading = false;
          } else {
            vm.refreshAll();
            Utils.showToast('Se desconcilió el pago seleccionado');
          }
        })
        .catch(function(error) {
          console.log(error);
          Utils.showToast('No se encontró el Servicio!!');
          vm.loading = false;
        });
    }

    function removeFromList(dataDetailPropio, dataDetailRelacion, data) {
      if (data.DetallePropio.length > 0) {
        data.DetallePropio.forEach(function(element) {
          var toDelete = dataDetailPropio.filter(function(result) {
            return result.Id === element.Id;
          });
          var index = dataDetailPropio.indexOf(toDelete[0]);
          if (index > -1) {
            dataDetailPropio.splice(index, 1);
          }
        });
      }
      if (data.DetalleRelacion.length > 0) {
        data.DetalleRelacion.forEach(function(element) {
          var toDelete = dataDetailRelacion.filter(function(result) {
            return result.Id === element.Id;
          });
          var index = dataDetailRelacion.indexOf(toDelete[0]);
          if (index > -1) {
            dataDetailRelacion.splice(index, 1);
          }
        });
      }
    }

    function addToList(dataDetailPropio, dataDetailRelacion, data) {
      if (data.DetallePropio.length > 0) {
        detallePropioChooseVia(dataDetailPropio, dataDetailRelacion, data);
      }
      if (data.DetalleRelacion.length > 0) {
        detalleRelacionChooseVia(dataDetailPropio, dataDetailRelacion, data);
      }
    }

    function detallePropioChooseVia(dataDetailPropio, dataDetailRelacion, data) {
      data.DetallePropio.forEach(function(item) {
        if (item.Payload !== '') {
          item.Payload = JSON.parse(item.Payload);
        }
      });
      data.DetallePropio.forEach(function(item) {
        dataDetailPropio.push(item);
      });
    }

    function detalleRelacionChooseVia(dataDetailPropio, dataDetailRelacion, data) {
      data.DetalleRelacion.forEach(function(item) {
        if (item.Payload !== '') {
          item.Payload = JSON.parse(item.Payload);
        }
      });
      data.DetalleRelacion.forEach(function(item) {
        dataDetailRelacion.push(item);
      });
    }

    function calculaMovimientos() {
      vm.movimientosA = vm.dataDetailA.length;
      vm.movimientosB = vm.dataDetailB.length;
      vm.importeA = 0;
      vm.importeB = 0;
      vm.existConcil = false;
      vm.existPreConcil = false;
      vm.existDiff = false;
      vm.existN = false;
      vm.dataDetailA.forEach(function(detail) {
        vm.importeA += detail.Importe;
        if (detail.Status === 'P' || detail.Status === 'T' || detail.Status === 'C' && detail.IdMotivoSistema !== 16) {
          vm.existConcil = true;
        } else if (detail.Status === 'N') {
          vm.existN = true;
        }if(detail.IdMotivoSistema === 24){
          vm.existPreConcil = true;
        }
      });
      vm.dataDetailB.forEach(function(detail) {
        vm.importeB += detail.Importe;
        if (detail.Status === 'P' || detail.Status === 'T' || detail.Status === 'C' && detail.IdMotivoSistema !== 16) {
          vm.existConcil = true;
        } else if (detail.Status === 'N') {
          vm.existN = true;
        }if(detail.IdMotivoSistema === 24){
          vm.existPreConcil = true;
        }
      });

      vm.importeA = vm.importeA.toFixed(2);
      vm.importeB = vm.importeB.toFixed(2);
      vm.sumImportA = parseFloat(vm.importeA);
      vm.sumImportB = parseFloat(vm.importeB);

      vm.diferencia = 0;
      if (vm.importeA - vm.importeB !== 0) {
        vm.existDiff = true;
        vm.diferencia = (vm.importeA - vm.importeB).toFixed(2);
      }
      vm.enableAjuste = Math.abs(vm.diferencia) > vm.limiteAjuste;
    }

    vm.getAyuda = function() {
      if(vm.checkAyuda){
        if(vm.respaldoInformationA !== undefined){
          vm.informacionA = Utils.cloneObject(vm.respaldoInformationA);
          vm.respaldoInformationA = undefined;
          vm.dataDetailA = [];
          calculaMovimientos();
        }
        vm.ayudaCeptoA = '';
        vm.ayudaCeptoB = '';
        vm.ayudaFiltroConcilManual = '';
        vm.ayudaImporteConcilManual = '';
      }else{
        if(vm.origenA === '' && vm.origenB === ''){
          vm.checkAyuda = false;
        }else{
           if(iCanHelp()){
              vm.ayuda();
            }else{
              vm.checkAyuda = true;
            }
        }
      }
    };

    function iCanHelp (){
      var checkedA = vm.informacionA.filter(function(item) {
        return item.Check;
      });
      var checkedB = vm.informacionB.filter(function(item) {
        return item.Check;
      });
      if((checkedA.length  > 0 && checkedB.length === 0) || (checkedA.length === 0 && checkedB.length > 0)){
        if(checkedA.length > 0){
          var clavesCeptosA = [];
          var filtrosAyudaA = [];
          vm.informacionA.forEach(function(item) {
            if(item.Check){
              var index = clavesCeptosA.indexOf(item.ClaveCepto);
              if(index === -1){
                clavesCeptosA.push(item.ClaveCepto);
              }

              var index = filtrosAyudaA.indexOf(item.FiltroConcilManual);
              if(index === -1){
                filtrosAyudaA.push(item.FiltroConcilManual);
              }
            }
          });
          if(clavesCeptosA.length === 1 && filtrosAyudaA.length === 1){
            return true;
          }else{
            Utils.showToast('Seleccione operaciones del mismo concepto y emisión!');
            return false;
          }
        }else{
          var clavesCeptosB = [];
          var filtrosAyudaB = [];
          vm.informacionB.forEach(function(item) {
            if(item.Check){
              var index = clavesCeptosB.indexOf(item.ClaveCepto);
              if(index === -1){
                clavesCeptosB.push(item.ClaveCepto);
              }

              var index = filtrosAyudaB.indexOf(item.FiltroConcilManual);
              if(index === -1){
                filtrosAyudaB.push(item.FiltroConcilManual);
              }
            }
          });
          if(clavesCeptosB.length === 1 && filtrosAyudaB.length === 1){
            return true;
          }else{
            Utils.showToast('Seleccione operaciones del mismo concepto y emisión!');
            return false;
          }
        }
      }else{
        Utils.showToast('Seleccione operaciones solo de un lado!');
        return false;
      }
    }

    vm.ayuda = function() {
      if (vm.ayudaCeptoA === '' && vm.ayudaCeptoB === '') {
        var infoA = vm.informacionA.filter(function(item) {
          if (item.Check) {
            return item;
          }
        });
        var infoB = vm.informacionB.filter(function(item2) {
          if (item2.Check) {
            return item2;
          }
        });
        if (infoA.length > 0 && infoB.length === 0) {
          var datoA = infoA[0];
          if(vm.viaLiquidacion === 1){
            switch(datoA.ClaveCepto) {
              case 'C':
              case 'V':
                setValuesAyuda(datoA.ClaveCepto,'COVE',datoA.FiltroConcilManual);
                break;
              case 'RA':
              case 'RP':
                setValuesAyuda(datoA.ClaveCepto,'REPO',datoA.FiltroConcilManual);
                break;
              case 'VRA':
              case 'VRP':
                setValuesAyuda(datoA.ClaveCepto,'VREP',datoA.FiltroConcilManual);
                break;
              case 'COVE':
                setValuesAyuda(datoA.ClaveCepto,datoA.Sentido === 'E' ? 'C' : 'V',datoA.FiltroConcilManual);
                break;
              case 'VREP':
                setValuesAyuda(datoA.ClaveCepto,datoA.Sentido === 'E' ? 'VRA' : 'VRP',datoA.FiltroConcilManual);
                break;
              case 'REPO':
                setValuesAyuda(datoA.ClaveCepto,datoA.Sentido === 'E' ? 'RP' : 'RA',datoA.FiltroConcilManual);
                break;
              case 'CCSR':
                setValuesAyuda(datoA.ClaveCepto,'INTR', '');
                break;
              case 'CCPR':
                setValuesAyuda(datoA.ClaveCepto,'INTR', '');
                break;
              case 'VPD':
                setValuesAyuda(datoA.ClaveCepto,'AMRT', datoA.FiltroConcilManual);
                break;
              case 'RSPE':
                setValuesAyuda(datoA.ClaveCepto,'RSPP', datoA.FiltroConcilManual);
                break;
              case 'RSPP':
                setValuesAyuda(datoA.ClaveCepto,'RSPS', datoA.FiltroConcilManual);
                break;
              default:
                Utils.showToast('No se ha implementado ayuda para el concepto seleccionado!!');
                vm.checkAyuda = true;
                break;
              }
          }else{
            vm.ayudaImporteConcilManual = datoA.Importe;
          }
        } else if (infoB.length > 0 && infoA.length === 0) {
          var datoB = infoB[0];
          if(vm.viaLiquidacion === 1){
            switch(datoB.ClaveCepto) {
              case 'C':
              case 'V':
                setValuesAyuda('COVE',datoB.ClaveCepto,datoB.FiltroConcilManual);
                break;
              case 'RA':
              case 'RP':
                setValuesAyuda('REPO',datoB.ClaveCepto,datoB.FiltroConcilManual);
                break;
              case 'VRA':
              case 'VRP':
                setValuesAyuda('VREP',datoB.ClaveCepto,datoB.FiltroConcilManual);
                break;
              case 'COVE':
                setValuesAyuda(datoB.Sentido === 'E' ? 'C' : 'V',datoB.ClaveCepto,datoB.FiltroConcilManual);
                break;
              case 'VREP':
                setValuesAyuda(datoB.Sentido === 'E' ? 'VRA' : 'VRP',datoB.ClaveCepto,datoB.FiltroConcilManual);
                break;
              case 'REPO':
                setValuesAyuda(datoB.Sentido === 'E' ? 'RP' : 'RA',datoB.ClaveCepto,datoB.FiltroConcilManual);
                break;
              case 'INTR':
                vm.ayudaCeptoB = datoB.ClaveCepto;
                vm.ayudaFiltroConcilManual = '';
                var infoFilterA = [];
                vm.respaldoInformationA = Utils.cloneObject(vm.informacionA);
                vm.informacionA.forEach(function(item){
                  if(item.ClaveCepto === 'CCSR' || item.ClaveCepto === 'CCPR'){
                    infoFilterA.push(item);
                  }
                });
                vm.informacionA = infoFilterA;
                break;
              case 'AMRT':
                setValuesAyuda('VPD',datoB.ClaveCepto, datoB.FiltroConcilManual);
                break;
              case 'RSPS':
                setValuesAyuda('RSPP',datoB.ClaveCepto, datoB.FiltroConcilManual);
                break;
              case 'RSPP':
                setValuesAyuda('RSPE',datoB.ClaveCepto, datoB.FiltroConcilManual);
                break;
              default:
                Utils.showToast('No se ha implementado ayuda para el concepto seleccionado!!');
                vm.checkAyuda = true;
                break;
              }
          }
          else{
            vm.ayudaImporteConcilManual = datoB.Importe;
          }
        }
      }
    };

    function resetAyuda() {
      vm.ayudaCeptoA = '';
      vm.ayudaCeptoB = '';
      vm.ayudaFiltroConcilManual = '';
      vm.ayudaImporteConcilManual = '';
    }

    function setValuesAyuda(ceptoA, ceptoB, filtroConcilManual) {
      vm.ayudaCeptoA = ceptoA;
      vm.ayudaCeptoB = ceptoB;
      vm.ayudaFiltroConcilManual = filtroConcilManual;
    }

    vm.refreshAll = function() {
      vm.loading = true;
      information();
      vm.origenA = '';
      vm.origenB = '';
      vm.tablesHeight = 'div-two-table-scroll-expand';
      vm.dataDetailA = [];
      vm.dataDetailB = [];
      vm.movimientosA = 0;
      vm.importeA = 0;
      vm.movimientosB = 0;
      vm.importeB = 0;
      closeBottomSheet();
      resetAyuda();
    };

    function information() {
      vm.loading = true;
      vm.fechaHistorico = vm.fecha < vm.fechaOper;

      if (vm.cuentaCorriente === '') {
        Utils.showToast('Selecciona una cuenta corriente');
        vm.loading = false;
      } else {
        CuentaCorriente
          .getList({
            'name': 'conciliacionManual',
            'status': vm.filtro.toString(),
            'IdCuentaCorriente': vm.cuentaCorriente,
            'FechaOperacion' : vm.fecha
          })
          .$promise
          .then(function(data) {
            if (data.GrupoA.length === 0) {
              vm.informacionA = [];
              Utils.showToast('No hay registros para la tabla A!');
            } else {
              vm.informacionA = data.GrupoA;
            }
            if (data.GrupoB.length === 0) {
              vm.informacionB = [];
              Utils.showToast('No hay registros para la tabla B!');
            } else {
              vm.informacionB = data.GrupoB;
            }
            vm.loading = false;
          })
          .catch(function() {
            Utils.showToast('No se encontró el Servicio!!');
            vm.loading = false;
          });
      }
    }

    vm.confirmGenerateIngresos = function() {
      var confirm = createConfirm('¿Desea registrar este ingreso como \n "Ingreso No Identificado" \n para su posterior reclasificación?', 'SI', 'NO');
      $mdDialog.show(confirm)
        .then(function() {
          vm.generateIngresoNI();
        });
    };

    vm.generateIngresoNI = function() {
      vm.loading = true;
      var aConciliar = {
        'ListGrupoA': generateDetailToConcilArray(vm.dataDetailA),
        'ListGrupoB': generateDetailToConcilArray(vm.dataDetailB),
        'Ajuste': false
      };
      CuentaCorriente.save({
          'name': 'ingresoNoIdentificado'
        }, aConciliar)
        .$promise
        .then(function(respuesta) {
          if (respuesta.ErrorMsg !== null && respuesta.ErrorMsg !== undefined && respuesta.ErrorCode === 1) {
            Utils.showToast('Error: ' + respuesta.ErrorMsg);
          } else if (respuesta.ErrorCode === 2) {
            Utils.showToast('Error al intentar registrar el ingreso!!!');
          } else {
            vm.refreshAll();
            Utils.showToast('Ingreso registrado correctamente!!!');
          }
          vm.loading = false;
        })
        .catch(function(error) {
          Utils.showToast('No se encontró el Servicio!!');
          console.log(error);
          vm.loading = false;
        });
    };

    document.oncontextmenu = function() {
      return false;
    };

    vm.ConfirmAction = function(operacion) {
      var dialog = '';
      if (operacion === 'desconciliate') {
        dialog = 'Este proceso eliminará las conciliaciones y los ajustes por conciliación. ¿Desea continuar?';
      } else {
        dialog = '¿Esta seguro que desea ejecutar la conciliación?';
      }
      var confirm = $mdDialog.confirm()
        .title('Atención')
        .textContent(dialog)
        .ariaLabel('Lucky day')
        .ok('Confirmar')
        .cancel('Regresar');

      $mdDialog.show(confirm).then(function() {
        vm.EjecutarOperacion(operacion);
      });
    };

    vm.EjecutarOperacion = function(operacion) {
      ConciliadorMasProService.send({
          'operacion': operacion,
          'IdCuentaCorriente': vm.cuentaCorriente
        })
        .$promise
        .then(function() {
          Utils.showToast('Operación finalizada correctamente');
          vm.refreshAll();
        })
        .catch(function(error) {
          console.log('Error: ' + JSON.stringify(error));
          Utils.showToast('Error al Ejecutar Operación');
        });
    };

    vm.PreconciliarOper = function(operacion){
      var confirm = createConfirm('Una vez realizada la pre-conciliación no es posible revertir el proceso. ¿Desea continuar?', 'Aplicar', 'Regresar');
      $mdDialog.show(confirm)
        .then(function() {
          vm.loading = true;
          var aConciliar = {
            'ListGrupoA': generateDetailToConcilArray(vm.dataDetailA),
            'ListGrupoB': generateDetailToConcilArray(vm.dataDetailB),
            'Ajuste': false
          };
          CuentaCorriente.save({
              'name': 'preConciliacion'
            }, aConciliar)
            .$promise
            .then(function(respuesta) {
              if (respuesta.ErrorMsg !== null && respuesta.ErrorMsg !== undefined && respuesta.ErrorCode === 1) {
                Utils.showToast('Error: ' + respuesta.ErrorMsg);
              } else if (respuesta.ErrorCode === 2) {
                Utils.showToast('Error al pre-conciliar operacion!!!');
              } else {
                vm.refreshAll();
                Utils.showToast('Pre-Conciliacion registrada correctamente!!!');
              }
              vm.loading = false;
            })
            .catch(function(error) {
              Utils.showToast('No se encontró el Servicio!!');
              console.log(error);
              vm.loading = false;
            });
          });
    };

    vm.GetImporteOtherVia = function(){
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/conciliacionOtherVia.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function(){
          vm.viasToConciliation = [];
          vm.viasLiquidacion.forEach(function(item){
            if(item.IdViaLiquidacion === 2 || item.IdViaLiquidacion === 7){
              vm.viasToConciliation.push({'IdVia':item.IdViaLiquidacion,'Nombre':item.Descripcion,'Importe':0});
            }
          });
          vm.maxAjusteConcil = Math.abs(vm.diferencia);

          vm.calcularSuma = function(){
            vm.sumaImportes = 0;
            vm.viasToConciliation.forEach(function(item){
              vm.sumaImportes = item.Importe.toString() === 'NaN' ? vm.sumaImportes + 0 : vm.sumaImportes + item.Importe;
            });
          }
        }
      });
    };

    vm.sortDataA = function(orderby, event) {
      var currentElement = angular.element(event.currentTarget);
      currentElement[0].width = '100px';
      $('#tSearchA').find('th').removeClass('st-sort-ascent');
      $('#tSearchA').find('th').removeClass('st-sort-descent');
      vm.nameTH = currentElement[0].textContent;
      if (vm.nameTH !== vm.lastElementA) {
        if (orderby === '') {
          orderby = vm.nameTH === 'Instrucción' ? 'Descripcion' : vm.nameTH === 'Oper.'
            ? 'TipoPago' : vm.nameTH === 'Importe' ? 'Importe' : vm.nameTH === 'Mov.' 
            ? 'Sentido' : vm.nameTH === 'Est.' ? 'Status' : vm.nameTHt === 'Origen'
            ? 'Origen' : vm.nameTH === 'Check' ? 'Check' : '';
        }
        vm.reverseA = false;
      }
      vm.lastElementA = vm.nameTH;
      if(orderby === ''){
        vm.SortbyA = orderby;
        vm.reverseA = '';
      }else{
        vm.SortbyA = orderby;
        vm.reverseA = !vm.reverseA;
        currentElement.addClass(vm.reverseA === '' ? '' : vm.reverseA ? 'st-sort-descent' : 'st-sort-ascent');
      }
    };

    vm.sortDataB = function(orderby, event) {
      var currentElement = angular.element(event.currentTarget);
      currentElement[0].width = '100px';
      $('#tSearchB').find('th').removeClass('st-sort-ascent');
      $('#tSearchB').find('th').removeClass('st-sort-descent');
      vm.nameTHB = currentElement[0].textContent;
      if (vm.nameTHB !== vm.lastElementB) {
        if (orderby === '') {
          orderby = vm.nameTHB === 'Instrucción' ? 'Descripcion' : vm.nameTHB === 'Oper.'
            ? 'TipoPago' : vm.nameTHB === 'Importe' ? 'Importe' : vm.nameTHB === 'Mov.' 
            ? 'Sentido' : vm.nameTHB === 'Est.' ? 'Status' : vm.nameTHB === 'Origen'
            ? 'Origen' : vm.nameTHB === 'Check' ? 'Check' : '';
        }
        vm.reverseB = false;
      }
      vm.lastElementB = vm.nameTHB;
      if(orderby === ''){
        vm.SortbyB = orderby;
        vm.reverseB = '';
      }else{
        vm.SortbyB = orderby;
        vm.reverseB = !vm.reverseB;
        currentElement.addClass(vm.reverseB === '' ? '' : vm.reverseB ? 'st-sort-descent' : 'st-sort-ascent');
      }
    };
  }
})();
