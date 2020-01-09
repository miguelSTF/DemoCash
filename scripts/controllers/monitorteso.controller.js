/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
        .controller('MonitorTesoController', MonitorTesoController);
  MonitorTesoController.$inject = ['$scope', 'Utils', 'MonitorTeso', '$mdDialog', '$mdMedia', '$compile', 'Parametros', 'ValidateSession'];
    /* @ngInject */
    function MonitorTesoController($scope, Utils, MonitorTeso, $mdDialog, $mdMedia, $compile, Parametros, ValidateSession) {
      var vm = this;
      vm.catalogo = {
        name: 'tesorero',
        nameCta : 'grupoCta'        
      };

      vm.gpoCuenta = [];
      vm.filtro = '';
      vm.loading = false;
      vm.detailEgresos = [];
      vm.detailIngresos = [];
      vm.detailNoId = [];
      vm.cuenta = [];
       var idsCuentasCorrientes = [];
      
      vm.btnFilter = [
          { label: 'Usuario/Sistema', value: 'Usuario' },
          { label: 'Departamento', value: 'Departamento' },
          { label: 'Concepto', value: 'Concepto'}
      ];

      vm.init = function() {
        var validate = ValidateSession.validate(22);
        if (validate){         
          initial();
        }else{
          location.href = '#/login';
        }                          
      };

      function initial(){        
        vm.loading  = true;                
        MonitorTeso.getCta({
          'name': vm.catalogo.nameCta
        }).$promise.then(function(data){
          vm.gpoCuenta = data.filter(function(item){
            if(item.IdCuentaCorriente.length > 0){
              return item;
            }
          });
          Parametros.query({
            'name': 'Configuracion'
          }).$promise.then(function(data) {
            vm.FechaOperacion = data.filter(function(n) {
              return n.Nombre === 'FechaOperacion';
            })[0];
            vm.fecha = new Date(vm.FechaOperacion.Valor); 
            asignarfiltro();        
            vm.maxDate = new Date(
              vm.fecha.getFullYear(),
              vm.fecha.getMonth(),
              vm.fecha.getDate()
            );
          });   
          if (vm.IdCuentaCorriente === null) {
            vm.operaciones = [];
            Utils.showToast('Seleccione un grupo de cuentas!');
          }else{
            vm.operaciones = [];
          }              
          vm.loading = false;              
        });         
      }

      function guardarFiltro(){
        if(vm.cuenta > 0 && vm.filtro !== ''){         
          vm.filtroMoniTeso = {          
            'IdGrupo': vm.cuenta,
            'Filtro': vm.filtro,            
            'gpoCuenta': vm.gpoCuenta           
          };
          sessionStorage.filtroMoniTeso = JSON.stringify(vm.filtroMoniTeso);
        }           
      }         
      
      function asignarfiltro (){
        if(sessionStorage.filtroMoniTeso !== undefined){
          vm.filtroMoniTeso = JSON.parse(sessionStorage.filtroMoniTeso);
          vm.cuenta= vm.filtroMoniTeso.IdGrupo;        
          vm.filtro = vm.filtroMoniTeso.Filtro;            
          vm.filterData();       
        }
      }     

      vm.filterData = function() {               
        vm.gpoCuenta.filter(function(item){
          if(item.IdGrupo === vm.cuenta){
            idsCuentasCorrientes = item.IdCuentaCorriente;
            vm.Divisa = item.Divisa;
          }
        });
        vm.loading = true;           
        if(vm.cuenta > 0 && vm.filtro !== ''){          
          MonitorTeso.getList({
            'name': vm.catalogo.name,
            'Fecha': vm.fecha,
            'Filtro': vm.filtro,
            'Cuentas': idsCuentasCorrientes
          })
          .$promise
          .then(function(data) {
            vm.tesoreroData = data;
            vm.loading = false;
          })
          .catch(function(){
            Utils.showToast('No se encontró el Servicio!');
          });
        }
        else{
          Utils.showToast('Elige una Cuenta y/o Filtro!!');
          vm.loading = false;
        }      
        guardarFiltro();           
      };

      vm.Close = function () {
        $mdDialog.hide();
      };
    }
})();
