/*jshint latedef: nofunc */

(function () {
  'use strict';

  angular.module('appCash')
    .factory('ValidateSession', ValidateSession);

  /* @ngInject */
  function ValidateSession(environment) {
    function validate(idPermiso) {
      var claveUser = sessionStorage.getItem('Clave');
      var menuUser = sessionStorage.getItem('Menu');
      var existPermiso = false;

      if (claveUser !== null && menuUser !== null) {
        JSON.parse(sessionStorage.getItem('Menu')).forEach(function(item){
          item.SubMenus.forEach(function(sub){
            if(sub.IdPermiso === idPermiso)
            {
              existPermiso = true;
            }
          });
        });
      }
      return existPermiso;
    }

    var service = {
      validate: validate
    };

    return service;
  }
}());
