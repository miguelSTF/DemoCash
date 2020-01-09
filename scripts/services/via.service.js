(function () {
  'use strict';

  angular.module('appCash')
    .factory('ViaLiquidacion', ViaLiquidacion);

  /* @ngInject */
  function ViaLiquidacion($resource, UrlBuilder, catalogosConfig) {
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
        }
      });
  }
}());


(function () {
  'use strict';
  angular.module('appCash')
    .factory('ViasUtils', ViasUtils);

  /* @ngInject */
  function ViasUtils(ViaLiquidacion) {

    function validaCve(clave) {
      if (clave.length > 2) {
        return ViaLiquidacion.query({'name': 'ViaLiquidacion', 'Clave': clave}).$promise;
      }
    }

    var service = {
      validaCve: validaCve
    };
    return service;
  }

}());
