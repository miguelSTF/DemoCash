/*jshint latedef: nofunc */

(function () {
  'use strict';

  angular.module('appCash')
    .directive('capitalize', capitalize);

  /* @ngInject */
  function capitalize() {
    return {
      require: 'ngModel',
      link: function (scope, element, attrs, modelCtrl) {
        var capitalize = function (inputValue) {
          if (inputValue === undefined) {
            inputValue = '';
          }
          var capitalized = inputValue.toUpperCase();
          var selection = element[0].selectionStart;
          if (capitalized !== inputValue) {
            modelCtrl.$setViewValue(capitalized);
            modelCtrl.$render();
            element[0].selectionStart = selection;
            element[0].selectionEnd = selection;
          }
          return capitalized;
        };
        modelCtrl.$parsers.push(capitalize);
        capitalize(scope[attrs.ngModel]);  // capitalize initial value
      }
    };
  }
}());
