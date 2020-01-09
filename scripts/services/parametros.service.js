(function () {
  'use strict';

  angular.module('appCash')
    .factory('Parametros', Parametros);

  /* @ngInject */
  function Parametros($resource, UrlBuilder, catalogosConfig) {
    var tkn = sessionStorage.getItem('Token');
    var url = UrlBuilder.build(catalogosConfig);
    return $resource(
      url + '/:name/:id',
      {id: '@id', name: '@name'},
      {
      send: {
        method: 'POST',
        isArray: true,
        headers: {'Token': tkn}
      },
      query:{
        method:'GET',
        isArray:true,
        headers: {'Token': tkn}
      }
    });
  }
}());
