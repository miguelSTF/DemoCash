/*jshint latedef: nofunc */
(function() {
  'use strict';

  angular.module('appCash')
    .controller('ObtenerBitacorasController', ObtenerBitacorasController);

  /* @ngInject */
  function ObtenerBitacorasController(Utils, Catalogos, ConciliadorService, ConciliadorMasProService, CuentaCorriente, generaPoliza, BitacoraLog, MonitorExt, Ordenes, Api, SenderBit, CatalogosCli, Banamex, Bancomer, Banorte, Bofa, Indeval, Siac, SpeiIng, SpeiWs, Swift, ValidateSession) {
    var vm = this;
    vm.loading = false;
    vm.ListCore = [
      {'Nombre': 'Catálogos','ServiceName': 'Catalogos'},
      {'Nombre': 'Cuenta Corriente','ServiceName': 'CheckingAccount'},
      {'Nombre': 'Conciliación','ServiceName': 'Conciliator'},
      {'Nombre': 'Consultas','ServiceName': 'Consultas'},
      {'Nombre': 'Contabilidad','ServiceName': 'Contabilidad'},
      {'Nombre': 'Bitácoras','ServiceName': 'Log'},
      {'Nombre': 'Estados de Cuenta','ServiceName': 'MensajesExternos'},
      {'Nombre': 'Operación','ServiceName':'PaymentOrders'},
      {'Nombre': 'Recepción de operaciones','ServiceName': 'RecepcionMensajesExternos'},
      {'Nombre': 'Envío de mensajes','ServiceName': 'Sender'},
    ];

    vm.ListPlugIn = [
      {'Nombre': 'Clientes','ServiceName': 'Plugin.Clientes.Default'}
    ];

    vm.ListVias = [
      {'IdVia' : '3','Nombre': 'Banamex','ServiceName': 'Banamex'},
      {'IdVia' : '4','Nombre': 'Bancomer','ServiceName': 'Bancomer'},
      {'IdVia' : '5','Nombre': 'Banorte','ServiceName': 'Banorte'},
      {'IdVia' : '6','Nombre': 'Bofa','ServiceName': 'Bofa'},
      {'IdVia' : '1', 'Nombre': 'Dali','ServiceName': 'Indeval'},
      {'IdVia' : '7','Nombre': 'Siac','ServiceName': 'Siac'},
      {'IdVia' : '2','Nombre': 'SPEI - Recepción','ServiceName': 'Spei'},
      {'IdVia' : '2','Nombre': 'SPEI - Emisión','ServiceName': 'SpeiWS'},
      {'IdVia' : '9','Nombre': 'Swift','ServiceName': 'Swift'}
    ];

    vm.ShowCore = false;
    vm.ShowPlugIn = false;
    vm.ShowVias = false;

    vm.init = function (){
      var validate = ValidateSession.validate(44);
      if (validate === false){
        location.href = '#/login';
      }
      vm.FilterViasByLicense();
    };

    vm.FilterViasByLicense = function()
    {
      Catalogos.query({
        'name': 'LicenseData',
      }).$promise.then(function(respuesta) {
        var listVias = [];
        vm.ListVias.forEach(function(item){
          respuesta.forEach(function(viasLic){
            if(item.IdVia === viasLic.IdVia){
              listVias.push(item);
            }
          })
        });
        vm.ListVias = listVias;
      }).catch(function(response) {
        Utils.showToast('Error al consultar las vias');
      });
    };

    vm.ShowListCore = function(){
      vm.ShowCore = !vm.ShowCore;
    };

    vm.ShowListPlugIn = function(){
      vm.ShowPlugIn = !vm.ShowPlugIn;
    };

    vm.ShowListVias = function(){
      vm.ShowVias = !vm.ShowVias;
    };

    vm.GetBitacoraCore = function (serviceName) {
      vm.loading= true;
      switch (serviceName) {
        case 'Catalogos':
            Catalogos.save({
              'name': 'getBitacora'
            }).$promise.then(function (data) {
              vm.PrintAnswer(data);
            }).catch(function(){
                vm.PrintErrorGetService();
            });
          break;

        case 'CheckingAccount':
            ConciliadorService.save({
              'operacion': 'getBitacora'
            }).$promise.then(function (data) {
              vm.PrintAnswer(data);
            }).catch(function(){
                vm.PrintErrorGetService();
            });
            break;

        case 'Conciliator':
            ConciliadorMasProService.save({
              'operacion': 'getBitacora'
            }).$promise.then(function (data) {
              vm.PrintAnswer(data);
            }).catch(function(){
                vm.PrintErrorGetService();
            });
            break;

        case 'Consultas':
          CuentaCorriente.save({
            'name': 'getBitacora'
          }).$promise.then(function (data) {
            vm.PrintAnswer(data);
          }).catch(function(){
              vm.PrintErrorGetService();
          });
          break;

        case 'Contabilidad':
          generaPoliza.save({
            'entry': 'getBitacora'
          }).$promise.then(function (data) {
            vm.PrintAnswer(data);
          }).catch(function(){
              vm.PrintErrorGetService();
          });
          break;

        case 'Log':
          BitacoraLog.save({
            'name': 'entry/getBitacora'
          }).$promise.then(function (data) {
            vm.PrintAnswer(data);
          }).catch(function(){
              vm.PrintErrorGetService();
          });
          break;

        case 'MensajesExternos':
          MonitorExt.save({
            'name': 'getBitacora'
          }).$promise.then(function (data) {
            vm.PrintAnswer(data);
          }).catch(function(){
              vm.PrintErrorGetService();
          });
          break;

        case 'PaymentOrders':
          Ordenes.save({
            'name': 'getBitacora'
          }).$promise.then(function (data) {
            vm.PrintAnswer(data);
          }).catch(function(){
              vm.PrintErrorGetService();
          });
          break;

        case 'RecepcionMensajesExternos':
            Api.save({
              'name': 'getBitacora'
            }).$promise.then(function (data) {
              vm.PrintAnswer(data);
            }).catch(function(){
                vm.PrintErrorGetService();
            });
            break;

        case 'Sender':
          SenderBit.save({
            'name': 'getBitacora'
          }).$promise.then(function (data) {
            vm.PrintAnswer(data);
          }).catch(function(){
              vm.PrintErrorGetService();
          });
          break;
      }
    };

    vm.GetBitacoraPlug = function (serviceName){
      vm.loading = true;
      switch (serviceName) {
        case 'Plugin.Clientes.Default':
          CatalogosCli.save({
            'name':'getBitacora'
          }).$promise.then(function (data) {
            vm.PrintAnswer(data);
          }).catch(function(){
              vm.PrintErrorGetService();
          });
          break;
      }
    };

    vm.GetBitacoraVia = function (serviceNAme){
      vm.loading = true;

      switch (serviceNAme) {
        case 'Banamex':
            Banamex.save({
              'name': 'getBitacora'
            }).$promise.then(function (data) {
              vm.PrintAnswer(data);
            }).catch(function(){
                vm.PrintErrorGetService();
            });
          break;

        case 'Bancomer':
          Bancomer.save({
            'name': 'getBitacora'
          }).$promise.then(function (data) {
            vm.PrintAnswer(data);
          }).catch(function(){
              vm.PrintErrorGetService();
          });
          break;

        case 'Banorte':
            Banorte.save({
              'name': 'getBitacora'
            }).$promise.then(function (data) {
              vm.PrintAnswer(data);
            }).catch(function(){
                vm.PrintErrorGetService();
            });
            break;

        case 'Bofa':
              Bofa.save({
                'name': 'getBitacora'
              }).$promise.then(function (data) {
                vm.PrintAnswer(data);
              }).catch(function(){
                  vm.PrintErrorGetService();
              });
              break;

        case 'Indeval':
                Indeval.save({
                  'name': 'getBitacora'
                }).$promise.then(function (data) {
                  vm.PrintAnswer(data);
                }).catch(function(){
                    vm.PrintErrorGetService();
                });
                break;

        case 'Siac':
            Siac.save({
              'name': 'getBitacora'
            }).$promise.then(function (data) {
              vm.PrintAnswer(data);
            }).catch(function(){
                vm.PrintErrorGetService();
            });
            break;

        case 'Spei':
              SpeiIng.save({
                'name': 'getBitacora'
              }).$promise.then(function (data) {
                vm.PrintAnswer(data);
              }).catch(function(){
                  vm.PrintErrorGetService();
              });
              break;

        case 'SpeiWS':
        SpeiWs.save({
          'name': 'getBitacora'
        }).$promise.then(function (data) {
          vm.PrintAnswer(data);
        }).catch(function(){
            vm.PrintErrorGetService();
        });
        break;

        case 'Swift':
          Swift.save({
            'name': 'getBitacora'
          }).$promise.then(function (data) {
            vm.PrintAnswer(data);
          }).catch(function(){
              vm.PrintErrorGetService();
          });
          break;


      }
    };

    vm.PrintAnswer = function (data){
      if(data.Sended === true){
        Utils.showToast('Archivo exportado correctamente');
      }
      else {
        Utils.showToast(data.Message);
      }
      vm.loading = false;
    };

    vm.PrintErrorGetService = function (){
      Utils.showToast('No se pudo conectar con el servicio.');
      vm.loading = false;
    };
  }
})();
