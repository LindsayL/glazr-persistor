/*jslint node: true, stupid: true*/
/*globals */
(function () {
  'use strict';

  var
    fse = require('fs-extra'),
    path = require('path'),
    utils = require('glazr-utils'),
    MultiFilePersistor;


  MultiFilePersistor = function (options) {
    this.type = 'MultiFile';
    if (!options.dir) {
      throw new Error('Persistor initialization: type="MultiFile", '
      + 'No dir specified in options.config (see readme).');
    }
    this.dir = options.dir;
    this.notFoundError = 404;
  };

  MultiFilePersistor.prototype.create = function (data, callback) {
    var
      self = this,
      id = 0,
      i;

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        callback(e);
        return;
      }
    }

    fse.readdir(self.dir, function (err, files) {

      if (err) {
        if (err.code === 'ENOENT') {
          fse.mkdirSync(self.dir);
          files = [];
        } else {
          callback(err);
          return;
        }
      }

      for (i = 0; i < files.length; i += 1) {
        id = Math.max(id, parseInt(files[i], 10));
      }
      id += 1;
      data.id = id;
      fse.writeJson(self.dir + '/' + id + '.json', data, function (err) {
        callback(err, id);
      });
    });
  };

  MultiFilePersistor.prototype.get = function (id, callback) {
    var self = this;
    fse.readJson(self.dir + '/' + id + '.json', function (err, contents) {
      if (err) {
        if (err.code === 'ENOENT') {
          err = new Error();
          err.code = self.notFoundError;
        }
        return callback(err);
      }

      callback(null, contents);
    });
  };

  MultiFilePersistor.prototype.getAll = function (callback) {
    var
      records = [],
      self = this;
    fse.readdir(self.dir, function (err, files) {
      if (files) {
        var
          barrier = utils.syncBarrier(files.length, function (err) {
            callback(err, records);
          });
        utils.forEach(files, function (index, file) {
          fse.readJson(path.join(self.dir, file), function (err, record) {
            if (err) {
              return barrier(err);
            }
            records.push(record);
            barrier();
          });
        });
      } else {
        if (err.code === 'ENOENT') {
          return callback(null, records);
        }
        callback(err, records);
      }
    });
  };

  MultiFilePersistor.prototype.update = function (updatedRecord, callback) {
    var
      self = this;

    self.get(updatedRecord.id, function (err) {
      if (err) {
        return callback(err);
      }
      fse.writeJson(self.dir + '/' + updatedRecord.id + '.json', updatedRecord, function (err) {
        callback(err);
      });
    });
  };

  MultiFilePersistor.prototype.remove = function (id, callback) {
    var
      self = this;

    fse.remove(self.dir + '/' + id + '.json', function (err) {
      callback(err);
    });
  };



  module.exports = MultiFilePersistor;
}());