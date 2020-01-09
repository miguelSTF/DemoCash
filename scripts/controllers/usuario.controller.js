(function () {
  'use strict';

  angular.module('appCash')
    .controller('UsuarioController', UsuarioController);

  /* @ngInject */
  function UsuarioController($mdDialog, $mdMedia, $filter, Usuarios, UsuariosP, $scope, Log, Utils, Perfiles, Catalogos, VerificarReg, ValidateSession, Parametros, Login) {

    var objetoPreUpload;
    var vm = this;
    var maskChar = '-';
    vm.passwordIsValid = false;
    vm.passwordConfirmIsValid = false;
    vm.SeguridadLocalArray = [];

    vm.catalogo = {
      id: 1,
      name: 'relaciones/UsuarioDepartamento',
      catalogId: 'IdUsuario',
      catalogRelation: 'Departamento',
      orderby: 'Nombre'
    };

    vm.tiposUsuario = [{
      Id: 0,
      Nombre: 'Operador'
    }, {
      Id: 1,
      Nombre: 'Supervisor'
    }, {
      Id: 2,
      Nombre: 'Tesorero'
    }];

    vm.loading = true;
    vm.readOnlyEditDiv = false;
    vm.formDirty = false;
    vm.formDirtyPerfil = false;
    vm.formDirtyDepto = false;
    vm.disabledSave = false;
    vm.datosUsuario = [];
    vm.newEdit = newEdit;
    vm.saveEdit = saveEdit;
    vm.watch = watch;
    vm.del = del;
    vm.edit = edit;
    vm.insert = 0;
    vm.searchPerfil = '';
    vm.searchDepa = '';
    vm.permisoGeneral = false;
    vm.permisoContable = false;

    vm.init = function () {
      var validate = ValidateSession.validate(7);
      if (validate){
	      Catalogos.getList({
	        'name': 'configuracion'
	      }).$promise.then(function (data) {
	        vm.modoLogin = data.filter(function (item) {
	          if (item.Nombre === 'ModoAutenticacion') {
	            return item;
	          }
	        })[0].Valor;
	        vm.conceptos = [];
	        Catalogos.query({
	          'name': 'Configuracion',
	          'Nombre': 'MascaraCuentaContable'
	        })
	        .$promise
	        .then(function (resultado) {
	          if (resultado.length <= 0) {
	            Utils.showToast('No hay mascara para el Usuario');
	          }
	          vm.mascara = resultado[0].Valor;
	          Usuarios.query({
	            'name': vm.catalogo.catalogRelation,
	            'orderby': 'Nombre'
	          }).$promise.then(function (response) {
	            vm.departamentos = response;
	            vm.datosUsuario = JSON.parse(JSON.stringify(response));
	            Usuarios.query({
	              'name': 'Concepto',
	              'Activo': 3,
	              'orderby': 'Nombre'
	            }).$promise.then(function (response) {
	              response.forEach(function (item) {
	                if ((item.Categoria === 2 || item.Categoria === 3) && item.Activo === 2) {
	                  vm.conceptos.push(item);
	                }
	              });
	              Usuarios.query({
	                'name': 'DepartamentoConcepto'
	              }).$promise.then(function (response) {
	                vm.departamentoConcepto = response;
	                vm.datosUsuario.forEach(function (data) {
	                  data.Conceptos = JSON.parse(JSON.stringify(vm.conceptos));
	                  vm.departamentoConcepto.forEach(function (item) {
	                    if (data.IdDepartamento === item.IdDepartamento) {
	                      data.Conceptos.forEach(function (cepto) {
	                        if (cepto.IdConcepto === item.IdConcepto) {
	                          cepto.relacionDepa = true;
	                        }
	                      });
	                    }
	                  });
	                });
	                Parametros.query({
	                  'name': 'ConfiguracionSeguridadLocal'
	                }).$promise.then(function (dataSeg) {
	                  vm.SeguridadLocalArray = dataSeg;
	                })
	              });
	            });
	            loadUsuarios();
	            loadTiposPerfil();
	            vm.permisoGeneral = vm.getPermisos(21);
	            vm.permisoContable = vm.getPermisos(22);
	            vm.loading = false;
	          })
	          .catch(function () {
	            Utils.showToast('No se encontró el Servicio!!');
	            vm.loading = false;
	          });
	        });
	      })
	      .catch(function(error){
	        Utils.showToast(' No se encontro el Servicio!!');
	        console.error('Error: ' + JSON.stringify(error));
	      });
	     }else {
        location.href = '#/login';
      	}
    };

    vm.getPermisos = function (permiso) {
      var idPantalla = 7;
      var permisos = [];
      JSON.parse(sessionStorage.getItem('Menu')).forEach(function (item) {
        item.SubMenus.forEach(function (sub) {
          if (sub.IdPermiso === idPantalla) {
            permisos = sub.Permiso;
          }
        });
      });
      var indexOf = permisos.indexOf(permiso);
      return indexOf >= 0;
    };

    function loadUsuarios() {
      Usuarios.query({
          'name': vm.catalogo.name,
          'orderby': vm.catalogo.orderby
        }).$promise
        .then(function (resultado) {
          if (resultado.length <= 0) {
            Utils.showToast('No hay usuarios registrados!');
          } else {
            vm.usuarios = resultado;
          }
        })
        .catch(function (response) {
          Utils.showToast('No se encontró el Servicio!!');
          console.error('Error: ' + JSON.stringify(response));
          vm.loading = false;
        });
    }

    function loadTiposPerfil() {
      Perfiles.query({
          'name': 'TipoPerfil'
        }).$promise.then(function (resultado) {
          vm.tipoPerfiles = resultado;
        })
        .catch(function () {
          Utils.showToast('No se encontró el Servicio!!');
        });
    }

    function watch(row) {
      resetForm(true);
      vm.readOnlyEditDiv = true;
      vm.Consultar();
      vm.userEdit = row;
      vm.showSelected();
    }

    function edit(row) {
      resetForm(true);
      vm.readOnlyEditDiv = false;
      vm.userEdit = row;
      var depaBitacora = [];
      var ceptoBitacora = [];
      row.IdDepartamentos.forEach(function (item) {
        vm.departamentos.forEach(function (data) {
          if (data.IdDepartamento === item) {
            depaBitacora.push(data.Nombre);
          }
        });
      });
      row.IdConceptos.forEach(function (item) {
        vm.conceptos.forEach(function (data) {
          if (data.IdConcepto === item) {
            ceptoBitacora.push(data.Nombre);
          }
        });
      });
      objetoPreUpload = {
        'DatosUsuario': row.Usuario,
        'Departamentos': depaBitacora.toString(),
        'Conceptos': ceptoBitacora.toString()
      };
      vm.insert = 0;
      vm.passwordIsValid = true;
      vm.passwordConfirmIsValid = true;
      vm.userEdit.Usuario.passwordConfirm = vm.userEdit.Usuario.Password;
      vm.showSelected();
      vm.Consultar();
    }

    vm.showSelected = function () {
      vm.tiposPerfiles = [];
      vm.perfilesUsuarioF = [];

      Perfiles.query({
        'name': 'TipoPerfil',
        'orderby': 'Clave'
      }).$promise.then(function (respuesta) {
        vm.perfilesUsuarioF = respuesta;
        Perfiles.query({
          'name': 'PerfilUsuario',
          'IdUsuario': vm.userEdit.Usuario.Id43S4301R1731
        }).$promise.then(function (respuesta) {
          vm.perfilesUsuario = respuesta;

          vm.perfilesUsuarioF.forEach(function (tipoperfil, i) {
            vm.perfilesUsuario.forEach(function (perfilusuario) {
              if (tipoperfil.IdTipoPerfil === perfilusuario.IdPerfil) {
                var perfilSelected = {
                  'IdTipoPerfil': tipoperfil.IdTipoPerfil,
                  'Clave': tipoperfil.Clave,
                  'Selected': true
                };
                vm.perfilesUsuarioF[i] = perfilSelected;
              }
            });
          });
          vm.depa = [];
          vm.userEdit.IdDepartamentos.forEach(function (item) {
            vm.datosUsuario.forEach(function (data) {
              if (data.IdDepartamento === item) {
                vm.depa.push(data);
              }
            });
          });
          vm.depa.forEach(function (data) {
            data.Conceptos.forEach(function (res) {
              res.Selected = false;
            });
          });
          vm.depa.sort(sortDeptos);
          vm.userEdit.IdConceptos.forEach(function (item) {
            vm.depa.forEach(function (data) {
              data.Conceptos.forEach(function (res) {
                if (res.relacionDepa) {
                  if (res.IdConcepto === item) {
                    res.Selected = true;
                  }
                }
              });
            });
          });
        });
      });
    };

    function sortDeptos(a, b) {
      if (a.Nombre < b.Nombre) {
        return -1;
      }
      if (a.Nombre > b.Nombre) {
        return 1;
      }
      return 0;
    }

    function newEdit() {
      Perfiles.query({
        'name': 'TipoPerfil',
        'orderby': 'Clave'
      }).$promise.then(function (respuesta) {
        vm.perfilesUsuarioF = respuesta;
      });
      vm.datosUsuario.forEach(function (data) {
        data.Conceptos.forEach(function (item) {
          item.Selected = false;
        });
      });
      resetForm(false);
      vm.Consultar();
      vm.insert = 1;

    }

    vm.checkDataReg = function () {
      vm.validateClaveUserLenght(vm.userEdit.Usuario.Clave);
      if (vm.modoLogin === '1' && vm.userEdit.Usuario.Id43S4301R1731 > 0){
        vm.passwordIsValid = true;
        vm.userEdit.Usuario.Password = '';
        vm.userEdit.Usuario.passwordConfirm = '';
      }else{
        if (vm.userValidLenght){
          vm.validatePassword();
        }
      }
      if (vm.userValidLenght){
        if (vm.passwordIsValid) {
          if (vm.userEdit.Usuario.Password === vm.userEdit.Usuario.passwordConfirm) {
            vm.disabledSave = true;
            vm.loading = true;
            vm.idsRegistros = [];
            var paramsToSearch = {
              'filtro': 'Clave',
              'valor': vm.userEdit.Usuario.Clave
            };
            VerificarReg.query({
              'name': 'Us4301R1731'
            }, paramsToSearch).$promise.then(function (respuesta) {
              vm.usuariosExistentes = respuesta;

              if (vm.userEdit.Usuario.Id43S4301R1731 !== undefined) {
                if (vm.usuariosExistentes.length > 0) {
                  vm.usuariosExistentes.forEach(function (data) {
                    vm.idsRegistros.push(data.Id43S4301R1731);
                  });
                  var index = vm.idsRegistros.indexOf(vm.userEdit.Usuario.Id43S4301R1731);
                  if (index > -1) {
                    saveEdit();
                  } else {
                    Utils.showToast('La Clave de usuario ya existe, verifique por favor!');
                    vm.loading = false;
                    vm.disabledSave = false;
                  }
                } else {
                  saveEdit();
                }
              } else {
                if (vm.usuariosExistentes.length > 0) {
                  Utils.showToast('La Clave de usuario ya existe, verifique por favor!');
                  vm.loading = false;
                  vm.disabledSave = false;
                } else {
                  saveEdit();
                }
              }
            });
          } else {
            Utils.showToast('La contraseña y la confirmación deben ser iguales');
          }
        }
      }
    };

    function saveEdit() {
      if (vm.userEdit.Usuario.CuentaContable !== undefined && vm.userEdit.Usuario.CuentaContable !== null) {
        var reFinal = new RegExp('\\' + maskChar, 'g');
        vm.userEdit.Usuario.CuentaContable = vm.userEdit.Usuario.CuentaContable.replace(reFinal, '');
      }
      vm.relaciones = {
        Usuario: vm.userEdit.Usuario,
        IdDepartamentos: [],
        IdPerfiles: [],
        IdConceptos: []
      };
      vm.bitacora = {
        Departamentos: [],
        Conceptos: []
      };
      var Perfiles = [];
      vm.depa.forEach(function (item) {
        vm.relaciones.IdDepartamentos.push(item.IdDepartamento);
        vm.bitacora.Departamentos.push(item.Nombre);
      });
      vm.depa.forEach(function (item) {
        item.Conceptos.forEach(function (data) {
          if (data.Selected === true) {
            vm.relaciones.IdConceptos.push(data.IdConcepto);
            vm.bitacora.Conceptos.push(data.Nombre);
          }
        });
      });

      if (vm.userEdit.Perfiles === undefined) {
        Utils.showToast('Seleccione un perfil para el usuario');
      } else {
        vm.userEdit.Perfiles.forEach(function (perfil) {
          var idPerfil = perfil.IdTipoPerfil;
          vm.relaciones.IdPerfiles.push(idPerfil);
          Perfiles.push(perfil.Clave);
        });
        if (vm.userEdit.Usuario.Activo === undefined) {
          vm.userEdit.Usuario.Activo = 0;
        }

        var objetoBitacora = {
          'DatosUsuario': vm.userEdit.Usuario,
          'Departamentos': vm.bitacora.Departamentos.toString(),
          'Conceptos': vm.bitacora.Conceptos.toString(),
          'Perfiles': Perfiles.toString()
        };

        if (vm.insert === 0) {
          var preUpdatePerfil = [];
          vm.perfilesUsuarioF.filter(function (item) {
            if (item.Selected) {
              preUpdatePerfil.push(item.Clave);
            }
          });
          objetoPreUpload.Perfiles = preUpdatePerfil.toString();
        }
        var key = CryptoJS.enc.Utf8.parse('69B9c7D1e0F0g4H@');
        var iv = CryptoJS.enc.Utf8.parse('@1B2c3D4e5F6g7H8');
        var encryptedpassword;
        encryptedpassword = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(vm.userEdit.Usuario.Password), key,
          {
            keySize: 128 / 8,
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          });

        vm.relaciones.Usuario.P01Ss = encryptedpassword.toString();

        UsuariosP.send(vm.relaciones).$promise.then(function () {
          
          delete objetoBitacora.DatosUsuario.Password;
          delete objetoBitacora.DatosUsuario.passwordConfirm;
          delete objetoBitacora.DatosUsuario.P01Ss;
        
          if (vm.insert === 1) {
            vm.loading = true;
            Log.storeData('Insert: Se inserto al usuario: ' + vm.relaciones.Usuario.Clave, 'Usuarios', objetoBitacora, 'Auditoria', 'Insert').then(function () {
              Utils.showToast('Registro almacenado correctamente!');
              resetDatosUser();
              setTimeout(function () {
                resetForm(true);
                vm.loading = false;
              }, 1500);
            })
            .catch(function () {
              timeoutValidacion();
            });
          } else {
            vm.loading = true;
            Log.storeData('PreUpdate: Se hara update al usuario: ' + objetoPreUpload.DatosUsuario.Clave, 'Usuarios', objetoPreUpload, 'Auditoria', 'Update').then(function () {
              Log.storeData('Update: El usuario ' + vm.relaciones.Usuario.Clave + ' ha sido modificado', 'Usuarios', objetoBitacora, 'Auditoria', 'Update').then(function () {
                Utils.showToast('Registro almacenado correctamente!');
                resetDatosUser();
                setTimeout(function () {
                  resetForm(true);
                  vm.loading = false;
                }, 1500);
              })
              .catch(function () {
                timeoutValidacion();
              });
            })
            .catch(function () {
              timeoutValidacion();
            });
          }
        })
        .catch(function () {
          Utils.showToast('Error al guardar el registro!');
          vm.loading = false;
          vm.disabledSave = false;
        });
      }
    }

    function timeoutValidacion() {
      Utils.showToast('No se encontró el Servicio de Bitácora!!');
      Utils.showToast('Registro almacenado correctamente!');
      setTimeout(function () {
        resetForm(true);
        vm.loading = false;
      }, 1500);
    }

    function del(row) {
      var confirm = $mdDialog.confirm()
        .title('Atención')
        .textContent('¿Realmente quiere eliminar el registro seleccionado?')
        .ariaLabel('Lucky day')
        .ok('Eliminar')
        .cancel('Regresar');
      $mdDialog.show(confirm).then(function () {
        confirmDelete(row);
      });
    }

    function confirmDelete(row) {
      resetForm(false);
      Usuarios.delete({
        'name': 'Us4301R1731',
        'id': row.Usuario.Id43S4301R1731
      }, function (data) {
        var response = data;
        Utils.showToast(response.Message);
        loadUsuarios();
        vm.loading = false;
      });
      delete row.Usuario.P01Ss;
      Log.storeData('Deleted: Se elimino al usuario: ' + row.Usuario.Clave, 'Usuarios', row.Usuario, 'Auditoria', 'Delete').then(function () {}).catch(function () {
        Utils.showToast('No se encontró el Servicio de Bitácora!!');
      });
    }

    vm.selectAll = function (depto) {
      if (!vm.readOnlyEditDiv && vm.permisoGeneral) {
        var nCeptos = getNCeptos(depto);
        var nSelected = getNSelected(depto);
        if (nCeptos === nSelected) {
          selectAllChange(depto, false);
        } else {
          selectAllChange(depto, true);
        }
      }
    };

    function selectAllChange(depto, valor) {
      depto.Conceptos.forEach(function (cepto) {
        if (cepto.relacionDepa) {
          cepto.Selected = valor;
        }
      });
    }

    function getNCeptos(depto) {
      var nSubmenus = 0;
      depto.Conceptos.forEach(function (cepto) {
        if (cepto.relacionDepa) {
          nSubmenus = nSubmenus + 1;
        }
      });
      return nSubmenus;
    }

    function getNSelected(depto) {
      var nSelected = 0;
      depto.Conceptos.forEach(function (cepto) {
        if (cepto.Selected) {
          nSelected = nSelected + 1;
        }
      });
      return nSelected;
    }

    function resetForm(reload) {
      vm.depa = [];
      vm.formDirty = false;
      vm.formDirtyPerfil = false;
      vm.formDirtyDepto = false;
      vm.readOnlyEditDiv = false;
      $mdDialog.hide();
      vm.userEdit = null;
      vm.showDiv = false;
      vm.disabledSave = false;
      if (reload) {
        vm.depa = [];
        loadUsuarios();
      }
    }

    $scope.$on('$locationChangeStart', function (event) {
      if (vm.UsuarioForm.$dirty && sessionStorage.CerrandoSesion === undefined) {
        var answer = window.confirm('Hay cambios pendientes de guardar ¿Deseas descartarlos?');
        if (!answer) {
          event.preventDefault();
        }
      }
      return;
    });

    vm.handleKeyup = function (ev) {
      ev.stopPropagation();
    };

    vm.Consultar = function () {
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/usuario-edit.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function () {
          vm.viewDialog = function viewDialog() {
            if (!vm.readOnlyEditDiv) {
              if (vm.formDirty || vm.formDirtyPerfil || vm.formDirtyDepto) {
                $mdDialog.show({
                  skipHide: true,
                  controllerAs: 'usuarioCtrl',
                  controller: function ($scope) {
                    $scope.viewDialog = function () {
                      $mdDialog.hide();
                    };
                    $scope.close = function () {
                      resetDatosUser();
                      $mdDialog.hide();
                      resetForm(true);
                    };
                  },
                  templateUrl: './views/templates/dialog-confirm.html'
                });
              } else {
                $mdDialog.hide();
                resetForm(false);
              }
            } else {
              $mdDialog.hide();
              resetForm(false);
            }
          };
        },
      });
    };

    vm.checkDirty = function () {
      return vm.formDirty || vm.formDirtyDepto || vm.formDirtyPerfil;
    };

    function resetDatosUser() {
      vm.datosUsuario.forEach(function (data) {
        data.Conceptos.forEach(function (res) {
          res.Selected = false;
        });
      });
    };

    vm.validatePassword = function () {
      if (vm.modoLogin === '1'){
        vm.passwordIsValid = false;
        var pswd = vm.userEdit.Usuario.Password;
        vm.passwordIsValid = ValidatePasswordLength(pswd) && ValidateAllowedCharacters(pswd) && ValidateCapitalCaseCharacters(pswd) && ValidateMinimumLowerCaseCharacters(pswd) &&
          ValidateMinimumNumericCharacters(pswd) && ValidateMinimumSpecialCharacters(pswd) && ValidateHasMiddleCapitalChars(pswd) && ValidateHasMiddleLowerChars(pswd) &&
          ValidateHasMiddleNumericChars(pswd) && ValidateHasMiddleSpecialChars(pswd);
      }else{
        vm.passwordIsValid = true;
      }
    };

    function ValidatePasswordLength(pswd) {
      var minLength = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'CaracteresMin') {
          return item;
        }
      });

      var maxLength = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'CaracteresMax') {
          return item;
        }
      });
      var lenghtValid = pswd.length >= minLength[0].Valor && pswd.length <= maxLength[0].Valor;
      if (lenghtValid === false) {
        Utils.showToast('La contraseña debe tener de ' + minLength[0].Valor + ' a ' + maxLength[0].Valor + ' caracteres');
      }
      return lenghtValid;
    };

    vm.validateClaveUserLenght = function (clave){
      if(vm.modoLogin === '0'){
        vm.userValidLenght = true;
        return vm.userValidLenght;
      }else{
        var minLength = vm.SeguridadLocalArray.filter(function (item) {
          if (item.Nombre === 'CaracteresMin_43SR') {
            return item;
          }
        });
  
        var maxLength = vm.SeguridadLocalArray.filter(function (item) {
          if (item.Nombre === 'CaracteresMax_43SR') {
            return item;
          }
        });
        vm.userValidLenght = clave.length >= minLength[0].Valor && clave.length <= maxLength[0].Valor;
        if (vm.userValidLenght === false){
          Utils.showToast('La clave del usuario debe tener de ' + minLength[0].Valor + ' a ' + maxLength[0].Valor + ' caracteres');
        }
        return vm.userValidLenght;
      }
    };

    function ValidateAllowedCharacters(pswd) {
      var allowedCharacters = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'CaracteresPermitidos') {
          return item;
        }
      });

      if (allowedCharacters[0].Valor === '1') {//Permite mayúsculas y minúsculas No valida nada
        return true;
      } 
      else if (allowedCharacters[0].Valor === '2') //Permite solo mayúsculas
      { 
        var regex = new RegExp('[a-z]');
        var hasLowerCaseChars = regex.test(pswd);
        if (hasLowerCaseChars) {
          Utils.showToast('La contraseña debe contener solo mayúsculas');
          return false;
        }
      } 
      else if (allowedCharacters[0].Valor === '3') //Permite solo minúsculas
      { 
        var regex = new RegExp('[A-Z]');
        var hasCapitalChars = regex.test(pswd);
        if (hasCapitalChars) {
          Utils.showToast('La contraseña debe contener solo minúsculas');
          return false;
        }
      }
      return true;
    };

    function ValidateCapitalCaseCharacters(pswd) {
      var minCapitalChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'NumMinMayusculas') {
          return item;
        }
      });
      var capitalCase = GetNumberOfMatches(pswd, '[A-Z]') >= parseInt(minCapitalChars[0].Valor);
      if (capitalCase === false) {
        var plural = minCapitalChars[0].Valor > 1 ? 's' : '';
        Utils.showToast('La contraseña dede contener mínimo ' + minCapitalChars[0].Valor + ' mayúscula' + plural);
      }
      return capitalCase;
    };

    function ValidateMinimumLowerCaseCharacters(pswd) {
      var minLowerChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'NumMinMinusculas') {
          return item;
        }
      });
      var lowerCase = GetNumberOfMatches(pswd, '[a-z]') >= parseInt(minLowerChars[0].Valor);
      if (lowerCase === false) {
        var plural = minLowerChars[0].Valor > 1 ? 's' : '';
        Utils.showToast('La contraseña dede contener mínimo ' + minLowerChars[0].Valor + ' minúscula' + plural);
      }
      return lowerCase;
    };

    function ValidateMinimumNumericCharacters(pswd) {
      var numMinNumericChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'NumMinCaracteresNum') {
          return item;
        }
      });
      var numericChars = GetNumberOfMatches(pswd, '[0-9]') >= parseInt(numMinNumericChars[0].Valor);
      if (numericChars === false) {
        var plural = numMinNumericChars[0].Valor > 1 ? 's' : '';
        Utils.showToast('La contraseña debe contener mínimo ' + numMinNumericChars[0].Valor + ' número' + plural);
      }
      return numericChars;
    };

    function ValidateMinimumSpecialCharacters(pswd) {
      var numMinSpecialChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'NumMinCaracteresEspeciales') {
          return item;
        }
      });
      var specialChars = GetNumberOfMatches(pswd, '[^a-zA-Z0-9]') >= parseInt(numMinSpecialChars[0].Valor);
      if (specialChars === false) {
        var plural = numMinSpecialChars[0].Valor > 1 ? 'es' : '';
        Utils.showToast('La contraseña debe contener mínimo ' + numMinSpecialChars[0].Valor + ' caracter' + plural + ' especial' + plural);
      }
      return specialChars;
    };

    function GetNumberOfMatches(strPassword, regexString) {
      var pswdArray = strPassword.split('');
      var countMatches = 0;
      var regex = new RegExp(regexString);

      pswdArray.forEach(function (c) {
        if (regex.test(c)) {
          countMatches++;
        };
      });
      return countMatches;
    };

    function ValidateHasMiddleCapitalChars(pswd) {
      var numMinSpecialChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'RequiereMayusIntermedias') {
          return item;
        }
      });

      if (numMinSpecialChars[0].Valor === 'true') {
        var middleChars = checkMiddleChars(pswd, '[A-Z]');
        if (middleChars === false) {
          Utils.showToast('La contraseña debe contener mayúsculas intermedias');
        }
        return middleChars;
      }
      return true;
    };

    function ValidateHasMiddleLowerChars(pswd) {
      var numMinSpecialChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'RequiereMinusIntermedias') {
          return item;
        }
      });

      if (numMinSpecialChars[0].Valor === 'true') {
        var middleChars = checkMiddleChars(pswd, '[a-z]');
        if (middleChars === false) {
          Utils.showToast('La contraseña debe contener minúsculas intermedias');
        }
        return middleChars;
      }
      return true;
    };

    function ValidateHasMiddleNumericChars(pswd){
      var validateMiddleNumbers = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'RequiereNumIntermedios') {
          return item;
        }
      });

      if (validateMiddleNumbers[0].Valor === 'true') {
        var middleNumbers = checkMiddleChars(pswd, '[0-9]');
        if (middleNumbers === false) {
          Utils.showToast('La contraseña debe contener números intermedios');
        }
        return middleNumbers;
      }
      return true;
    };

    function ValidateHasMiddleSpecialChars(pswd) {
      var numMinSpecialChars = vm.SeguridadLocalArray.filter(function (item) {
        if (item.Nombre === 'RequiereCaracteresEspeciales') {
          return item;
        }
      });

      if (numMinSpecialChars[0].Valor === 'true') {
        var specialChars = checkMiddleChars(pswd, '[^a-zA-Z0-9]');
        if (specialChars === false) {
          Utils.showToast('La contraseña debe contener caracteres especiales intermedios');
        }
        return specialChars;
      }
      return true;
    };

    function checkMiddleChars(strToCheck, regexString) {
      var pswdArray = strToCheck.split('');
      var regex = new RegExp(regexString);
      var minLength = 3;

      if (pswdArray.length >= minLength) {
        var firstMiddlePosition = 1;
        var lastPosition = pswdArray.length - 1;
        for (var i = firstMiddlePosition; i < lastPosition; i++) {
          if (regex.test(pswdArray[i])) {
            return true;
          }
        }
        return false;
      }
      return false;
    };

    vm.showContrasena = function() {
      var input1 = document.getElementById('PasswordUser');
      var input2 = document.getElementById('PasswordConfirmUser');

      if (input1.type && input2.type === 'password') {
        input1.type = 'text';
        input2.type = 'text';
      } else {
        input1.type = 'password';
        input2.type = 'password';
      }
    };

    vm.ShowInfoSeg = function (row) {
      vm.showDataPC = false;
      vm.userEdit = row;
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/infoUserSeg.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function () {
        },
      });
    };

    vm.CloseInfoSeg = function () {
      $mdDialog.hide();
    };

    vm.ClearSessionsConfirm = function(){
      var confirm = createConfirm('¿Desea limpiar las sesiones del usuario: ' + vm.userEdit.Usuario.Clave + ' ?', 'SI', 'NO');
      $mdDialog.show(confirm)
        .then(function() {
          vm.ClearSessions();
        });
    };

    vm.ClearSessions = function(){
      Login.validate({'name':'limpiarSesiones'},{'43S4301R1731':vm.userEdit.Usuario.Clave, 'userAuth':sessionStorage.Clave})
        .$promise
        .then(function(ans){
          if(ans.Error !== undefined){
            Utils.showToast(ans.Error);
          }else{
            Utils.showToast('Se limpiaron las sesiones de manera correcta');
            loadUsuarios();
          }
        })
        .catch(function(error){
          console.error(error);
          Utils.showToast('No se encontró el Servicio!!');
        });
    };

    vm.UnlockUserConfirm = function(){
      var confirm = createConfirm('¿Desea desbloquear al usuario: ' + vm.userEdit.Usuario.Clave + ' ?', 'SI', 'NO');
      $mdDialog.show(confirm)
        .then(function() {
          vm.UnlockUser();
        });
    };

    vm.UnlockUser = function(){
      Login.validate({'name':'desbloquear'},{'43S4301R1731':vm.userEdit.Usuario.Clave, 'userAuth':sessionStorage.Clave})
        .$promise
        .then(function(ans){
          if(ans.Error !== undefined){
            Utils.showToast(ans.Error);
          }else{
            Utils.showToast('Se desbloqueo al usuario de manera correcta');
            loadUsuarios();
          }
        })
        .catch(function(error){
          console.error(error);
          Utils.showToast('No se encontró el Servicio!!');
        });
    };

    vm.ShowChangePass = function () {
      vm.passwordIsValid = false;
      vm.passwordConfirmIsValid = false;
      vm.passwordNewToChange = null;
      vm.passwordNewToChangeConfirm = null;
      $mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        templateUrl: './views/templates/changePassUser.html',
        scope: $scope,
        preserveScope: true,
        parent: angular.element(document.body),
        fullscreen: ($mdMedia('sm') || $mdMedia('xs')) && $mdMedia('xs') || $mdMedia('sm'),
        controller: function () {
        },
      });
    };

    vm.ValidPassChange = function () {
      vm.passwordIsValid = false;
      var passChange = vm.passwordNewToChange;
      vm.passwordIsValid = ValidatePasswordLength(passChange) && ValidateAllowedCharacters(passChange) && ValidateCapitalCaseCharacters(passChange) && ValidateMinimumLowerCaseCharacters(passChange) &&
        ValidateMinimumNumericCharacters(passChange) && ValidateMinimumSpecialCharacters(passChange) && ValidateHasMiddleCapitalChars(passChange) && ValidateHasMiddleLowerChars(passChange) &&
        ValidateHasMiddleNumericChars(passChange) && ValidateHasMiddleSpecialChars(passChange);
    };

    vm.validateConfirmPassword = function () {
      vm.passwordConfirmIsValid = (vm.passwordNewToChange === vm.passwordNewToChangeConfirm) && vm.passwordIsValid;
    };

    vm.SaveChangePass = function (){
      vm.ValidPassChange();
      if (vm.passwordIsValid) {
        if (vm.passwordNewToChange === vm.passwordNewToChangeConfirm) {
          var key = CryptoJS.enc.Utf8.parse('69B9c7D1e0F0g4H@');
          var iv = CryptoJS.enc.Utf8.parse('@1B2c3D4e5F6g7H8');

          var encryptedpassword;
          encryptedpassword = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(vm.passwordNewToChange), key,
            {
              keySize: 128 / 8,
              iv: iv,
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7
            });
          Login.validate({ 'name': 'cambioContrasena' }, { '43S4301R1731': vm.userEdit.Usuario.Clave, 'P01SS': encryptedpassword.toString(), 'userAuth': sessionStorage.Clave })
            .$promise
            .then(function (ans) {
              if (ans.Error === '') {
                Utils.showToast('El cambio de contraseña fue satisfactorio');
                vm.CloseInfoSeg();
              } else {
                Utils.showToast(ans.Error);
                loadUsuarios();
              }
            })
            .catch(function (error) {
              console.error(error);
              Utils.showToast('No se encontró el Servicio!!');
            });
        } else {
          Utils.showToast('La contraseña y la confirmación deben ser iguales');
        }
      }
    };
    
    function createConfirm(dialog, btnOk, btnNot) {
      return $mdDialog
        .confirm()
        .title('Atención')
        .textContent(dialog)
        .ariaLabel('Lucky day')
        .ok(btnOk)
        .cancel(btnNot);
    }
  }
})();
