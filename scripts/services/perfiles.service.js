(function () {
  'use strict';

  angular.module('appCash')
    .factory('Perfiles', Perfiles);

  /* @ngInject */
  function Perfiles($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id',
      {id: '@id', name: '@name'}, {
        query : {
          method : 'GET',
          isArray : true,
          headers: {'Token': tkn}
        }
      });
  }
}());
