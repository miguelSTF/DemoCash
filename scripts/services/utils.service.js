/*jshint latedef: nofunc */

// Based in Christian Heilmann's Revealing Module Pattern
(function () {
  'use strict';

  angular.module('appCash')
    .factory('Utils', Utils);

  /* @ngInject */
  function Utils(ngToast) {
    // Internal properties

    // Internal methods
    function cloneObject(objeto) {
      return (JSON.parse(JSON.stringify(objeto)));
    }

    function removeUndefinedFromArray(inputArray) {
      return inputArray.filter(function (n) {
        return angular.isDefined(n);
      });
    }

    function generateSolicitudId() {
      /*jshint bitwise: false*/
      var d = new Date().getTime();
      return 'xxxxxxxx-yxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }

    function showToast(title) {
      ngToast.create({'dismissButton':true,'dismissOnTimeout':true,content: '<span>'+title+'</span>'});
    }

    function showToastFijo(title) {
      ngToast.create({'dismissButton':true,'dismissOnTimeout':false,content: '<span>'+title+'</span>'});
    }

    function disableDays (date, diasInhabiles) {
      var findDayIn = diasInhabiles.indexOf(date.toString()) === -1;
      var day = date.getDay();
      return (day > 0 && day < 6) && findDayIn;
    }


    // Define the interface or the functions and properties to reveal.
    var service = {
      cloneObject: cloneObject,
      removeUndefinedFromArray: removeUndefinedFromArray,
      showToast: showToast,
      showToastFijo: showToastFijo,
      generateSolicitudId: generateSolicitudId,
      disableDays : disableDays
    };

    return service;
  }
}());
