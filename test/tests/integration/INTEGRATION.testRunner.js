/*jslint node: true*/
/*globals describe, it, before, beforeEach, after, afterEach, vars, path, fse*/

(function () {
  'use strict';

  var
    should = require('should'),
    path = require('path'),
    testSuite = require('./INTEGRATION.tests'),
    Persistor = require(path.resolve("./interface.js")),
    testParam,
    testObjects,
    temp,
    config,
    i;

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
        fse = require('graceful-fs-extra'),
        fileDir = 'someTempDir',
        fileName = 'tempLocalFileForTest.json',
        filePath = path.resolve(path.join(fileDir, 'thatIsNested', fileName)),
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
      for (i = 0; i < 4; i += 1) {
        temp = {};
        temp[testParam] = 'blah' + String(i);
        testObjects.push(temp);
      }

      testSuite(persistor, refreshResourceFn, refreshResourceFn, testObjects, testParam);
    });

    describe('Ldap', function () {
      this.timeout(60000);

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
                if (record.removeAttemps > startLength * 2) {
                  callback('Failed to remove entries while refreshing ldap resource. ' + err);
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

          // Longest ids first
          records.sort(function (a, b) {
            return b.id.length - a.id.length;
          });

          remove(records, function (err) {
            should.not.exist(err);
            done();
          });

        }, '(objectclass=*)');
      };

      // Create refreshResourceFn
      refreshResourceFn = function (done) {
        removeResourceFn(function () {
          persistor.adapter.add(options.config.searchBase, {objectClass: ['organizationalUnit']}, function (err) {
            should.not.exist(err);
            done();
          });
        });
      };

      testParam = 'attributes';
      testObjects = [];
      for (i = 0; i < 4; i += 1) {
        temp = {};
        temp[testParam] = 'blah' + String(i);
        temp[testParam] = {
          cn: ['temp' + String(i + 1)],
          objectClass: [options.config.entryObjectClass],
          member: ['cn=blah' + String(i + 1), 'cn=blahblah' + String(i + 1)]
        };
        testObjects.push(temp);
      }
      delete testObjects[3][testParam].cn;

      testSuite(persistor, refreshResourceFn, removeResourceFn, testObjects, testParam);
    });

    describe('MultiFile', function () {
      // Init persistor
      var
        fse = require('graceful-fs-extra'),
        fileDir = 'someTempDir',
        filePath = path.join(path.resolve(fileDir), 'thatIsNested'),
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
      for (i = 0; i < 4; i += 1) {
        temp = {};
        temp[testParam] = 'blah' + String(i);
        testObjects.push(temp);
      }

      testSuite(persistor, refreshResourceFn, refreshResourceFn, testObjects, testParam);
    });

    describe('Yaml', function () {

      // Init persistor
      var
        fse = require('graceful-fs-extra'),
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
      for (i = 0; i < 4; i += 1) {
        temp = {};
        temp[testParam] = 'blah' + String(i);
        testObjects.push(temp);
      }

      testSuite(persistor, refreshResourceFn, refreshResourceFn, testObjects, testParam);
    });

  });

}());