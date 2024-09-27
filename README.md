# tiny-markdown-editor

TinyMDE: A tiny, low-dependency<sup>(1)</sup> embeddable HTML/JavaScript Markdown editor.

<sup>(1)</sup>: TinyMDE's runtime only depends on `core-js` for polyfills to support older browsers.

Visit the [demo page](https://jefago.github.io/tiny-markdown-editor/) to see TinyMDE in action.

## Overview

TinyMDE is an in-browser markdown editor that allows editing Markdown files with in-line formatting previews (bold, italic, headings, code etc.) as well as a toolbar with familiar point-and-click or keyboard shortcut interaction.

TinyMDE can be used as a drop-in text area replacement.

## Motivation

TinyMDE was motivated by wanting to improve on [EasyMDE](https://github.com/Ionaru/easy-markdown-editor) which is extremely flexible but had two shortcomings:

- EasyMDE depends on [Code Mirror](https://codemirror.net/) for editing and formatting. CodeMirror is a full fledged and customizable in-browser code editor, and has a price: EasyMDE's JS file is 280kb in size. TinyMDE is less than 70kb (less than a quarter of EasyMDE's size), the "tiny" version without the toolbar even below 60kb!
- CodeMirror doesn't work well on mobile, at least not for writing prose: mobile phone OS auto-correction functionality, which many people rely on to quickly type on mobile, is not supported by CodeMirror.

## Install TinyMDE

You can install TinyMDE from NPM (e.g., if you want to use it in a bundled JS application using Webpack or Rollup), use a hosted version, or self-host the JavaScript and CSS files.

### Install TinyMDE from NPM

Install the `tiny-markdown-editor` package from NPM:

```bash
npm install --save tiny-markdown-editor
```

Then, in your JavaScript file, simply import the package like this:

```JavaScript
const TinyMDE = require('tiny-markdown-editor');
var tinyMDE = new TinyMDE.Editor({element: 'editor'});
```

Bundle the JavaScript with your favorite bundler like Webpack or Rollup to ensure the TinyMDE code gets included in the shipped JavaScript file.

**Please note:** If you go down the NPM package route, you will also need to make sure to [style the components](#styling-tinymde). After installing TinyMDE from NPM, you will find a CSS file `tiny-mde.css` you can use as a base in the directory `node_modules/tiny-markdown-editor/dist`.

### Hosted version

You can simply include the JavaScript and CSS files from Unpkg on your website, using the following code:

```html
<script src="https://unpkg.com/tiny-markdown-editor/dist/tiny-mde.min.js"></script>
<link
  rel="stylesheet"
  type="text/css"
  href="https://unpkg.com/tiny-markdown-editor/dist/tiny-mde.min.css"
/>
```

### Self-host

To self-host TinyMDE, follow these steps:

- [Download and build TinyMDE](#build-tinymde). Alternatively, download the newest [release](https://github.com/jefago/tiny-markdown-editor/releases) and unpack the archive.
- Copy the output JS and CSS files `tiny-mde.min.js` and `tiny-mde.min.css` from the `dist` directory to your website's directory.
- Include these files on your website:
  ```html
  <script src="tiny-mde.min.js"></script>
  <link rel="stylesheet" type="text/css" href="tiny-mde.min.css" />
  ```

## Creating an editor and toolbar on your page

### Simple creation

To create a simple editor as child of an HTML `div` element with the ID `editor`, use the following HTML / JS code:

```html
<div id="editor"></div>
<script type="text/javascript">
  var tinyMDE = new TinyMDE.Editor({ element: "editor" });
</script>
```

### Command bar creation

To create a toolbar (command bar) along with the editor, create another container div (here called `toolbar`), and instantiate editor and toolbar as follows:

```html
<div id="toolbar"></div>
<div id="editor"></div>
<script type="text/javascript">
  var tinyMDE = new TinyMDE.Editor({ element: "editor" });
  var commandBar = new TinyMDE.CommandBar({
    element: "toolbar",
    editor: tinyMDE,
  });
</script>
```

### Creation from a textarea

TinyMDE can be used as a drop-in textarea replacement. This means that when TinyMDE is passed a textarea, the editor will act as if the user is directly editing the textarea: The editor is initialized with the content of the textarea, and changing text in the editor changes the textarea's content. The easiest code to do so is as follows:

```html
<div class="txtcontainer">
  <textarea id="txt">This is some **Markdown** formatted text</textarea>
</div>
<script type="text/javascript">
  var tinyMDE = new TinyMDE.Editor({ textarea: "txt" });
</script>
```

Please note:

- The editor doesn't quite _replace_ the textarea. The textarea just gets hidden, and the editor content is mirrored in the textarea. If you programmatically change the contents of the textarea, the editor would get out of sync.
- The editor element will be inserted in the DOM as a sibling of the textarea element. In order to size and format the editor element properly, apply styles to the parent element of the textarea (in the example above, `div.txtcontainer`).

## Configure TinyMDE

### Editor constructor parameters

`TinyMDE.Editor` takes as argument a key-value object with the following possible attributes:

| Attribute  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `element`  | The DOM element under which the TinyMDE DOM element will be created. The `element` attribute can be given as either an ID or the DOM element itself (i.e., the result of a call to `document.getElementById()`).                                                                                                                                                                                                                                                                                                                    |
| `content`  | The initial content of the editor, given as a string. May contain newlines.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `textarea` | The textarea that will be linked to the editor. The textarea can be given as an ID or as the DOM element itself (i.e., the result of a call to `document.getElementById()`). The content of the editor will be reflected in the value of the textarea at any given point in time. If `textarea` is given and `content` isn't, then the editor content will be initialized to the textarea's value. If `textarea` is given and `element` isn't, then the editor element will be created as the next sibling of the textarea element. |

If neither `element` not `textarea` are given, the editor element will be created as the last child element of the `body` element (probably not what you want in most cases, so you probably want to pass at least one of `element` or `textarea`).

If neither `content` nor `textarea` are given, the content of the editor is initialized with a placeholder text (`# Hello TinyMDE!\nEdit **here**`). This is probably not what you want, so you probably want to pass at least one of `content` or `textarea`.

### CommandBar constructor parameters

`TinyMDE.Editor` takes as argument a key-value object with the following possible attributes:

| Attribute  | Description                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `element`  | The DOM element under which the command bar DOM element will be created. The `element` attribute can be given as either an ID or the DOM element itself (i.e., the result of a call to `document.getElementById()`). If `element` is not given, the commandbar will be created as the last child of the `body` element (probably not what you want in most cases). |
| `editor`   | The editor object that this command bar will be linked to (i.e., the return value of `new TinyMDE.Editor()`).                                                                                                                                                                                                                                                      |
| `commands` | The list of commands to show. See [below](#customizing-commands).                                                                                                                                                                                                                                                                                                  |

### Customizing commands

In order to customize the commands shown on the command bar, pass an array to the `commands` attribute. Each of the entries of the array defines one command bar element (button or separator), left to right. Each of the entries of the `commands` array can be one of the following:

- A string with the content `|` (vertical pipe), which will create a separator line.
- A string with one of the command identifiers `bold`, `italic`, `strikethrough`, `code`, `h1`, `h2`, `ul`, `ol`, `blockquote`, `hr`, `insertLink`, or `insertImage`, which will create the default button for that command
- A key-value object to create a customized or custom button.

If an entry of the `commands` array is an object, you can either customize one of the existing commands (e.g., use a different icon or keyboard shortcut for the `bold` command), or use a completely custom command. An object entry of the `commands` array can contain the following attributes:

| Attribute          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` _mandatory_ | A string that is unique within the scope of this CommandBar instance that identifies the command. If one of the default commands (`bold`, `italic`, `strikethrough`, `code`, `h1`, `h2`, `ul`, `ol`, `blockquote`, `hr`, `insertLink`, or `insertImage`) is given as the `name` attribute, then the command is initialized with all the default values of the default commands and they can be overridden by specifying additional attributes. In other words, `{ name: 'bold' }` as a command array entry behaves the same as `'bold'`. If the `name` attribute is set to a string other than one of the default command, a custom command can be defined. |
| `title`            | The title of the command, shown as a tooltip on hover. Defaults to be the same as `name`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `innerHTML`        | The HTML content of the command button. In the default styling, the content will have a space of 18x18 CSS pixels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `action`           | For custom commands, you need to set the `action` attribute to a function taking the Editor object as a parameter, for example: `action: editor => { editor.setContent('Test')}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `hotkey`           | A keyboard shortcut for the command. The keyboard shortcut needs to be a string containing a key (e.g., 'A' or '1'), preceded by one or more modifier keys (`Ctrl`, `Shift`, `Alt`, `Cmd`, `Win`, `Option`), each separated with `-`. Examples: `Alt-I`, `Ctrl-Shift-3`. There are two convenience modifier keys that are recognized for easy cross-platform development: `Mod` is set to `Cmd` on macOS / iOS / iPadOS and `Ctrl` elsewhere (e.g., `Mod-B` as a shortcut for the `bold` command ends up as either `Ctrl` + `B` or `⌘` + `B`); `Mod2` is set to `Option` on macOS / iOS / iPadOS and `Alt` elsewhere.                                       |

The default array of commands is as follows: `['bold', 'italic', 'strikethrough', '|', 'code', '|', 'h1', 'h2', '|', 'ul', 'ol', '|', 'blockquote', 'hr', '|', 'insertLink', 'insertImage']`.

### Editor methods

Here are some methods of the Editor object that might be useful in general interaction or custom CommandBar commands:

| Method                                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getContent()`                            | Returns the content of the editor as a string.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `setContent(content)`                     | Sets the content of the editor to the string `content`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `getSelection(getAnchor)`                 | Gets the current selection / cursor position inside the editor. The parameter `getAnchor` (defaults to false) determines if the anchor (starting point) of the selection should be returned—if `getAnchor` is false (or omitted), the focus (end point) is returned, otherwise the starting point. If the selection is not inside the editor, `null` is returned. The method returns an object with the attributes `row` and `col` which contain the zero-based row (line) and column number of the selection position. |
| `setSelection(focus, anchor)`             | Sets the selection within the editor. The parameters `focus` and `offset` are both of the format returned by `getSelection()` (containing attributes `row` and `col`). If `anchor` is `null` or omitted, a single-point selection (cursor position) will be set.                                                                                                                                                                                                                                                        |
| `paste(text, anchor, focus)`              | Pastes / inserts text over either the current selection (if `anchor` and `focus` are null or omitted) or a specific range (if `anchor` and `focus` are passed in in the format as returned by `getSelection()`).                                                                                                                                                                                                                                                                                                        |
| `wrapSelection(pre, post, anchor, focus)` | Wraps the current selection (if `anchor` and `focus` are `null` or omitted) or a specific selection (if `anchor` and `focus` are given) in the strings `pre` and `post`. For example, `wrapSelection('[', '](https://www.github.com)')` will wrap the selection with a link to GitHub.                                                                                                                                                                                                                                  |
| `addEventListener(type, listener`)        | Adds an [event listener](#event-listeners) to the editor. `type` is a string denoting the type (`change` or `selection`), and `listener` is a function which takes one parameter, the event.                                                                                                                                                                                                                                                                                                                            |

### Event listeners

There are two event listener types that can be registered on the editor: `change` and `selection`.

#### `change` event

A `change` event is fired any time the content of the editor changes. The event object passed to the listener function contains the following properties:

| Attribute | Description |
| --- | ----------- |
| `content` | The current content as a string. |
| `linesDirty` | An array of booleans, which for each line contains `true` if the line might have changed in terms of either its content or its block type since the last change, and `false` if the line is guaranteed to not have changed. |

#### `selection` event

A `selection` event is fired any time the selection within the editor changes. The event object passed to the listener function contains the following properties:

| Attribute | Description |
| --- | ----------- |
| `focus` | The focus (end point) of the current selection, in the format as returned by `getSelection()` (two attributes `row` and `col` denoting the zero based row and column). |
| `anchor` | The anchor (start point) of the current selection, in the format as returned by `getSelection()` (two attributes `row` and `col` denoting the zero based row and column). |
| `commandState` | An array which contains an attribute for every default command name `bold`, `italic`, `strikethrough`, `code`, `h1`, `h2`, `ul`, `ol`, `blockquote`, `hr`, `insertLink`, and `insertImage`). The value of each attribute is one of `true`, `false`, or `null`. The value is `true` if the command is currently active (e.g., if the cursor is within a bold stretch of text, then the state for `bold` will be `true`). The value is `false` if the command is currently inactive but could be activated (e.g., if the selection encompasses a stretch of text that could be bolded, then the state for `bold` will be `false`). The value is `null` if the command is currently not applicable (e.g., if the cursor is within a code block where inline formatting is not available, the state will be `null` for `bold`). |

#### `drop` event

A `drop` event is mirroring a native `drop` event. It was added to TinyMDE to allow drag & dropping images into Markdown textarea (like on Github). The event object passed to the listener function contains the following properties:

| Attribute | Description |
| --- | ----------- |
| `dataTransfer` | The event's [DataTransfer](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer) data (dropped files). |

Here's how to add image drag & drop to your TinyMDE editor:

```js
editor.addEventListener("drop", function (event) {
  let formData = new FormData();

  // You can add use event.dataTransfer.items or event.dataTransfer.files
  // to build the form data object:
  for (let i = 0; i < event.dataTransfer.items.length; i++) {
    if (event.dataTransfer.items[i].kind === "file") {
      let file = event.dataTransfer.items[i].getAsFile();
      formData.append("image", file);
    }
  }

  // Call your API endpoint that accepts "Content-Type": "multipart/form-data"
  // requests and responds with the image names and URL-s.
  //
  // Now you can add Markdown images like so:
  editor.paste(`![${imageName}](${imageUrl})`);
});
```

### Styling TinyMDE

In order to style TinyMDE, edit the CSS file. You can see the classes that can be assigned styles within the file. For a bit more detail about the classes, read on.

#### Editor styling

There are some generally interesting CSS classes that can be formatted. Most of them start with `TM`, short for `TinyMDE`.

- `TinyMDE` is the editor element.
- `TMMark` is any markup. Any element with the class `TMMark` will also have another class called `TMMark_*`, where `*` is replaced by the class name of the respective block or inline style. For example, in a H1 line with the content `# Heading 1`, the `#` is contained in an element with the classes `TMMark TMMark_TMH1`.
- `TMInlineFormatted` contains text that is inline formatted.

The following classes denote Markdown blocks: `TMPara`, `TMBlankLine`, `TMH1`, `TMH2`, `TMH3`, `TMH4`, `TMH5`, `TMH6`, `TMBlockquote`, `TMCodeFenceBacktickOpen`, `TMFencedCodeBacktick`, `TMCodeFenceBacktickClose`, `TMCodeFenceTildeOpen`, `TMFencedCodeTilde`, `TMCodeFenceTildeClose`, `TMSetextH1`, `TMSetextH1Marker`, `TMSetextH2`, `TMSetextH2Marker`, `TMHR`, `TMUL`, `TMOL`, `TMIndentedCode`, `TMLinkReferenceDefinition`, `TMHTMLBlock`.

The following classes denote Markdown inline formatted stretches of text: `TMCode`, `TMAutolink`, `TMHTML`, `TMStrong`, `TMEm`, `TMStrikethrough`, `TMImage`, `TMLink`, (`TMLinkLabel` (also marked as `TMLinkLabel_Valid` or `TMLinkLabel_Invalid` depending on whether or not the label references a valid reference), `TMLinkDestination`, `TMLinkTitle`, `TMImageDestination`, `TMImageTitle`.

Each line of a code fenced blocks (ie. starting and ending with ` ``` ` or `~~~`) will also be wrapped in an element with the class `TMFencedCode`. Each line of an HTML block (ie. starting with an HTML element) will also be wrapped in an element with the class `TMHTMLContent`.

#### CommandBar styling

The main toolbar element has the class `TMCommandBar`. Buttons have the class `TMCommandButton`, with an additional class of `TMCommandButton_Active`, `TMCommandButton_Inactive`, or `TMCommandButton_Disabled`, depending on the state of the respective command. Divider elements have the class `TMCommandDivider`.

## Build TinyMDE

Building TinyMDE is pretty straight forward:

1. Clone this repository:

```bash
git clone git@github.com:jefago/tiny-markdown-editor.git
```

2. In the repository directory, install dependencies and build the project:

```bash
npm install

# You may need to run npm install --force

npm run prepublishOnly
```

The latter command generates the `dist` and `lib` directories. You will find the following files there:

- `dist/tiny-mde.css` and `dist/tiny-mde.min.css`: CSS files to style the editor. These can be edited at will to make the editor look like you want to. `dist/tiny-mde.min.css` has the same content as `dist/tiny-mde.css`, it's just minified. You will only need to use one of the files on your page. If you want to edit the CSS file, it's easier to edit `dist/tiny-mde.css` and then minify the edited version.
- `dist/tiny-mde.js`: Debug version of the editor. The JS file is not minified and contains a sourcemap. It is not recommended to use this in production settings, since the file is large.
- `dist/tiny-mde.min.js`: Minified JS file for most use cases. Simply copy this to your project to use it.
- `dist/tiny-mde.tiny.js`: Minified and stripped-down JS file. Contains only the editor itself, not the toolbar.
