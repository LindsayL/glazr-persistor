/*jslint node: true*/
(function () {
  'use strict';
  var
    fse = require('fs-extra'),
    path = require('path'),
    LocalPersistor;


  /**
   * @param options
   *  options.filePath - File path to where the data will be stored.
   * @constructor
   */
  LocalPersistor = function (options) {
    this.type = 'LocalFile';
    if (!options.filePath) {
      throw new Error('Persistor initialization: type="LocalFile", '
        + 'No filePath specified in options.config (see readme).');
    }
    this.filePath = options.filePath;
    this.notFoundError = 404;
    this.serverError = 500;
    this.clientError = 400;
  };

  LocalPersistor.prototype.create = function (record, callback) {
    var
      self = this;

    self.readJson(function (err, records) {
      if (err) {
        if (err.status === self.notFoundError) {
          records = [];
        } else {
          return callback(err);
        }
      }

      var
        id;

      // Add a unique id to the record.
      id = self.getMaxId(records) + 1;
      record.id = id;

      // Add the new record and write it out
      records.push(record);
      self.writeJson(records, function (err) {
        if (err) {
          callback(err);
        } else {
          callback(null, id);
        }
      });
    });
  };

  LocalPersistor.prototype.get = function (id, callback) {
    var
      self = this;

    self.readJson(function (err, records) {
      if (err) {
        return callback(err);
      }

      var
        result,
        i;

      id = parseInt(id, 10);

      // Find the requested record
      if (records && records.length) {
        for (i = 0; i < records.length; i += 1) {
          if (records[i].id === id) {
            result = records[i];
            break;
          }
        }
      }

      if (result) {
        callback(err, result);
      } else {
        err = new Error();
        err.status = self.notFoundError;
        callback(err);
      }
    });
  };

  LocalPersistor.prototype.getAll = function (callback) {
    this.readJson(callback);
  };

  LocalPersistor.prototype.update = function (updatedRecord, callback) {
    var
      self = this;

    self.readJson(function (err, records) {
      if (err) {
        return callback(err);
      }

      var
        i,
        recordIndex;


      // Find the requested record
      if (records && records.length) {
        for (i = 0; i < records.length; i += 1) {
          if (records[i].id === updatedRecord.id) {
            recordIndex = i;
            break;
          }
        }
      }

      if (recordIndex !== undefined) {
        // Found the record, update it and save
        records[recordIndex] = updatedRecord;
        self.writeJson(records, callback);
      } else {
        // Else we didn't find the record
        err = new Error();
        err.status = self.notFoundError;
        callback(err);
      }
    });
  };

  LocalPersistor.prototype.remove = function (id, callback) {
    var
      self = this;

    self.readJson(function (err, records) {
      if (err) {
        return callback(err);
      }

      var
        i,
        recordIndex;

      // Find the requested record
      if (records && records.length) {
        for (i = 0; i < records.length; i += 1) {
          if (records[i].id === id) {
            recordIndex = i;
            break;
          }
        }
      }

      if (recordIndex !== undefined) {
        // Found the record, remove it and save
        records.splice(recordIndex, 1);
        self.writeJson(records, callback);

      } else {
        // Else we didn't find the record
        err = new Error();
        err.status = self.notFoundError;
        callback(err);
      }
    });
  };

  /**
   * Gets the max val of id found in records.
   *
   * @param {array} records - An array of objects with property, 'id'.
   * @returns {number} - The max Id found.
   */
  LocalPersistor.prototype.getMaxId = function (records) {
    var
      i,
      maxId = 0;
    for (i = 0; i < records.length; i += 1) {
      if (records[i].id > maxId) {
        maxId = records[i].id;
      }
    }
    return maxId;
  };

  /**
   * Reads json from a file.  If file does not exist an empty object is
   * returned.  Can return an error if there is a parse error.
   *
   * @param {function(err, data)} callback - data is the parsed json object.
   */
  LocalPersistor.prototype.readJson = function (callback) {
    var
      self = this;
    fse.readJson(self.filePath, function (err, data) {
      // If it doesn't exist give appropriate error
      if (err) {
        if (err.code === 'ENOENT') {
          err.status = self.notFoundError;
          err.message = 'LocalFilePersistor: Could not find "' + self.filePath + '".';
          return callback(err);
        }
        err.status = self.serverError;
        return callback(err);
      }
      // Else return the err (if success err == null)
      return callback(err, data);
    });
  };

  /**
   * writes json to a file.  If filePath does not exist it is created.
   *
   * @param {object} data - Data to stringify and write.
   * @param {function(err)} callback
   */
  LocalPersistor.prototype.writeJson = function (data, callback) {
    var
      self = this;

    fse.writeJson(self.filePath, data, function (err) {

      // If it doesn't exist create it
      if (err) {
        if (err.code === 'ENOENT') {
          return fse.mkdirs(path.dirname(self.filePath), function (err) {
            if (err) {
              callback(err);
            } else {
              fse.writeJson(self.filePath, data, function (err) {
                callback(err);
              });
            }
          });
        }
        err.status = self.clientError;
        return callback(err);
      }

      // Else return the err (if success err == null)
      return callback(err);
    });
  };

  module.exports = LocalPersistor;
}());