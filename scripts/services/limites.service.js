(function () {
  'use strict';

  angular.module('appCash')
    .factory('LimitesService', LimitesService);

  /* @ngInject */
  function LimitesService($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id',
      {id: '@id', name: '@name'},
      {
        save : {
          method : 'POST',
          headers: {'Token': tkn}          
        },
        query : {
          method : 'GET',
          isArray : true,
          headers: {'Token': tkn}
        }
      }
    );
  }
}());
