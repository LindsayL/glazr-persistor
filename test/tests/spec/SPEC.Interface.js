/*jslint node:true, unparam: true*/
/*globals describe, it, before, beforeEach, after, afterEach, vars, path, fse*/

(function () {
  'use strict';

  require('../../support/helper');

  var
    should = require('should'),
    Persistor = require('../../../Interface.js');

  describe('SPEC.Interface', function () {
    var
      NO_ID_CODE = 'NOID',
      persistor;

    describe('Instantiation', function () {
      it('should throw an error if no options specified', function () {
        try {
          persistor = new Persistor();
          should.not.exist('should not get here, should have thrown an error');
        } catch (e) {
          e.message.should.match(/options/);
        }
      });
      it('should throw an error if no type specified', function () {
        try {
          persistor = new Persistor({});
          should.not.exist('should not get here, should have thrown an error');
        } catch (e) {
          e.message.should.match(/type/);
        }
      });
      it('should throw an error if no config specified', function () {
        try {
          persistor = new Persistor({type: 'LocalFile'});
          should.not.exist('should not get here, should have thrown an error');
        } catch (e) {
          e.message.should.match(/config/);
        }
      });
      it('should throw an error if invalid type specified', function () {
        try {
          persistor = new Persistor({config: {}, type: 'bet this doesnt exist'});
          should.not.exist('should not get here, should have thrown an error');
        } catch (e) {
          /*jslint regexp: true*/
          e.message.should.match(/Invalid options.type/);
        }
      });
    });

    describe('Functions', function () {
      var
        myId = 1,
        myItem = {id: 2, param: 'blah'},
        myCallback = function (err) {};

      beforeEach(function () {
        // Init the persistor with some valid options, but will override
        sinon.stub(Persistor.prototype, 'getAdapter', function () {
          return {
            create: {},
            get: {},
            getAll: {},
            update: {},
            remove: {}
          };
        });
        persistor = new Persistor();
      });

      describe('#create(record, callback)', function () {
        it('should call the adapters create method with the same args', function (done) {
          sinon.stub(persistor.adapter, 'create', function (record, callback) {
            JSON.stringify(record).should.equal(JSON.stringify(myItem));
            String(callback).should.equal(String(myCallback));
            done();
          });
          persistor.create(myItem, myCallback);
        });
      });

      describe('#get(id, callback)', function () {
        it('should call the adapters get method with the same args', function (done) {
          sinon.stub(persistor.adapter, 'get', function (id, callback) {
            id.should.equal(myId);
            String(callback).should.equal(String(myCallback));
            done();
          });
          persistor.get(myId, myCallback);
        });
      });

      describe('#getAll(callback)', function () {
        it('should call the adapters getAll method with the same args', function (done) {
          sinon.stub(persistor.adapter, 'getAll', function (callback) {
            String(callback).should.equal(String(myCallback));
            done();
          });
          persistor.getAll(myCallback);
        });
      });

      describe('#update(record, callback)', function () {
        it('should throw an error if no id in reocrd', function (done) {
          persistor.update({param: 'blah'}, function (err) {
            should.exist(err);
            err.code.should.equal(NO_ID_CODE);
            done();
          });
        });
        it('should call the adapters update method with the same args', function (done) {
          sinon.stub(persistor.adapter, 'update', function (record, callback) {
            JSON.stringify(record).should.equal(JSON.stringify(myItem));
            String(callback).should.equal(String(myCallback));
            done();
          });
          persistor.update(myItem, myCallback);
        });
      });

      describe('#remove(callback)', function () {
        it('should call the adapters remove method with the same args', function (done) {
          sinon.stub(persistor.adapter, 'remove', function (id, callback) {
            id.should.equal(myId);
            String(callback).should.equal(String(myCallback));
            done();
          });
          persistor.remove(myId, myCallback);
        });
      });

    });

  });

}());