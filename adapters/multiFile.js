/*jslint node: true*/
/*globals */
(function () {
  'use strict';

  var
    fse = require('fs-extra'),
    path = require('path'),
    utils = require('glazr-utils'),
    MultiFilePersistor;


  MultiFilePersistor = function (options) {
    if (!options.dir) {
      throw new Error('Persistor initialization: type="MultiFile", '
        + 'No dir specified in options.config (see readme).');
    }
    this.dir = options.dir;
    this.notFoundError = 404;
    this.serverError = 500;
    this.clientError = 400;
  };

  MultiFilePersistor.prototype.create = function (data, callback) {
    var
      self = this,
      id = 0,
      i,
      createFn;

    createFn = function (files, callback) {
      for (i = 0; i < files.length; i += 1) {
        id = Math.max(id, parseInt(files[i], 10));
      }
      id += 1;
      data.id = id;
      fse.writeJson(self.dir + '/' + id + '.json', data, function (err) {
        if (err) {
          err.status = self.clientError;
        }
        callback(err, id);
      });
    };

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
          fse.mkdirs(self.dir, function (err) {
            if (err) {
              err.status = self.serverError;
              return callback(err);
            }
            createFn([], callback);
          });
        } else {
          err.status = self.serverError;
          callback(err);
        }
      } else {
        createFn(files, callback);
      }
    });
  };

  MultiFilePersistor.prototype.get = function (id, callback) {
    var self = this;
    fse.readJson(self.dir + '/' + id + '.json', function (err, contents) {
      if (err) {
        if (err.code === 'ENOENT') {
          err.status = self.notFoundError;
          err.message = 'Failed to find ' + self.dir + '/' + id + '.json';
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
            if (err && err.length) {
              err[0].status = self.serverError;
              return callback(err[0]);
            }
            callback(err, records);
          });
        utils.forEach(files, function (index, file) {
          /*jslint unparam: true*/
          fse.readJson(path.join(self.dir, file), function (err, record) {
            if (err) {
              return barrier(err);
            }
            records.push(record);
            barrier();
          });
        });
      } else {
        if (err) {
          if (err.code === 'ENOENT') {
            err.status = self.notFoundError;
            err.message = 'Failed to find ' + self.dir;
          } else {
            err.status = self.serverError;
          }
          return callback(err);
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