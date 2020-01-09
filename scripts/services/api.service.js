/*jshint latedef: nofunc */

(function () {
  'use strict';

  angular.module('appCash')
    .factory('Api', Api);

  /* @ngInject */
  function Api($resource, UrlBuilder, apiConfig) {
    var tkn = sessionStorage.getItem('Token');
    var url = UrlBuilder.build(apiConfig);
    return $resource(
      url + '/:name',{
        name: '@name'
      },{
        getList:{
          method: 'POST',
          isArray: true,
          headers: {'Token': tkn}
        },
        save:{
          method: 'POST',
          headers: {'Token': tkn}
        }
      }
    );
  }
}());
