# tiny-markdown-editor
TinyMDE: A tiny, dependency-free embeddable HTML/JavaScript Markdown editor.

## Overview
TinyMDE is an in-browser markdown editor that allows editing Markdown files with in-line formatting previews (bold, italic, headings, code etc.) as well as a toolbar with familiar point-and-click or keyboard shortcut interaction. 

TinyMDE can be used as a drop-in text area replacement.

## Motivation 
TinyMDE was motivated by wanting to improve on [EasyMDE](https://github.com/Ionaru/easy-markdown-editor) which is extremely flexible but had two shortcomings:

- It depends on [Code Mirror](https://codemirror.net/) for editing and formatting. CodeMirror is a full fledged and customizable in-browser code editor, and has a price: EasyMDE's JS file is 280kb in size.
- CodeMirror doesn't work well on mobile, at least not for writing prose: mobile phone OS auto-correction functionality, which many people rely on to quickly type on mobile, is not supported by CodeMirror.
