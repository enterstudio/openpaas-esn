'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The open-event-on-click component', function() {

  var $compile, $rootScope, $scope, element, calOpenEventFormSpy;

  beforeEach(function() {
    angular.mock.module('esn.calendar');

    module(function($provide) {
      calOpenEventFormSpy = sinon.spy();
      $provide.value('calOpenEventForm', calOpenEventFormSpy);
    });
  });

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
  }));

  function compileDirective(html) {
    element = angular.element(html);
    $compile(element)($scope);
    $scope.$digest();
  }

  it('should call "calOpenEventForm" with the given "event" when clicked', function() {
    $scope.myEvent = { id: 'an event id' };
    compileDirective('<cal-open-event-on-click event="myEvent" />');

    element.click();

    expect(calOpenEventFormSpy).to.have.been.calledWith($scope.myEvent);
  });

});
