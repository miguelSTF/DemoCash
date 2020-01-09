(function() {
    'use strict';
    angular.module('appCash')
    .factory('BitacoraEdoCuenta', BitacoraEdoCuenta);

    function BitacoraEdoCuenta($resource, UrlBuilder, logConfig) {
    var url = UrlBuilder.build(logConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url + '/entry/' + '/:name/:id', {name:'@name',id: '@id'},{
        query : {
            method:'GET', 
            isArray:true,
            headers : {'Token' : tkn}
        }
    });
  }
}());


