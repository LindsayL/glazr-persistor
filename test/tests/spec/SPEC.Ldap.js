/*jslint node:true, unparam: true*/
/*globals describe, it, before, beforeEach, after, afterEach, vars, path, fse*/

(function () {
  'use strict';

  require('../../support/helper');

  var
    should = require('should'),
    Persistor = require('../../../adapters/Ldap.js');

  describe("SPEC.Ldap", function () {

    var
      ldap = require('ldapjs'),
      NOT_FOUND_CODE = 404,
      CLIENT_ERROR_CODE = 400,
      id,
      item = {param: 'blah'},
      myError = 'MahSpecialError!',
      resourceContents,
      persistor;

    beforeEach(function () {
      sinon.stub(ldap, 'createClient', function () {
        return {
          on: function (event, callback) {},
          search: {},
          del: {},
          bind: {},
          add: {}
        };
      });
      persistor = new Persistor({
        url: '1',
        bindDn: '1',
        bindCredentials: '1',
        searchBase: '1',
        entryObjectClass: '1'
      });
      resourceContents = undefined;
    });

    describe('Instantiation', function () {
      it('should throw an error if no url specified', function () {
        try {
          persistor = new Persistor({});
          persistor.should.equal('should not get here, should have thrown an error');
        } catch (e) {
          e.message.should.match(/url/);
        }
      });
      it('should throw an error if no bindDn specified', function () {
        try {
          persistor = new Persistor({url: '1'});
          persistor.should.equal('should not get here, should have thrown an error');
        } catch (e) {
          e.message.should.match(/bindDn/);
        }
      });
      it('should throw an error if no bindCredentials specified', function () {
        try {
          persistor = new Persistor({url: '1', bindDn: '1'});
          persistor.should.equal('should not get here, should have thrown an error');
        } catch (e) {
          e.message.should.match(/bindCredentials/);
        }
      });
      it('should throw an error if no searchBase specified', function () {
        try {
          persistor = new Persistor({
            url: '1',
            bindDn: '1',
            bindCredentials: '1'
          });
          persistor.should.equal('should not get here, should have thrown an error');
        } catch (e) {
          e.message.should.match(/searchBase/);
        }
      });
      it('should throw an error if no entryObjectClass specified', function () {
        try {
          persistor = new Persistor({
            url: '1',
            bindDn: '1',
            bindCredentials: '1',
            searchBase: '1'
          });
          persistor.should.equal('should not get here, should have thrown an error');
        } catch (e) {
          e.message.should.match(/entryObjectClass/);
        }
      });
      it('should instantiate successfully with all options specified', function () {
        try {
          persistor = new Persistor({
            url: '1',
            bindDn: '1',
            bindCredentials: '1',
            searchBase: '1',
            entryObjectClass: '1'
          });
          should.exist(persistor);
        } catch (e) {
          should.not.exist(e.message);
        }
      });
    });

    describe('#authenticate(callback)', function () {
      beforeEach(function () {
        sinon.stub(persistor.client, 'bind', function (user, pass, controls, callback) {
          callback(myError);
        });
      });
      it('should call pass the error out to the callback', function () {
        persistor.authenticate(function (err) {
          err.should.equal(myError);
        });
      });
    });

    describe('#search(dn, scope, callback)', function () {
      beforeEach(function () {
        sinon.stub(persistor, 'errorParser', function (err) {
          return err;
        });
      });
      describe('search Error', function () {
        beforeEach(function () {
          sinon.stub(persistor.client, 'search', function (location, options, callback) {
            callback(myError);
          });
        });
        it('should call the callback with the error', function (done) {
          persistor.search(persistor.searchBase, 'sub', function (err, records) {
            err.should.equal(myError);
            should.not.exist(records);
            done();
          });
        });
      });
      describe('search on("searchReference")', function () {
        beforeEach(function () {
          sinon.stub(persistor.client, 'search', function (location, options, callback) {
            var res = {
              on: function (event, callback) {
                if (event === 'searchReference') {
                  callback(myError);
                }
              }
            };
            callback(null, res);
          });
        });
        it('should call the callback with the error', function (done) {
          persistor.search(persistor.searchBase, 'sub', function (err, records) {
            err.should.equal(myError);
            should.not.exist(records);
            done();
          });
        });
      });
      describe('search on("error")', function () {
        beforeEach(function () {
          sinon.stub(persistor.client, 'search', function (location, options, callback) {
            var res = {
              on: function (event, callback) {
                if (event === 'error') {
                  callback(myError);
                }
              }
            };
            callback(null, res);
          });
        });
        it('should call the callback with the error', function (done) {
          persistor.search(persistor.searchBase, 'sub', function (err, records) {
            err.should.equal(myError);
            should.not.exist(records);
            done();
          });
        });
      });
      describe('search on("end") with error', function () {
        beforeEach(function () {
          sinon.stub(persistor.client, 'search', function (location, options, callback) {
            var res = {
              on: function (event, callback) {
                if (event === 'end') {
                  callback(myError);
                }
              }
            };
            callback(null, res);
          });
        });
        it('should call the callback with the error', function (done) {
          persistor.search(persistor.searchBase, 'sub', function (err, records) {
            err.should.equal(myError);
            done();
          });
        });
      });
      describe('search on("end") No entries found', function () {
        beforeEach(function () {
          sinon.stub(persistor.client, 'search', function (location, options, callback) {
            var res = {
              on: function (event, callback) {
                if (event === 'end') {
                  callback();
                }
              }
            };
            callback(null, res);
          });
        });
        it('should return an empty array', function (done) {
          persistor.search(persistor.searchBase, 'sub', function (err, records) {
            should.not.exist(err);
            Object.prototype.toString.call(records).should.equal('[object Array]');
            records.length.should.equal(0);
            done();
          });
        });
      });
      describe("resource exists and has content", function () {
        var
          entries = [
            {id: 1, param: 'blah1'},
            {id: 2, param: 'blah2'},
            {id: 2, param: 'blah3'}
          ];
        beforeEach(function () {
          sinon.stub(persistor, 'formatData', function (record) {
            return record;
          });
          sinon.stub(persistor.client, 'search', function (location, options, callback) {
            var res = {
              on: function (event, callback) {
                if (event === 'searchEntry') {
                  callback(entries[0]);
                  callback(entries[1]);
                  callback(entries[2]);
                }
                if (event === 'end') {
                  callback();
                }
              }
            };
            callback(null, res);
          });
        });
        it('should return all the records', function (done) {
          persistor.search(persistor.searchBase, 'sub', function (err, records) {
            should.not.exist(err);
            Object.prototype.toString.call(records).should.equal('[object Array]');
            records.length.should.equal(3);
            JSON.stringify(records).should.equal(JSON.stringify(entries));
            done();
          });
        });
      });
    });

    describe('#formatData(record)', function () {
      var
        record,
        result;
      beforeEach(function () {
        record = {
          dn: 'id1',
          attributes: [
            {
              type: 'type1',
              vals: ['val1', 'val2']
            },
            {
              type: 'type2',
              vals: ['val3', 'val4']
            }
          ]
        };
        result = persistor.formatData(record);
      });
      it('should not modify the original record', function () {
        JSON.stringify(result).should.not.equal(JSON.stringify(record));
      });
      it('should not have attributes property anymore', function () {
        should.not.exist(result.attributes);
      });
      it('should have "id"', function () {
        should.exist(result.id);
        result.id.should.equal(record.dn);
      });
      it('should have "name"', function () {
        should.exist(result.name);
        result.name.should.equal(record.dn);
      });
      it('should reformat attributes into own properties', function () {
        var
          i,
          attr;
        for (i = 0; i < record.attributes.length; i += 1) {
          attr = record.attributes[i];
          JSON.stringify(result[attr.type]).should.equal(JSON.stringify(attr.vals));
        }
      });
    });

    describe('#getNewDn()', function () {
      it('should create unique dns', function () {
        var
          dn1 = persistor.getNewDn(),
          dn2 = persistor.getNewDn();
        dn1.should.not.equal(dn2);
      });
    });

    describe('#errorParser(err)', function () {
      it('should format the error', function () {
        var
          res,
          myErr = {
            code: 'blah',
            name: 'blah',
            message: 'blah',
            stack: 'blah',
            somethingelse: 'blah'
          };
        res = persistor.errorParser(myErr);
        res.constructor.name.should.equal('Error');
        res.code.should.equal(myErr.code);
        res.name.should.equal(myErr.name);
        res.message.should.equal(myErr.message);
        res.stack.should.equal(myErr.stack);
        should.not.exist(res.somethingelse);
      });
      it('should translate the NoSuchObjectError', function () {
        var
          res,
          myErr = {
            code: 'blah',
            name: 'NoSuchObjectError',
            message: 'blah',
            stack: 'blah',
            somethingelse: 'blah'
          };
        res = persistor.errorParser(myErr);
        res.constructor.name.should.equal('Error');
        res.code.should.equal(NOT_FOUND_CODE);
        res.name.should.equal(myErr.name);
        res.message.should.equal(myErr.message);
        res.stack.should.equal(myErr.stack);
        should.not.exist(res.somethingelse);
      });
      it('should translate the InvalidDistinguishedNameError', function () {
        var
          res,
          myErr = {
            code: 'blah',
            name: 'InvalidDistinguishedNameError',
            message: 'blah',
            stack: 'blah',
            somethingelse: 'blah'
          };
        res = persistor.errorParser(myErr);
        res.constructor.name.should.equal('Error');
        res.code.should.equal(NOT_FOUND_CODE);
        res.name.should.equal(myErr.name);
        res.message.should.equal(myErr.message);
        res.stack.should.equal(myErr.stack);
        should.not.exist(res.somethingelse);
      });
      it('should translate the EntryAlreadyExistsError', function () {
        var
          res,
          myErr = {
            code: 'blah',
            name: 'EntryAlreadyExistsError',
            message: 'blah',
            stack: 'blah',
            somethingelse: 'blah'
          };
        res = persistor.errorParser(myErr);
        res.constructor.name.should.equal('Error');
        res.code.should.equal(CLIENT_ERROR_CODE);
        res.name.should.equal(myErr.name);
        res.message.should.equal(myErr.message);
        res.stack.should.equal(myErr.stack);
        should.not.exist(res.somethingelse);
      });
      it('should translate the InvalidAttributeSyntaxError', function () {
        var
          res,
          myErr = {
            code: 'blah',
            name: 'InvalidAttributeSyntaxError',
            message: 'blah',
            stack: 'blah',
            somethingelse: 'blah'
          };
        res = persistor.errorParser(myErr);
        res.constructor.name.should.equal('Error');
        res.code.should.equal(CLIENT_ERROR_CODE);
        res.name.should.equal(myErr.name);
        res.message.should.equal(myErr.message);
        res.stack.should.equal(myErr.stack);
        should.not.exist(res.somethingelse);
      });
      it('should translate the UndefinedAttributeTypeError', function () {
        var
          res,
          myErr = {
            code: 'blah',
            name: 'UndefinedAttributeTypeError',
            message: 'blah',
            stack: 'blah',
            somethingelse: 'blah'
          };
        res = persistor.errorParser(myErr);
        res.constructor.name.should.equal('Error');
        res.code.should.equal(CLIENT_ERROR_CODE);
        res.name.should.equal(myErr.name);
        res.message.should.equal(myErr.message);
        res.stack.should.equal(myErr.stack);
        should.not.exist(res.somethingelse);
      });
      it('should translate the ProtocolError with "no attributes provided"', function () {
        var
          res,
          myErr = {
            code: 'blah',
            name: 'ProtocolError',
            message: 'no attributes provided',
            stack: 'blah',
            somethingelse: 'blah'
          };
        res = persistor.errorParser(myErr);
        res.constructor.name.should.equal('Error');
        res.code.should.equal(CLIENT_ERROR_CODE);
        res.name.should.not.equal(myErr.name);
        res.message.should.not.equal(myErr.message);
        res.stack.should.equal(myErr.stack);
        should.not.exist(res.somethingelse);
      });
      it('should translate the ProtocolError without "no attributes provided"', function () {
        var
          res,
          myErr = {
            code: 'blah',
            name: 'ProtocolError',
            message: 'blah',
            stack: 'blah',
            somethingelse: 'blah'
          };
        res = persistor.errorParser(myErr);
        res.constructor.name.should.equal('Error');
        res.code.should.equal(res.code);
        res.name.should.equal(myErr.name);
        res.message.should.equal(myErr.message);
        res.stack.should.equal(myErr.stack);
        should.not.exist(res.somethingelse);
      });


    });

    describe('#add(dn, record, callback)', function () {
      beforeEach(function () {
        sinon.stub(persistor, 'errorParser', function (err) {
          return err;
        });
      });
      describe('authetication error', function () {
        beforeEach(function () {
          sinon.stub(persistor, 'authenticate', function (callback) {
            callback(myError);
          });
        });
        it('should return the error', function (done) {
          persistor.add('', {}, function (err, id) {
            should.exist(err);
            err.should.equal(myError);
            should.not.exist(id);
            done();
          });
        });
      });
      describe('client add error', function () {
        beforeEach(function () {
          sinon.stub(persistor, 'authenticate', function (callback) {
            callback();
          });
          sinon.stub(persistor.client, 'add', function (dn, record, controls, callback) {
            callback(myError);
          });
        });
        it('should return the error', function (done) {
          persistor.add('', {}, function (err, id) {
            should.exist(err);
            err.should.equal(myError);
            done();
          });
        });
      });
      describe('successful add', function () {
        var
          myId = 'blah';
        beforeEach(function () {
          sinon.stub(persistor, 'authenticate', function (callback) {
            callback();
          });
          sinon.stub(persistor.client, 'add', function (dn, record, controls, callback) {
            callback();
          });
        });
        describe('id is specified', function () {
          it('should return the id', function (done) {
            persistor.add(myId, {}, function (err, newId) {
              should.not.exist(err);
              newId.should.equal(myId);
              done();
            });
          });
        });
        describe('id is not specified', function () {
          beforeEach(function () {
            sinon.stub(persistor, 'getNewDn', function () {
              return myId;
            });
          });
          it('should create and return a new id', function (done) {
            persistor.add(undefined, {}, function (err, newId) {
              should.not.exist(err);
              newId.should.equal(myId);
              done();
            });
          });
        })
      });
    });

    //describe("#create(item, callback)", function () {
    //  var
    //    myId = 'blah';
    //  beforeEach(function () {
    //    sinon.stub(persistor, 'getNewDn', function () {
    //      return myId;
    //    });
    //  });
    //  describe('search Error', function () {
    //    beforeEach(function () {
    //      sinon.stub(persistor, 'search', function (dn, scope, callback) {
    //        callback(myError);
    //      });
    //      sinon.stub(persistor, 'add', function (dn, record, callback) {
    //        throw new Error('should not get here');
    //      });
    //    });
    //    it('should call the callback with the error', function (done) {
    //      persistor.create(item, function (err, recordId) {
    //        err.should.equal(myError);
    //        should.not.exist(recordId);
    //        done();
    //      });
    //    });
    //  });
    //  describe('writeJson Error', function () {
    //    beforeEach(function () {
    //      sinon.stub(persistor, 'readJson', function (callback) {
    //        callback(null, resourceContents || []);
    //      });
    //      sinon.stub(persistor, 'writeJson', function (data, callback) {
    //        callback(myError);
    //      });
    //    });
    //    it('should call the callback with the error', function (done) {
    //      persistor.create(item, function (err, recordId) {
    //        err.should.equal(myError);
    //        should.not.exist(recordId);
    //        done();
    //      });
    //    });
    //  });
    //  describe("Resource does not exist/is empty", function () {
    //    beforeEach(function () {
    //      sinon.stub(persistor, 'readJson', function (callback) {
    //        callback(null, resourceContents || []);
    //      });
    //      sinon.stub(persistor, 'writeJson', function (data, callback) {
    //        resourceContents = data;
    //        callback();
    //      });
    //    });
    //    it('should call the callback with the new id', function (done) {
    //      persistor.create(item, function (err, recordId) {
    //        should.not.exist(err);
    //        should.exist(recordId);
    //        done();
    //      });
    //    });
    //    it('should add the record to the resource', function (done) {
    //      persistor.create(item, function (err, recordId) {
    //        should.not.exist(err);
    //        should.exist(recordId);
    //        persistor.get(recordId, function (err, record) {
    //          should.not.exist(err);
    //          record.id.should.equal(recordId);
    //          record.param.should.equal(item.param);
    //          done();
    //        });
    //      });
    //    });
    //  });
    //  describe("resource exists and has content", function () {
    //    beforeEach(function (done) {
    //      sinon.stub(persistor, 'readJson', function (callback) {
    //        callback(null, resourceContents || []);
    //      });
    //      sinon.stub(persistor, 'writeJson', function (data, callback) {
    //        resourceContents = data;
    //        callback();
    //      });
    //      persistor.create(item, function (err, recordId) {
    //        should.not.exist(err);
    //        should.exist(recordId);
    //        id = recordId;
    //        done();
    //      });
    //    });
    //    it('should append new record to the resource with unique id', function (done) {
    //      var
    //        item2 = {param: 'blah2'};
    //
    //      // Call create
    //      persistor.create(item2, function (err, recordId) {
    //        should.not.exist(err);
    //        should.exist(recordId);
    //
    //        // Check that the first entry is still good
    //        persistor.get(id, function (err, record) {
    //          should.not.exist(err);
    //          record.id.should.equal(id);
    //          record.param.should.equal(item.param);
    //
    //          // Check new entry
    //          persistor.get(recordId, function (err, record) {
    //            should.not.exist(err);
    //            record.id.should.equal(recordId);
    //            record.param.should.equal(item2.param);
    //            done();
    //          });
    //        });
    //      });
    //    });
    //  });
    //});

    describe('#get(id, callback)', function () {

      describe('search Error', function () {
        beforeEach(function () {
          sinon.stub(persistor, 'search', function (dn, scope, callback) {
            callback(myError);
          });
        });
        it('should call the callback with the error', function (done) {
          persistor.get('someDN', function (err, record) {
            err.should.equal(myError);
            should.not.exist(record);
            done();
          });
        });
      });
      describe("resource exists and has content", function () {
        var
          entries = [
            {id: 1, param: 'blah1'},
            {id: 2, param: 'blah2'},
            {id: 3, param: 'blah3'}
          ];
        beforeEach(function () {
          entries = [
            {id: 1, param: 'blah1'},
            {id: 2, param: 'blah2'},
            {id: 3, param: 'blah3'}
          ];
          sinon.stub(persistor, 'search', function (dn, scope, callback) {
            callback(null, [entries[1]]);
          });
        });
        it('should return the requested item', function (done) {
          persistor.get(2, function (err, record) {
            should.not.exist(err);
            JSON.stringify(record).should.equal(JSON.stringify(entries[1]));
            done();
          });
        });
      });
    });

    describe('#getAll(id, callback)', function () {
      describe('search Error', function () {
        beforeEach(function () {
          sinon.stub(persistor, 'search', function (dn, scope, callback) {
            callback(myError);
          });
          sinon.stub(persistor, 'errorParser', function (error) {
            return error;
          });
        });
        it('should call the callback with the error', function (done) {
          persistor.getAll(function (err, records) {
            err.should.equal(myError);
            should.not.exist(records);
            done();
          });
        });
      });
      describe('resource does not exist', function () {
        beforeEach(function () {
          sinon.stub(persistor, 'search', function (dn, scope, callback) {
            callback({name: 'NoSuchObjectError'});
          });
        });
        it('should return an empty array', function (done) {
          persistor.getAll(function (err, records) {
            should.exist(err);
            err.code.should.equal(NOT_FOUND_CODE);
            should.not.exist(records);
            done();
          });
        });
      });
      describe('resource is empty', function () {
        beforeEach(function () {
          sinon.stub(persistor, 'search', function (dn, scope, callback) {
            callback(null, []);
          });
        });
        it('should return an empty array', function (done) {
          persistor.getAll(function (err, records) {
            should.not.exist(err);
            Object.prototype.toString.call(records).should.equal('[object Array]');
            records.length.should.equal(0);
            done();
          });
        });
      });
      describe("resource exists and has content", function () {
        var
          entries = [
            {id: 1, param: 'blah1'},
            {id: 2, param: 'blah2'},
            {id: 2, param: 'blah3'}
          ];
        beforeEach(function () {
          sinon.stub(persistor, 'search', function (dn, scope, callback) {
            callback(null, entries);
          });
        });
        it('should return all the records', function (done) {
          persistor.getAll(function (err, records) {
            should.not.exist(err);
            Object.prototype.toString.call(records).should.equal('[object Array]');
            records.length.should.equal(3);
            JSON.stringify(records).should.equal(JSON.stringify(entries));
            done();
          });
        });
      });
    });

    //describe('#update(id, record, callback)', function () {
    //  var myId = 123;
    //  describe('readJson Error', function () {
    //    beforeEach(function () {
    //      sinon.stub(persistor, 'readJson', function (callback) {
    //        callback(myError);
    //      });
    //      sinon.stub(persistor, 'writeJson', function (data, callback) {
    //        throw new Error('should not get here');
    //      });
    //    });
    //    it('should call the callback with the error', function (done) {
    //      persistor.update({id: 1}, function (err, recordId) {
    //        err.should.equal(myError);
    //        should.not.exist(recordId);
    //        done();
    //      });
    //    });
    //  });
    //  describe('writeJson Error', function () {
    //    beforeEach(function () {
    //      sinon.stub(persistor, 'readJson', function (callback) {
    //        resourceContents = [{id: myId}];
    //        callback(null, resourceContents);
    //      });
    //      sinon.stub(persistor, 'writeJson', function (data, callback) {
    //        callback(myError);
    //      });
    //    });
    //    it('should call the callback with the error', function (done) {
    //      persistor.update({id: myId}, function (err, recordId) {
    //        err.should.equal(myError);
    //        should.not.exist(recordId);
    //        done();
    //      });
    //    });
    //  });
    //  describe("resource does not exist/is empty", function () {
    //    beforeEach(function () {
    //      sinon.stub(persistor, 'readJson', function (callback) {
    //        callback(null, resourceContents || []);
    //      });
    //      sinon.stub(persistor, 'writeJson', function (data, callback) {
    //        resourceContents = data;
    //        callback();
    //      });
    //    });
    //    it('should return an error', function (done) {
    //      persistor.update({id: myId}, function (err) {
    //        should.exist(err);
    //        err.code.should.equal(NOT_FOUND_CODE);
    //        done();
    //      });
    //    });
    //    it('should not add the entry', function (done) {
    //      persistor.update({id: myId}, function (err) {
    //        should.exist(err);
    //        err.code.should.equal(NOT_FOUND_CODE);
    //        persistor.get(myId, function (err, record) {
    //          should.exist(err);
    //          should.not.exist(record);
    //          done();
    //        });
    //      });
    //    });
    //  });
    //  describe("resource exists and has content", function () {
    //    var
    //      id1,
    //      id2,
    //      id3,
    //      item1 = {param: 'blah1'},
    //      item2 = {param: 'blah2'},
    //      item3 = {param: 'blah3'},
    //      updatedItem = {param: 'newBlah'};
    //    beforeEach(function (done) {
    //      sinon.stub(persistor, 'readJson', function (callback) {
    //        callback(null, resourceContents || []);
    //      });
    //      sinon.stub(persistor, 'writeJson', function (data, callback) {
    //        resourceContents = data;
    //        callback();
    //      });
    //      persistor.create(item1, function (err, recordId) {
    //        should.not.exist(err);
    //        should.exist(recordId);
    //        id1 = recordId;
    //        persistor.create(item2, function (err, recordId) {
    //          should.not.exist(err);
    //          should.exist(recordId);
    //          id2 = recordId;
    //          persistor.create(item3, function (err, recordId) {
    //            should.not.exist(err);
    //            should.exist(recordId);
    //            id3 = recordId;
    //            done();
    //          });
    //        });
    //      });
    //    });
    //    it('should update only the first record', function (done) {
    //      updatedItem.id = id1;
    //      persistor.update(updatedItem, function (err) {
    //        should.not.exist(err);
    //        persistor.getAll(function (err, records) {
    //          should.not.exist(err);
    //          Object.prototype.toString.call(records).should.equal('[object Array]');
    //          records.length.should.equal(3);
    //          records[0].param.should.equal(updatedItem.param);
    //          records[0].id.should.equal(id1);
    //          records[1].param.should.equal(item2.param);
    //          records[1].id.should.equal(id2);
    //          records[2].param.should.equal(item3.param);
    //          records[2].id.should.equal(id3);
    //          done();
    //        });
    //      });
    //    });
    //    it('should update only the second record', function (done) {
    //      updatedItem.id = id2;
    //      persistor.update(updatedItem, function (err) {
    //        should.not.exist(err);
    //        persistor.getAll(function (err, records) {
    //          should.not.exist(err);
    //          Object.prototype.toString.call(records).should.equal('[object Array]');
    //          records.length.should.equal(3);
    //          records[0].param.should.equal(item1.param);
    //          records[0].id.should.equal(id1);
    //          records[1].param.should.equal(updatedItem.param);
    //          records[1].id.should.equal(id2);
    //          records[2].param.should.equal(item3.param);
    //          records[2].id.should.equal(id3);
    //          done();
    //        });
    //      });
    //    });
    //    it('should update only the third record', function (done) {
    //      updatedItem.id = id3;
    //      persistor.update(updatedItem, function (err) {
    //        should.not.exist(err);
    //        persistor.getAll(function (err, records) {
    //          should.not.exist(err);
    //          Object.prototype.toString.call(records).should.equal('[object Array]');
    //          records.length.should.equal(3);
    //          records[0].param.should.equal(item1.param);
    //          records[0].id.should.equal(id1);
    //          records[1].param.should.equal(item2.param);
    //          records[1].id.should.equal(id2);
    //          records[2].param.should.equal(updatedItem.param);
    //          records[2].id.should.equal(id3);
    //          done();
    //        });
    //      });
    //    });
    //  });
    //});

    //describe('#remove(id, callback)', function () {
    //  var myId = 123;
    //  describe('del Error', function () {
    //    beforeEach(function () {
    //      sinon.stub(persistor.client, 'del', function (id, controls, callback) {
    //        callback(myError);
    //      });
    //    });
    //    it('should call the callback with the error', function (done) {
    //      persistor.remove(myId, function (err) {
    //        should.exist(err);
    //        err.should.equal(myError);
    //        done();
    //      });
    //    });
    //  });
    //  describe("resource does not exist/is empty", function () {
    //    beforeEach(function () {
    //      sinon.stub(persistor.client, 'del', function (id, controls, callback) {
    //        callback({name: 'NoSuchObjectError'});
    //      });
    //    });
    //    it('should call the callback with the not found error', function (done) {
    //      persistor.remove(myId, function (err) {
    //        should.exist(err);
    //        err.code.should.equal(NOT_FOUND_CODE);
    //        done();
    //      });
    //    });
    //  });
    //  describe("successful del", function () {
    //    beforeEach(function () {
    //      sinon.stub(persistor.client, 'del', function (id, controls, callback) {
    //        callback();
    //      });
    //    });
    //    it('should call the callback with the not found error', function (done) {
    //      persistor.remove(myId, function (err) {
    //        should.not.exist(err);
    //        done();
    //      });
    //    });
    //  });
    //});

  });

}());