/*jshint latedef: nofunc */
(function () {
  'use strict';

  angular.module('appCash')
    .factory('ConciliadorService', ConciliadorService);

  /* @ngInject */
  function ConciliadorService($resource, UrlBuilder, cuentacorrienteConfig) {
    var url = UrlBuilder.build(cuentacorrienteConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:operacion',
      {operacion: '@operacion'},
      {
        send : { 
          method:'POST',
          headers: {'Token': tkn} 
         },
         save : { 
          method:'POST',
          headers: {'Token': tkn} 
         }
      });
  }
}());

/*jshint latedef: nofunc */
(function () {
  'use strict';

  angular.module('appCash')
    .factory('ConciliadorMasProService', ConciliadorMasProService);

  /* @ngInject */
  function ConciliadorMasProService($resource, UrlBuilder, conciliatorConfig) {
    var url = UrlBuilder.build(conciliatorConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:operacion',
      {operacion: '@operacion'},
      {
        send: { 
          method:'POST',
          headers: {'Token': tkn}  
        },
        save: { 
          method:'POST',
          headers: {'Token': tkn}  
        }
      });
  }
}());
