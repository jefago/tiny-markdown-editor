# tiny-markdown-editor
TinyMDE: A tiny, dependency-free<sup>(1)</sup> embeddable HTML/JavaScript Markdown editor.

<sup>(1)</sup>: Technically, TinyMDE depends on Babel / preset-env for polyfills to support older browsers

## Overview
TinyMDE is an in-browser markdown editor that allows editing Markdown files with in-line formatting previews (bold, italic, headings, code etc.) as well as a toolbar with familiar point-and-click or keyboard shortcut interaction. 

TinyMDE can be used as a drop-in text area replacement.

## Motivation 
TinyMDE was motivated by wanting to improve on [EasyMDE](https://github.com/Ionaru/easy-markdown-editor) which is extremely flexible but had two shortcomings:

- It depends on [Code Mirror](https://codemirror.net/) for editing and formatting. CodeMirror is a full fledged and customizable in-browser code editor, and has a price: EasyMDE's JS file is 280kb in size. TinyMDE is less than 70kb (less than a quarter of EasyMDE's size), the "tiny" version without the toolbar even below 60kb!
- CodeMirror doesn't work well on mobile, at least not for writing prose: mobile phone OS auto-correction functionality, which many people rely on to quickly type on mobile, is not supported by CodeMirror.

## Install TinyMDE
You can install TinyMDE from NPM (e.g., if you want to use it in a bundled JS application using Webpack or Rollup), use a hosted version, or self-host the JavaScript and CSS files.

### Install TinyMDE from NPM

TODO

### Hosted version

TODO

### Self-host
To self-host TinyMDE, follow these steps:

- [Download and build TinyMDE](#build-tinymde)
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
var tinyMDE = new TinyMDE.Editor({element: 'editor'});
</script>
```

### Command bar creation
To create a toolbar (command bar) along with the editor, create another container div (here called `toolbar`), and instantiate editor and toolbar as follows:

```html
<div id="toolbar"></div>
<div id="editor"></div>
<script type="text/javascript">
var tinyMDE = new TinyMDE.Editor({element: 'editor'});
var commandBar = new TinyMDE.CommandBar({element: 'toolbar', editor: tinyMDE});
</script>
```

### Creation from a textarea
TinyMDE can be used as a drop-in textarea replacement. This means that when TinyMDE is passed a textarea, the editor will act as if the user is directly editing the textarea: The editor is initialized with the content of the textarea, and changing text in the editor changes the textarea's content. The easiest code to do so is as follows:

```html
<div class="txtcontainer"><textarea id="txt">This is some **Markdown** formatted text</textarea></div>
<script type="text/javascript">
var tinyMDE = new TinyMDE.Editor({textarea: 'txt'});
</script>
```

Please note:
- The editor doesn't quite *replace* the textarea. The textarea just gets hidden, and the editor content is mirrored in the textarea. If you programmatically change the contents of the textarea, the editor would get out of sync.
- The editor element will be inserted in the DOM as a sibling of the textarea element. In order to size and format the editor element properly, apply styles to the parent element of the textarea (in the example above, `div.txtcontainer`).

## Configure TinyMDE

### Editor constructor parameters

`TinyMDE.Editor` takes as argument a key-value object with the following possible attributes:

| Attribute              | Description                           | 
| ---------------------- | ------------------------------------- | 
| `element`              | The DOM element under which the TinyMDE DOM element will be created. The `element` attribute can be given as either an ID or the DOM element itself (i.e., the result of a call to `document.getElementById()`). |
| `content`              | The initial content of the editor, given as a string. May contain newlines. |
| `textarea`             | The textarea that will be linked to the editor. The textarea can be given as an ID or as the DOM element itself (i.e., the result of a call to `document.getElementById()`). The content of the editor will be reflected in the value of the textarea at any given point in time. If `textarea` is given and `content` isn't, then the editor content will be initialized to the textarea's value. If `textarea` is given and `element` isn't, then the editor element will be created as the next sibling of the textarea element. |

If neither `element` not `textarea` are given, the editor element will be created as the last child element of the `body` element (probably not what you want in most cases, so you probably want to pass at least one of `element` or `textarea`).

If neither `content` nor `textarea` are given, the content of the editor is initialized with a placeholder text (`# Hello TinyMDE!\nEdit **here**`). This is probably not what you want, so you probably want to pass at least one of `content` or `textarea`.

### CommandBar constructor parameters


### Customizing commands

### Event listeners



## Build TinyMDE

Building TinyMDE is pretty straight forward:

1. Clone this repository:
    ```bash
    git clone git@github.com:jefago/tiny-markdown-editor.git
    ```
2. In the repository directory, run the build script:
    ```bash
    npm run build
    ```

The build output is in the `dist` directory. You will find the following files there:

- `tiny-mde.css` and `tiny-mde.min.css`: CSS files to style the editor. These can be edited at will to make the editor look like you want to. `tiny-mde.min.css` has the same content as `tiny-mde.css`, it's just minified. You will only need to use one of the files on your page. If you want to edit the CSS file, it's easier to edit `tiny-mde.css` and then minify the edited version.
- `tiny-mde.js`: Debug version of the editor. The JS file is not minified and contains a sourcemap. It is not recommended to use this in production settings, since the file is large.
- `tiny-mde.min.js`: Minified JS file for most use cases. Simply copy this to your project to use it.
- `tiny-mde.tiny.js`: Minified and stripped-down JS file. Contains only the editor itself, not the toolbar.

