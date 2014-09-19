var filterFrontMatter = require('../index');
var expect            = require('expect.js');
var broccoli          = require('broccoli');
var fs                = require('fs');
var path              = require('path');
var rimraf            = require('rimraf');
var mkdirp            = require('mkdirp');
var mergeTrees        = require('broccoli-merge-trees');

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

  describe('stripFrontMatter', function() {
    it('removes front matter by default from file sent to destination tree', function() {
      var tree = filterFrontMatter(sourcePath);

      return buildTree(tree).then(function(dir) {
        var destPath = path.join(dir.directory, 'ios.md');
        var fileContent = fs.readFileSync(destPath, {encoding: 'utf8'});
        expect(/^##/.test(fileContent)).to.be.ok();
      });
    });

    it('retains front matter if specified', function() {
      var tree = filterFrontMatter(sourcePath, {
        stripFrontMatter: false
      });

      return buildTree(tree).then(function(dir) {
        var destPath = path.join(dir.directory, 'ios.md');
        var fileContent = fs.readFileSync(destPath, {encoding: 'utf8'});
        expect(/^---/.test(fileContent)).to.be.ok();
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

  // Set a low ulimit on the testing system to better test this
  describe('lots of files and concurrent builds', function() {
    var lotsOfFilesPath = path.join(sourcePath, 'lots_o_files');
    beforeEach(function(done) {
      mkdirp.sync(lotsOfFilesPath);
      var i;
      for(i=0; i < 6000; i++) {
        var filePath = path.join(lotsOfFilesPath, i.toString());
        fs.writeFileSync(filePath, 'Hello ' + i);
      }
      done();
    });

    afterEach(function(done) {
      rimraf(lotsOfFilesPath, function(err) {
        if (err) {
          console.log('There was an error removing all the files from lots of files test');
        }
        done();
      });
    });

    it('does not error with lots of files', function() {
      this.timeout(10000);
      var firstTree = filterFrontMatter(sourcePath, {
        include: function(frontMatter) {
          return frontMatter.mobile === true;
        }
      });
      var secondTree = filterFrontMatter(sourcePath, {
        include: function(frontMatter) {
          return frontMatter.mobile === true;
        }
      });

      var tree = mergeTrees([firstTree, secondTree], {overwrite: true});
      return buildTree(tree).then(function(dir) {
        // If there is an exception raised during buildTree
        // we should not make it here, which is what we're testing
        expect(true).to.be.ok();
      });
    });
  });
});
