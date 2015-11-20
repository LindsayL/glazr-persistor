/*jslint node: true*/
/*globals describe, it, before, beforeEach, after, afterEach, vars, path, fse*/

(function () {
  'use strict';

  var
    should = require('should'),
    path = require('path'),
    testSuite = require('./INTEGRATION.tests'),
    Persistor = require(path.resolve("./Interface.js")),
    testParam,
    testObjects,
    temp,
    config;

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
        filePath = path.resolve(path.join(fileDir, fileName)),
        options = {
          type: 'LocalFile',
          config: {
            filePath: filePath
          }
        },
        persistor = new Persistor(options),
        refreshResourceFn;

      // Create removeResourceFn
      refreshResourceFn = function (done) {
        /*jslint stupid: true*/
        if (fse.existsSync(fileDir)) {
          fse.remove(fileDir, function (err) {
            should.not.exist(err);
            done();
          });
        } else {
          done();
        }
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

      testSuite(persistor, refreshResourceFn, refreshResourceFn, testObjects, testParam);
    });

    describe('Ldap', function () {
      // Init persistor
      var
        options = {
          type: 'Ldap',
          config: config.Ldap
        },
        persistor = new Persistor(options),
        refreshResourceFn,
        removeResourceFn;

      // Create removeResourceFn
      removeResourceFn = function (done) {
        persistor.adapter.search(options.config.searchBase, 'sub', function (err, records) {
          if (err) {
            if (err.status === 404) {
              return done();
            }
            should.not.exist(err);
            return done();
          }

          var remove = function (records, callback, startLength) {
            if (startLength === undefined) {
              startLength = records.length;
            }
            var
              record = records[0];
            persistor.remove(record.id, function (err) {
              if (err) {
                record.removeAttemps = record.removeAttemps + 1 || 1;
                if (record.removeAttemps > startLength) {
                  callback('Failed to remove entries while refreshing ldap resource.');
                }
                // Else move the record to the end
                records.push(record);
              }
              // remove the record from the front of the queue
              records.splice(0, 1);

              if (records.length > 0) {
                remove(records, callback, startLength);
              } else {
                callback();
              }
            });
          };

          remove(records, function (err) {
            should.not.exist(err);
            done();
          });

        }, '(objectclass=*)');
      };

      // Create refreshResourceFn
      refreshResourceFn = function (done) {
        removeResourceFn(function () {
          persistor.adapter.add(options.config.searchBase, {objectClass: 'organizationalUnit'}, function (err) {
            should.not.exist(err);
            done();
          });
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

      testSuite(persistor, refreshResourceFn, removeResourceFn, testObjects, testParam);
    });

    describe('MultiFile', function () {

      // Init persistor
      var
        fse = require('fs-extra'),
        fileDir = 'someTempDir',
        filePath = path.resolve(fileDir),
        options = {
          type: 'MultiFile',
          config: {
            dir: filePath
          }
        },
        persistor = new Persistor(options),
        refreshResourceFn;

      // Create removeResourceFn
      refreshResourceFn = function (done) {
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

      testSuite(persistor, refreshResourceFn, refreshResourceFn, testObjects, testParam);
    });

    describe.only('Yaml', function () {

      // Init persistor
      var
        fse = require('fs-extra'),
        fileDir = 'someTempDir',
        fileName = 'tempLocalFileForTest.yaml',
        filePath = path.resolve(path.join(fileDir, fileName)),
        options = {
          type: 'Yaml',
          config: {
            filePath: filePath
          }
        },
        persistor = new Persistor(options),
        refreshResourceFn;

      // Create removeResourceFn
      refreshResourceFn = function (done) {
        /*jslint stupid: true*/
        if (fse.existsSync(fileDir)) {
          fse.remove(fileDir, function (err) {
            should.not.exist(err);
            done();
          });
        } else {
          done();
        }
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

      testSuite(persistor, refreshResourceFn, refreshResourceFn, testObjects, testParam);
    });

  });

}());