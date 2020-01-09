/*jshint latedef: nofunc */
(function() {
    'use strict';

    angular.module('appCash')
        .directive('jsonViewer', jsonViewer);

    /* @ngInject */
    function jsonViewer() {
        return {
            restrict: 'E',
            link: function(scope, element, attrs) {
                var data = JSON.parse(attrs.data);
                var html = '';
                for (var key in data) {
                    if (data[key] instanceof Array) {
                        html = getDataOfArray(data[key],key);
                        element.append(html);
                    }
                    else if (data[key] instanceof Object) {
                      html = getDataOfObject(data[key]);
                      element.append(html);
                  }
                    else {
                        if(key === 'Iva' && data[key] <= 0){
                            continue;
                        }
                        if(data[key] === null || data[key] === 'NULL'){
                            data[key] = '';
                        }
                        html =
                          '<div layout="row" class="layout-row flex">' +
                              '<div flex="20" >' +
                                '<strong>' + key + '</strong>' +
                              '</div>' +
                              '<div flex="10" class="layout-row flex" style="width:100px;"></div>' +
                                '<div flex="20" class="layout-row" style="text-align:right;">' +
                                '<p">' + data[key] + '</p>' +
                              '</div>' +
                            '</div>';
                        element.append(html);
                    }
                }
            }
        };
    }

    function getDataOfArray(array,key) {
        var html = '';
        for (var object in array) {
            if (array[object].toString() === '[object Object]') {
                for (var prop in array[object]) {
                    if(prop === 'Iva' && array[object][prop] <= 0){
                        continue;
                    }
                    if(array[object][prop] === null || array[object][prop] === 'NULL'){
                        rray[object][prop] = '';
                    }
                    html = html + '<div layout="row" class="layout-row flex">' +
                            '<div flex="20" >' +
                              '<strong>' + prop + '</strong>' +
                            '</div>' +
                            '<div flex="10" class="layout-row flex" style="width:100px;"></div>' +
                              '<div flex="20" class="layout-row" style="text-align:right;">' +
                              '<p">' + array[object][prop] + '</p>' +
                            '</div>' +
                          '</div>';
                }
            }
            else {
                if(prop === 'Iva' && object[prop] <= 0){
                    continue;
                }
                if(array[object] === null || array[object] === 'NULL'){
                    array[object] = ''; 
                }
                    html ='<div layout="row" class="layout-row flex">' +
                           '<div flex="20" >' +
                             '<strong>' + key + '</strong>' +
                           '</div>' +
                           '<div flex="10" class="layout-row flex" style="width:100px;"></div>' +
                             '<div flex="20" class="layout-row" style="text-align:right;">' +
                             '<p>' +  array[object] + '</p>' +
                           '</div>' +
                         '</div>';
                }
        }
        return html;
    }

    function getDataOfObject(object) {
        var html = '';
        for (var prop in object) {
            if(prop === 'Iva' && object[prop] <= 0){
                continue;
            }
            if(object[prop] === null || object[prop] === 'NULL'){
                object[prop] = '';
            }
            html = html +     '<div layout="row" class="layout-row flex">' +
                    '<div flex="20" >' +
                      '<strong>' + prop + '</strong>' +
                    '</div>' +
                    '<div flex="10" class="layout-row flex" style="width:100px;"></div>' +
                      '<div flex="20" class="layout-row" style="text-align:right;">' +
                      '<p>' + object[prop] + '</p>' +
                    '</div>' +
                  '</div>';
        }
        return html;
    }

}());
