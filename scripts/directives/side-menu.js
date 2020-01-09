/*jshint latedef: nofunc */

(function () {
  'use strict';

  angular.module('appCash')
    .directive('sideNav', sideNav);

  sideNav.$inject = ['$compile'];
  /* @ngInject */
  function sideNav($compile) {
    return {
      restrict: 'A',
    link: function(scope, element, attrs) {
        var menuSettings = null;
        attrs.$observe('menuSettings', function(value){
            if (value !== '') {
              menuSettings = JSON.parse(value);
              var menuContentHtml = '';
              menuSettings.forEach(function(parent){
                var headerHtml = '';
                var contentHtml = '';
                var footerHtml = '';
                var title = parent.Title;
                headerHtml = '<ul style="margin-bottom:0px;">'+
                              '<li class="ng-scope li-border-bottom" style="width:100%;" ng-click="toggle($event)">'+
                                '<md-button class="md-primary md-raised" style="text-transform: none;">'+
                                  '<div layout="row">'+
                                    '<div class="menu-align" flex="80">'+title+'</div>'+
                                    '<div flex="20"><span class="glyphicon glyphicon-chevron-down"></span></div>'+
                                  '</div>'+
                                '</md-button>';
                parent.SubMenus.forEach(function(child){
                  var subTitle = child.Title;
                  var route = child.Route;
                  var action = child.Action;
                    contentHtml += '<ul class="animate-show">'+
                                  '<li class="ng-scope" style="width:100%">'+
                                      '<md-button href="'+route+'" class="md-primary md-raised" style="text-align:left;padding-left:25px;text-transform: none;"' + ' ng-click="setSubmenuTitle('+ "'" +subTitle.toString() + "'" +')"' + 'flex ' + action + '>'+
                                      subTitle+
                                    '</md-button>'+
                                  '</li>'+
                                '</ul>';
                });
                footerHtml =  '</li>'+
                             '</ul>'+
                             '<md-divider></md-divider>';
                menuContentHtml += (headerHtml + contentHtml + footerHtml);
              });
              element.append($compile(menuContentHtml)(scope));

              scope.toggle = function(event){
                var currentElement = angular.element(event.currentTarget);
                var spanElement = currentElement.find('span');
                spanElement.hasClass('rotate') ? spanElement.removeClass('rotate') : spanElement.addClass('rotate');
                var ulElement = currentElement.children('ul');
                ulElement.hasClass('show') ? ulElement.removeClass('show') : ulElement.addClass('show');
              };
            }
        });
    }
    };
  }
}());
