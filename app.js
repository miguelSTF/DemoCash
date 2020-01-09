// Declare app level module which depends on filters, and services
(function () {
  'use strict';

  angular.module('appCash', [
    'appCash.configuration',
    'ngResource',
    'ngRoute',
    'ngAnimate',
    'ngTagsInput',
    'ngTable',
    'ngStorage',
    'ngDragDrop',
    'ngMaterial',
    'ui.bootstrap',
    'ui.date',
    'infinite-scroll',
    'ngIdle',
    'smart-table',
    'fixed.table.header',
    'ceibo.components.table.export',
    'ngMaterialDatePicker',
    'ngToast'
  ])
    .value('THROTTLE_MILLISECONDS', 150)
    .config(function($mdDateLocaleProvider) {
      $mdDateLocaleProvider.formatDate = function(date) {
        return moment(date).format('DD/MM/YYYY');
      };
      $mdDateLocaleProvider.months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo','Junio','Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      $mdDateLocaleProvider.shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun','Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      $mdDateLocaleProvider.days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sábado'];
      $mdDateLocaleProvider.shortDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
    })
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider
        .when('/login', {
          templateUrl: 'views/login.html',
          controller: 'LoginController',
          controllerAs: 'loginCtrl'
        })
        .when('/usuario', {
          templateUrl: 'views/usuario.html',
          controller: 'UsuarioController',
          controllerAs: 'usuarioCtrl'
        })
        .when('/departamento', {
          templateUrl: 'views/departamento.html',
          controller: 'DepartamentoController',
          controllerAs: 'departamentoCtrl'
        })
        .when('/concepto', {
          templateUrl: 'views/concepto.html',
          controller: 'ConceptoController',
          controllerAs: 'conceptoCtrl'
        })
        .when('/via', {
          templateUrl: 'views/via.html',
          controller: 'ViaLiquidacionController',
          controllerAs: 'viaCtrl'
        })
        .when('/institucion', {
          templateUrl: 'views/institucion.html',
          controller: 'InstitucionController',
          controllerAs: 'institucionCtrl'
        })
        .when('/mensaje', {
          templateUrl: 'views/mensaje.html',
          controller: 'MensajeController',
          controllerAs: 'mensajeCtrl'
        })
        .when('/monitor', {
          templateUrl: 'views/monitor.html',
          controller: 'MonitorController',
          controllerAs: 'monitorCtrl'
        })
        .when('/monitorext', {
          templateUrl: 'views/monitorext.html',
          controller: 'MonitorControllerExt',
          controllerAs: 'monitorExtCtrl'
        })
        .when('/divisa', {
          templateUrl: 'views/divisa.html',
          controller: 'DivisaController',
          controllerAs: 'divisaCtrl'
        })
        .when('/limites', {
          templateUrl: 'views/limites.html',
          controller: 'LimitesController',
          controllerAs: 'limiteCtrl'
        })
        .when('/clienteceptodepto', {
          templateUrl: 'views/clienteceptodepto.html',
          controller: 'ClienteCeptodeptoController',
          controllerAs: 'clienteceptodeptoCtrl'
        })
        .when('/cuenta_corriente', {
          templateUrl: 'views/cuenta_corriente.html',
          controller: 'CuentaCorrienteController',
          controllerAs: 'cuentaCorrienteCtrl'
        })
        .when('/cuentas_institucion', {
          templateUrl: 'views/cuentas_institucion.html',
          controller: 'CuentasInstitucionController',
          controllerAs: 'cuentasInstitucionCtrl'
        })
        .when('/conciliacion_manual', {
          templateUrl: 'views/conciliacion_manual.html',
          controller: 'ConciliacionManualController',
          controllerAs: 'conciliacionManCtrl'
        })
        .when('/grupocuentas',{
          templateUrl: 'views/grupocuentas.html',
          controller: 'GrupocuentasController',
          controllerAs: 'grupocuentasCtrl'
        })
        .when('/monitor_teso', {
          templateUrl: 'views/monitor_teso.html',
          controller: 'MonitorTesoController',
          controllerAs: 'monitorTesoCtrl'
        })
        .when('/bitacora', {
          templateUrl: 'views/bitacora.html',
          controller: 'BitacoraController',
          controllerAs: 'bitacoraCtrl'
        })
        .when('/bitacoraEdoCuenta',{
          templateUrl: 'views/bitacoraEdoCuenta.html',
          controller: 'BitacoraEdoCuentaController',
          controllerAs: 'bitacoraEdoCuentaCtrl'
        })
        .when('/config_contable',{
          templateUrl: 'views/configContable.html',
          controller: 'configContableController',
          controllerAs: 'configContableCtrl'
        })
        .when('/generar_poliza',{
          templateUrl: 'views/generarPoliza.html',
          controller: 'generaPolizaController',
          controllerAs: 'generaPolizaCtrl'
        })
        .when('/perfiles', {
          templateUrl: 'views/perfiles.html',
          controller: 'PerfilesController',
          controllerAs: 'perfilCtrl'
        })
        .when('/monitor_emisiones', {
          templateUrl: 'views/monitor_emisiones.html',
          controller: 'MonitorEmisionController',
          controllerAs: 'monitorEmiCtrl'
        })
        .when('/monitor_autorizacion', {
          templateUrl: 'views/monitor_autorizacion.html',
          controller: 'MonitorAutController',
          controllerAs: 'monitorAutCtrl'
        })
        .when('/monitor_reclasificacion', {
          templateUrl: 'views/monitor_reclasificacion.html',
          controller: 'MonitorReclaController',
          controllerAs: 'monitorReclaCtrl'
        })
        .when('/configuracion_traspasos', {
          templateUrl: 'views/configuracion_traspasos.html',
          controller: 'ConfigTrasController',
          controllerAs: 'configTrasCtrl'
        })
        .when('/monitor_confirmacion', {
          templateUrl: 'views/monitor_confirmacion.html',
          controller: 'MonitorConfirmacionController',
          controllerAs: 'monitorConfirCtrl'
        })
        .when('/plaza', {
          templateUrl: 'views/plaza.html',
          controller: 'PlazaController',
          controllerAs: 'plazaCtrl'
		    })
        .when('/tablero_posicion', {
          templateUrl: 'views/tablero_posicion.html',
          controller: 'TableroPosicionController',
          controllerAs: 'tableroposCtrl'
        })
        .when('/sucursal', {
          templateUrl: 'views/sucursal.html',
          controller: 'SucursalController',
          controllerAs: 'sucursalCtrl'
		    })
        .when('/mapa_configuracion', {
          templateUrl: 'views/mapa_configuracion.html',
          controller: 'MapaConfiguracionController',
          controllerAs: 'mapaCtrl'
        })
        .when('/obtener_bitacoras', {
          templateUrl: 'views/obtener_bitacoras.html',
          controller: 'ObtenerBitacorasController',
          controllerAs: 'obBitCtrl'
        })
        .when('/parametros', {
          templateUrl: 'views/parametros.html',
          controller: 'parametrosController',
          controllerAs: 'parametrosCtrl'
        })
        .when('/fin_dia', {
          templateUrl: 'views/fin_dia.html',
          controller: 'inicioFinDiaController',
          controllerAs: 'inicioFinDiaCtrl'
        })
        .when('/inicio_dia', {
          templateUrl: 'views/inicio_dia.html',
          controller: 'inicioFinDiaController',
          controllerAs: 'inicioFinDiaCtrl'
        })
        .when('/consulta_general', {
          templateUrl: 'views/consulta_general.html',
          controller: 'ConsultaGralController',
          controllerAs: 'consultaGralCtrl'
        })
        .when('/captura_masiva', {
          templateUrl: 'views/captura_masiva.html',
          controller: 'CapturaMasivaController',
          controllerAs: 'CapturaMasivaCtrl'
        })
        .when('/envio_no_identificado', {
          templateUrl: 'views/envio_no_identificado.html',
          controller: 'EnvioNoIdentController',
          controllerAs: 'envioNoIdentCtrl'
        })
        .when('/dias_inhabiles', {
          templateUrl: 'views/dias_inhabiles.html',
          controller: 'DiasInhabilesController',
          controllerAs: 'diasInhabilesCtrl'
        })
        .when('/bitacora_emision', {
          templateUrl: 'views/bitacora_emision.html',
          controller: 'BitacoraEmisionController',
          controllerAs: 'bitacoraEmisionCtrl'
        })
        .when('/splash', {
          templateUrl: 'views/splash.html',
          controller: 'LoginController',
          controllerAs: 'loginCtrl'
        })
        .when('/loginOAuth', {
          templateUrl: 'views/loginOAuth.html',
          controller: 'LoginController',
          controllerAs: 'loginCtrl'
        })
        .when('/parametros_generales', {
          templateUrl: 'views/parametros_generales.html',
          controller: 'ParamGenController',
          controllerAs: 'paramGenCtrl'
        })
        .when('/home', {
          templateUrl: 'views/home.html'
        })
        .otherwise({redirectTo: '/login'});
    }]);
}());
