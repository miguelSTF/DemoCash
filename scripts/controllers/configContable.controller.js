(function(){
    'use strict';
    angular.module('appCash')
        .controller('configContableController', configContableController);

    function configContableController($scope, Utils, Parametros, ValidateSession){
        var vm = this;
        vm.longitud = {};
        vm.formato = {};
        vm.rutaExportacion = {};
        vm.longitudRealFormato = 0;
        vm.longitudValor = 0;
        vm.porcentajeIva = {};
        vm.porcentajeIvaValor = 0;
        vm.ctaContableIvaCobrado = '';
        vm.ctaContableIvaPagado = '';
        vm.mascara = '';
        var maskChar = '-';

        $scope.catalogo = {
            name: 'configuracion'
        };

        vm.init = function (){
            var validate = ValidateSession.validate(31);
            if (validate){
                vm.obtenerParametros();
                vm.ConfigForm.$invalid = true;
            }else{
                location.href = '#/login';
            }
        };

        vm.guardarConfig = function(){
            vm.loading = true;
            vm.longitud.Valor = vm.longitudValor.toString();
            vm.porcentajeIva.Valor = vm.porcentajeIvaValor.toString();
            var reFinal = new RegExp();
            if (vm.ctaContableIvaCobrado.Valor !== undefined && vm.ctaContableIvaCobrado.Valor !== null) {
                reFinal = new RegExp('\\' + maskChar, 'g');
                vm.ctaContableIvaCobrado.Valor = vm.ctaContableIvaCobrado.Valor.replace(reFinal, '');
            }
            if (vm.ctaContableIvaPagado.Valor !== undefined && vm.ctaContableIvaPagado.Valor !== null) {
                reFinal = new RegExp('\\' + maskChar, 'g');
                vm.ctaContableIvaPagado.Valor = vm.ctaContableIvaPagado.Valor.replace(reFinal, '');
            }


                vm.parametros = [vm.longitud,vm.formato,vm.rutaExportacion,vm.porcentajeIva,vm.ctaContableIvaCobrado,vm.ctaContableIvaPagado];        

                    var paramsToSave = vm.parametros.filter(function(val) {
                    return val !== undefined;
                    });
                        
                    Parametros.send({
                    'name': $scope.catalogo.name}, paramsToSave, function(data) {
                    if (data.errorMsg === undefined) {
                        Utils.showToast('Registro almacenado correctamente!');
                        vm.init();
                    } else {
                        Utils.showToast(data.errorMsg);
                    }
                });

            vm.loading = false;
        };

        vm.obtenerParametros = function() {
            vm.loading = true;
                Parametros.query({
                'name': $scope.catalogo.name
            }).$promise.then(function(data) {
                
                console.log(data);
                vm.longitud = data.filter(function(n) {
                    if(n.Nombre === 'LongitudMascaraContable'){
                        vm.longitudValor = parseInt(n.Valor);
                        return n.Nombre === 'LongitudMascaraContable';
                    }
                })[0];
                 vm.formato = data.filter(function(n) {
                     if(n.Nombre === 'MascaraCuentaContable'){
                         vm.mascara = n.Valor;
                        return n.Nombre === 'MascaraCuentaContable';
                     }
                })[0];
                 vm.rutaExportacion = data.filter(function(n) {
                    return n.Nombre === 'RutaExportacionContable';
                })[0];
                vm.porcentajeIva = data.filter(function(n) {
                    if(n.Nombre === 'PorcentajeIVA'){
                        vm.porcentajeIvaValor = parseFloat(n.Valor);
                        return n.Nombre === 'PorcentajeIVA';
                    }                        
                })[0];
                vm.ctaContableIvaCobrado = data.filter(function(n) {
                        return n.Nombre === 'CuentaContableIVACobrado';
                })[0];
                vm.ctaContableIvaPagado = data.filter(function(n) {
                        return n.Nombre === 'CuentaContableIVAPagado';
                })[0];
            });

            vm.loading = false;   
         };


        $scope.$watch(function(){return vm.formato.Valor;}, function() {
            if(vm.formato.Valor !== undefined){
            vm.numGuiones = 0;
            vm.numCaracteres = 0;
             var arr = vm.formato.Valor.split('');
                arr.forEach(function(caracter){
                    if(caracter === '-'){
                        vm.numGuiones++;
                    }else{
                        vm.numCaracteres++;
                    }
                });
                vm.longValEqualsThanCharacNum = vm.numCaracteres === vm.longitudValor ? false: true;
                vm.logitudRealMaxima = vm.longitudValor === '' ? 0 : parseInt(vm.longitudValor) + vm.numGuiones;
            }
        }); 

        $scope.$watch(function(){
            return vm.longitudValor;}, function(){
                vm.logitudRealMaxima = vm.longitudValor === '' ? 0 : parseInt(vm.longitudValor) + vm.numGuiones;
                vm.longValEqualsThanCharacNum = vm.numCaracteres === vm.longitudValor ? false: true;
        });


        vm.actualizaMascara = function(){
            vm.mascara = vm.formato.Valor;
            vm.ctaContableIvaCobrado.Valor = maskApply(vm.ctaContableIvaCobrado.Valor, vm.mascara, maskChar);
            vm.ctaContableIvaPagado.Valor = maskApply(vm.ctaContableIvaPagado.Valor, vm.mascara, maskChar);
           };
       
          function maskApply(value, mask, maskCharacter){
              if(value === '') {
                return '';
              }
              var maskDiv = mask.split(maskCharacter);
              var reFinal = new RegExp('\\' + maskCharacter, 'g');
              var pristineValue = value.replace(reFinal, '');
              var newValue = '';
              maskDiv.forEach(function(val, id, array){
                if(pristineValue.length < 0 || newValue.length === mask.length || pristineValue.length === 0) {
                  return;
                }
                newValue += pristineValue.substring(0, val.length) + ((id === array.length - 1) ? '' : maskCharacter);
                pristineValue = pristineValue.substring(val.length, pristineValue.length);
              });
              return newValue;
          }
    }
})();