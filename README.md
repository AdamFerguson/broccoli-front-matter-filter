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
