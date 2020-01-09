/*jshint latedef: nofunc */
(function () {
  'use strict';

  angular.module('appCash')
    .controller('LoginController', LoginController);

  /* @ngInject */
  function LoginController($scope, $location, Idle, $uibModal, Utils, OAuthServerUrl, environment, Parametros, Login, LoginConfiguracion) {
    var vm = this;
    $scope.started = false;
    vm.showChangePassword = false;
    vm.showData = false;

    vm.init = function () {
      LoginConfiguracion.GetData({
        'name' : 'ModoAutenticacion'
      }).$promise.then(function (data){
        vm.modoLogin = data.filter(function(item){
          if (item.Nombre === 'ModoAutenticacion') {
            return item;
          }
        })[0];
          
        if(vm.modoLogin !== undefined){
          if(sessionStorage.Clave !== undefined && vm.modoLogin.Valor === '1'){
            Login.validate({'name':'administracionSesion'},
              {'43S4301R1731':sessionStorage.Clave})
              .$promise
              .then(function(dataValid) {
                if (dataValid.Valido){
                  sessionStorage.clear();
                  var nav = document.getElementsByTagName('nav')[0];
                  nav.setAttribute('style', 'display:none');
                  if (environment.mode === 'release') {
                    location.href = '#/splash';
                  }
                }
              })
              .catch(function (error) {
                sessionStorage.clear();
                var nav = document.getElementsByTagName('nav')[0];
                nav.setAttribute('style', 'display:none');
                location.href = '#/splash';
                console.error(error);
                Utils.showToast('No se encontró el servicio');
              });
          }else{
            sessionStorage.clear();
            var nav = document.getElementsByTagName('nav')[0];
            nav.setAttribute('style','display:none');
            location.href = '#/splash';
          }
        }else{
          Utils.showToast('No se ha configurado un metodo de autenticación');
        }
      })
      .catch(function (response) {
        vm.msError = true;
        vm.msNotify = ' No se encontro el Servicio!!';
        console.error('Error: ' + JSON.stringify(response));
        resetForm(false);
      });
    };

    vm.ValidateCredentials = function () {
      vm.loading = true;
      var key = CryptoJS.enc.Utf8.parse('69B9c7D1e0F0g4H@');
      var iv = CryptoJS.enc.Utf8.parse('@1B2c3D4e5F6g7H8');

      var encryptedpassword;
      encryptedpassword = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(vm.password), key,
        {
          keySize: 128 / 8,
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
      Login.validate({'name':'validarCredenciales'},
        {'43S4301R1731':vm.username, 'P01SS':encryptedpassword.toString()})
        .$promise
        .then(function(data) {
          vm.loading = false;
          if(data.Error !== undefined){
            vm.showChangePassword = data.Error === 'Se requiere cambio de contraseña';
            if(vm.showChangePassword){
              vm.lastPassword = vm.password;
              vm.userToChangePass = vm.username;
              LoginConfiguracion.GetData({
                'name' : 'ParametrosSeguridadLocal'
              }).$promise.then( function(dataSeg){
                vm.SeguridadLocalArray = dataSeg;
              }).catch(function(response){
                vm.msError = true;
                vm.msNotify = ' No se encontro el Servicio!!';
                console.error('Error: ' + JSON.stringify(response));
                resetForm(false);
              });
            }
            Utils.showToast(data.Error);
            vm.username = null;
            vm.password = null;
          }else{
            Utils.showToast(' Bienvenido: ' + data.Nombre + '!!');
            saveInStorage(data);
            resetForm(true);
          }
        })
        .catch(function (error) {
          console.error(error);
          Utils.showToast('No se encontró el servicio');
          vm.loading = false;
          vm.username = null;
          vm.password = null;
        });
    };

    vm.Cancel = function () {
      location.href = '#/login';
    };

    vm.SaveChange = function () {
      if (vm.lastPassword === vm.passwordNew) {
        Utils.showToast('La contraseña ya se ha utilizado anteriormente!');
      }else{
        vm.validatePassword();
        if (vm.passwordIsValid) {
          if (vm.passwordNew !== vm.passwordNewConfirm) {
            Utils.showToast('La contraseña nueva y la confirmación deben ser iguales');
          } else {
            var key = CryptoJS.enc.Utf8.parse('69B9c7D1e0F0g4H@');
            var iv = CryptoJS.enc.Utf8.parse('@1B2c3D4e5F6g7H8');
            var encryptedNewPassword;
            encryptedNewPassword = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(vm.passwordNewConfirm), key, {
              keySize: 128 / 8,
              iv: iv,
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7
            });
            Login.validate({
                'name': 'cambioContrasena'
              }, {
                '43S4301R1731': vm.userToChangePass,
                'P01SS': encryptedNewPassword.toString()
              })
              .$promise
              .then(function (data) {
                if (data.Error === '') {
                  Utils.showToast('El cambio de contraseña fue satisfactorio');
                  location.href = '#/login';
                } else {
                  Utils.showToast(data.Error);
                }
              });
          }
        }
      }
    };

    function resetForm(redirect) {
      setTimeout(function () {
        vm.msError = false;
        vm.msExito = false;
        vm.username = null;
        vm.password = null;
        $scope.$apply();
        if (redirect) {
          $('md-toolbar').removeClass('hiddenToolBar');
          location.href = '#/home';
          location.reload(true);
        }
      }, 1500);
    }

    function saveInStorage(usuario) {
      sessionStorage.clear();
      sessionStorage.setItem('IdUsuario', usuario.IdUsuario);
      sessionStorage.setItem('Clave', usuario.Clave);
      sessionStorage.setItem('Nombre', usuario.Nombre);
      sessionStorage.setItem('TipoUsuario', usuario.TipoUsuario);
      sessionStorage.setItem('Token', usuario.token);
    }

    function closeModals() {
      if ($scope.warning) {
        $scope.warning.close();
        $scope.warning = null;
      }

      if ($scope.timedout) {
        $scope.timedout.close();
        $scope.timedout = null;
      }
    }

    $scope.$on('IdleStart', function() {
      closeModals();
      $scope.warning = $uibModal.open({
        templateUrl: 'warning-dialog.html',
        windowClass: 'modal-danger'
      });
    });

    $scope.$on('IdleEnd', function() {
      closeModals();
    });

    $scope.$on('IdleTimeout', function() {
      closeModals();
      location.href = '#/login';
    });

    function start() {
      closeModals();
      Idle.watch();
      $scope.started = true;
    }

    vm.SentToLoginOAuth = function() {
      setTimeout(function () { location.href = "#/loginOAuth"; }, 3000);
    };

    document.onkeydown = function(){
      if(window.event && window.event.keyCode == 116){
        document.getElementById('toolbar').className = 'hiddenToolBar';
        document.getElementById('accessList').className = 'hiddenToolBar';

        setTimeout(function () {
          document.getElementById('toolbar').remove();
          document.getElementById('accessList').remove();
          }, 500);
      };
    };

    window.onload = function () {
      if (document.getElementById('toolbar') !== null){
        document.getElementById('toolbar').className = 'hiddenToolBar';
        document.getElementById('toolbar').remove();
      }
      if (document.getElementById('accessList') !== null){
        document.getElementById('accessList').className = 'hiddenToolBar';
        document.getElementById('accessList').remove();
      }
    };

    //Validar conformacion de Password
    vm.validatePassword = function () {
      vm.passwordIsValid = false;
      var pswd = vm.passwordNew;
      vm.passwordIsValid = ValidatePasswordLength(pswd) && ValidateAllowedCharacters(pswd) && ValidateCapitalCaseCharacters(pswd) && ValidateMinimumLowerCaseCharacters(pswd) &&
        ValidateMinimumNumericCharacters(pswd) && ValidateMinimumSpecialCharacters(pswd) && ValidateHasMiddleCapitalChars(pswd) && ValidateHasMiddleLowerChars(pswd) &&
        ValidateHasMiddleNumericChars(pswd) &&ValidateHasMiddleSpecialChars(pswd);
    };

    function ValidatePasswordLength(pswd) {
      var minLength = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'CaracteresMin') {
          return item;
        }
      });

      var maxLength = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'CaracteresMax') {
          return item;
        }
      });
      var lenghtValid = pswd.length >= minLength[0].Valor && pswd.length <= maxLength[0].Valor;
      if (lenghtValid === false){
        Utils.showToast('La contraseña debe tener de ' + minLength[0].Valor + ' a ' + maxLength[0].Valor + ' caracteres');
      }
      return lenghtValid;
    };

    function ValidateAllowedCharacters(pswd) {
      var allowedCharacters = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'CaracteresPermitidos') {
          return item;
        }
      });

      if (allowedCharacters[0].Valor === '1') {//Permite mayúsculas y minúsculas No valida nada
        return true;
      } 
      else if (allowedCharacters[0].Valor === '2') //Permite solo mayúsculas
      { 
        var regex = new RegExp('[a-z]');
        var hasLowerCaseChars = regex.test(pswd);
        if (hasLowerCaseChars) {
          Utils.showToast('La contraseña debe contener solo mayúsculas');
          return false;
        }
      } 
      else if (allowedCharacters[0].Valor === '3') //Permite solo minúsculas
      { 
        var regex = new RegExp('[A-Z]');
        var hasCapitalChars = regex.test(pswd);
        if (hasCapitalChars) {
          Utils.showToast('La contraseña debe contener solo minúsculas');
          return false;
        }
      }
      return true;
    };

    function ValidateCapitalCaseCharacters(pswd) {
      var minCapitalChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'NumMinMayusculas') {
          return item;
        }
      });
      var capitalCase = GetNumberOfMatches(pswd, '[A-Z]') >= parseInt(minCapitalChars[0].Valor);
      if(capitalCase === false){
        var plural = minCapitalChars[0].Valor > 1 ? 's' : '';
        Utils.showToast('La contraseña dede contener mínimo ' + minCapitalChars[0].Valor + ' mayúscula' + plural);
      }
      return capitalCase;
    };

    function ValidateMinimumLowerCaseCharacters(pswd) {
      var minLowerChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'NumMinMinusculas') {
          return item;
        }
      });
      var lowerCase = GetNumberOfMatches(pswd, '[a-z]') >= parseInt(minLowerChars[0].Valor);
      if(lowerCase === false){
        var plural = minLowerChars[0].Valor > 1 ? 's' : '';
        Utils.showToast('La contraseña dede contener mínimo ' + minLowerChars[0].Valor + ' minúscula' + plural);
      }
      return lowerCase;
    };

    function ValidateMinimumNumericCharacters(pswd) {
      var numMinNumericChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'NumMinCaracteresNum') {
          return item;
        }
      });
      var numericChars = GetNumberOfMatches(pswd, '[0-9]') >= parseInt(numMinNumericChars[0].Valor);
      if (numericChars === false){
        var plural = numMinNumericChars[0].Valor > 1 ? 's' : '';
        Utils.showToast('La contraseña debe contener mínimo ' + numMinNumericChars[0].Valor + ' número' + plural);
      }
      return numericChars;
    };

    function ValidateMinimumSpecialCharacters(pswd) {
      var numMinSpecialChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'NumMinCaracteresEspeciales') {
          return item;
        }
      });
      var specialChars = GetNumberOfMatches(pswd, '[^a-zA-Z0-9]') >= parseInt(numMinSpecialChars[0].Valor);
      if (specialChars === false){
        var plural = numMinSpecialChars[0].Valor > 1 ? 'es' : '';
        Utils.showToast('La contraseña debe contener mínimo ' + numMinSpecialChars[0].Valor + ' caracter' + plural + ' especial' + plural);
      }
      return specialChars;
    };

    function GetNumberOfMatches(strPassword, regexString) {
      var pswdArray = strPassword.split('');
      var countMatches = 0;
      var regex = new RegExp(regexString);

      pswdArray.forEach(function (c) {
        if (regex.test(c)) {
          countMatches++;
        };
      });
      return countMatches;
    };

    function ValidateHasMiddleCapitalChars(pswd) {
      var numMinSpecialChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'RequiereMayusIntermedias') {
          return item;
        }
      });

      if (numMinSpecialChars[0].Valor === 'true') {
        var middleChars = checkMiddleChars(pswd, '[A-Z]');
        if(middleChars === false){
          Utils.showToast('La contraseña debe contener mayúsculas intermedias');
        }
        return middleChars;
      }
      return true;
    };

    function ValidateHasMiddleLowerChars(pswd) {
      var numMinSpecialChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'RequiereMinusIntermedias') {
          return item;
        }
      });

      if (numMinSpecialChars[0].Valor === 'true') {
        var middleChars = checkMiddleChars(pswd, '[a-z]');
        if (middleChars === false){
          Utils.showToast('La contraseña debe contener minúsculas intermedias');
        } 
        return middleChars;
      }
      return true;
    };

    function ValidateHasMiddleNumericChars(pswd){
      var validateMiddleNumbers = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'RequiereNumIntermedios') {
          return item;
        }
      });

      if (validateMiddleNumbers[0].Valor === 'true') {
        var middleNumbers = checkMiddleChars(pswd, '[0-9]');
        if (middleNumbers === false) {
          Utils.showToast('La contraseña debe contener números intermedios');
        }
        return middleNumbers;
      }
      return true;
    };  

    function ValidateHasMiddleSpecialChars(pswd) {
      var numMinSpecialChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'RequiereCaracteresEspeciales') {
          return item;
        }
      });

      if (numMinSpecialChars[0].Valor === 'true') {
        var specialChars = checkMiddleChars(pswd, '[^a-zA-Z0-9]');
        if (specialChars === false){
          Utils.showToast('La contraseña debe contener caracteres especiales intermedios');
        }
        return specialChars;
      }
      return true;
    };

    function checkMiddleChars(strToCheck, regexString) {
      var pswdArray = strToCheck.split('');
      var regex = new RegExp(regexString);
      var minLength = 3;

      if (pswdArray.length >= minLength) {
        var firstMiddlePosition = 1;
        var lastPosition = pswdArray.length - 1;
        for (var i = firstMiddlePosition; i < lastPosition; i++) {
          if (regex.test(pswdArray[i])) {
            return true;
          }
        }
        return false;
      }
      return false;
    };

    vm.showContrasena = function() {
      var input1 = document.getElementById('passwordNew');
      var input2 = document.getElementById('passwordNewConfirm');

      if (input1.type && input2.type === 'password') {
        input1.type = 'text';
        input2.type = 'text';
      } else {
        input1.type = 'password';
        input2.type = 'password';
      }
    };

    vm.setDominio = function(){
      LoginConfiguracion.GetData({
        'name': 'Dominio'
      }).$promise.then(function (data) {
        vm.dominio = data.filter(function (item) {
          if (item.Nombre === 'Dominio') {
            return item;
          }
        })[0].Valor;
      });
    }
  }
}());
