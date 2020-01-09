(function () {
  'use strict';

  angular.module('appCash')
    .factory('Usuarios', Usuarios);

  /* @ngInject */
  function Usuarios($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id',
      {id: '@id', name: '@name'}, {
        query : {
          method:'GET', 
          isArray:true,
          headers: {'Token': tkn}
        },
        delete : {
          method : 'DELETE',
          headers: {'Token': tkn}
        }
      });
  }
}());


(function () {
  'use strict';

  angular.module('appCash')
    .factory('UsuariosP', UsuariosP);

  /* @ngInject */
  function UsuariosP($resource, UrlBuilder, catalogosConfig) {
    var url1 = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url1 + '/relaciones/UsuarioDepartamento', null,
      {
        send: {method: 'POST', 
        isArray: true,
        headers: {'Token': tkn}
      }
      });
  }

}());
