/*jslint node: true*/
(function () {
  'use strict';
  var
    fse = require('fs-extra'),
    path = require('path'),
    yaml = require('js-yaml'),
    YamlPersistor;


  /**
   * @param options
   *  options.filePath - File path to where the data will be stored.
   * @constructor
   */
  YamlPersistor = function (options) {
    if (!options.filePath) {
      throw new Error('Persistor initialization: type="Yaml", '
        + 'No filePath specified in options.config (see readme).');
    }
    this.filePath = options.filePath;
    this.notFoundError = 404;
    this.serverError = 500;
    this.clientError = 400;
  };

  YamlPersistor.prototype.create = function (record, callback) {
    var
      self = this;

    self.readYaml(function (err, records) {
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
      self.writeYaml(records, function (err) {
        if (err) {
          callback(err);
        } else {
          callback(null, id);
        }
      });
    });
  };

  YamlPersistor.prototype.get = function (id, callback) {
    var
      self = this;

    self.readYaml(function (err, records) {
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
        err.message = 'Id, "' + id + '", not found in "' + self.filePath + '".';
        callback(err);
      }
    });
  };

  YamlPersistor.prototype.getAll = function (callback) {
    this.readYaml(callback);
  };

  YamlPersistor.prototype.update = function (updatedRecord, callback) {
    var
      self = this;

    self.readYaml(function (err, records) {
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
        self.writeYaml(records, callback);
      } else {
        // Else we didn't find the record
        err = new Error();
        err.status = self.notFoundError;
        callback(err);
      }
    });
  };

  YamlPersistor.prototype.remove = function (id, callback) {
    var
      self = this;

    self.readYaml(function (err, records) {
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
        self.writeYaml(records, callback);

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
  YamlPersistor.prototype.getMaxId = function (records) {
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
   * Reads ymal from a file.  If file does not exist an empty object is
   * returned.  Can return an error if there is a parse error.
   *
   * @param {function(err, data)} callback - data is the parsed object.
   */
  YamlPersistor.prototype.readYaml = function (callback) {
    var
      self = this;
    fse.readFile(self.filePath, function (err, data) {
      // If it doesn't exist give appropriate error
      if (err && err.code === 'ENOENT') {
        err.status = self.notFoundError;
        err.message = 'YamlPersistor: Could not find "' + path.resolve(self.filePath) + '".';
        return callback(err);
      }
      try {
        data = yaml.safeLoad(data);
      } catch (e) {
        e.status = self.serverError;
        e.message = 'YamlPersistor: Could not parse "' + path.resolve(self.filePath) + '".';
        return callback(e);
      }

      // Else return the err (if success err == null)
      return callback(err, data);
    });
  };

  /**
   * Writes yaml to a file.  If filePath does not exist it is created.
   *
   * @param {object} data - Data to stringify and write.
   * @param {function(err)} callback
   */
  YamlPersistor.prototype.writeYaml = function (data, callback) {
    var
      self = this;

    try {
      data = yaml.safeDump(data);
    } catch (e) {
      e.status = self.clientError;
      e.message = 'YamlPersistor: Could not convert "' + JSON.stringify(data) + '"to yaml.';
      return callback(e);
    }

    fse.writeFile(self.filePath, data, function (err) {

      // If it doesn't exist create it
      if (err && err.code === 'ENOENT') {
        return fse.mkdirs(path.dirname(self.filePath), function (err) {
          if (err) {
            callback(err);
          } else {
            fse.writeFile(self.filePath, data, function (err) {
              callback(err);
            });
          }
        });
      }

      // Else return the err (if success err == null)
      return callback(err);
    });
  };

  module.exports = YamlPersistor;
}());