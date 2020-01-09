(function () {
  'use strict';

  angular.module('appCash')
    .factory('Departamentos', Departamentos);

  /* @ngInject */
  function Departamentos($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        id: '@id',
        name: '@name',
        headers: {'Token': tkn}
      }, 
      {
        send: {
          method: 'POST',
          headers: {'Token': tkn}
        },
        query : {
          method : 'GET',
          isArray : true,
          headers: {'Token': tkn}
        },
        delete : {
          method : 'DELETE',
          headers: {'Token': tkn}
        }
      });
  }
}());
