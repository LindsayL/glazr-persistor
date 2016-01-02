# glazr-persistor

#####Currently supports persistence via:
- [LocalFile](#localfile)
- [MultiFile](#multifile)
- [Yaml](#yaml)
- [Ldap](#ldap)

#Usage
```
var 
  Persistor = require('glazr-persistor'),
  persistor,
  options;
  
  options = {
    type: 'LocalFile',
    config: {
      filePath: 'some/path/file.txt'
      }
    };
  
  persistor = new Persistor(options);
```

### create(record, callback)
######@param {object} record - The object to create.
######@param {function(err, id)} callback

The callback returns the object's new id upon successful creation.

### get(id, callback)
######@param{string} id - The id of the record to retrieve.
######@param{function(err, record)} callback

The callback returns the record upon successful retrieval.

### getAll(callback)
######@param{function(err, records)} callback - records is expected to be an array of objects.

The callback returns an array of records upon successful retrieval.

### update(updatedRecord, callback)
######@param{object} updatedRecord - Has the mandatory parameter of 'id'.
######@param{function(err)} callback

The callback returns nothing on successful update.

### remove(id, callback)
######@param{string} id
######@param{function(err)} callback

The callback returns nothing on successful removal of the record.

# LocalFile
```
options = {
  type: 'LocalFile',
  config: {
    filePath: 'some/path/toaFile.txt'
    }
  };
```
NOTE: Local files do a maximum size limit before trouble can occur.  Storing something like ~50 screenshots in one file can cause your node/docker server to restart losing all data.


# MultiFile
```
options = {
  type: 'MultiFile',
  config: {
    dir: 'some/path/toTheContainingDirectory'
    }
  };
```
