(function(){
    'use strict';


    angular.module('appCash')
        .controller('BitacoraEdoCuentaController', BitacoraEdoCuentaController);
    

    function BitacoraEdoCuentaController($scope, Utils, Parametros, Catalogos, EnumVia, ViaLiquidacion, BitacoraEdoCuenta, ValidateSession){
        var vm = this;
        vm.via = [];        
        vm.loading = true;
        vm.init = function (){
            var validate = ValidateSession.validate(27);
            if (validate){
                Parametros.query({
                    'name': 'Configuracion'
                }).$promise.then(function(data){
                    vm.FechaOperacion = data.filter(function(n){
                        return n.Nombre === 'FechaOperacion';
                    })[0];
                    vm.fecha = new Date(vm.FechaOperacion.Valor);
                    vm.maxDate = new Date(
                        vm.fecha.getFullYear(),
                        vm.fecha.getMonth(),
                        vm.fecha.getDate()
                );
                ViaLiquidacion.query({
                    'name' : 'ViaLiquidacion',
                    'orderby' : 'Descripcion'
                }).$promise.then(function(via){
                    vm.vias = via;
                    asignarFiltro();
                    vm.loading = false;
                });
                }).catch(function(){
                    Utils.showToast('No se encontró el Servicio!');
                    vm.loading = false;
                });
            }else{
                location.href = '#/login';
            }
        };

        vm.buscaVialiq = function(){
            vm.dataCollection.forEach(function(item){ 
                item.NombreVia = EnumVia.stringOfEnum(item.IdViaLiquidacion);
                if(item.Resultado === 'C'){
                    item.Resultado = 'Correcto';
                }else if(item.Resultado === 'E'){
                    item.Resultado = 'Error';
                } else if(item.Resultado === 'A'){
                    item.Resultado = 'Advertencia';
                }
            });
        };

        vm.obtenerBitacora = function(){ 
            vm.dataCollection = [];           
            vm.loading = true;                   
            BitacoraEdoCuenta.query({
                'name': 'BitacoraEdoCuenta',
                'FechaOperacion': vm.fecha,
                'IdViaLiquidacion': vm.via
            }).$promise.then(function(resultado){
                if(resultado.length === 0){
                    Utils.showToast('No se encontraron registros!');                    
                }
                else{
                    vm.dataCollection = resultado;
                    vm.buscaVialiq();
                } 
                guardarFiltro(); 
                vm.loading= false;              
            }).catch(function(){
                Utils.showToast('No se encontró el Servicio!');
                vm.loading = false;
            });
        };

        function guardarFiltro(){
            var filtro = {
                'via' : vm.via
            };
            sessionStorage.filtroBitacoraEdoCta = JSON.stringify(filtro);
        }

        function asignarFiltro(){
            if(sessionStorage.filtroBitacoraEdoCta !== undefined){
                vm.Filtro = JSON.parse(sessionStorage.filtroBitacoraEdoCta);
                vm.via = vm.Filtro.via;
                vm.obtenerBitacora();
            }
        }
    }
})();