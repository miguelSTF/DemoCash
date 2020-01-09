(function () {
    'use strict';
  
    angular.module('appCash')
      .factory('Plaza', Plaza);
  
    /* @ngInject */
    function Plaza($resource, UrlBuilder, catalogosConfig) {
      var url = UrlBuilder.build(catalogosConfig);
      var tkn = sessionStorage.getItem('Token');
      return $resource(
        url + '/:name/:id',
        {id: '@id', name: '@name'},{
          query : {
            method:'GET', 
            isArray:true,
            headers: {'Token': tkn}
          },
          save : {
            method:'POST', 
            headers: {'Token': tkn}
          },
          delete : {
            method:'DELETE', 
            isArray:true,
            headers: {'Token': tkn}
          }
        });
    }
  }());