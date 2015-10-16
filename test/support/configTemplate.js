/*jslint node: true, nomen:true*/
(function () {
  'use strict';

  /**
   * This is just a template!
   * Please create a file called "config.js" in the root directory.
   * This file is used for running the integration tests.
   * Please copy the contents of this file to "config.js" and fill in
   * the values as required.
   */
  
  
  var
    config;

  config = {
    "Ldap": {
      url: '', // eg. 'ldap://127.0.0.1:389'
      bindDn: '', // eg. 'cn=rootAccount,dc=someOrg,dc=ca' 
      bindCredentials: '', // eg. 'rootAccountsPassword'
      searchBase: '', // eg. ou=theTopOuThatHasGroups,dc=someOrg,dc=ca
      entryObjectClass: '' // eg. 'groupOfNames'
    }
  };

  module.exports = config;
}());