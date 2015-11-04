/*jslint node:true, unmember: true*/
/*globals describe, it, before, beforeEach, after, afterEach, vars, path, fse*/

(function () {
  'use strict';


  module.exports = function (persistor, removeResourceFn, testObjects, testParam) {
    var
      should = require('should'),
      utils = require('glazr-utils'),
      NO_ID_CODE = 'NOID',
      NOT_FOUND_CODE = 404,
      id,
      item1 = testObjects[0],
      item2 = testObjects[1],
      item3 = testObjects[2],
      updatedItem = testObjects[3];

    beforeEach(function (done) {
      removeResourceFn(done);
    });
    after(function (done) {
      removeResourceFn(done);
    });

    describe("#create(item1, callback)", function () {

      describe("resource does not exist", function () {
        beforeEach(function (done) {
          persistor.create(item1, function (err, recordId) {
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
            JSON.stringify(record[testParam]).should.equal(JSON.stringify(item1[testParam]));
            done();
          });
        });
      });

      describe("resource exists", function () {
        beforeEach(function (done) {
          // Should create the resource
          persistor.create(item1, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);
            id = recordId;
            // Confirm the first entry is correct
            persistor.get(id, function (err, record) {
              should.not.exist(err);
              record.id.should.equal(id);
              JSON.stringify(record[testParam]).should.equal(JSON.stringify(item1[testParam]));
              done();
            });
          });
        });
        it('should append new entry to the resource with unique id', function (done) {
          // Call create
          persistor.create(item2, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);

            // Check that the first entry is still good
            persistor.get(id, function (err, record) {
              should.not.exist(err);
              record.id.should.equal(id);
              JSON.stringify(record[testParam]).should.equal(JSON.stringify(item1[testParam]));

              // Check new entry
              persistor.get(recordId, function (err, record) {
                should.not.exist(err);
                record.id.should.equal(recordId);
                JSON.stringify(record[testParam]).should.equal(JSON.stringify(item2[testParam]));
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
          persistor.create(item1, function (err, recordId) {
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
          id3;
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
            record.id.should.equal(id1);
            JSON.stringify(record[testParam]).should.equal(JSON.stringify(item1[testParam]));
            done();
          });
        });
        it('should return the second item', function (done) {
          persistor.get(id2, function (err, record) {
            should.not.exist(err);
            record.id.should.equal(id2);
            JSON.stringify(record[testParam]).should.equal(JSON.stringify(item2[testParam]));
            done();
          });
        });
        it('should return the third item', function (done) {
          persistor.get(id3, function (err, record) {
            should.not.exist(err);
            record.id.should.equal(id3);
            JSON.stringify(record[testParam]).should.equal(JSON.stringify(item3[testParam]));
            done();
          });
        });
        it('should return the second item when passed a string for id as well', function (done) {
          persistor.get(id2, function (err, record) {
            should.not.exist(err);
            record.id.should.equal(id2);
            JSON.stringify(record[testParam]).should.equal(JSON.stringify(item2[testParam]));
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
          persistor.create(item1, function (err, recordId) {
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
          id3;
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
            var
              i,
              ids = [id1, id2, id3],
              content = [
                JSON.stringify(item1[testParam]),
                JSON.stringify(item2[testParam]),
                JSON.stringify(item3[testParam])
              ];

            utils.forEach(records, function (index, record) {
              // Find the matching record
              for (i = 0; i < ids.length; i += 1) {
                if (record.id === ids[i]) {
                  break;
                }
              }
              record.id.should.equal(ids[i]);
              JSON.stringify(record[testParam]).should.equal(content[i]);
            });
            done();
          });
        });
      });
    });

    describe('#update(id, record, callback)', function () {
      describe("updated record has no id", function () {
        it('should return an error', function (done) {
          persistor.update({member: 'blah'}, function (err) {
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
          persistor.create(item1, function (err, recordId) {
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
          myUpdatedItem,
          id1,
          id2,
          id3;
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
          persistor.get(id1, function (err, record) {
            myUpdatedItem = utils.merge(record, updatedItem);
            persistor.update(myUpdatedItem, function (err, id) {
              should.not.exist(err);
              persistor.get(id1, function (err, record) {
                should.not.exist(err);
                record.id.should.equal(id1);
                JSON.stringify(record[testParam]).should.equal(JSON.stringify(myUpdatedItem[testParam]));
                persistor.get(id2, function (err, record) {
                  should.not.exist(err);
                  record.id.should.equal(id2);
                  JSON.stringify(record[testParam]).should.equal(JSON.stringify(item2[testParam]));
                  persistor.get(id3, function (err, record) {
                    record.id.should.equal(id3);
                    JSON.stringify(record[testParam]).should.equal(JSON.stringify(item3[testParam]));
                    done();
                  });
                });
              });
            });
          });
        });
        it('should update only the second record', function (done) {
          persistor.get(id2, function (err, record) {
            myUpdatedItem = utils.merge(record, updatedItem);
            persistor.update(myUpdatedItem, function (err) {
              should.not.exist(err);
              persistor.get(id2, function (err, record) {
                should.not.exist(err);
                record.id.should.equal(id2);
                JSON.stringify(record[testParam]).should.equal(JSON.stringify(myUpdatedItem[testParam]));
                persistor.get(id1, function (err, record) {
                  should.not.exist(err);
                  record.id.should.equal(id1);
                  JSON.stringify(record[testParam]).should.equal(JSON.stringify(item1[testParam]));
                  persistor.get(id3, function (err, record) {
                    record.id.should.equal(id3);
                    JSON.stringify(record[testParam]).should.equal(JSON.stringify(item3[testParam]));
                    done();
                  });
                });
              });
            });
          });
        });
        it('should update only the third record', function (done) {
          persistor.get(id3, function (err, record) {
            myUpdatedItem = utils.merge(record, updatedItem);
            persistor.update(myUpdatedItem, function (err) {
              should.not.exist(err);
              persistor.get(id3, function (err, record) {
                should.not.exist(err);
                record.id.should.equal(id3);
                JSON.stringify(record[testParam]).should.equal(JSON.stringify(myUpdatedItem[testParam]));
                persistor.get(id2, function (err, record) {
                  should.not.exist(err);
                  record.id.should.equal(id2);
                  JSON.stringify(record[testParam]).should.equal(JSON.stringify(item2[testParam]));
                  persistor.get(id1, function (err, record) {
                    record.id.should.equal(id1);
                    JSON.stringify(record[testParam]).should.equal(JSON.stringify(item1[testParam]));
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });

    describe("#remove(id, callback)", function () {

      describe("resource does not exist", function () {
        it('should throw an error', function (done) {
          persistor.get(id, function (err, record) {
            should.exist(err);
            err.code.should.equal(NOT_FOUND_CODE);
            should.not.exist(record);
            done();
          });
        });
      });

      describe("resource exists", function () {
        beforeEach(function (done) {
          // Should create the resource
          persistor.create(item1, function (err, recordId) {
            should.not.exist(err);
            should.exist(recordId);
            id = recordId;
            // Confirm the first entry is correct
            persistor.get(id, function (err, record) {
              should.not.exist(err);
              record.id.should.equal(id);
              JSON.stringify(record[testParam]).should.equal(JSON.stringify(item1[testParam]));
              done();
            });
          });
        });
        it('should remove the entry', function (done) {
          // Call create
          persistor.remove(id, function (err) {
            should.not.exist(err);

            // Check that the entry is gone
            persistor.get(id, function (err, record) {
              should.exist(err);
              err.code.should.equal(NOT_FOUND_CODE);
              should.not.exist(record);
              done();
            });
          });
        });
      });

    });
  };

}());