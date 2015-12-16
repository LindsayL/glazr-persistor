/*jslint node: true, nomen: true, unparam: true*/
(function () {
  'use strict';

  var
    helper = {};

  helper.parseError = function (err) {
    if (!err) {
      return err;
    }
    try {
      /*jslint evil: true*/
      eval('JustGettingTheStackTrace');
    } catch (e) {
      err.stack = e.stack;
    }
    return err;
  };

  module.exports = helper;
}());
