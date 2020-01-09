/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('MapaConfiguracionController', MapaConfiguracionController);

  /* @ngInject */
  function MapaConfiguracionController(Utils, Catalogos, MapConfig, ValidateSession) {
    var vm = this;
    vm.loading = false;
    vm.dataset = [];
    vm.catalogoSelect = '';
    vm.tableLimite = true;
    vm.tablePerfil = true;
    vm.tableContraparte = true;
    vm.tipoCatalogo = [];

    vm.init = function() {
      var validate = ValidateSession.validate(40);
      if (validate){
        vm.tipoCatalogo = [
          { name: 'CONTRAPARTES' },
          { name: 'LÍMITES' },
          { name: 'PERFILES' }
        ];
      }else{
        location.href = '#/login';
      }
    };

    vm.filterData = function() {
      vm.loading = true;
      vm.tableLimite = true;
      vm.tablePerfil = true;
      vm.tableContraparte = true;
      vm.dataset = [];
      vm.checkTableExport(vm.catalogoSelect);

      MapConfig.query({
        'Catalogo': vm.catalogoSelect
      })
      .$promise.then(function(resultado){
        if(resultado.length <= 0){
          Utils.showToast('No se encontraron registros!');
          vm.loading = false;
        }
        if (resultado[0].Message !== undefined) {
          Utils.showToast(resultado[0].Message);
          vm.loading = false;
        }else{
          vm.dataset = resultado;
          vm.loading = false;
        }
      });
    };

    vm.exportExcel = function() {
      export_table_to_excel(vm.tableExport,vm.nameExcel,'[1]','[15]');
    };

    vm.checkTableExport = function(tableView) {
      if (tableView === 'CONTRAPARTES') {
        vm.tableContraparte = false;
        vm.tableExport = 'tablaContraparte';
        vm.nameExcel = 'Mapa Configuración Contrapartes';
      }else if (tableView === 'LÍMITES') {
        vm.tableLimite = false;
        vm.tableExport = 'tablaLimite';
        vm.nameExcel = 'Mapa Configuración Límites';
      }else if (tableView === 'PERFILES') {
        vm.tablePerfil = false;
        vm.tableExport = 'tablaPerfil';
        vm.nameExcel = 'Mapa Configuración Perfiles';
      }
    };
  }
})();
