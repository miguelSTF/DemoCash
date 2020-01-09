/*jshint latedef: nofunc */

(function () {
  'use strict';

  angular.module('appCash')
    .directive('sidebar', sidebar);

  /* @ngInject */
  function sidebar() {
    return {
      link: function (scope, element, attr) {
        scope.$watch(attr.sidebar, function (newVal) {
          if (newVal) {
            element.addClass('show');
            return;
          }
          element.removeClass('show');
        });
      }
    };
  }
}());
