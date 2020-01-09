/*jshint latedef: nofunc */

(function() {
  'use strict';

  angular.module('appCash')
    .directive('treeGridView', treeGridView);

  treeGridView.$inject = ['$compile'];
  /* @ngInject */
  function treeGridView($compile) {
    return {
      restrict: 'EA',
      link: function(scope, element, attrs) {
        attrs.$observe('content', function(contentValue) {

          if (contentValue === '') {
            return;
          }
          var content = JSON.parse(contentValue);
          element.find('tr').remove();

          var saldoInicial = '<tr>' +
            '<td class="td-MCuentaCorriente"></span></td>' +
            '<td class="font-tree-title">' + content.SaldoInicial.Nombre + '</td>' +
            '<td class="td-MCuentaCorriente" format="{{' + content.SaldoInicial.ImporteProgramado + '}}" tipo="Numerico"></td>' +
            '<td class="td-MCuentaCorriente" format="{{' + content.SaldoInicial.ImporteLiquidado + '}}" tipo="Numerico"></td>' +
            '<td class="td-MCuentaCorriente" format="{{' + content.SaldoInicial.ImportePorLiquidar + '}}" tipo="Numerico"></td>' +
            '</tr>';

          var ingresosGpo = '<tr>' +
          '<td class="td-MCuentaCorriente"></span></td>' +
          '<td class="font-tree-title"> Ingresos </td>' +
          '<td class="font-tree-title" format="{{' + content.TotalIngresos.ImporteProgramado + '}}" tipo="Numerico"></td>' +
          '<td class="font-tree-title" format="{{' + content.TotalIngresos.ImporteLiquidado + '}}" tipo="Numerico"></td>' +
          '<td class="font-tree-title" format="{{' + content.TotalIngresos.ImportePorLiquidar + '}}" tipo="Numerico"></td>' +
          '</tr>';
          ingresosGpo += GenerateTables(content.Ingresos);

          var egresosGpo = '<tr>' +
          '<td class="td-MCuentaCorriente"></span></td>' +
          '<td class="font-tree-title"> Egresos </td>' +
          '<td class="font-tree-title" format="{{' + content.TotalEgresos.ImporteProgramado + '}}" tipo="Numerico"></td>' +
          '<td class="font-tree-title" format="{{' + content.TotalEgresos.ImporteLiquidado + '}}" tipo="Numerico"></td>' +
          '<td class="font-tree-title" format="{{' + content.TotalEgresos.ImportePorLiquidar + '}}" tipo="Numerico"></td>' +
          '</tr>';
          egresosGpo += GenerateTables(content.Egresos);

          var noIdentificadosGpo = '<tr><td></td><td colspan="4" class="font-tree-title">No Idenficados</td></tr>';
          noIdentificadosGpo += GenerateTables(content.NoIdentificados);

          var saldoFinal = '<tr>' +
            '<td class="td-MCuentaCorriente"></td>' +
            '<td class="font-tree-title">' + content.SaldoFinal.Nombre + '</td>' +
            '<td class="td-MCuentaCorriente" format="{{' + content.SaldoFinal.ImporteProgramado + '}}" tipo="Numerico"></td>' +
            '<td class="td-MCuentaCorriente" format="{{' + content.SaldoFinal.ImporteLiquidado + '}}" tipo="Numerico"></td>' +
            '<td class="td-MCuentaCorriente" format="{{' + content.SaldoFinal.ImportePorLiquidar + '}}" tipo="Numerico"></td>' +
            '</tr>';

          var treeGrid = saldoInicial + ingresosGpo + egresosGpo + noIdentificadosGpo + saldoFinal;
          element.append($compile(treeGrid)(scope));

          scope.toggle1 = function(event) {
            var idgpos = 'gpo';
            var idPrevio = 'gpo1';
            var currentElement = angular.element(event.currentTarget);
            currentElement.hasClass('image-tree-rotate') ? currentElement.removeClass('image-tree-rotate') : currentElement.addClass('image-tree-rotate');
            if (!currentElement.hasClass('image-tree-rotate')) {
              var collapseAll = currentElement.parent('td').parent('tr').nextAll();
              collapseAll.toArray().forEach(function(item) {
                if (item.id.indexOf(idgpos) >= 0) {
                  var childElement = angular.element(item);
                  childElement.removeClass('expand');
                  childElement.find('.image-tree-rotate').removeClass('image-tree-rotate');
                }
              });
              return;
            }
            var ulElement = currentElement.parent('td').parent('tr');
            while (1) {
              var nextElement = ulElement.next();
              if (nextElement[0].id.indexOf(idgpos) >= 0) {
                if (nextElement[0].id === idPrevio) {
                  nextElement.hasClass('expand') ? nextElement.removeClass('expand') : nextElement.addClass('expand');
                }
                ulElement = nextElement;
              } else {
                break;
              }
            }
          };

          scope.toggle2 = function(event) {
            var idgpos = 'gpo';
            var idCurrent = 'gpo1';
            var idPrevio = 'gpo2';
            var currentElement = angular.element(event.currentTarget);
            currentElement.hasClass('image-tree-rotate') ? currentElement.removeClass('image-tree-rotate') : currentElement.addClass('image-tree-rotate');
            var ulElement = currentElement.parent('td').parent('tr');
            while (1) {
              var nextElement = ulElement.next();
              if (nextElement[0].id.indexOf(idgpos) >= 0 && nextElement[0].id !== idCurrent) {
                if (nextElement[0].id === idPrevio) {
                  nextElement.hasClass('expand') ? nextElement.removeClass('expand') : nextElement.addClass('expand');
                }
                ulElement = nextElement;
              } else {
                break;
              }
            }
          };

          scope.toggle3 = function(event) {
            var currentElement = angular.element(event.currentTarget);
            currentElement.hasClass('image-tree-rotate') ? currentElement.removeClass('image-tree-rotate') : currentElement.addClass('image-tree-rotate');
            var ulElement = currentElement.parent('td').parent('tr');
            var idPrevio = 'gpo3';
            while (1) {
              var nextElement = ulElement.next();
              if (nextElement[0].id === idPrevio) {
                nextElement.hasClass('expand') ? nextElement.removeClass('expand') : nextElement.addClass('expand');
                ulElement = nextElement;
              } else {
                break;
              }
            }
          };
        });
      }
    };

    function GenerateTables(grupoPadre) {
      var datosGrupo = '';
      grupoPadre.forEach(function(grupo0) {
        datosGrupo += ('<tr>' +
          '<td class="td-MCuentaCorriente"></td>' +
          '<td class="td-tree-level-zero"><span class="glyphicon glyphicon-expand" ng-click="toggle1($event)"></span>' + grupo0.Nombre + '</td>' +
          '<td class="td-MCuentaCorriente font-tree-title" format="{{' + grupo0.ImporteProgramado + '}}" tipo="Numerico"></td>' +
          '<td class="td-MCuentaCorriente font-tree-title" format="{{' + grupo0.ImporteLiquidado + '}}" tipo="Numerico"></td>' +
          '<td class="td-MCuentaCorriente font-tree-title" format="{{' + grupo0.ImportePorLiquidar + '}}" tipo="Numerico"></td>' +
          '</tr>');
        if (grupo0.Detalle !== null && grupo0.Detalle.length > 0) {
          grupo0.Detalle.forEach(function(grupoDet1) {
            datosGrupo += ('<tr id="gpo1" class="show-tree">' +
              '<td class="td-MCuentaCorriente"></td>' +
              '<td class="td-tree-level-two">' + grupoDet1.Nombre + '</td>' +
              '<td class="td-MCuentaCorriente" format="{{' + grupoDet1.ImporteProgramado + '}}" tipo="Numerico"></td>' +
              '<td class="td-MCuentaCorriente" format="{{' + grupoDet1.ImporteLiquidado + '}}" tipo="Numerico"></td>' +
              '<td class="td-MCuentaCorriente" format="{{' + grupoDet1.ImportePorLiquidar + '}}" tipo="Numerico"></td>' +
              '</tr>');
          });
        }
        if (grupo0.GrupoHijo !== null && grupo0.GrupoHijo.length > 0) {
          grupo0.GrupoHijo.forEach(function(grupo1) {
            datosGrupo += ('<tr id="gpo1" class="show-tree">' +
              '<td class="td-MCuentaCorriente"></td>' +
              '<td class="td-tree-level-one"><span class="glyphicon glyphicon-expand" ng-click="toggle2($event)"></span>' + grupo1.Nombre + '</td>' +
              '<td class="td-MCuentaCorriente font-tree-title" format="{{' + grupo1.ImporteProgramado + '}}" tipo="Numerico"></td>' +
              '<td class="td-MCuentaCorriente font-tree-title" format="{{' + grupo1.ImporteLiquidado + '}}" tipo="Numerico"></td>' +
              '<td class="td-MCuentaCorriente font-tree-title" format="{{' + grupo1.ImportePorLiquidar + '}}" tipo="Numerico"></td>' +
              '</tr>');
            if (grupo1.Detalle !== null && grupo1.Detalle.length > 0) {
              grupo1.Detalle.forEach(function(grupoDet1) {
                datosGrupo += ('<tr id="gpo2" class="show-tree">' +
                  '<td class="td-MCuentaCorriente"></td>' +
                  '<td class="td-tree-level-two">' + grupoDet1.Nombre + '</td>' +
                  '<td class="td-MCuentaCorriente" format="{{' + grupoDet1.ImporteProgramado + '}}" tipo="Numerico"></td>' +
                  '<td class="td-MCuentaCorriente" format="{{' + grupoDet1.ImporteLiquidado + '}}" tipo="Numerico"></td>' +
                  '<td class="td-MCuentaCorriente" format="{{' + grupoDet1.ImportePorLiquidar + '}}" tipo="Numerico"></td>' +
                  '</tr>');
              });
            }
            if (grupo1.GrupoHijo !== null && grupo1.GrupoHijo.length > 0) {
              grupo1.GrupoHijo.forEach(function(grupo2) {
                datosGrupo += ('<tr id="gpo2" class="show-tree">' +
                  '<td class="td-MCuentaCorriente"></td>' +
                  '<td class="td-tree-level-two"><span class="glyphicon glyphicon-expand" ng-click="toggle3($event)"></span>' + grupo2.Nombre + '</td>' +
                  '<td class="td-MCuentaCorriente font-tree-title" format="{{' + grupo2.ImporteProgramado + '}}" tipo="Numerico"></td>' +
                  '<td class="td-MCuentaCorriente font-tree-title" format="{{' + grupo2.ImporteLiquidado + '}}" tipo="Numerico"></td>' +
                  '<td class="td-MCuentaCorriente font-tree-title" format="{{' + grupo2.ImportePorLiquidar + '}}" tipo="Numerico"></td>' +
                  '</tr>');
                if (grupo2.Detalle !== null && grupo2.Detalle.length > 0) {
                  grupo2.Detalle.forEach(function(grupoDet1) {
                    datosGrupo += ('<tr id="gpo3" class="show-tree">' +
                      '<td class="td-MCuentaCorriente"></td>' +
                      '<td class="td-tree-level-three">' + grupoDet1.Nombre + '</td>' +
                      '<td class="td-MCuentaCorriente" format="{{' + grupoDet1.ImporteProgramado + '}}" tipo="Numerico"></td>' +
                      '<td class="td-MCuentaCorriente" format="{{' + grupoDet1.ImporteLiquidado + '}}" tipo="Numerico"></td>' +
                      '<td class="td-MCuentaCorriente" format="{{' + grupoDet1.ImportePorLiquidar + '}}" tipo="Numerico"></td>' +
                      '</tr>');
                  });
                }
              });
            }
          });
        }
      });
      return datosGrupo;
    }
  }
}());
