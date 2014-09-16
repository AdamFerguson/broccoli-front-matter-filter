var Writer   = require('broccoli-writer');
var walkSync = require('walk-sync');
var FS       = require('q-io/fs');
var RSVP     = require('rsvp');
var path     = require('path');
var mkdirp   = require('mkdirp');

module.exports = FrontMatterFilter;

FrontMatterFilter.prototype = Object.create(Writer.prototype);
FrontMatterFilter.prototype.constructor = FrontMatterFilter;

function FrontMatterFilter (inputTree, options) {
  if (!(this instanceof FrontMatterFilter)) return new FrontMatterFilter(inputTree, options);

  this.options   = options || {};
  this.inputTree = inputTree;
}

FrontMatterFilter.prototype.write = function(readTree, destDir) {
  return readTree(this.inputTree).then(function(srcDir) {
    var filePaths = walkSync(srcDir);

    return RSVP.all(filePaths.map(function(filePath) {
      var srcFilePath  = path.join(srcDir, filePath);
      var destFilePath = path.join(destDir, filePath);

      return FS.read(srcFilePath).then(function(file) {
        mkdirp.sync(path.dirname(destFilePath));
        return FS.write(destFilePath, file);
      });
    }));
  });
};
