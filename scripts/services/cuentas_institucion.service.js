(function () {
  'use strict';
    angular.module('appCash')
    .factory('CuentasInstitucion', CuentasInstitucion);

  /* @ngInject */
  function CuentasInstitucion($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id',
      {id: '@id', name: '@name'},
      {
        query : {
          method:'GET',
          isArray : true,
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
    .factory('SaveRelation', SaveRelation);

  /* @ngInject */
  function SaveRelation($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/relacion/CtaCorrienteConceptos/:name/', 
      { name: '@name'},{
        save : {
          method : 'POST',
          headers : {'Token' : tkn}
        }
      }
    );
  }
}());
