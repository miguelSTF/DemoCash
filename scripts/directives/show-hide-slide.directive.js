(function () {
  'use strict';
  angular.module('appCash')
    .directive('showHideSlide', ShowHideSlide);

  /* @ngInject */
  function ShowHideSlide() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        scope.$watch(attrs.showHideSlide, function (newVal) {
          if (newVal) {
            element.css('visibility', 'visible');
            return;
          }
          element.css('visibility', 'collapse');
        });
      }
    };
  }
}());
