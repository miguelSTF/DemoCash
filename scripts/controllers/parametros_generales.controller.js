(function(){
  'use strict';
  angular.module('appCash')
    .controller('ParamGenController', ParamGenController);

  function ParamGenController($scope, $mdDialog, Utils, Parametros, Catalogos, ValidateSession) {
    
    var vm = this;
    vm.ctaNostro = {};
    vm.loading = true;
    vm.searchCta = '';
    vm.edit = false;

    vm.init = function (){
      var validate = ValidateSession.validate(56);
      if (validate){
      vm.loading = false;
        Catalogos.query({
          'name': 'CuentaCorriente',
          'orderby': 'Alias',
          'Activo': '1',
          'IdViaLiquidacion': '2'
        }).$promise.then(function(res) {
          vm.cuentasNostro = res;
          vm.obtenerParametros();
          vm.obtenerConfigSeg();
          vm.loading = false;
        }).catch(function(response) {
          Utils.showToast('No se encontró el Servicio!!');
          console.error('Error: ' + JSON.stringify(response));
          vm.loading = false;
        });
      }else{
        location.href = '#/login';
      }
    }

    vm.obtenerParametros = function() {
      Parametros.query({
        'name': $scope.catalogo.name
      }).$promise.then(function(data) {
        vm.bansefiCtaPrin = data.filter(function(n) {
          if(n.Nombre === 'IdCtaSpei'){
            vm.bansefiCtaPrinValue = n.Valor;
            if (vm.bansefiCtaPrinValue !== '') {
              vm.cuentasNostro.forEach(function(res){
                if (res.IdCuentaCorriente === parseInt(vm.bansefiCtaPrinValue)) {
                  vm.ctaNostro = res;
                }
              });
              vm.ctaNostroChange();
            }
            return n.Nombre === 'IdCtaSpei';
          }                        
        })[0];
      });
    };

    vm.enableEdit = function(){
      vm.edit = true;
    };

    vm.cancelEdit = function(){
      vm.ConfigForm.$setPristine();
      vm.edit = false;
      vm.obtenerParametros();
      vm.obtenerConfigSeg();
    };

    vm.ctaNostroChange = function() {
      vm.cuentasNostro.forEach(function(ctaR){
        ctaR.Selected = false;
      });
      vm.restCtaNostro = [];
      vm.cuentasNostro.forEach(function(cta){
        if (cta.IdCuentaCorriente !== vm.ctaNostro.IdCuentaCorriente) {
          vm.restCtaNostro.push(cta);   
        }  
      });
    };

    vm.SetTab = function(a){
      vm.Tab = a;
      vm.edit = false;
    };

    vm.save = function() {
      if(vm.Tab === 1){
        vm.saveConfig();
        vm.ConfigForm.$setPristine();
      }
      else if(vm.validateForm()){
        vm.guardarConfigSeg();
        vm.edit = false;
        vm.ConfigForm.$setPristine();
      }
    };

    vm.saveConfig = function(){
      vm.loading = true;
      vm.bansefiCtaPrin.Valor = vm.ctaNostro.IdCuentaCorriente.toString();
      vm.parametros = [vm.bansefiCtaPrin];        
      var paramsToSave = vm.parametros.filter(function(val) {
        return val !== undefined;
      });
      Parametros.send({
        'name': 'configuracion'
      }, paramsToSave, function(data) {
        if (data.errorMsg === undefined) {
          Utils.showToast('Registro almacenado correctamente!');
          vm.loading = false;
          vm.edit = false;
        } else {
          Utils.showToast(data.errorMsg);
          vm.loading = false;
          vm.edit = false;
        }
      });
    };

    vm.handleKeyup = function(ev) {
      ev.stopPropagation();
    };

    //Configuracion de Seguridad
    vm.SeguridadLocalArray = [];

    //Reglas de manejo de sesión
    vm.NumMaxSesionesSimultaneas = {
      name: 'NumMaxSesionesSimultaneas',
      value: 0
    };
    vm.MinutosMaxInactividadSesion = {
      name: 'MinutosMaxInactividadSesion',
      value: 0
    };
    vm.NumMaxIntentosAcceso = {
      name: 'NumMaxIntentosAcceso',
      value: 0
    };
    vm.MinutosBloqueoAccesoFallido = {
      name: 'MinutosBloqueoAccesoFallido',
      value: 0
    };

    //Reglas de conformación para usuario
    vm.CaracteresMin_43SR = {
      name: 'CaracteresMin_43SR',
      value: 0
    };
    vm.CaracteresMax_43SR = {
      name: 'CaracteresMax_43SR',
      value: 0
    };

    //Reglas de conformación para contraseña
    vm.NumDiasCambio_P01SS = {
      name: 'NumDiasCambio_P01SS',
      value: 0
    };
    vm.NumMaxP01SSHistPermitidas = {
      name: 'NumMaxP01SSHistPermitidas',
      value: 0
    };
    vm.CaracteresMin = {
      name: 'CaracteresMin',
      value: 0
    };
    vm.CaracteresMax = {
      name: 'CaracteresMax',
      value: 0
    };  
    vm.CaracteresPermitidos = {
      name: 'CaracteresPermitidos',
      value: ''
    };
    vm.NumMinMayusculas = {
      name: 'NumMinMayusculas',
      value: 0
    };
    vm.NumMinMinusculas = {
      name: 'NumMinMinusculas',
      value: 0
    };
    vm.NumMinCaracteresNum = {
      name: 'NumMinCaracteresNum',
      value: 0
    };
    vm.NumMinCaracteresEspeciales = {
      name: 'NumMinCaracteresEspeciales',
      value: 0
    };
    vm.RequiereMayusIntermedias = {
      name: 'RequiereMayusIntermedias',
      value: false
    };
    vm.RequiereMinusIntermedias = {
      name: 'RequiereMinusIntermedias',
      value: false
    };
    vm.RequiereNumIntermedios = {
      name: 'RequiereNumIntermedios',
      value: false
    };
    vm.RequiereCaracteresEspeciales = {
      name: 'RequiereCaracteresEspeciales',
      value: false
    };

    vm.allValues = [vm.NumMaxSesionesSimultaneas, vm.MinutosMaxInactividadSesion, vm.NumMaxIntentosAcceso, vm.MinutosBloqueoAccesoFallido, vm.CaracteresMin_43SR, vm.CaracteresMax_43SR,
      vm.NumDiasCambio_P01SS, vm.NumMaxP01SSHistPermitidas, vm.CaracteresMin, vm.CaracteresMax, vm.CaracteresPermitidos, vm.NumMinMayusculas, vm.NumMinMinusculas, vm.NumMinCaracteresNum,
      vm.NumMinCaracteresEspeciales, vm.RequiereMayusIntermedias, vm.RequiereMinusIntermedias, vm.RequiereNumIntermedios, vm.RequiereCaracteresEspeciales
    ];

    vm.catalogo = {
      name: 'ConfiguracionSeguridadLocal'
    };

    vm.yesOrNot = [{
      text: 'Si',
      value: true
    }, {
      text: 'No',
      value: false
    }];

    vm.allowedCharacters = [{
      text: 'Ambas',
      value: 1
    }, {
      text: 'Maýusculas',
      value: 2
    }, {
      text: 'Minúsculas',
      value: 3
    }];

    vm.obtenerConfigSeg = function () {
      vm.loading = true;
      Parametros.query({
        'name': vm.catalogo.name
      }).$promise.then(function (data) {
        vm.SeguridadLocalArray = data;
        vm.allValues.forEach(function (e) {
          vm.SeguridadLocalArray.forEach(function (x) {
            if (e.name === x.Nombre) {
              var test = parseInt(x.Valor);
              if (test.toString() === 'NaN'){
                e.value = x.Valor;
              } else {
                e.value = test;
              }
            }
          });
        });
      });
      vm.loading = false;
    };

    vm.guardarConfigSeg = function () {
      vm.loading = true;
      vm.SeguridadLocalArray.forEach(function(elem){
        vm.allValues.forEach(function(input){
          if(elem.Nombre === input.name){
            var test = parseInt(input.value);
            if (test.toString() === 'NaN') {
              elem.Valor = input.value;
            } else {
              elem.Valor = test;
            }
          }
        });
      });
      Parametros.send({
        'name': vm.catalogo.name
      }, vm.SeguridadLocalArray, function (data) {
        if (data.errorMsg === undefined) {
          Utils.showToast('Datos almacenados correctamente!');
        } else {
          Utils.showToast('Error al guardar datos' + data.errorMsg);
        }
      });
      vm.loading = false;
    };
    
    vm.disableOptionsAllowedCharacters = function(){
      if( parseInt(vm.CaracteresPermitidos.value) === vm.allowedCharacters[1].value || parseInt(vm.CaracteresPermitidos.value) === vm.allowedCharacters[2].value ){
        vm.NumMinMayusculas.value = 0;
        vm.NumMinMinusculas.value = 0;
        vm.RequiereMayusIntermedias.value = false;
        vm.RequiereMinusIntermedias.value = false;
      }
    };

    vm.validateForm = function(){
      if (vm.CaracteresMax_43SR.value < vm.CaracteresMin_43SR.value) {
        Utils.showToast('El número de caracteres mínimos de usuario deben ser menor al número de caracteres máximos.');
        return false;
      }
      if (vm.CaracteresMax.value < vm.CaracteresMin.value) {
        Utils.showToast('El número de caracteres mínimos de la contraseña deben ser menor al número de caracteres máximos.');
        return false;
      }
      if (vm.NumMinMayusculas.value > vm.CaracteresMax.value) {
        Utils.showToast('El número mínimo de mayúsculas de la contraseña debe ser menor al número de caracteres máximos.');
        return false;
      }

      if (vm.NumMinMinusculas.value > vm.CaracteresMax.value) {
        Utils.showToast('El número mínimo de minúisculas de la contraseña debe ser menor al número de caracteres máximos.');
        return false;
      }
      if (vm.NumMinCaracteresNum.value > vm.CaracteresMax.value) {
        Utils.showToast('El número mínimo de caracteres numericos de la contraseña debe ser menor al número de caracteres máximos.');
        return false;
      }

      if (vm.NumMinCaracteresEspeciales.value > vm.CaracteresMax.value) {
        Utils.showToast('El número mínimo de caracteres especiales de la contraseña debe ser menor al número de caracteres máximos.');
        return false;
      }
      return true;
    };
    
    vm.filterValue = function($event){
      if(isNaN(String.fromCharCode($event.keyCode))){
        $event.preventDefault();
      }
    }
  }
})();