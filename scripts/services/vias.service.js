
(function () {
  'use strict';
  angular.module('appCash')
    .factory('Banamex', Banamex);

  /* @ngInject */
  function Banamex($resource, UrlBuilder, banemxConfig) {
    var url = UrlBuilder.build(banemxConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        save: {
          method: 'POST',
          headers: {'Token': tkn}
        }
      });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('Bancomer', Bancomer);

  /* @ngInject */
  function Bancomer($resource, UrlBuilder, bancomerConfig) {
    var url = UrlBuilder.build(bancomerConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        save: {
          method: 'POST',
          headers: {'Token': tkn}
        }
      });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('Banorte', Banorte);

  /* @ngInject */
  function Banorte($resource, UrlBuilder, banorteConfig) {
    var url = UrlBuilder.build(banorteConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        save : {
          method: 'POST',
          headers: {'Token': tkn}
        }
      });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('Bofa', Bofa);

  /* @ngInject */
  function Bofa($resource, UrlBuilder, bofaConfig) {
    var url = UrlBuilder.build(bofaConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        save: {
          method: 'POST',
          headers: {'Token': tkn}
        }
      });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('Indeval', Indeval);

  /* @ngInject */
  function Indeval($resource, UrlBuilder, indevalConfig) {
    var url = UrlBuilder.build(indevalConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        save : {
          method: 'POST',
          headers: {'Token': tkn}
        }
      });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('Siac', Siac);

  /* @ngInject */
  function Siac($resource, UrlBuilder, siacConfig) {
    var url = UrlBuilder.build(siacConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        save: {
          method: 'POST',
          headers: {'Token': tkn}
        }
      });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('SpeiIng', SpeiIng);

  /* @ngInject */
  function SpeiIng($resource, UrlBuilder, speiIngConfig) {
    var url = UrlBuilder.build(speiIngConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        save: {
          method: 'POST',
          headers: {'Token': tkn}
        }
      });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('SpeiWs', SpeiWs);

  /* @ngInject */
  function SpeiWs($resource, UrlBuilder, speiWsConfig) {
    var url = UrlBuilder.build(speiWsConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        getList: {
          method: 'POST',
          headers: {'Token': tkn}
        },
        save : {
          method:'POST',
          headers : {'Token' : tkn} 
        }
      });
  }
}());

(function () {
  'use strict';
  angular.module('appCash')
    .factory('Swift', Swift);

  /* @ngInject */
  function Swift($resource, UrlBuilder, swiftConfig) {
    var url = UrlBuilder.build(swiftConfig);
    var tkn = sessionStorage.getItem('Token');
    return $resource(
      url + '/:name/:id', {
        name: '@name',
        id: '@id'
      }, {
        save: {
          method: 'POST',
          headers: {'Token': tkn}
        }
      });
  }
}());
