(function () {
  'use strict';

  angular.module('appCash')
  .directive('adminMask', adminMask);

  function adminMask(){
      return {
     restrict: 'A',
     link:function(scope, element, attr){
       scope.$watch(attr.ngModel, function (currentValue) {
         if(currentValue === undefined || currentValue === null){
           return;
         }
         element.attr('maxlength', attr.mask.length);
           var newValue = (currentValue.length !== attr.mask) ?
               maskApply(currentValue, attr.mask, attr.maskChar) :
               currentValue;
           if(element[0].localName === 'input'){
              element.val(newValue);
           }else{
             element[0].innerHTML = newValue;
           }
           scope.ngModel = newValue;
       });
     }
   };

   function maskApply(value, mask, maskChar){

       if(value === '') {
         return '';
       }

       var maskDiv = mask.split(maskChar);
       var reFinal = new RegExp('\\' + maskChar, 'g');
       var pristineValue = value.replace(reFinal, '');
       var newValue = '';
       maskDiv.forEach(function(val, id, array){
         if(pristineValue.length < 0 || newValue.length === mask.length || pristineValue.length === 0) {
           return;
         }
         newValue += pristineValue.substring(0, val.length) + ((id === array.length - 1) ? '' : maskChar);
         pristineValue = pristineValue.substring(val.length, pristineValue.length);
       });
   return newValue;
   }
 }
}());
