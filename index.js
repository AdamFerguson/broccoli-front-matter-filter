var Writer    = require('broccoli-writer');
var walkSync  = require('walk-sync');
var FS        = require('q-io/fs');
var RSVP      = require('rsvp');
var path      = require('path');
var mkdirp    = require('mkdirp');
var fm        = require('front-matter');

module.exports = FrontMatterFilter;

FrontMatterFilter.prototype = Object.create(Writer.prototype);
FrontMatterFilter.prototype.constructor = FrontMatterFilter;

function FrontMatterFilter (inputTree, options) {
  if (!(this instanceof FrontMatterFilter)) return new FrontMatterFilter(inputTree, options);

  this.options   = options || {};
  this.inputTree = inputTree;
}

FrontMatterFilter.prototype.write = function(readTree, destDir) {
  var self = this;
  var includeCB = this.options.include;
  var strip      = this.options.stripFrontMatter;
  var removeIfNoFrontMatter = this.options.removeIfNoFrontMatter;

  var hasIncludeCB = (typeof(includeCB) === 'function');

  return readTree(this.inputTree).then(function(srcDir) {
    var filePaths = walkSync(srcDir);

    return RSVP.all(filePaths.map(function(filePath) {
      var srcFilePath  = path.join(srcDir, filePath);
      var destFilePath = path.join(destDir, filePath);

      return FS.read(srcFilePath).then(function(content) {
        var hasFrontMatter = fm.test(content);

        if (!hasFrontMatter) {
          if (!removeIfNoFrontMatter) {
            return _writeFile(destFilePath, content);
          } else {
            return RSVP.Promise.resolve(true);
          }
        } else {
          var parsed = fm(content);
          if (hasIncludeCB && includeCB(parsed.attributes)) {
            return _writeFile(destFilePath, (strip ? parsed.body : content));
          }
        }
      });
    }));
  });
};

// Returns a promise
function _writeFile(destFilePath, contents) {
  mkdirp.sync(path.dirname(destFilePath));
  return FS.write(destFilePath, contents);
}
