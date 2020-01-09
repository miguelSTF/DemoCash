/*jshint latedef: nofunc */
(function(){

  angular.module('appCash')
    .controller('ConsultaGralController', ConsultaGralController);

    /* @ngInject */
    function ConsultaGralController($scope, Utils, Ordenes, $mdMedia, $mdDialog, Parametros, ValidateSession)
    {
      var vm = this;
      vm.loading = true;
      vm.fechaHistorico = false;
      vm.datos = [];
      vm.descripcion = '';
      vm.motivo = 0;
      vm.Iva = 0;
      vm.incluirCancel = false;
      vm.idUser = parseInt(sessionStorage.getItem('IdUsuario'));
      vm.idSolicitud = '';
      vm.NombreDepartamento = '';
      vm.NombreConceptoOriginal = '';
      vm.NombreContraParte = '';
      vm.IdSistemaExterno = '';
      vm.Instruccion = '';
      vm.Importe = '';
      vm.Sentido = '';
      vm.DescripcionStatus = '';
      vm.FechaRegistro = '';

      vm.init = function() {
        var validate = ValidateSession.validate(51);
        if (validate){
          Parametros.query({
            'name': 'Configuracion'
          }).$promise.then(function(data) {
            vm.FechaOperacion = data.filter(function(n) {
              return n.Nombre === 'FechaOperacion';
            })[0];
            vm.fecha = new Date(vm.FechaOperacion.Valor);
            vm.fechaOper = vm.fecha;
            vm.maxDate = new Date(
              vm.fecha.getFullYear(),
              vm.fecha.getMonth(),
              vm.fecha.getDate()
            );
            vm.IvaObj = data.filter(function(n){
              return n.Nombre === 'PorcentajeIVA';
            })[0];
            vm.Iva = parseFloat(vm.IvaObj.Valor);
            vm.reloadData();
          });

          vm.ops = [];
          vm.Originator = {};
        }else{
          location.href = '#/login';
        }
      };

      vm.reloadData = function() {
        borrarFiltros();
        vm.dataset = [];
        vm.loading = true;
        var idUsuario = sessionStorage.getItem('IdUsuario');
        vm.tipoUsuario = sessionStorage.getItem('TipoUsuario');
        vm.fechaHistorico = vm.fecha < vm.fechaOper;
        Ordenes.query({
          'FechaValor': vm.fecha,
          'IdUsuario': idUsuario,
          'IncluirCanceladas': vm.incluirCancel,
          'ConsultaGeneral' : true
        }).$promise.then(function(data) {
          if (data.length === 0) {
            Utils.showToast('No hay registros!');
            vm.loading = false;
          } else {
            vm.dataset = data;
            vm.dataset.forEach(function(oper){
              oper.PayloadExport = JSON.parse(oper.PayloadString);
            });
            vm.loading = false;
          }
        }).catch(function() {
          Utils.showToast('No se encontro el servicio');
          vm.loading = false;
        });
      };
      
      vm.Consultar = function(registro) {
        vm.registro = JSON.parse(registro);
        $mdDialog.show({
          clickOutsideToClose: false,
          escapeToClose: false,
          templateUrl: './views/templates/detalleOperacion.html',
          scope: $scope,
          preserveScope: true,
          parent: angular.element(document.body),
          fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
          controller: function(){
            $scope.registro = vm.registro;
            $scope.viewDialog = function viewDialog(){
              $mdDialog.show({
                skipHide: true,
                scope: $scope,
                preserveScope: true
              });
            };
          }
        });
      };

      vm.incluirCanceladas = function(){
        vm.incluirCancel = !vm.incluirCancel;
        vm.reloadData();
      };

      function borrarFiltros (){
        vm.idSolicitud = '';
        vm.NombreDepartamento = '';
        vm.NombreConceptoOriginal = '';
        vm.NombreContraParte = '';
        vm.IdSistemaExterno = '';
        vm.Instruccion = '';
        vm.Importe = '';
        vm.Sentido = '';
        vm.DescripcionStatus = '';
        vm.FechaRegistro = '';
      }

      vm.Close = function() {
        $mdDialog.hide();
        vm.datos = [];
        vm.descripcion = '';
        vm.motivo = 0;
      };
    }
})();