(function () {
  'use strict';
  angular.module('appCash')
    .directive('loadingModal', LoadingModal);

  /* @ngInject */
  function LoadingModal() {
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: './views/templates/cargando.html',
      link: function (scope, element, attr) {
        scope.$watch(attr.loadshow, function (newVal) {
          if (newVal === true) {
            element.addClass('show');
            return;
          }
          element.removeClass('show');
        });
      }
    };
  }
}());
