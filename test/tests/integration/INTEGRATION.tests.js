/*jslint node:true, unparam: true*/
/*globals describe, it, before, beforeEach, after, afterEach, vars, path, fse*/

(function () {
  'use strict';


  module.exports = function (persistor, removeResourceFn) {
    var
      should = require('should'),
      NO_ID_CODE = 'NOID',
      NOT_FOUND_CODE = 'NOTFOUND',
      id,
      item = {param: 'blah'};

    beforeEach(function (done) {
      removeResourceFn(done);
    });
    after(function (done) {
      removeResourceFn(done);
    });

    describe("#create(item, callback)", function () {

      describe("resource does not exist", function () {
        beforeEach(function (done) {
          persistor.create(item, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);
            id = recordId;
            done();
          });
        });
        it('should add the entry to the resource', function (done) {
          persistor.get(id, function (err, record) {
            should.not.exist(err);
            record.id.should.equal(id);
            record.param.should.equal(item.param);
            done();
          });
        });
      });

      describe("resource exists", function () {
        beforeEach(function (done) {
          // Should create the resource
          persistor.create(item, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);
            id = recordId;
            // Confirm the first entry is correct
            persistor.get(id, function (err, record) {
              should.not.exist(err);
              record.id.should.equal(id);
              record.param.should.equal(item.param);
              done();
            });
          });
        });
        it('should append new entry to the resource with unique id', function (done) {
          var
            item2 = {param: 'blah2'};

          // Call create
          persistor.create(item2, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);

            // Check that the first entry is still good
            persistor.get(id, function (err, record) {
              should.not.exist(err);
              record.id.should.equal(id);
              record.param.should.equal(item.param);

              // Check new entry
              persistor.get(recordId, function (err, record) {
                should.not.exist(err);
                record.id.should.equal(recordId);
                record.param.should.equal(item2.param);
                done();
              });
            });
          });
        });
      });

    });

    describe('#get(id, callback)', function () {

      describe("resource does not exist", function () {
        it('should return an error', function (done) {
          persistor.get(12, function (err, record) {
            should.exist(err);
            err.code.should.equal(NOT_FOUND_CODE);
            should.not.exist(record);
            done();
          });
        });
      });
      describe("resource exists and is empty", function () {
        beforeEach(function (done) {
          // create the file
          persistor.create(item, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);
            id = recordId;
            //Empty the file
            persistor.remove(id, function (err) {
              should.not.exist(err);
              done();
            });
          });
        });
        it('should return an error', function (done) {
          persistor.get(id, function (err, record) {
            should.exist(err);
            err.code.should.equal(NOT_FOUND_CODE);
            should.not.exist(record);
            done();
          });
        });
      });
      describe("resource exists and has content", function () {
        var
          id1,
          id2,
          id3,
          item1 = {param: 'blah1'},
          item2 = {param: 'blah2'},
          item3 = {param: 'blah3'};
        beforeEach(function (done) {
          persistor.create(item1, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);
            id1 = recordId;
            persistor.create(item2, function (err, recordId) {
              should.not.exist(err);
              should.exist(recordId);
              id2 = recordId;
              persistor.create(item3, function (err, recordId) {
                should.not.exist(err);
                should.exist(recordId);
                id3 = recordId;
                done();
              });
            });
          });
        });
        it('should return an error when looking for invalid id', function (done) {
          persistor.get(id1 + id2 + id3, function (err, record) {
            should.exist(err);
            err.code.should.equal(NOT_FOUND_CODE);
            should.not.exist(record);
            done();
          });
        });
        it('should return the first item', function (done) {
          persistor.get(id1, function (err, record) {
            should.not.exist(err);
            record.param.should.equal(item1.param);
            record.id.should.equal(id1);
            done();
          });
        });
        it('should return the second item', function (done) {
          persistor.get(id2, function (err, record) {
            should.not.exist(err);
            record.param.should.equal(item2.param);
            record.id.should.equal(id2);
            done();
          });
        });
        it('should return the third item', function (done) {
          persistor.get(id3, function (err, record) {
            should.not.exist(err);
            record.param.should.equal(item3.param);
            record.id.should.equal(id3);
            done();
          });
        });
        it('should return the second item when passed a string for id as well', function (done) {
          persistor.get(JSON.stringify(id2), function (err, record) {
            should.not.exist(err);
            record.param.should.equal(item2.param);
            record.id.should.equal(id2);
            done();
          });
        });
      });

    });

    describe('#getAll(id, callback)', function () {

      describe("resource does not exist", function () {
        it('should return an empty array', function (done) {
          persistor.getAll(function (err, records) {
            should.not.exist(err);
            Object.prototype.toString.call(records).should.equal('[object Array]');
            records.length.should.equal(0);
            done();
          });
        });
      });
      describe("resource exists and is empty", function () {
        beforeEach(function (done) {
          // create the file
          persistor.create(item, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);
            id = recordId;
            //Empty the file
            persistor.remove(id, function (err) {
              should.not.exist(err);
              persistor.get(id, function (err, record) {
                should.exist(err);
                err.code.should.equal(NOT_FOUND_CODE);
                should.not.exist(record);
                done();
              });
            });
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
          id1,
          id2,
          id3,
          item1 = {param: 'blah1'},
          item2 = {param: 'blah2'},
          item3 = {param: 'blah3'};
        beforeEach(function (done) {
          persistor.create(item1, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);
            id1 = recordId;
            persistor.create(item2, function (err, recordId) {
              should.not.exist(err);
              should.exist(recordId);
              id2 = recordId;
              persistor.create(item3, function (err, recordId) {
                should.not.exist(err);
                should.exist(recordId);
                id3 = recordId;
                done();
              });
            });
          });
        });
        it('should return all the records', function (done) {
          persistor.getAll(function (err, records) {
            should.not.exist(err);
            Object.prototype.toString.call(records).should.equal('[object Array]');
            records.length.should.equal(3);
            records[0].param.should.equal(item1.param);
            records[0].id.should.equal(id1);
            records[1].param.should.equal(item2.param);
            records[1].id.should.equal(id2);
            records[2].param.should.equal(item3.param);
            records[2].id.should.equal(id3);
            done();
          });
        });
      });
    });

    describe('#update(id, record, callback)', function () {
      describe("updated record has no id", function () {
        it('should return an error', function (done) {
          persistor.update({param: 'blah'}, function (err) {
            should.exist(err);
            err.code.should.equal(NO_ID_CODE);
            done();
          });
        });
      });
      describe("resource does not exist", function () {
        it('should return an error', function (done) {
          persistor.update({id: 12}, function (err) {
            should.exist(err);
            err.code.should.equal(NOT_FOUND_CODE);
            done();
          });
        });
        it('should not add the entry', function (done) {
          persistor.update({id: 12}, function (err) {
            should.exist(err);
            err.code.should.equal(NOT_FOUND_CODE);
            persistor.get(12, function (err, record) {
              should.exist(err);
              err.code.should.equal(NOT_FOUND_CODE);
              should.not.exist(record);
              done();
            });
          });
        });
      });
      describe("resource exists but record does not", function () {
        beforeEach(function (done) {
          persistor.create(item, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);
            id = recordId;
            done();
          });
        });
        it('should return an error', function (done) {
          persistor.update({id: id + 12}, function (err) {
            should.exist(err);
            err.code.should.equal(NOT_FOUND_CODE);
            done();
          });
        });
        it('should not add the entry', function (done) {
          persistor.update({id: id + 12}, function (err) {
            should.exist(err);
            err.code.should.equal(NOT_FOUND_CODE);
            persistor.get(12, function (err, record) {
              should.exist(err);
              err.code.should.equal(NOT_FOUND_CODE);
              should.not.exist(record);
              done();
            });
          });
        });
      });
      describe("resource exists and has content", function () {
        var
          id1,
          id2,
          id3,
          item1 = {param: 'blah1'},
          item2 = {param: 'blah2'},
          item3 = {param: 'blah3'},
          updatedItem = {param: 'newblah'};
        beforeEach(function (done) {
          persistor.create(item1, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);
            id1 = recordId;
            persistor.create(item2, function (err, recordId) {
              should.not.exist(err);
              should.exist(recordId);
              id2 = recordId;
              persistor.create(item3, function (err, recordId) {
                should.not.exist(err);
                should.exist(recordId);
                id3 = recordId;
                done();
              });
            });
          });
        });
        it('should update only the first record', function (done) {
          updatedItem.id = id1;
          persistor.update(updatedItem, function (err) {
            should.not.exist(err);
            persistor.getAll(function (err, records) {
              should.not.exist(err);
              Object.prototype.toString.call(records).should.equal('[object Array]');
              records.length.should.equal(3);
              records[0].param.should.equal(updatedItem.param);
              records[0].id.should.equal(id1);
              records[1].param.should.equal(item2.param);
              records[1].id.should.equal(id2);
              records[2].param.should.equal(item3.param);
              records[2].id.should.equal(id3);
              done();
            });
          });
        });
        it('should update only the second record', function (done) {
          updatedItem.id = id2;
          persistor.update(updatedItem, function (err) {
            should.not.exist(err);
            persistor.getAll(function (err, records) {
              should.not.exist(err);
              Object.prototype.toString.call(records).should.equal('[object Array]');
              records.length.should.equal(3);
              records[0].param.should.equal(item1.param);
              records[0].id.should.equal(id1);
              records[1].param.should.equal(updatedItem.param);
              records[1].id.should.equal(id2);
              records[2].param.should.equal(item3.param);
              records[2].id.should.equal(id3);
              done();
            });
          });
        });
        it('should update only the third record', function (done) {
          updatedItem.id = id3;
          persistor.update(updatedItem, function (err) {
            should.not.exist(err);
            persistor.getAll(function (err, records) {
              should.not.exist(err);
              Object.prototype.toString.call(records).should.equal('[object Array]');
              records.length.should.equal(3);
              records[0].param.should.equal(item1.param);
              records[0].id.should.equal(id1);
              records[1].param.should.equal(item2.param);
              records[1].id.should.equal(id2);
              records[2].param.should.equal(updatedItem.param);
              records[2].id.should.equal(id3);
              done();
            });
          });
        });
      });
    });
  };

}());