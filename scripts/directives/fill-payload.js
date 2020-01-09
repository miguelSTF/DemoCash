/*jshint latedef: nofunc */

(function () {
  'use strict';

  angular.module('appCash')
    .directive('fillPayload', fillPayload);

  fillPayload.$inject = ['$compile'];
  /* @ngInject */
  function fillPayload($compile) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        attrs.$observe('payload', function () {
          element.children().remove();
          var html = '';
          if(attrs.payload === undefined || attrs.payload === ''){
            return;
          }
          var elements = JSON.parse(attrs.payload);
          if(elements.length === 0){return;}

          var count = 0;
          html += '<form name=' + '"'+ attrs.formelement + '"'+ ' novalidate>';
          elements.forEach(function(el){
            if(el.element === 'input' && el.type === 'hidden'){
              html += inputHidden(el);
            }
            else if(el.element === 'input' || el.element === 'textarea'){
              if(count % 3 === 0){
                html += '<div layout="row" style="padding-top:5px;">';
              }
              html += el.ngModel === 'mensajeCtrl.Payload.ConceptoPago' || el.ngModel === 'monitorCtrl.Payload.ConceptoPago' ? '<div flex="100" style="padding:5px 5px;" ' : '<div flex="33" style="padding:5px 5px;" ';
              var idControl = el.ngModel.replace('mensajeCtrl.Payload.','').replace('monitorCtrl.Payload.','');
              html += 'ng-class="{' + "'" + 'has-error' + "'" + ':' + attrs.formelement + '.' + idControl + '.$invalid}" >';
              html += input(el);
              html += '</div>';
              html += el.ngModel === 'mensajeCtrl.Payload.ConceptoPago' || el.ngModel === 'monitorCtrl.Payload.ConceptoPago' ? '</div>' : (count+1) % 3 === 0 ? '</div>' : '';
              count = el.ngModel === 'mensajeCtrl.Payload.ConceptoPago' || el.ngModel === 'monitorCtrl.Payload.ConceptoPago' ? 0 : count + 1;
            }else if(el.element === 'select'){
              if(count % 3 === 0){
                html += '<div layout="row" style="padding-top:5px;">';
              }
              html += '<div flex="33" style="padding:5px 5px;">';
              html += select(el);
              html += '</div>';
              if((count+1) % 3 === 0){
                html += '</div>';
              }
              count++;
            }
          });
          html += '</form>';
          element.append($compile(html)(scope));
        });

      function input(el){
        var tag = '';
        tag += validateNullOrEmpty(el.label) ? ('<label>'+ el.label +'</label>') : '';
        tag += validateNullOrEmpty(el.element) ? ('<'+el.element) : '';
        var idControl = el.ngModel.replace('mensajeCtrl.Payload.','').replace('monitorCtrl.Payload.','');
        tag += ' id="'+ idControl + '"' + ' name="' + idControl + '"';
        tag += validateNullOrEmpty(el.type) ? (' type="' + el.type +'"') : '';
        tag += idControl === 'NomOrd' || idControl === 'NomBen' || idControl === 'RfcBen' || idControl === 'RfcOrd' ? ' onkeypress="evaluateCaracter(event)"' : '';
        tag += ' class="form-control" ';
        tag += validateNullOrEmpty(el.length) ? ('maxlength="' + el.length + '"') : '';
        tag += validateNullOrEmpty(el.default) ? (' ng-init="' + el.ngModel +'=\''+ el.default + '\'" ') : '  ';
        tag += '  ng-disabled="' + el.disable + '"';
        tag += top(el);
        tag += bottom(el);
        return tag;
      }

      function inputHidden(el){
        var tag = '';
        tag += validateNullOrEmpty(el.element) ? ('<'+el.element) : '';
        tag += ' type="text"';
        tag += validateNullOrEmpty(el.default) ? (' ng-init="' + el.ngModel +'=\''+ el.default + '\'"') : '';
        tag += ' ng-hide="true"';
        tag += validateNullOrEmpty(el.ngModel) ? (' ng-model="' + el.ngModel + '"') : '';
        tag += bottom(el);
        return tag;
      }

      function select(el){
        var tag = '';
        tag += '<md-input-container>';
        tag += validateNullOrEmpty(el.label) ? ('<label>'+ el.label +'</label>') : '';
        tag += '<md-select class="ng-pristine ng-empty ng-invalid ng-invalid-required ng-touched"';
        tag += top(el);
        tag += (el.required === '1' ? ' required' : ' ');
        tag += '>';
        el.options.forEach(function(val){
          tag += '<md-option value="'+ val.Id +'">'+ val.Nombre +'</md-option>';
        });
        tag += '</md-select>';
        tag += '</md-input-container>';
        return tag;
      }

      function top(el){
        var tag = '';
        tag += ' style="';
        tag += validateNullOrEmpty(el.height) ? ('height:' + el.height + ';'): '';
        tag += validateNullOrEmpty(el.width) ? ('width:' + el.width + ';') : '';
        tag += validateNullOrEmpty(el.style) ? (' ' + el.style + '') : '';
        tag += '"';
        tag += validateNullOrEmpty(el.title) ? (' title="' + el.title + '"') : '';
        tag += validateNullOrEmpty(el.action) ? (' ' + el.action + '') : '';
        tag += validateNullOrEmpty(el.ngModel) ? (' ng-model="' + el.ngModel + '"') : '';
        tag += 'ng-disabled="' + el.disable + '"';
        tag += validateNullOrEmpty(el.extension) ? (' ' + el.extension + '') : '';
        if(validateNullOrEmpty(el.ngModel) && validateNullOrEmpty(el.format)){
          tag += ' format="{{'+ el.ngModel +'}}" tipo="' + el.format +'"' ;
        }
        return tag;
      }

      function bottom(el){
        var tag = '';
        tag += (el.required === '1' ? ' required' : ' ');
        tag += ' ></'+el.element+'>';
        return tag;
      }

      function validateNullOrEmpty(str){
        return (str || 0 !== str.length);
      }
     }
    };
  }
}());
