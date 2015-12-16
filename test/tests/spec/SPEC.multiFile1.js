///*jslint node: true, unparam: true*/
///*globals describe, it, beforeEach, after*/
//(function () {
//  'use strict';
//  var
//    fse = require('graceful-fs-extra'),
//    path = require('path'),
//    MultiFile = require('../../../../app/persistors/MultiFile');
//
//  describe('MultiFile persistor', function () {
//    describe('constuctor', function () {
//      it('should have a default storage directory', function (done) {
//        var mf = new MultiFile();
//
//        (!!mf.dir).should.equal(true);
//        done();
//      });
//      it('should accept a storage directory', function (done) {
//        var
//          dirName = 'someDir',
//          mf = new MultiFile({dir: dirName});
//
//        mf.dir.should.equal(dirName);
//        done();
//      });
//    });
//    describe('methods', function () {
//      var mf;
//
//      beforeEach(function (done) {
//        mf = new MultiFile({dir: path.resolve('./app/resources/temp/multiFile')});
//        fse.emptyDir(mf.dir, function () {
//          done();
//        });
//      });
//
//      after(function (done) {
//        fse.emptyDir(mf.dir, function () {
//          done();
//        });
//      });
//
//      describe('#create', function () {
//        it('should exist', function (done) {
//          mf.create.should.be.type('function');
//          done();
//        });
//        it('should return an id in a callback', function (done) {
//          mf.create('{"some":"data"}', function (err, id) {
//            (!!id).should.equal(true);
//            done();
//          });
//        });
//        it('should accept a JSON object', function () {
//          mf.create({json: 'test'}, function (err) {
//            (err === null).should.equal(true);
//          });
//        });
//        it('should make sure that if it gets passed a string, it contains valid json', function (done) {
//          mf.create('not json', function (err) {
//            err.message.should.match(/Unexpected token/);
//            done();
//          });
//        });
//        it('should create a json file in the storage directory named after the id', function (done) {
//          mf.create('{}', function (err, id) {
//            fse.readJson(mf.dir + '/' + id + '.json', function (err, contents) {
//              (err === null).should.equal(true);
//              done();
//            });
//          });
//        });
//        it('should not clobber existing files', function (done) {
//          mf.create('{"item":1}', function () {
//            mf.create('{"item":2}', function () {
//              fse.readJson(mf.dir + '/1.json', function (err, contents) {
//                contents.item.should.equal(1);
//                done();
//              });
//            });
//          });
//        });
//      });
//
//      describe('#get', function () {
//        it('should exist', function (done) {
//          mf.get.should.be.type('function');
//          done();
//        });
//        it('should get a resource if it exists', function (done) {
//          var
//            data = {"some": "data"},
//            id = 28;
//          fse.writeJson(mf.dir + '/' + id + '.json', data, function () {
//            mf.get(id, function (err, item) {
//              item.some.should.equal(data.some);
//              done();
//            });
//          });
//        });
//        it('should return an error if a resource does not exist', function (done) {
//          mf.get(999, function (err, item) {
//            (err !== null).should.equal(true);
//            done();
//          });
//        });
//        it('should return an error if the data file does not contain JSON', function (done) {
//          var
//            data = '{"some bad data"}',
//            id = 28;
//
//          fse.writeFile(mf.dir + '/' + id + '.json', data, function () {
//            mf.get(id, function (err, item) {
//              (err !== null).should.equal(true);
//              done();
//            });
//          });
//        });
//      });
//      describe('#update', function () {
//        var id = 25;
//        beforeEach(function (done) {
//          var
//            data = '{"data": "original"}',
//            file = mf.dir + '/' + id + '.json';
//          fse.writeJson(file, data, done);
//        });
//        it('should exist', function (done) {
//          mf.update.should.be.type('function');
//          done();
//        });
//        it('should replace the existing item with a new one', function (done) {
//          var
//            newData = {"data": "new"},
//            file = mf.dir + '/' + id + '.json';
//          mf.update(id, newData, function (err) {
//            fse.readJson(file, function (err2, item) {
//              item.data.should.equal(newData.data);
//              done();
//            });
//          });
//        });
//        it('should accept a JSON object', function (done) {
//          mf.update(id, {json: 'test'}, function (err) {
//            (err === null).should.equal(true);
//            done();
//          });
//        });
//        it('should make sure that if it gets passed a string, it contains valid json', function (done) {
//          mf.update(id, 'not json', function (err) {
//            err.message.should.match(/Unexpected token/);
//            done();
//          });
//        });
//        it('should return an error if the item doesn\'t exist', function (done) {
//          mf.update(97, '{"data":"new"}', function (err) {
//            (err === null).should.equal(false);
//            done();
//          });
//        });
//      });
//    });
//  });
//}());
