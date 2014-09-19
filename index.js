var Writer      = require('broccoli-writer');
var walkSync    = require('walk-sync');
var RSVP        = require('rsvp');
var path        = require('path');
var mkdirp      = require('mkdirp');
var matter      = require('gray-matter');
var objectMerge = require('object-merge');
var fs          = require('graceful-fs');

var promiseReadFile  = RSVP.denodeify(fs.readFile);
var promiseWriteFile = RSVP.denodeify(fs.writeFile);
var promiseFileClose = RSVP.denodeify(fs.close);

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

  var hasIncludeCB = (typeof(includeCB) === 'function');

  return readTree(this.inputTree).then(function(srcDir) {
    var filePaths = walkSync(srcDir);

    return RSVP.all(filePaths.map(function(filePath) {
      var srcFilePath  = path.join(srcDir, filePath);
      var destFilePath = path.join(destDir, filePath);

      // handle directories
      if (destFilePath.slice(-1) === '/') {
        mkdirp.sync(destFilePath);
        return RSVP.resolve();
      }

      // return promiseReadFile(srcFilePath, {encoding: 'utf8'}).then(function(content) {
      return _readFile(srcFilePath).then(function(content) {
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
  return promiseWriteFile(destFilePath, contents, {encoding: 'utf8'});
}

function _readFile(srcFilePath) {
  return promiseReadFile(srcFilePath, {encoding: 'utf8'});
}
