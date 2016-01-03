/*jslint node: true*/
(function () {
  'use strict';
  var
    ldap = require('ldapjs'),
    utils = require('glazr-utils'),
    helper = require('../helper'),
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
      /*jslint unparam:true*/
      if (options[object] === undefined || options[object] === null) {
        throw self.parseError(new Error('Persistor initialization: options.type="Ldap", '
          + 'No ' + object + ' specified in options.config (see readme).'));
      }
      self[object] = options[object];
    });
  };

  LdapPersistor.prototype.connect = function () {
    var
      self = this,
      client,
      connectionOptions = {
        url: this.url
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
      subDn;

    // Prepare the record
    record = JSON.parse(JSON.stringify(record));
    record.attributes.objectClass = [self.entryObjectClass];
    if (!record.dn && record.attributes && record.attributes.cn) {
      record.dn = 'cn=' + record.attributes.cn + ',' + self.searchBase;
    }

    // Get the super dn of the dn
    if (record.dn) {
      subDn = record.dn.split(',');
      subDn[0] = subDn[1];
      for (i = 2; i < subDn.length; i += 1) {
        subDn[0] += ',' + subDn[i];
      }
      subDn = subDn[0];
    } else {
      subDn = self.searchBase;
    }

    // Check that super dn exists
    self.search(subDn, 'base', function (err) {
      if (err) {
        if (err.status === 404) {
          err.name = 'Path does not exist.';
          err.message = 'The super dn, "' + subDn + '", does not exist.';
        }
        return callback(err);
      }

      // If super dn existed do the add!
      return self.add(record.dn, record.attributes, callback);
    }, null);
  };

  LdapPersistor.prototype.add = function (dn, attributes, callback) {
    var
      createOwnDn = false,
      self = this;
    self.authenticate(function (err) {
      if (err) {
        return callback(self.parseError(err));
      }

      if (!dn) {
        createOwnDn = true;
        dn = self.getNewDn();
      }
      try {
        self.client.add(String(dn), attributes, [], function (err) {
          self.client.unbind();
          err = self.parseError(err);
          if (createOwnDn && err && err.name === 'EntryAlreadyExistsError') {
            return self.add(undefined, attributes, callback);
          }
          return callback(err, dn);
        });
      } catch (e) {
        e = self.parseError(e);
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
      }
      if (err) {
        return callback(self.parseError(err));
      }

      return callback(null, results[0]);
    });
  };

  LdapPersistor.prototype.getAll = function (callback) {
    var
      self = this;

    self.search(self.searchBase, 'sub', function (err, results) {
      if (err) {
        return callback(self.parseError(err));
      }

      return callback(null, results);
    });
  };

  LdapPersistor.prototype.update = function (updatedRecord, callback) {
    var
      self = this;

    // Ensure the record actually exists
    self.get(updatedRecord.id, function (err, oldRecord) {
      if (err) {
        return callback(err);
      }

      // Remove old record
      self.remove(oldRecord.dn, function (err) {
        if (err) {
          return callback(err);
        }

        // Create new record
        self.create(updatedRecord, function (err, id) {
          if (err) {
            // If we failed to create, recreate the old one
            self.create(oldRecord, function (err2, id) {
              /*jslint unparam:true*/
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
        return callback(self.parseError(err));
      }

      try {
        self.client.del(String(id), [], function (err) {
          self.client.unbind();
          return callback(self.parseError(err));
        });
      } catch (e) {
        return callback(self.parseError(e));
      }
    });
  };

  /**
   * Authenticates the bind credentials.
   * @param {function(err)} callback
   */
  LdapPersistor.prototype.authenticate = function (callback) {
    this.client = this.connect();
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
    this.client = this.connect();
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
        if (err) {
          return callback(self.parseError(err));
        }

        res.on('searchEntry', function (entry) {
          results.push(self.formatData(entry));
        });
        res.on('searchReference', function (err) {
          return callback(self.parseError(err));
        });
        res.on('error', function (err) {
          return callback(self.parseError(err));
        });
        res.on('end', function (err) {
          self.client.unbind();
          return callback(self.parseError(err), results);
        });
      });
    } catch (e) {
      return callback(self.parseError(e));
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
      transformedData = {attributes: {}};

    if (record.attributes) {
      // Add attributes to top level
      for (i = 0; i < record.attributes.length; i += 1) {
        attr = record.attributes[i];
        transformedData.attributes[attr.type] = attr.vals;
      }
    }

    // Add special attributes
    transformedData.id = record.dn;
    transformedData.dn = record.dn;
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
  LdapPersistor.prototype.parseError = function (err) {
    if (!err || (!err.status && !err.message && !err.name)) {
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
    error.status = 500;
    error.stack = err.stack;
    if (err && (err.name === 'NoSuchObjectError' || err.name === 'InvalidDistinguishedNameError')) {
      error.status = 404;
    } else if (utils.matchExists([err.name], clientErrors)) {
      error.status = 400;
    } else if (err.name === 'ProtocolError' && err.message === 'no attributes provided') {
      error.status = 400;
      error.name = 'MissingAttribute';
      error.message = 'Missing required attributes to create an object of class "' + this.entryObjectClass + '"';
    }

    return helper.parseError(error);
  };

  module.exports = LdapPersistor;
}());