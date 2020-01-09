/*jshint latedef: nofunc */
(function () {
  'use strict';
  angular.module('appCash')
    .factory('CatalogosCli', CatalogosCli);

  /* @ngInject */
  function CatalogosCli($resource, UrlBuilder, clientesServiceConfig) {
    var url = UrlBuilder.build(clientesServiceConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url + '/:prefix/:name/:id', {
      prefix: '@prefix',
      name: '@name',
      id: '@id'
    }, {
      'query' : {
        method: 'GET',
        isArray: true,
        headers : {'Token' : tkn}
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
    .factory('CatalogosRelacion', CatalogosRelacion);

  /* @ngInject */
  function CatalogosRelacion($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url + '/relacion/:name/:id/:relation', {
      name: '@name',
      id: '@id',
      relation: '@relation'
    }, {
      send: {
        method: 'POST',
        isArray: true,
        headers : {'Token' : tkn}
      },
      delete : {
        method:'DELETE',
        headers : {'Token' : tkn}
      }
    });
  }
}());
(function () {
  'use strict';
  angular.module('appCash')
    .factory('CatalogosContraparte', CatalogosContraparte);

  function CatalogosContraparte($resource, UrlBuilder, clientesServiceConfig) {
    var url = UrlBuilder.build(clientesServiceConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/contrapartes/:idConcepto/:emite', {
        idConcepto: '@idConcepto',
        emite: '@emite'
      }, {
        query: {
          method: 'GET',
          isArray: true,
          headers : {'Token' : tkn}
        },
      });
  }
}());
(function () {
  'use strict';
  angular.module('appCash')
    .factory('Contraparte', Contraparte);

  function Contraparte($resource, UrlBuilder, clientesServiceConfig) {
    var url = UrlBuilder.build(clientesServiceConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/infoContrapartes', {
        idConcepto: '@idConcepto'
      }, {
        query: {
          method: 'GET',
          isArray: true,
          headers : {'Token' : tkn}
        }
      });
  }
}());
