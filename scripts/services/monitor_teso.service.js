(function() {
    'use strict';

    angular.module('appCash')
        .factory('MonitorTeso', MonitorTeso);

    function MonitorTeso($resource, UrlBuilder, consultasConfig) {
        var url = UrlBuilder.build(consultasConfig);
        var tkn = sessionStorage.getItem('Token');
        return $resource(
            url + '/:name', {
                name: '@name'
            }, {
                query : {
                    method: 'GET',
                    isArray : true,
                    headers: {'Token': tkn}
                },
                getList: {
                    method: 'GET',
                    isArray: false,
                    headers: {'Token': tkn}
                },
                getCta: {
                  method: 'GET',
                  isArray: true,
                  headers: {'Token': tkn}
                }
            });
    }
}());
