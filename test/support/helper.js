/*jslint unparam: true, stupid: true, nomen: true*/
/*globals global, beforeEach, afterEach, describe, __dirname*/

global.path = require('path');

(function () {
  'use strict';

  var
    helper = function () { return this; },
    sinonOriginal = require('sinon');

  beforeEach(function () {
    global.sinon = sinonOriginal.sandbox.create();
  });

  afterEach(function () {
    global.sinon.restore();
  });

  module.exports = helper;
}());