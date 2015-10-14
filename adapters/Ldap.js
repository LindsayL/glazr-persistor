/*jslint node: true, nomen: true, unparam: true*/
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
   *  options.directoryDn: "ou=Glazr2Test,dc=glazr,dc=ca"
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
        'directoryDn',
        'entryObjectClass'
      ];

    utils.forEach(requiredParams, function (index, object) {
      if (options[object] === undefined || options[object] === null) {
        throw new Error('Persistor initialization: options.type="Ldap", '
          + 'No ' + object + ' specified in options.config (see readme).');
      }
      self[object] = options[object];
    });
    this.memberAttr = 'member';

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
    var err = new Error();
    err.code = 'METHODNOTIMPLEMENTED';
    return callback(err);
    //var
    //  dn;
    //if (!record.name) {
    //  record.name = this.getNewName();
    //}
    //dn = record.name;
    //delete record.name;
    //this.client.add(dn, record, [], function (err) {
    //  if (err) {
    //    return callback(err);
    //  }
    //  return callback(null, dn);
    //});
  };

  LdapPersistor.prototype.get = function (id, callback) {
    var
      self = this;

    self.search(id, 'base', function (err, results) {
      if (err) {
        if (err.name === 'NoSuchObjectError' || (results && results.length < 1)) {
          err = new Error();
          err.code = 'NOTFOUND';
          return callback(err);
        }
        return callback(err);
      }

      var
        record = results[0];
      if (record[self.memberAttr]) {
        // We need to parse the members attr, so we need additional data
        self.getAll(function (err, records) {
          record = self.parseMembers(record, records);
          return callback(null, record);
        });
      } else {
        return callback(null, record);
      }
    });
  };

  LdapPersistor.prototype.getAll = function (callback) {
    var
      self = this;

    self.search(this.directoryDn, 'sub', function (err, results) {
      if (err) {
        if (err.name === 'NoSuchObjectError') {
          return callback(null, []);
        }
        return callback(err);
      }
      // Time to parse the results!
      utils.forEach(results, function (index, record) {
        results[index] = self.parseMembers(record, results);
      });

      return callback(null, results);
    });
  };

  LdapPersistor.prototype.update = function (updatedRecord, callback) {
    var err = new Error();
    err.code = 'METHODNOTIMPLEMENTED';
    return callback(err);
  };

  LdapPersistor.prototype.remove = function (id, callback) {
    var err = new Error();
    err.code = 'METHODNOTIMPLEMENTED';
    return callback(err);

    //var
    //  self = this;
    //self.authenticate(function (err) {
    //  if (err) {
    //    return callback(err);
    //  }
    //  self.search(id, 'sub', function (err, results) {
    //    if (err) {
    //      callback(err);
    //    }
    //    self.deleteAll(results, function (err) {
    //      callback(err);
    //    });
    //  });
    //});
  };

  LdapPersistor.prototype.deleteAll = function (records, callback, iteration) {
    var
      self = this,
      barrier = utils.syncBarrier(records.length, function (err) {
        if (iteration > 30) {
          callback(iteration + ' attempts have been made to delete the following records: ' + JSON.stringify(records));
        } else if (err) {
          self.deleteAll(records, callback);
        } else {
          callback();
        }
      });

    utils.forEach(records, function (index, record) {
      self.deleteOne(record, function (err) {
        if (!err) {
          // Successfull deletion so remove from records
          records.splice(index, 1);
        }
        barrier(err);
      });
    });
  };

  LdapPersistor.prototype.deleteOne = function (record, callback) {
    this.client.del(record.dn, [], function (err) {
      if (err && err.name === 'NoSuchObjectError') {
        err = new Error();
        err.code = 'NOTFOUND';
        return callback(err);
      }
      return callback(err);
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
   * @param callback
   */
  LdapPersistor.prototype.search = function (dn, scope, callback) {
    var
      self = this,
      results = [],
      opts = {
        filter: '(objectclass=' + this.entryObjectClass + ')',
        scope: scope
      };

    this.client.search(dn, opts, function (err, res) {
      if (err) {
        return callback(err);
      }

      res.on('searchEntry', function (entry) {
        results.push(self.formatData(entry));
      });
      res.on('searchReference', function (err) {
        return callback(err);
      });
      res.on('error', function (err) {
        return callback(err);
      });
      res.on('end', function (err) {
        if (err) {
          return callback(err);
        }
        return callback(null, results);
      });
    });
  };

  /**
   * Transforms the member property of a record into 'groups' and 'users'
   * properties.  Does nothing if no member property.
   * @param {object} record - The record to transform.  (Already in interface form.)
   * @param {Array} groupRecords - An array of all the group records.
   * @returns {object} - The transformed record.
   */
  LdapPersistor.prototype.parseMembers = function (record, groupRecords) {
    var
      a,
      b,
      isGroup,
      members,
      rec = JSON.parse(JSON.stringify(record)); // create copy so we don't modify in place

    if (rec[this.memberAttr]) {
      members = rec[this.memberAttr];
      // It is a group entry!
      rec.groups = [];
      rec.users = [];
      for (a = 0; a < members.length; a += 1) {
        isGroup = false;
        for (b = 0; b < groupRecords.length; b += 1) {
          if (members[a] === groupRecords[b].id) {
            //The member is group
            isGroup = true;
            break;
          }
        }
        // Add the entry to appropriate property
        if (isGroup) {
          rec.groups.push(members[a]);
        } else {
          // Assume it is a user
          rec.users.push(members[a]);
        }
      }
      // Finished sorting members, remove it to prevent data duplication
      delete rec[this.memberAttr];
    }
    return rec;
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
   * Transforms expected interface format back to ldap records.
   * @param {object} record
   * @returns {object} - The transformed data
   */
  LdapPersistor.prototype.parseData = function (record) {

  };

  LdapPersistor.prototype.getNewName = (function () {
    var name = (new Date()).valueOf();
    return function () {
      name += 1;
      return 'cn=' + name;
    };
  }());
  module.exports = LdapPersistor;
}());