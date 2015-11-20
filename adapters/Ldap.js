/*jslint node: true*/
(function () {
  'use strict';
  var
    ldap = require('ldapjs'),
    utils = require('glazr-utils'),
    LdapPersistor;

  /**
   * This adapter is adapted for specific uses of ldap.  These uses include
   * managing groups.
   * @param {object} options
   *  options.url: "ldap://ipaddress:389"
   *  options.bindDn: "CN=admin,DC=ca"
   *  options.bindCredentials: "somepassword"
   *  options.searchBase: "ou=Glazr2Test,dc=glazr,dc=ca"
   *  options.entryObjectClass: "groupOfNames"
   * @constructor
   */
  LdapPersistor = function (options) {
    this.type = 'Ldap';
    var
      self = this,
      requiredParams = [
        'url',
        'bindDn',
        'bindCredentials',
        'searchBase',
        'entryObjectClass'
      ];

    utils.forEach(requiredParams, function (index, object) {
      if (options[object] === undefined || options[object] === null) {
        throw new Error('Persistor initialization: options.type="Ldap", '
          + 'No ' + object + ' specified in options.config (see readme).');
      }
      self[object] = options[object];
    });

    this.client = this.connect();
  };

  LdapPersistor.prototype.connect = function () {
    var
      self = this,
      client,
      connectionOptions = {
        url: this.url
        // Apparently binding initially does not happen... So bind manually as required
        //bindDN: this.bindDn,
        //bindCredentials: this.bindCredentials
      };
    client = ldap.createClient(connectionOptions);

    // Auto reset connection
    client.on('error', function (e) {
      console.log('LDAP connection error:', e);
      self.client = ldap.createClient(connectionOptions);
    });

    return client;
  };

  LdapPersistor.prototype.create = function (record, callback) {
    var
      self = this,
      i,
      subDn,
      dn;

    // Prepare the record
    record.objectClass = self.entryObjectClass;

    // Get the dn
    dn = record.name;
    delete record.name;

    // Get the super dn of the dn
    subDn = dn;
    if (!subDn) {
      subDn = self.getNewDn();
    }
    subDn = subDn.split(',');
    subDn[0] = subDn[1];
    for (i = 2; i < subDn.length; i += 1) {
      subDn[0] += ',' + subDn[i];
    }
    subDn = subDn[0];

    // Check that super dn exists
    self.search(subDn, 'base', function (err) {
      if (err) {
        if (err.code === 404) {
          err.name = 'Path does not exist.';
          err.message = 'The super dn, "' + subDn + '", does not exist.';
        }
        return callback(err);
      }

      // If super dn existed do the add!
      return self.add(dn, record, callback);
    }, null);
  };

  LdapPersistor.prototype.add = function (dn, record, callback) {
    var
      createOwnDn = false,
      self = this;
    self.authenticate(function (err) {
      err = self.errorParser(err);
      if (err) {
        return callback(err);
      }

      if (!dn) {
        createOwnDn = true;
        dn = self.getNewDn();
      }
      try {
        self.client.add(String(dn), record, [], function (err) {
          err = self.errorParser(err);
          if (createOwnDn && err && err.name === 'EntryAlreadyExistsError') {
            return self.add(undefined, record, callback);
          }
          return callback(err, dn);
        });
      } catch (e) {
        e = self.errorParser(e);
        callback(e);
      }
    });
  };

  LdapPersistor.prototype.get = function (id, callback) {
    var
      self = this;

    self.search(id, 'base', function (err, results) {
      if (!err && results.length === 0) {
        err = {name: 'NoSuchObjectError'};
        err = self.errorParser(err);
      }
      if (err) {
        return callback(err);
      }

      return callback(null, results[0]);
    });
  };

  LdapPersistor.prototype.getAll = function (callback) {
    var
      self = this;

    self.search(self.searchBase, 'sub', function (err, results) {
      if (err) {
        err = self.errorParser(err);
        return callback(err);
      }

      return callback(null, results);
    });
  };

  LdapPersistor.prototype.update = function (updatedRecord, callback) {
    var
      oldRecord,
      dn = updatedRecord.id,
      self = this;

    delete updatedRecord.id;
    oldRecord = JSON.parse(JSON.stringify(updatedRecord));
    oldRecord.name = dn;

    // Ensure the record actually exists
    self.get(dn, function (err) {
      if (err) {
        return callback(err);
      }
      if (!updatedRecord.name) {
        updatedRecord.name = dn;
      }

      // Remove old record
      self.remove(dn, function (err) {
        if (err) {
          return callback(err);
        }

        // Create new record
        self.create(updatedRecord, function (err, id) {
          if (err) {
            // If we failed to create, recreate the old one
            self.create(oldRecord, function (err2, id) {
              if (err2) {
                return callback(err2);
              }
              callback(err);
            });
          } else {
            callback(null, id);
          }
        });
      });
    });
  };

  LdapPersistor.prototype.remove = function (id, callback) {
    var
      self = this;
    self.authenticate(function (err) {
      if (err) {
        return callback(err);
      }

      try {
        self.client.del(String(id), [], function (err) {
          err = self.errorParser(err);
          return callback(err);
        });
      } catch (e) {
        return callback(self.errorParser(e));
      }
    });
  };

  /**
   * Authenticates the bind credentials.
   * @param {function(err)} callback
   */
  LdapPersistor.prototype.authenticate = function (callback) {
    this.client.bind(this.bindDn, this.bindCredentials, [], callback);
  };

  /**
   * Searches for entries in the dn or for the dn specifically.
   * @param dn - The directory to search through, or entry to search for.
   * @param {string} scope - 'base'/'sub'/'one'
   *  base: Look for the dn exactly.
   *  sub: Look at every sub-entry.
   *  one: Look only at direct sub-entries.
   * @param {function(err, res)} callback
   * @param filter - defaults to '(objectclass=' + this.entryObjectClass + ')'.
   */
  LdapPersistor.prototype.search = function (dn, scope, callback, filter) {
    if (filter === undefined) {
      filter = '(objectclass=' + this.entryObjectClass + ')';
    }
    var
      self = this,
      results = [],
      opts = {
        filter: filter,
        scope: scope
      };

    try {
      self.client.search(String(dn), opts, function (err, res) {
        err = self.errorParser(err);
        if (err) {
          return callback(err);
        }

        res.on('searchEntry', function (entry) {
          results.push(self.formatData(entry));
        });
        res.on('searchReference', function (err) {
          return callback(self.errorParser(err));
        });
        res.on('error', function (err) {
          return callback(self.errorParser(err));
        });
        res.on('end', function (err) {
          err = self.errorParser(err);
          return callback(err, results);
        });
      });
    } catch (e) {
      return callback(self.errorParser(e));
    }
  };

  /**
   * Transforms ldap records into a an expected interface format.
   * @param {object} record - ldap entry.
   * @returns {object} - The transformed data in interface format.
   */
  LdapPersistor.prototype.formatData = function (record) {
    var
      i,
      attr,
      transformedData = {};

    if (record.attributes) {
      // Add attributes to top level
      for (i = 0; i < record.attributes.length; i += 1) {
        attr = record.attributes[i];
        transformedData[attr.type] = attr.vals;
      }
    }

    // Add special attributes
    transformedData.id = record.dn;
    transformedData.name = record.dn;
    return transformedData;
  };

  /**
   * Gets a new uniquely generated dn.
   * @returns {string} The new dn.
   */
  LdapPersistor.prototype.getNewDn = (function () {
    var
      uniId = 0;

    return function () {
      uniId += 1;
      return 'cn=' + (new Date()).valueOf() + uniId + ',' + this.searchBase;
    };
  }());

  /**
   * Translates errors into expected error values.
   * @param {object} err - The original error.
   * @returns {object} The translated error.
   */
  LdapPersistor.prototype.errorParser = function (err) {
    if (!err || (!err.code && !err.message && !err.name)) {
      // We don't really have an error
      return undefined;
    }
    var
      clientErrors = [
        'EntryAlreadyExistsError',
        'InvalidAttributeSyntaxError',
        'UndefinedAttributeTypeError'
      ],
      error = new Error();
    error.name = err.name;
    error.message = err.message;
    error.code = 500;
    error.stack = err.stack;
    if (err && (err.name === 'NoSuchObjectError' || err.name === 'InvalidDistinguishedNameError')) {
      error.code = 404;
    } else if (utils.matchExists([err.name], clientErrors)) {
      error.code = 400;
    } else if (err.name === 'ProtocolError' && err.message === 'no attributes provided') {
      error.code = 400;
      error.name = 'MissingAttribute';
      error.message = 'Missing required attributes to create an object of class "' + this.entryObjectClass + '"';
    }
    return error;
  };

  module.exports = LdapPersistor;
}());