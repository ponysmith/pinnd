'use strict';

jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';

describe('setup/init', function() {

  beforeEach(function() {
    loadFixtures('basic.html');
  });

  it('should return public methods', function() {
    var p = pinnd(document.getElementById('pinnd-example'));
    expect(typeof p).toBe('object');
  });

});
