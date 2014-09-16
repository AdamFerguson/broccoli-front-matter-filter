var Writer      = require('broccoli-writer');
var walkSync    = require('walk-sync');
var FS          = require('q-io/fs');
var RSVP        = require('rsvp');
var path        = require('path');
var mkdirp      = require('mkdirp');
var matter      = require('gray-matter');
var objectMerge = require('object-merge');

module.exports = FrontMatterFilter;

FrontMatterFilter.prototype = Object.create(Writer.prototype);
FrontMatterFilter.prototype.constructor = FrontMatterFilter;

function FrontMatterFilter (inputTree, options) {
  if (!(this instanceof FrontMatterFilter)) return new FrontMatterFilter(inputTree, options);

  var defaultOptions = {
    stripFrontMatter:      true,
    removeIfNoFrontMatter: false,
    grayMatter: {}
  };

  this.options   = objectMerge(defaultOptions, (options || {}));
  this.inputTree = inputTree;
}

FrontMatterFilter.prototype.write = function(readTree, destDir) {
  var includeCB             = this.options.include;
  var strip                 = this.options.stripFrontMatter;
  var removeIfNoFrontMatter = this.options.removeIfNoFrontMatter;
  var grayMatterOptions     = this.options.grayMatter;
  var dirRegExp = /\/$/;

  var hasIncludeCB = (typeof(includeCB) === 'function');

  return readTree(this.inputTree).then(function(srcDir) {
    var filePaths = walkSync(srcDir);
    var onlyFiles = filePaths.filter(function(filePath) {
      // Is not a directory
      return !dirRegExp.test(filePath);
    });

    return RSVP.all(onlyFiles.map(function(filePath) {
      var srcFilePath  = path.join(srcDir, filePath);
      var destFilePath = path.join(destDir, filePath);

      return FS.read(srcFilePath).then(function(content) {
        var hasFrontMatter = matter.exists(content, grayMatterOptions);

        if (!hasFrontMatter) {
          if (!removeIfNoFrontMatter) {
            return _writeFile(destFilePath, content);
          } else {
            return RSVP.Promise.resolve(true);
          }
        } else {
          var parsed = matter(content, grayMatterOptions);
          if (hasIncludeCB && includeCB(parsed.data)) {
            return _writeFile(destFilePath, (strip ? parsed.content : content));
          } else if (!hasIncludeCB) {
            // pass through if include callback not provided
            return _writeFile(destFilePath, (strip ? parsed.content : content));
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
