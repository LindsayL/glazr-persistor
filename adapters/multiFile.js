/*jslint node: true, stupid: true*/
/*globals */
(function () {
  'use strict';

  var
    fse = require('fs-extra'),
    path = require('path'),
    MultiFilePersistor;


  MultiFilePersistor = function (options) {
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
        callback(err);
        return;
      }

      callback(null, contents);
    });
  };

  MultiFilePersistor.prototype.getAll = function (callback) {
    var self = this;
    fse.readJson(self.dir + '/' + id + '.json', function (err, contents) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, contents);
    });
  };

  MultiFilePersistor.prototype.update = function (updatedRecord, callback) {
    var self = this;

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (err) {
        callback(err);
        return;
      }
    }

    self.get(id, function (err) {
      if (!!err) {
        callback(err);
        return;
      }

      fse.writeJson(self.dir + '/' + id + '.json', data, function (err2) {
        callback(err2);
      });
    });
  };

  MultiFilePersistor.prototype.remove = function (id, callback) {
    var self = this;

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (err) {
        callback(err);
        return;
      }
    }

    self.get(id, function (err) {
      if (!!err) {
        callback(err);
        return;
      }

      fse.writeJson(self.dir + '/' + id + '.json', data, function (err2) {
        callback(err2);
      });
    });
  };



  module.exports = MultiFilePersistor;
}());