# Broccoli Front Matter Filter

A Broccoli plugin that includes or excludes files from being included
in the destination tree based on the values of front matter found
in the individual files.

## Installation

```bash
npm install --save-dev broccoli-front-matter-filter
```

## Usage

Assume files with the following content:

- `src/ios.md`

```yaml
---
mobile: true
---

## Hello from the phone.
```

- `src/windoz.md`

```yaml
---
desktop: true
---

## Hello from the desktop
```

Including 'desktop' files:

```javascript
var filterFrontMatter = require('broccoli-front-matter-filter');

var tree = filterFrontMatter('src', {
  include: function(frontMatter) {
    return frontMatter.desktop === true;
  }
});
// tree will include 'src/windoz.md'
```

## Documentation

### `filterFrontMatter(inputTree, options)`

---

`options.include` *{Function}*

A callback that is passed the value of the parsed front matter. If the callback
returns a truthy value, then the file will be included in the destination tree.
Otherwise, it will not.

---

`options.removeIfNoFrontMatter` *{Boolean}*

What to do when a file does not include front matter. If true, the file will
not be included in the destination tree. _Default_: `false`

---

`options.stripFrontMatter` *{Boolean}*

If true, front matter will be removed from the file before going to the destination
tree. Otherwise, the file will be left alone. _Default_: `true`

---

`options.grayMatter` *{Object}*

This uses [gray-matter](https://github.com/jonschlinkert/gray-matter) for front matter
parsing. Gray matter supports additional features like configuring the type of front matter,
evaluating the front matter, if you wish to use coffeescript or javascript, and specifying
different delimiters (amongst other features). Any options provided here will be passed
through to the gray matter parser. So, to support multiple types of front matter delimiters,
you could do:

```javascript
var tree = filterFrontMatter('src', {
  grayMatter: {
    delims: [ '\\/\\*\\* yaml', '\\*\\*\\/' ]
  },
  include: function(frontMatter) {
    return frontMatter.desktop === true;
  }
});
```

**Note:** the delims are converted to regular expressions. If you wish to use characters that
are reserved in regular expressions as delimiters, then you must escape them both from the defining string
and to the regular expression (hence the double backslashes).
