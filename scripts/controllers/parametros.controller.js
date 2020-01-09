(function(){
    'use strict';
    angular.module('appCash')
        .controller('parametrosController', parametrosController);

    function parametrosController($scope, Utils, Parametros, ValidateSession){
        var vm = this;
        vm.rutaDescarga = '';

        $scope.catalogo = {
            name: 'configuracion'
        };

        vm.init = function (){
            var validate = ValidateSession.validate(43);
            if (validate){
                vm.obtenerParametros();
            }else{
                location.href = '#/login';
            }
        };

        vm.obtenerParametros = function() {
            vm.loading = true;
                Parametros.query({
                'name': $scope.catalogo.name
            }).$promise.then(function(data) {
                vm.rutaDescargaObject = data.filter(function(n) {
                  if(n.Nombre === 'RutaBitacoras'){
                    return vm.rutaDescarga = n.Valor;
                  }
                })[0];
            });
            vm.loading = false;
         };

        vm.guardarConfig = function(){
            vm.loading = true;

            if(vm.rutaDescarga === '' || vm.rutaDescarga === undefined){
              Utils.showToast('No se ha configurado la ruta para la descarga de archivo de eventos.');
              return;
            }
            vm.rutaDescargaObject.Valor = vm.rutaDescarga;
            vm.parametros = [vm.rutaDescargaObject];

            var paramsToSave = vm.parametros.filter(function(val) {
            return val !== undefined;
            });

            Parametros.send({
            'name': $scope.catalogo.name}, paramsToSave, function(data) {
            if (data.errorMsg === undefined) {
                Utils.showToast('Registro almacenado correctamente!');
            } else {
                Utils.showToast(data.errorMsg);
            }
        });

        vm.ConfigForm.$invalid = true;
        vm.loading = false;
        };
    }
})();
