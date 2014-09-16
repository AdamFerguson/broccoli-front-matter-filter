var filterFrontMatter = require('../index');
var expect            = require('expect.js');
var broccoli          = require('broccoli');
var fs                = require('fs');
var path              = require('path');

describe('broccoli-front-matter-filter', function() {
  var sourcePath = 'tests/fixtures';
  var builder;
  var tree;

  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  var buildTree = function(inputTree) {
    builder = new broccoli.Builder(inputTree);
    return builder.build();
  };

  describe('removeIfNoFrontMatter', function() {
    it('does not filter files without front matter by default', function() {
      var tree = filterFrontMatter(sourcePath);

      return buildTree(tree).then(function(dir) {
        var destPath = path.join(dir.directory, 'no-front-matter-file.md');
        expect(fs.existsSync(destPath)).to.be.ok();
      });
    });

    it('filters out files w/o front matter if removeIfNoFrontMatter', function() {
      var tree = filterFrontMatter(sourcePath, {
        removeIfNoFrontMatter: true
      });

      return buildTree(tree).then(function(dir) {
        var destPath = path.join(dir.directory, 'no-front-matter-file.js');
        expect(fs.existsSync(destPath)).to.not.be.ok();
      });
    });
  });

  describe('include', function() {
    it('sends through files that eval true', function() {
      var tree = filterFrontMatter(sourcePath, {
        include: function(frontMatter) {
          return frontMatter.mobile === true;
        }
      });

      return buildTree(tree).then(function(dir) {
        var iosPath = path.join(dir.directory, 'ios.md');
        var windozPath = path.join(dir.directory, 'windoz.md');

        expect(fs.existsSync(iosPath)).to.be.ok();
        expect(fs.existsSync(windozPath)).to.not.be.ok();
      });
    });
  });

  describe('grayMatter', function() {
    it('accepts grayMatter options to pass through to front matter parser', function() {
      var tree = filterFrontMatter(sourcePath, {
        grayMatter: {
          delims: [['\\/\\*\\* yaml', '---'], ['\\*\\*\\/', '---']]
        },
        include: function(frontMatter) {
          return frontMatter.mobile === true;
        }
      });

      return buildTree(tree).then(function(dir) {
        var iosPath = path.join(dir.directory, 'ios.md');
        var windozPath = path.join(dir.directory, 'windoz.md');

        var iosJsPath = path.join(dir.directory, 'sub', 'ios.js');
        var windozJsPath = path.join(dir.directory, 'sub', 'windoz.js');

        expect(fs.existsSync(iosPath)).to.be.ok();
        expect(fs.existsSync(windozPath)).to.not.be.ok();

        expect(fs.existsSync(iosJsPath)).to.be.ok();
        expect(fs.existsSync(windozJsPath)).to.not.be.ok();
      });
    });
  });
});
