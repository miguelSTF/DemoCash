/*jshint latedef: nofunc */

(function () {
  'use strict';

  angular.module('appCash')
    .directive('ngCurrency', ngCurrency);

  /* @ngInject */
  function ngCurrency($filter, $locale) {
    return {
      require: 'ngModel',
      scope: {
        min: '=?min',
        max: '=?max',
        currencySymbol: '@',
        ngRequired: '=?ngRequired',
        fraction: '=?fraction'
      },
      link: function (scope, element, attrs, ngModel) {
        if (attrs.ngCurrency === 'false') {
          return;
        }

        scope.fraction = (typeof scope.fraction !== 'undefined') ? scope.fraction : 2;

        function decimalRex(dChar) {
          return new RegExp('\\d|\\-|\\' + dChar, 'g');
        }

        function clearRex(dChar) {
          return new RegExp('\\-{0,1}((\\' + dChar + ')|([0-9]{1,}\\' + dChar + '?))&?[0-9]{0,' + scope.fraction + '}', 'g');
        }

        function clearValue(value) {
          value = String(value);
          var dSeparator = $locale.NUMBER_FORMATS.DECIMAL_SEP;
          var cleared = null;

          if (value.indexOf($locale.NUMBER_FORMATS.DECIMAL_SEP) === -1 &&
            value.indexOf('.') !== -1 &&
            scope.fraction) {
            dSeparator = '.';
          }

          // Replace negative pattern to minus sign (-)
          var negDummy = $filter('currency')('-1', getCurrencySymbol(), scope.fraction);
          var negRegExp = new RegExp('[0-9.' + $locale.NUMBER_FORMATS.DECIMAL_SEP + $locale.NUMBER_FORMATS.GROUP_SEP + ']+');
          var negDummyTxt = negDummy.replace(negRegExp.exec(negDummy), '');
          var valueDummyTxt = value.replace(negRegExp.exec(value), '');

          // If is negative
          if (negDummyTxt === valueDummyTxt) {
            value = '-' + negRegExp.exec(value);
          }

          if ((new RegExp('^-[\\s]*$', 'g')).test(value)) {
            value = '-0';
          }

          if (decimalRex(dSeparator).test(value)) {
            cleared = value.match(decimalRex(dSeparator))
              .join('').match(clearRex(dSeparator));
            cleared = cleared ? cleared[0].replace(dSeparator, '.') : null;
          }
          return cleared;
        }

        function validaMonto(cantidad) {
          var monto = cantidad;
          if (monto !== 'M' || monto !== 'm') {
            cantidad = monto.replace('M', '000');
            cantidad = cantidad.replace('m', '000');
          } else {
            cantidad = null;
          }
          return cantidad;
        }

        function getCurrencySymbol() {
          if (angular.isDefined(scope.currencySymbol)) {
            return scope.currencySymbol;
          } else {
            return $locale.NUMBER_FORMATS.CURRENCY_SYM;
          }
        }

        function reformatViewValue() {
          var formatters = ngModel.$formatters,
            idx = formatters.length;

          var viewValue = ngModel.$$rawModelValue;
          while (idx--) {
            viewValue = formatters[idx](viewValue);
          }

          ngModel.$setViewValue(viewValue);
          ngModel.$render();
        }

        ngModel.$parsers.push(function (viewValue) {
          var cVal = clearValue(viewValue);
          //return parseFloat(cVal);
          // Check for fast digitation (-. or .)
          if (cVal === '.' || cVal === '-.') {
            cVal = '.0';
          }
          return parseFloat(cVal);
        });

        element.on('blur', function () {
          ngModel.$commitViewValue();
          reformatViewValue();
        });

        element.on('keyup', function () {
          var monto = validaMonto(ngModel.$viewValue);
          ngModel.$setViewValue(monto);
          ngModel.$render();
        });

        ngModel.$formatters.unshift(function (value) {
          return $filter('currency')(value, '', scope.fraction);
        });

        ngModel.$validators.min = function (cVal) {
          if (!scope.ngRequired && isNaN(cVal)) {
            return true;
          }
          if (typeof scope.min !== 'undefined') {
            return cVal >= parseFloat(scope.min);
          }
          return true;
        };

        scope.$watch('min', function () {
          ngModel.$validate();
        });

        ngModel.$validators.max = function (cVal) {
          if (!scope.ngRequired && isNaN(cVal)) {
            return true;
          }
          if (typeof scope.max !== 'undefined') {
            return cVal <= parseFloat(scope.max);
          }
          return true;
        };

        scope.$watch('max', function () {
          ngModel.$validate();
        });


        ngModel.$validators.fraction = function (cVal) {
          return !(!!cVal && isNaN(cVal));
        };

        scope.$on('currencyRedraw', function () {
          ngModel.$commitViewValue();
          reformatViewValue();
        });

        element.on('focus', function () {
          var viewValue = ngModel.$$rawModelValue;

          if (isNaN(viewValue) || viewValue === '' || viewValue === null) {
            viewValue = '';
          } else {
            viewValue = parseFloat(viewValue).toFixed(scope.fraction);
          }
          ngModel.$setViewValue(viewValue);
          ngModel.$render();
        });
      }
    };
  }
}());
