/*jslint node:true, unparam: true*/
/*globals describe, it, before, beforeEach, after, afterEach, vars, path, fse*/

(function () {
  'use strict';

  var
    should = require('should'),
    path = require('path'),
    testSuite = require('./INTEGRATION.tests'),
    Persistor = require(path.resolve("./Interface.js")),
    persistor,
    options,
    config,
    removeResourceFn;

  describe("INTEGRATION", function () {
    before(function () {
      try {
        config = require('../../support/config');
      } catch (e) {
        e.message += '\n!!!Please create the file "test/support/config.js" '
          + 'according to the instructions found in "test/support/configTemplate.js".!!!';
        throw e;
      }
    });

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

      testSuite(persistor, removeResourceFn);
    });

    // TODO re-add and finish implementing
    //describe('Ldap', function () {
    //  var
    //    ldap = require('ldapjs'),
    //    options,
    //    server;
    //  before(function (done) {
    //    options = {
    //      type: 'Ldap',
    //      config: config.Ldap
    //    };
    //    // Create test ldap
    //    //server = ldap.createServer();
    //    //server.listen(port, function (err) {
    //    //  should.not.exist(err);
    //    //  console.log('Ldap listening on: ' + server.url);
    //    //
    //    //    server.bind(options.config.bindDn, function (req, res, next) {
    //    //      if (req.dn.toString() !== options.config.bindDn ||
    //    //        req.credentials !== options.config.bindCredentials) {
    //    //        return next(new ldap.InvalidCredentialsError());
    //    //      }
    //    //      res.end();
    //    //      return next();
    //    //    });
    //
    //    // Init persistor
    //    persistor = new Persistor(options);
    //    done();
    //    //});
    //  });
    //
    //  after(function (done) {
    //    // Destroy ldap server
    //    //server.close();
    //    done();
    //  });
    //
    //  // Create removeResourceFn
    //  removeResourceFn = function (cb) {
    //    //var
    //    //  client;
    //    //client = ldap.createClient({url: options.config.url});
    //    //client.bind(options.config.bindDn, options.config.bindCredentials, [], function (err) {
    //    //  should.not.exist(err);
    //    //  client.del(options.config.directoryDn, [], function (err) {
    //    //    should.not.exist(JSON.stringify(err));
    //    //    cb();
    //    //  });
    //    //});
    //    persistor.remove(options.config.directoryDn, function (err) {
    //      should.not.exist(err);
    //      cb();
    //    });
    //  };
    //
    //  testSuite(persistor, removeResourceFn);
    //});

  });

}());