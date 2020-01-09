/*jshint latedef: nofunc */
(function () {
  'use strict';

  angular.module('appCash')
    .factory('EnumVia', EnumVia);

  /* @ngInject */
  function EnumVia(){

    var enumVia = {
      Dali: 1 ,
      Spei: 2,
      Banamex: 3,
      Bancomer: 4,
      Banorte: 5,
      Bofa: 6,
      Siac: 7,
      Afirme: 8,
      Swift: 9
    };

    function stringOfEnum(valueToSearch){
      for(var k in enumVia){
        if(enumVia[k] === valueToSearch){
          return k;
        }
      }
    }

    function indexOfEnum(valueToSearch){
      for(var k in enumVia){
        if(k === valueToSearch){
          return enumVia[k];
        }
      }
    }

    var service = {
      stringOfEnum:stringOfEnum,
      indexOfEnum:indexOfEnum
    };

    return service;
  }

}());
