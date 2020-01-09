(function () {
  'use strict';

  angular.module('appCash')
    .factory('Log', Log);

  /* @ngInject */
  function Log(Bitacora) {

    function storeData(evento, desde, ObjetoAfectado, categoria, accion) {

      var data = [{
        Evento: evento,
        Desde: desde,
        Quien: sessionStorage.getItem('Nombre'),
        ObjetoAfectadosString: JSON.stringify(ObjetoAfectado),
        Categoria: categoria,
        Accion: accion
      }];
      return Bitacora.send(data).$promise;
    }

    var service = {
      storeData: storeData
    };
    return service;
  }

}());
