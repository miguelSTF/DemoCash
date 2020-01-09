(function() {
    'use strict';

  angular.module('appCash')
        .factory('CuentaCorriente', CuentaCorriente);

  function CuentaCorriente($resource, UrlBuilder, consultasConfig) {
    var url = UrlBuilder.build(consultasConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
        url + '/:name/:idCuentaCorriente', {
          name: '@name',
          idCuentaCorriente :'@idCuentaCorriente'
        }, {
          getList: {
            method: 'GET',
            isArray: false,
            headers: {'Token': tkn}
          },
          getCta: {
            method: 'GET',
            isArray: true,
            headers: {'Token': tkn}
          },
          save: {
            method: 'POST',
            isArray: false,
            headers: {'Token': tkn}
          }
        });
  }  
}());
