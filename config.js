(function () {
  'use strict';

  angular.module('appCash.configuration', [])
    .constant('version', '1.0.0.0')
    .constant('rabbitServerUrl', 'http://localhost:15674/stomp')
    .constant('rabbitUser', 'Apesaqueue')
    .constant('rabbitPasword', 'Apesaqueue')
    .constant('OAuthServerUrl', 'http://localhost/OAuthServer/test/test.aspx')
    .constant('environment', {
      'mode':'release',
      'httpMode':1
    })
    .constant('fechaHoraFormat', 'DD-MM-YYYY HH:mm:ss')
    .constant('tiempoEspera', 600)
    .constant('catalogosConfig', {
      'host':'localhost',
      'port':'4101',
      'apiPrefix':'api',
      'prefix':'catalogos'
    })
    .constant('ordenesPagoConfig', {
      'host':'localhost',
      'port':'4103',
      'apiPrefix':'api',
      'prefix':'order'
    })
    .constant('senderConfig', {
      'host':'localhost',
      'port':'4104',
      'apiPrefix':'api',
      'prefix':'message'
    })
    .constant('viasConfig', {
      'host':'localhost',
      'port':'4105',
      'apiPrefix':'api',
      'prefix':'vias/spei'
    })
    .constant('logConfig', {
      'host':'localhost',
      'port':'4201',
      'apiPrefix':'api',
      'prefix':'log'
    })
    .constant('clientesConfig', {
      'host':'localhost',
      'port':'4301',
      'apiPrefix':'api',
      'prefix':'clientes'
    })
    .constant('clientesServiceConfig', {
      'host':'localhost',
      'port':'4301',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('autenticacionConfig', {
      'host':'localhost',
      'port':'4111',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('mensajesExternosConfig', {
      'host':'localhost',
      'port':'4109',
      'apiPrefix':'api',
      'prefix':'mensajesexternos'
    })
    .constant('consultasConfig', {
      'host':'localhost',
      'port':'4108',
      'apiPrefix':'api',
      'prefix':'consultas'
    })
    .constant('cuentacorrienteConfig', {
      'host':'localhost',
      'port':'4112',
      'apiPrefix':'api',
      'prefix':'cuentacorriente'
    })
    .constant('conciliatorConfig', {
      'host':'localhost',
      'port':'4113',
      'apiPrefix':'api',
      'prefix':'conciliator'
    })
    .constant('configContableConfig',{
      'host':'localhost',
      'port':'4101',
      'apiPrefix':'api',
      'prefix':'catalogos'
    })
    .constant('apiConfig', {
      'host':'localhost',
      'port':'4110',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('contabilidadConfig', {
      'host':'localhost',
      'port':'4116',
      'apiPrefix':'api',
      'prefix':'contabilidad'
    })
    .constant('banemxConfig', {
      'host':'localhost',
      'port':'4117',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('bancomerConfig', {
      'host':'localhost',
      'port':'4118',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('banorteConfig', {
      'host':'localhost',
      'port':'4119',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('bofaConfig', {
      'host':'localhost',
      'port':'4120',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('indevalConfig', {
      'host':'localhost',
      'port':'4121',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('siacConfig', {
      'host':'localhost',
      'port':'4122',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('speiIngConfig', {
      'host':'localhost',
      'port':'4114',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('speiWsConfig', {
      'host':'localhost',
      'port':'4115',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('swiftConfig', {
      'host':'localhost',
      'port':'4107',
      'apiPrefix':'api',
      'prefix':''
    })
    .constant('uiConfig', {
      'host':'localhost',
      'port':'4106',
      'apiPrefix':'api',
      'prefix':'ui'
    });
}());
