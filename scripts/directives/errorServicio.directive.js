/*jshint latedef: nofunc */
(function () {
  'use strict';

  angular.module('appCash')
    .directive('error', ErrorDirective);

  /* @ngInject */
  function ErrorDirective() {
    return {
      restrict: 'EA',
      transclude: true,
      templateUrl: './views/sections/errorServicio.html'
    };
  }
}());
