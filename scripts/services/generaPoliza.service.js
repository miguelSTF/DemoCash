(function () {
  'use strict';
  angular.module('appCash')
    .factory('generaPoliza', generaPoliza);

  /* @ngInject */
  function generaPoliza($resource, UrlBuilder, contabilidadConfig) {
    var url = UrlBuilder.build(contabilidadConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource( url + '/:entry/', {entry: '@entry', name: '@name'},
      {
        query : {
          method : 'GET',
          isArray : true,
          headers : {'Token' : tkn}
        },
        send: {
          method: 'POST',
          isArray: true,
          headers : {'Token' : tkn}
        },
         sendExp: {
          method: 'POST',
          isArray: false,
          headers : {'Token' : tkn}
        },
        save : {
          method:'POST',
          headers : {'Token' : tkn} 
        }
    });
  }
}());