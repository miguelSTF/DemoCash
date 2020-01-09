(function () {
  'use strict';

  angular.module('appCash')
    .directive('format', format);

  /* @ngInject */
  function format() {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {

        attr.$observe('format', function () {
          var d = attr.format;

          if (attr.tipo === 'Moneda' || attr.tipo === 'Numerico') {
            element.css('text-align', 'right');
            element.text(new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(d));
          } else if (attr.tipo === 'Hora' || attr.tipo === 'Fecha') {
            element.css('text-align', 'center');
            if (attr.tipo === 'Hora') {
              d = new Date('2016/01/01 ' + d);
              element.text(d.toTimeString().split(' ')[0]);
            } else if (attr.tipo === 'Fecha') {
              d = new Date(d);
              element.text(d.toLocaleString('en-US', {
                year:  'numeric',
                month: '2-digit',
                day:   '2-digit'
              }).replace(/(\d+)\/(\d+)\/(\d+)/, '$2/$1/$3'));
            }
          } else if (attr.tipo === 'Tasa') {
            console.log(attr.format);
            element.css('text-align', 'center');
            element.text(new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 5,
              maximumFractionDigits: 5
            }).format(d));
          } else if (attr.tipo === 'FechaCompleta') {
            element.css('text-align', 'center');
            d = new Date(d);
            var dDate = d.toLocaleString('en-US', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }).replace(/(\d+)\/(\d+)\/(\d+)/, '$2/$1/$3');
            var dHour = d.toTimeString().split(' ')[0];
            element.text(dDate + ' ' + dHour);
          }
          else if (attr.tipo === 'Number') {
            element.css('text-align', 'right');
            element.text(new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(d));
          }
          if (attr.isdetail === 'true') {
            element.css('text-align', 'center');
          }
        });
      }
    };
  }
}());
