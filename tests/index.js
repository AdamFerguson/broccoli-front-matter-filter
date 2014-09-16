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

  describe('removeIfNoFrontMatter', function() {
    it('does not filter files without front matter by default', function() {
      var tree = filterFrontMatter(sourcePath);

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(dir) {
        var destPath = path.join(dir.directory, 'no-front-matter-file.js');
        expect(fs.existsSync(destPath)).to.be.ok();
      });
    });

    it('filters out files w/o front matter if removeIfNoFrontMatter', function() {
      var tree = filterFrontMatter(sourcePath, {
        removeIfNoFrontMatter: true
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(dir) {
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

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(dir) {
        var iosPath = path.join(dir.directory, 'ios.js');
        var windowzPath = path.join(dir.directory, 'windoz.js');

        expect(fs.existsSync(iosPath)).to.be.ok();
        expect(fs.existsSync(windowzPath)).to.not.be.ok();
      });
    });
  });
});
