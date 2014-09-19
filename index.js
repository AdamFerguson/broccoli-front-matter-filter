var Writer      = require('broccoli-writer');
var walkSync    = require('walk-sync');
var path        = require('path');
var mkdirp      = require('mkdirp');
var matter      = require('gray-matter');
var objectMerge = require('object-merge');
var fs          = require('fs');

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

    return filePaths.map(function(filePath) {
      var srcFilePath  = path.join(srcDir, filePath);
      var destFilePath = path.join(destDir, filePath);

      // handle directories
      if (destFilePath.slice(-1) === '/') {
        mkdirp.sync(destFilePath);
        return;
      }

      var content = fs.readFileSync(srcFilePath, {encoding: 'utf8'});
      var hasFrontMatter = matter.exists(content, grayMatterOptions);

      if (!hasFrontMatter) {
        if (!removeIfNoFrontMatter) {
          fs.writeFileSync(destFilePath, content);
        } 
      } else {
        var parsed = matter(content, grayMatterOptions);
        if (hasIncludeCB && includeCB(parsed.data)) {
          fs.writeFileSync(destFilePath, (strip ? parsed.content : content));
        } else if (!hasIncludeCB) {
          // pass through if include callback not provided
          fs.writeFileSync(destFilePath, (strip ? parsed.content : content));
        }
      }
      return;
    });
  });
};
