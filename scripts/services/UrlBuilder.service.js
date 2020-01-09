/*jshint latedef: nofunc */

(function () {
  'use strict';

  angular.module('appCash')
    .factory('UrlBuilder', UrlBuilder);

  /* @ngInject */
  function UrlBuilder(environment) {
    function build(catalogosConfig) {
      var c = catalogosConfig;
      var httpStr = environment.httpMode === 2 || environment.httpMode === 3 ? 'https' : 'http';
      var url =  httpStr +'://' + c.host + ':' + c.port;
      url = url.concat((!c.apiPrefix || c.apiPrefix.length === 0 || c.apiPrefix === '') ? '' : ('/' + c.apiPrefix));
      url = url.concat((!c.prefix || c.prefix.length === 0 || c.prefix === '') ? '' : ('/' + c.prefix));
      return url;
    }

    var service = {
      build: build
    };

    return service;
  }
}());
