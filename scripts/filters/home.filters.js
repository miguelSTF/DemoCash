/*jshint latedef: nofunc */

(function () {
  'use strict';

  angular.module('appCash')
    .filter('catalogRelation', CatalogRelation);

  /* @ngInject */
  function CatalogRelation() {
    return function (items, filterItems, catalogo) {
      if (angular.isDefined(items)) {
        var idCatalogoName = 'Id' + catalogo;
        return items.filter(function (item) {
          if (angular.isDefined(filterItems)) {
            return filterItems.filter(function (fitem) {
                return fitem[idCatalogoName] === item[idCatalogoName];
              }).length > 0;
          } else {
            return true;
          }
        });
      } else {
        return items;
      }
    };
  }
})();
