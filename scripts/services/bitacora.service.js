/*jshint latedef: nofunc */
/**
 * Bitacora Factory
 * @namespace Factories
 */
(function() {
  'use strict';

  angular.module('appCash')
    .factory('Bitacora', Bitacora);

  /**
   * @namespace Bitacora
   * @desc Registra en el servicio de bitacora
   * @memberOf Factories
   */
  /* @ngInject */
  function Bitacora($resource, UrlBuilder, logConfig) {
    var tkn = sessionStorage.getItem('Token');
    var url = UrlBuilder.build(logConfig);
    return $resource(url + '/entry/:id', {id: '@id'},{
        getList: {
            method: 'GET',
            isArray: false,
            headers : {'Token' : tkn}
        },
        send: {
            method: 'POST',
            isArray: true,
            headers : {'Token' : tkn}
        },
        query: {
          method: 'GET',
          isArray: true,
          headers : {'Token' : tkn}
        }
    });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('BitacoraLog', BitacoraLog);

  /* @ngInject */
  function BitacoraLog($resource, UrlBuilder, logConfig) {
    var tkn = sessionStorage.getItem('Token');
    var url = UrlBuilder.build(logConfig);
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        save : {
          method: 'POST',
          headers : {'Token' : tkn}
        }
      });
  }
}());
