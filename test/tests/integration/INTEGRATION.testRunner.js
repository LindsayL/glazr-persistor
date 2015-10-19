/*jslint node:true, unparam: true*/
/*globals describe, it, before, beforeEach, after, afterEach, vars, path, fse*/

(function () {
  'use strict';

  var
    should = require('should'),
    path = require('path'),
    utils = require('glazr-utils'),
    testSuite = require('./INTEGRATION.tests'),
    Persistor = require(path.resolve("./Interface.js")),
    persistor,
    testParam,
    testObjects,
    temp,
    options,
    config,
    removeResourceFn;

  describe("INTEGRATION", function () {
    try {
      config = require('../../support/config');
    } catch (e) {
      e.message += '\n!!!Please create the file "test/support/config.js" '
        + 'according to the instructions found in "test/support/configTemplate.js".!!!';
      throw e;
    }

    describe('LocalFile', function () {

      // Init persistor
      var
        fse = require('fs-extra'),
        fileDir = 'someTempDir',
        fileName = 'tempLocalFileForTest.json',
        filePath = path.resolve(path.join(fileDir, fileName));
      options = {
        type: 'LocalFile',
        config: {
          filePath: filePath
        }
      };
      persistor = new Persistor(options);

      // Create removeResourceFn
      removeResourceFn = function (done) {
        fse.remove(fileDir, function (err) {
          should.not.exist(err);
          done();
        });
      };

      testParam = 'param';
      testObjects = [];
      temp = {};
      temp[testParam] = 'blah1';
      testObjects.push(temp);
      temp[testParam] = 'blah2';
      testObjects.push(temp);
      temp[testParam] = 'blah3';
      testObjects.push(temp);
      temp[testParam] = 'blah4';
      testObjects.push(temp);

      testSuite(persistor, removeResourceFn, testObjects, testParam);
    });

    describe('Ldap', function () {
      options = {
        type: 'Ldap',
        config: config.Ldap
      };

      // Init persistor
      persistor = new Persistor(options);

      // Create removeResourceFn
      removeResourceFn = function (done) {
        var
          mutexName = 'ldapModMutex',
          barrier;

        persistor.getAll(function (err, records) {
          if (err) {
            should.not.exist(err);
            return done();
          }
          barrier = utils.syncBarrier(records.length, function (err) {
            should.not.exist(err);
            done();
          });
          utils.forEach(records, function (index, record) {
            if (record.id !== options.config.searchBase) {
              utils.getMutex(mutexName, function (releaseMutex) {
                persistor.remove(record.id, function (err) {
                  releaseMutex();
                  barrier(err);
                });
              })
            } else {
              barrier();
            }
          })
        });
      };

      testParam = 'member';
      testObjects = [];
      temp = {};
      temp[testParam] = ['cn=blah1', 'cn=blahblah1'];
      testObjects.push(temp);
      temp[testParam] = ['cn=blah2', 'cn=blahblah2'];
      testObjects.push(temp);
      temp[testParam] = ['cn=blah3', 'cn=blahblah3'];
      testObjects.push(temp);
      temp[testParam] = ['cn=blah4', 'cn=blahblah4'];
      testObjects.push(temp);

      testSuite(persistor, removeResourceFn, testObjects, testParam);
    });

  });

}());