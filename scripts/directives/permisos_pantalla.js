(function () {
  'use strict';

  angular.module('appCash')
    .directive('permisopantalla', permisopantalla);

  /* @ngInject */
  function permisopantalla() {
    return {
      restrict: 'A',
      link: function ($scope, element, attr) {
        attr.$observe('permisopantalla', function () {
          var permiso = Number(attr.permiso);
          var idPantalla = Number(attr.idpantalla);
          var permisos = [];
          JSON.parse(sessionStorage.getItem('Menu')).forEach(function(item){
            item.SubMenus.forEach(function(sub){
              if(sub.IdPermiso === idPantalla)
              {
                permisos = sub.Permiso;
              }
            });
          });
          var indexOf = permisos.indexOf(permiso);
          if(indexOf >= 0){
            element.css('display', 'inline');
          }else{
            element.css('display', 'none');
          }
        });
      }
    };
  }
}());
