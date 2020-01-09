/*jshint latedef: nofunc */
/*jshint loopfunc: true */
(function () {
  'use strict';
  angular.module('appCash')
    .factory('MonitorExt', MonitorExt);

  /* @ngInject */
  function MonitorExt($resource, UrlBuilder, mensajesExternosConfig) {
    var url = UrlBuilder.build(mensajesExternosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      },{
        query : {
          method : 'GET',
          isArray : true,
          headers: {'Token': tkn} 
        },
        save : {
          method : 'POST',
          headers: {'Token': tkn}
        }
      });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('CancelEdoCta', CancelEdoCta);

  function CancelEdoCta($resource, UrlBuilder, mensajesExternosConfig) {
    var url = UrlBuilder.build(mensajesExternosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name',
      {name: '@name'},
      {
        send: {
          method: 'POST',
          headers: { 'Token': tkn },
          isArray: true
      },
    });
  }
}());
