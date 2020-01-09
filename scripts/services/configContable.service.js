/*jshint latedef: nofunc */
/*jshint loopfunc: true */
(function () {
  'use strict';
  angular.module('appCash')
    .factory('configContable', configContable);

  /* @ngInject */
  function configContable($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        getList: {
          method: 'GET',
          isArray: true,
          headers : {'Token' : tkn}
        }
      });
  }
}());