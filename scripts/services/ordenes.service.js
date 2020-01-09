/*jshint latedef: nofunc */
(function () {
  'use strict';

  angular.module('appCash')
    .factory('Ordenes', Ordenes);

  /* @ngInject */
  function Ordenes($resource, UrlBuilder, ordenesPagoConfig) {
    var url = UrlBuilder.build(ordenesPagoConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id',
      {id: '@id', name: '@name'},
      {
      get: {
        method: 'GET',
        isArray: false,
        headers: {'Token': tkn}
      },
      send: {
        method: 'POST',
        isArray: true,
        headers: {'Token': tkn}
      },
      query:{
        method:'GET',
        isArray:true,
        headers: {'Token': tkn}
      },
      save : {
        method:'POST',
        headers : {'Token' : tkn} 
      }
    });
  }
  }());

  (function () {
    'use strict';

  angular.module('appCash')
    .factory('OrdenesAut', OrdenesAut);

  function OrdenesAut($resource, UrlBuilder, ordenesPagoConfig) {
    var url = UrlBuilder.build(ordenesPagoConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name',
      {name: '@name'},
       {
        send: {
         method: 'POST',
         isArray: true,
         headers: {'Token': tkn}
      },
    });


  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('Recepcion', Recepcion);

  /* @ngInject */
  function Recepcion($resource, UrlBuilder, apiConfig) {
    var url = UrlBuilder.build(apiConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url + '/delete/message',null, {
      delete: {
        method: 'POST',
        isArray: true,
        headers: {'Token': tkn}
      }
    });
  }
}());

  (function () {
    'use strict';

  angular.module('appCash')
    .factory('OrdenesConfir', OrdenesConfir);

  function OrdenesConfir($resource, UrlBuilder, ordenesPagoConfig) {
    var url = UrlBuilder.build(ordenesPagoConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name',
      {name: '@name'},
       {
        send: {
         method: 'POST',
         isArray: true,
         headers: {'Token': tkn}
      }
    });
  }
}());
