/*jslint node: true, nomen: true, unparam: true*/
(function () {
  'use strict';

  /**
   * Accepts the filePath where the data will be stored
   * @param {object} options - Possible configurations include:
   * {
   *  type: 'LocalFile'
   *  config: {
   *    filePath: ''
   *   }
   * }
   * @constructor
   */
  var Persistor = function (options) {
    this.adapter = this.getAdapter(options);
    this.type = options.type;
  };

  /**
   * Initializes the adapter that will be used.
   * @param {object} options
   * @returns {object} The initialized adapter.
   */
  Persistor.prototype.getAdapter = function (options) {
    if (!options) {
      throw new Error("Persistor initialization: Missing options (see readme)");
    }
    if (!options.type) {
      throw new Error("Persistor initialization: Missing options.type (see readme)");
    }
    if (!options.config) {
      throw new Error("Persistor initialization: Missing options.config (see readme)");
    }

    var
      persPath;

    switch (options.type) {
      case 'LocalFile':
        persPath = 'LocalFile';
        break;
      case 'Ldap':
        persPath = 'Ldap';
        break;
      case 'MultiFile':
        persPath = 'MultiFile';
        break;
      case 'Yaml':
        persPath = 'Yaml';
        break;
      default:
        throw new Error("Persistor initialization: Invalid options.type (see readme)");
    }
    return new (require('./adapters/' + persPath))(options.config);
  };

  /**
   * The callback returns the object's new id upon successful creation.
   * @param {object} record - The object to create.
   * @param {function(err, id)} callback
   */
  Persistor.prototype.create = function (record, callback) {
    this.adapter.create(record, callback);
  };


  /**
   * The callback returns the record upon successful retrieval.
   * @param {string} id - The id of the record to retrieve.
   * @param {function(err, record)} callback
   */
  Persistor.prototype.get = function (id, callback) {
    this.adapter.get(id, callback);
  };

  /**
   * The callback returns an array of records upon successful retrieval.
   * @param {function(err, records)} callback - records is expected to be an array of objects.
   */
  Persistor.prototype.getAll = function (callback) {
    this.adapter.getAll(callback);
  };

  /**
   * Updates the record with the given id.
   * @param {object} updatedRecord - Has the mandatory parameter of 'id'
   * @param {function(err)} callback
   */
  Persistor.prototype.update = function (updatedRecord, callback) {
    if (updatedRecord.id === undefined || updatedRecord.id === null) {
      var err = new Error();
      err.status = 400;
      err.message = 'No "id" specified in the record. (' + JSON.stringify(updatedRecord) + ')';
      return callback(err);
    }
    this.adapter.update(updatedRecord, callback);
  };

  /**
   * The callback returns nothing on successful removal.
   * @param {string} id
   * @param {function(err)} callback
   */
  Persistor.prototype.remove = function (id, callback) {
    this.adapter.remove(id, callback);
  };

  module.exports = Persistor;
}());
