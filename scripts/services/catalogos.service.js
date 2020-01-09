/*jshint latedef: nofunc */
/*jshint loopfunc: true */
(function () {
  'use strict';
  angular.module('appCash')
    .factory('Catalogos', Catalogos);

  /* @ngInject */
  function Catalogos($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        getList: {
          method: 'GET',
          isArray: true,
          headers: {'Token': tkn}
        },
        query : {
          method:'GET',
          isArray : true,
          headers : {'Token' : tkn}
        },
        delete : {
          method:'DELETE',
          headers : {'Token' : tkn}
        },
        save : {
          method: 'POST',
          headers : {'Token' : tkn}
        }
      });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('RelacionesCliente', RelacionesCliente);

  /* @ngInject */
  function RelacionesCliente($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url + '/ClienteRelaciones/DepartamentoContraparte/ConceptoContraparte/:IdContraparte', {
      IdContraparte: '@IdContraparte'
    }, {
      send: {
        method: 'POST',
        headers: {'Token': tkn}
      }
    });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('Relaciones', Relaciones);

  /* @ngInject */
  function Relaciones($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url + '/relacion/:name/:id/:relation', {
      name: '@name',
      id: '@id',
      relation: '@relation'
    }, {
      query: {
        method: 'GET',
        isArray: true,
        headers: {'Token': tkn}
      }
    });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('VerificarReg', VerificarReg);

  /* @ngInject */
  function VerificarReg($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url + '/verificar/:name/', {
      name: '@name',
      filtro: '@filtro',
      valor: '@valor'
    }, {
      query: {
        method: 'POST',
        isArray: true,
        headers: {'Token': tkn}
      }
    });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('MapConfig', MapConfig);

  /* @ngInject */
  function MapConfig($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url + '/mapConfig/', {
    }, {
      query: {
        method: 'GET',
        isArray: true,
        headers: {'Token': tkn}
      }
    });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('GetVersion', GetVersion);

  /* @ngInject */
  function GetVersion($resource, UrlBuilder, uiConfig) {
    var url = UrlBuilder.build(uiConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url + '/showVersion/', {
    }, {
      query: {
        method: 'GET',
        isArray: false,
        headers: {'Token': tkn}
      }
    });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('Limites', Limites);

  /* @ngInject */
  function Limites($resource, UrlBuilder, catalogosConfig) {
    var url = UrlBuilder.build(catalogosConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(url + '/LimiteCatalogo', {},
    {
      query: {
        isArray: true,
        headers: {'Token': tkn}
      }
    }
  );
  }
}());

// Based in Christian Heilmann's Revealing Module Pattern
(function () {
  'use strict';
  angular.module('appCash')
    .factory('TiposLimites', TiposLimites);

  /* @ngInject */
  function TiposLimites(Limites, Catalogos) {
    // Internal properties
    // Internal methods
    function getTiposLimites(catalogo, id) {
      var tipoLimiteVacio = [];
      return Limites.query({
        'IdCatalogo': catalogo,
        'IdEspecifico': id
      }, function (response) {
        var tipoLimiteAsignados = response;
        if (tipoLimiteAsignados.length === 0) {
          Limites.query({
            'IdCatalogo': catalogo
          }, function (res) {
            tipoLimiteVacio = res;
            for (var i = 0; i < 4; i++) {
              tipoLimiteVacio[i].IdEspecifico = id;
              tipoLimiteVacio[i].IdLimiteCatalogo = 0;
              tipoLimiteVacio[i].LimiteMax = '';
              tipoLimiteAsignados[i] = tipoLimiteVacio[i];
            }
          });
        } else {
          tipoLimiteAsignados = response;
        }
        return tipoLimiteAsignados;
      });
    }

    function save(tipoLimiteAsignados, catalogo, id, catalogoVm) {
      for (var i = 0; i < tipoLimiteAsignados.length; i++) {
        tipoLimiteAsignados[i].IdEspecifico = id;
        Catalogos.save({
          'name': 'limitecatalogo'
        }, tipoLimiteAsignados[i], function () {
          catalogoVm.SuccessLimits = true;
          setTimeout(function () {
            catalogoVm.$apply(function () {
              catalogoVm.SuccessLimits = false;
            });
          }, 1500);
        });
      }
    }

    // Define the interface or the functions and properties to reveal.
    var service = {
      getTiposLimites: getTiposLimites,
      save: save
    };
    return service;
  }
}());