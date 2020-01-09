/*jshint latedef: nofunc */
(function () {
  'use strict';

  angular.module('appCash')
    .factory('Sender', Sender);

  /* @ngInject */
  function Sender($resource, UrlBuilder, senderConfig) {
    var url1 = UrlBuilder.build(senderConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url1, null,
      {
        send: {
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
    .factory('SenderBit', SenderBit);

  /* @ngInject */
  function SenderBit($resource, UrlBuilder, senderConfig) {
    var url = UrlBuilder.build(senderConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        save : {
          method: 'POST',
          headers: {'Token': tkn}
        }
      });
  }
}());
