var filterFrontMatter = require('../index');
var expect            = require('expect.js');
var broccoli          = require('broccoli');
var fs                = require('fs');
var path              = require('path');

describe('broccoli-front-matter-filter', function() {
  var sourcePath = 'tests/fixtures';
  var builder;

  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  it('does not filter files without front matter by default', function() {
    var tree = filterFrontMatter(sourcePath);

    builder = new broccoli.Builder(tree);
    return builder.build().then(function(dir) {
      var destPath = path.join(dir.directory, 'no-front-matter-file.js');
      expect(fs.existsSync(destPath)).to.be.ok();
    });
  });
});
