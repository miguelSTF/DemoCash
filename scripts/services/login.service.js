/*jshint latedef: nofunc */
(function () {
  'use strict';

  angular.module('appCash')
    .factory('Login', Login);

  /* @ngInject */
  function Login($resource, UrlBuilder, autenticacionConfig) {
    var url = UrlBuilder.build(autenticacionConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/', {
        name: '@name'
      }, {
        validate: {
          method: 'POST',
          isArray: false,
          headers: {'Token': tkn}
        }
      });
  }
}());


(function(){
  'use strict';

  angular.module('appCash')
  .factory('LoginConfiguracion', LoginConfiguracion);

   /* @ngInject */
   function LoginConfiguracion($resource, UrlBuilder, autenticacionConfig){
     var url = UrlBuilder.build(autenticacionConfig);
     var tkn = sessionStorage.getItem('Token');
     return $resource(
       url + '/:name/', 
       { name: '@name' }, {
         GetData: {
           method: 'GET',
           isArray: true,
           headers: {'Token': tkn}
         }
       });
   }
}());