/*jshint latedef: nofunc */

(function() {
  'use strict';

  angular.module('appCash')
    .controller('SidebarController', function SidebarController($scope, $mdDialog, $mdMedia, Idle, environment, Keepalive, $uibModal, Parametros, ConciliadorService, ConciliadorMasProService, Utils, $mdSidenav, Perfiles, $location, Catalogos, GetVersion, rabbitServerUrl,rabbitUser,rabbitPasword) {
      var vm = this;
      $scope.state = false;
      $scope.userInfo = sessionStorage;
      $scope.started = false;
      var originatorEv;
      vm.SeguridadLocalArray = [];
      $scope.openMenu = function($mdOpenMenu, ev) {
        originatorEv = ev;
        $mdOpenMenu(ev);
      };

      $scope.catalogo = {
        name: 'configuracion',
        id: 'Id'
      };

      $scope.objetoMenu = [];
      $scope.menuContent = [];
      $scope.firstTenSubmenus = [];
      $scope.showAccessList = true;
      $scope.quickAccessListMargin = 0;
      $scope.ShowArrows = false;

      $scope.init = function() {
        if(sessionStorage.getItem('Token') === null){
          var nav = document.getElementsByTagName('nav')[0];
          nav.setAttribute('style', 'display:none');
        }
        vm.loading = true;
        connectToRabbit($scope,rabbitServerUrl);
        $scope.hasItem = false;
        $scope.message= [];
        $scope.dataList=[];
        $scope.quickAccessBtnsList = [];

        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data) {
          $scope.FechaOperacion = data.filter(function(n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
          $scope.fechaOper = getDateString(new Date($scope.FechaOperacion.Valor));
          vm.statusDia = obitieneStatusDia(data);
          vm.loading = false;
        var idUsuario = sessionStorage.getItem('IdUsuario');
        var username = $location.search().user;
        if(username !== undefined){
          Catalogos.getList({
            'name': 'usuario',
            'Clave': username.toUpperCase()
          }).$promise.then(function (data) {
            idUsuario = data[0].IdUsuario;
            obtienePerfil(idUsuario);
          })
          .catch(function (response) {
            console.error('Error: ' + JSON.stringify(response));
          });
        }else{
          obtienePerfil(idUsuario);
        }

        if(vm.statusDia === 'E'){
          var cerrarSesion = true;
          JSON.parse(sessionStorage.getItem('Menu')).forEach(function(item){
            item.SubMenus.forEach(function(sub){
              if(sub.IdPermiso >= 34 && sub.IdPermiso <= 35)
              {
                cerrarSesion = false;
              }
            });
          });

          if(cerrarSesion){
            $scope.warning = $uibModal.open({
              templateUrl: 'fin-dialog.html',
              windowClass: 'modal-danger'
            });

            setTimeout(function(){
              closeModals();
              window.location.replace('/#/login');
            }, 3000);
          }
        }
        });
          getBtnsList();
      };

      function obtienePerfil(idUsuario){
        if (idUsuario !== null) {
          Perfiles.query({
            'name': 'permisos',
            'id': idUsuario
          }).$promise.then(function(data) {
            Perfiles.query({
              'name': 'Permiso'
            }).$promise.then(function(permisosdisp) {
              Perfiles.query({
                'name': 'permisospantalla',
                'id': idUsuario
              }).$promise.then(function(permisosPantalla) {
                permisosdisp.forEach(function(item) {
                  data.forEach(function(permiso) {
                    if (item.IdPermiso === permiso) {
                      if (item.Contenedor === 0) {
                        $scope.objetoMenu.push(item);
                        $scope.objetoMenu.forEach(function(element) {
                          element.menu = JSON.parse(element.ObjetoOpcion);
                          element.menu.SubMenus = [];
                          permisosdisp.forEach(function(itemS) {
                            data.forEach(function(permisoA) {
                              if (permisoA === itemS.IdPermiso) {
                                if (element.IdPermiso === itemS.Contenedor) {
                                  var objetoSubMenu = JSON.parse(itemS.ObjetoOpcion);
                                  element.menu.SubMenus.push({'IdPermiso':itemS.IdPermiso,'Title':objetoSubMenu.Title,'Route':objetoSubMenu.Route,'Action':objetoSubMenu.Action,'Ordenamiento': itemS.Ordenamiento});
                                }
                              }
                            });
                          });
                        });
                      }
                    }
                  });
                });

                $scope.objetoMenu.sort(sortMenus);

                $scope.objetoMenu.forEach(function(obj){
                    obj.menu.SubMenus.sort(sortMenus);
                });

                $scope.objetoMenu.forEach(function(menu) {
                  $scope.menuContent.push(menu.menu);
                });
                $scope.menuContent.forEach(function(menu){
                  menu.SubMenus.forEach(function(subMenu){
                    subMenu.Permiso = [];
                    permisosPantalla.forEach(function(operSub){
                      if(subMenu.IdPermiso === operSub.IdPermiso)
                      {
                        subMenu.Permiso.push(operSub.IdTipoPermisoPantalla);
                      }
                    });
                  });
                });
                sessionStorage.setItem('Menu', JSON.stringify($scope.menuContent));
                // Call to quick access menu function
                initialQuickAccess();
              });
            });
          });
        }

        if (environment.mode === 'release') {
          start();
        }
      }



      $scope.showQuickAccessBtns = function(){
        $scope.showAccessList = !$scope.showAccessList;
      };

      $scope.refreshSubmenuTitle = function(submenuTitle){
        sessionStorage.route = submenuTitle;
      };

      $scope.moveRight = function(){
        if($scope.quickAccessBtnsList.length > 0)
        {
          var firstElementOfList = $scope.quickAccessBtnsList[0];
          var marginLeftLimit = ($scope.quickAccessBtnsList.length - 10) * 110 * - 1;
          var actualMargin = $scope.quickAccessListMargin;
          var modifiedMargin = (actualMargin - 110);
            if(modifiedMargin >= marginLeftLimit)
            {
              $scope.quickAccessListMargin = modifiedMargin;
              firstElementOfList.setAttribute('style', 'margin-left:' + modifiedMargin.toString() + 'px;');
            }
          }
      };

      $scope.moveLeft = function(){
        if($scope.quickAccessBtnsList.length > 0)
        {
          var firstElementOfList = $scope.quickAccessBtnsList[0];
          var marginLeftLimit = 0;
          var actualMargin = $scope.quickAccessListMargin;
          var modifiedMargin = (actualMargin + 110);
            if(modifiedMargin <= marginLeftLimit)
            {
              $scope.quickAccessListMargin = modifiedMargin;
              firstElementOfList.setAttribute('style', 'margin-left:' + modifiedMargin.toString() + 'px;');
            }
        }
      };

      function getBtnsList(){
        var directAccessList = document.getElementById('quickAccessList');
        var listOfElements = directAccessList.getElementsByTagName('li');
        $scope.quickAccessBtnsList = listOfElements;
      }

      function sortMenus(a,b){
        if (a.Ordenamiento < b.Ordenamiento){
            return -1;
          }
        if (a.Ordenamiento > b.Ordenamiento){
          return 1;
        }
          return 0;
      }

      function sortQuickAccessBtns(a, b){
        if (a.Title < b.Title){
          return -1;
        }
        if (a.Title > b.Title){
          return 1;
        }
          return 0;
      }

      function initialQuickAccess(){
        var count = 0;
        for(var i = 0; i < $scope.menuContent.length; i++){
          var menu = $scope.menuContent[i];
          for(var j = 0; j < menu.SubMenus.length; j++){
            var subMenu = menu.SubMenus[j];
              if(subMenu.Title !== 'Inicio de dia' && subMenu.Title !== 'Fin de dia'){
                $scope.firstTenSubmenus.push(subMenu);
              }
              count++;
          }
        }
         $scope.firstTenSubmenus.sort(sortQuickAccessBtns);
         $scope.ShowArrows = $scope.firstTenSubmenus.length > 10 ?  true : false;
      }

      $scope.setSubmenuTitle = function(titleName){
        $scope.Name = titleName;
        sessionStorage.setItem('route', titleName);
        if($mdSidenav('left').isOpen()){
          $mdSidenav('left').close();
        }
      }

      $scope.toggleState = function() {
        if($mdSidenav('left').isOpen()){
          $mdSidenav('left').close();
        }else{
          $mdSidenav('left').toggle();
          $scope.state = !$scope.state;
        }
      };

      function obitieneStatusDia(data){
        var status = data.filter(function(n){
          return n.Nombre === 'StatusDia';
        })[0];
        $scope.statusDia = status.Valor === 'A' ? 'Abierto' : status.Valor === 'E' ? 'En espera de apertura' : '' ;
      }

      function verificaSiCierraSesion(){
         var cierroSesion = sessionStorage.getItem('FinDiaSend');
         if(cierroSesion !== '1'){
           $scope.warning = $uibModal.open({
             templateUrl: 'fin-dialog.html',
             windowClass: 'modal-danger'
           });

           setTimeout(function(){
             closeModals();
             window.location.replace('/#/login');
           }, 3000);
         }
      }

      $scope.ModificarParametros = function() {
        var templateUriPage = './views/templates/parametros-edit.html';
        var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && customFullscreen;
        $mdDialog.show({
          templateUrl: templateUriPage,
          scope: $scope,
          preserveScope: true,
          parent: angular.element(document.body),
          clickOutsideToClose: false,
          fullscreen: useFullScreen
        });
        $scope.obtenerParametros();
      };

      $scope.Notificacion = function() {
          $scope.hasItem = false;
          $scope.message = [];
          var dataSet = sessionStorage.getItem('Notificacion');

          if(dataSet){
            $scope.message = JSON.parse(dataSet);
            $scope.message.sort(function(a,b){
              return new Date(b.Fecha)- new Date(a.Fecha);
            });
        }

        var templateUriPage = './views/templates/notificaciones.html';
        var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && customFullscreen;
        $mdDialog.show({
          templateUrl: templateUriPage,
          scope: $scope,
          preserveScope: true,
          parent: angular.element(document.body),
          clickOutsideToClose: false,
          fullscreen: useFullScreen
        });
      };

      $scope.Close = function() {
        $mdDialog.hide();
      };

      $scope.obtenerFecha = function() {
        $scope.FechaOperacion.Valor = new Date($scope.FechaOperacion.Valor);
      };

      $scope.obtenerParametros = function() {
        Parametros.query({
          'name': $scope.catalogo.name
        }).$promise.then(function(data) {
          $scope.UmbralInicioDia = data.filter(function(n) {
            return n.Nombre === 'UmbralIniciodia';
          })[0];
          $scope.UmbralCupones = data.filter(function(n) {
            return n.Nombre === 'UmbralCupones';
          })[0];
          $scope.UmbralIntradia = data.filter(function(n) {
            return n.Nombre === 'UmbralIntradia';
          })[0];
          $scope.FechaOperacion = data.filter(function(n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
          $scope.RutaEdoCta = data.filter(function(n){
            return n.Nombre === 'RutaEdoCta';
          })[0];
          $scope.FechaOperacion.Valor = new Date($scope.FechaOperacion.Valor);
        });
      };

      $scope.getFechaOper = function(){
        Parametros.query({
          'name': 'Configuracion'
        }).$promise.then(function(data) {
          $scope.FechaOperacion = data.filter(function(n) {
            return n.Nombre === 'FechaOperacion';
          })[0];
        });
      };

      $scope.saveUmbral = function() {
        $scope.parametros = [$scope.UmbralInicioDia, $scope.UmbralCupones, $scope.UmbralIntradia, $scope.FechaOperacion, $scope.RutaEdoCta];
        var paramsToSave = $scope.parametros.filter(function(val) {
          return val !== undefined;
        });
        Parametros.send({
          'name': $scope.catalogo.name
        }, paramsToSave, function(data) {
          if (data.errorMsg === undefined) {
            Utils.showToast('Registros almacenados correctamente!');
            $scope.fechaOper = getDateString( new Date($scope.FechaOperacion.Valor));
            $scope.Close();
          } else {
            Utils.showToast(data.errorMsg);
          }
        });
      };

      $scope.searchVersionApp = function(){
        GetVersion.query({
        }).$promise.then(function(data) {
          $scope.version = data;
          if ($scope.version.Service === undefined) {
            Utils.showToast('No se pudo encontrar la versión actual del sistema');
          }else{
            var templateUriPage = './views/templates/versionApp.html';
            var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && customFullscreen;
            $mdDialog.show({
              templateUrl: templateUriPage,
              scope: $scope,
              preserveScope: true,
              parent: angular.element(document.body),
              clickOutsideToClose: false,
              fullscreen: useFullScreen
            });
          }
        }).catch(function () {
          Utils.showToast('No se encontró el servicio');
        });
      };

      function closeModals() {
        if ($scope.warning) {
          $scope.warning.close();
          $scope.warning = null;
        }

        if ($scope.timedout) {
          $scope.timedout.close();
          $scope.timedout = null;
        }
      }

      function getDateString (date){
        return date.toLocaleDateString('es-ES',{
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }

      $scope.$on('IdleStart', function() {
        sessionStorage.CerrandoSesion = true;
        closeModals();
        $scope.warning = $uibModal.open({
          templateUrl: 'warning-dialog.html',
          windowClass: 'modal-danger'
        });
      });

      $scope.$on('IdleEnd', function() {
        closeModals();
        sessionStorage.removeItem('CerrandoSesion');
      });

      $scope.$on('IdleTimeout', function() {
        if (environment.mode === 'release') {
          $scope.showAccessList = false;
          closeModals();
          location.href = '#/login';
        }
      });

       // menu left hover
      var menu = $('.md-sidenav-left');
      $(window).on('mousemove', mouseMoveHandler);

      function mouseMoveHandler(e) {
        if (e.pageX > 280) {
          $scope.toggleState('');
          $mdSidenav('left').close();
          }
      }

      $scope.goLogin = function(){
        $scope.showAccessList = false;
        location.href = '#login';
      };

      // RabbitMQ connection
      function connectToRabbit(scope, rabbitServerUrl) {
        var ws = new SockJS(rabbitServerUrl);
        var client = Stomp.over(ws);

        scope.ws = ws;
        scope.client = client;

        // SockJS does not support heart-beat: disable heart-beats
        client.heartbeat.outgoing = 0;
        client.heartbeat.incoming = 0;

        var onConnect = function() {
          client.subscribe('/topic/CASH_EVENTS_TOPIC', function(message) {
            if (message.body) {
              $scope.$apply(function(){
                $scope.hasItem = true;
                var objectJson = JSON.parse(message.body);
                $scope.dataList.push(objectJson);
                sessionStorage.setItem('Notificacion', JSON.stringify($scope.dataList));

                if(objectJson.Status === 0){
                  verificaSiCierraSesion();
                }
              });
              console.log('Got it!');
            }
            else{
              $scope.$apply(function(){
                $scope.hasItem = false;
              });
            }

          });
        };

        var onError = function(err) {
          console.log('error connecting to RabbitMQ:', err);
        };
        client.connect(rabbitUser, rabbitPasword, onConnect, onError, '/');
     }

      function start() {
        closeModals();
        Idle.watch();
        $scope.started = true;
      }

      $scope.showNav = function() {
        return sessionStorage.length > 0;
      };
    })
    .config(function(IdleProvider, KeepaliveProvider,tiempoEspera) {
      IdleProvider.idle(tiempoEspera);
      IdleProvider.timeout(10);
      KeepaliveProvider.interval(10);
    })
    .run(function(Parametros,Idle){
      Parametros.query({
        'name':'Configuracion'
      }).$promise.then(function (config) {
        var configData = config;
        var modoLogin = configData.filter(function (item) {
          if (item.Nombre === 'ModoAutenticacion') {
            return item;
          }
        })[0];
        if(modoLogin !== undefined || modoLogin !== null){
          if(modoLogin.Valor === '1'){
            Parametros.query({
              'name': 'ConfiguracionSeguridadLocal'
            }).$promise.then(function (data) {
              var SeguridadLocalArray = data;
              var minMaxInactividad = SeguridadLocalArray.filter(function (item) {
                if (item.Nombre === 'MinutosMaxInactividadSesion') {
                  return item;
                }
              })[0].Valor;
              var minMax = minMaxInactividad * 60;
              Idle.setIdle(minMax);
              Idle.watch();
            })
          }
        }
      })
    });
}());
