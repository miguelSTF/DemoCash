(function () {
  'use strict';

  angular.module('appCash')
    .factory('GrupoCuentas', GrupoCuentas);

  /* @ngInject */
  function GrupoCuentas($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id',
      {id: '@id', name: '@name'},
      {
      query : {
        method : 'GET',
        isArray : true,
        headers: {'Token': tkn}
      },
      delete: {
        method: 'DELETE',
        headers: {'Token': tkn}
      }
    });
  }
}());

(function () {
  'use strict';

  angular.module('appCash')
    .factory('GrupoCuentasP', GrupoCuentasP);

  /* @ngInject */
  function GrupoCuentasP($resource, UrlBuilder, catalogosConfig) {
    var url1 = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url1 + '/relaciones/GrupoCuentas/', null,
      {
        send: {
          method: 'POST', 
          isArray: true,
          headers: {'Token': tkn}
        }
      });
  }

}());
