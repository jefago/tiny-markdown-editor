# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development mode with file watching and live reload
- `npm run build` - Build production assets (JS, CSS, HTML)
- `npm run test` - Run Jest tests with Puppeteer (browser-based testing)
- `npm run prepublishOnly` - Full build, test, and transpile pipeline for publishing

## Architecture Overview

TinyMDE is a lightweight, embeddable Markdown editor with two main components:

### Core Components

1. **Editor (`src/TinyMDE.js`)** - The main Markdown editor class
   - Handles content parsing, rendering, and user interaction
   - Manages undo/redo stack and event listeners
   - Provides methods: `getContent()`, `setContent()`, `getSelection()`, `setSelection()`, `paste()`, `wrapSelection()`

2. **CommandBar (`src/TinyMDECommandBar.js`)** - Optional toolbar component
   - Provides UI buttons for formatting commands (bold, italic, etc.)
   - Handles keyboard shortcuts and command execution
   - Customizable command set with default commands

3. **Grammar (`src/grammar.js`)** - Markdown parsing rules
   - Contains regex patterns for inline and block-level Markdown elements
   - Defines line grammar, inline grammar, and HTML block patterns
   - Handles punctuation detection for proper Markdown rendering

### Build System

- **Gulp-based** build system (`gulpfile.mjs`)
- **Rollup** for JavaScript bundling with Babel transpilation
- **PostCSS** with autoprefixer and cssnano for CSS processing
- **ESLint** for code quality
- Generates multiple build outputs:
  - `dist/tiny-mde.js` - Debug version with sourcemaps
  - `dist/tiny-mde.min.js` - Minified full version
  - `dist/tiny-mde.tiny.js` - Minified editor-only version (no toolbar)

### Entry Points

- `src/index.js` - Full build (Editor + CommandBar)
- `src/tiny.js` - Minimal build (Editor only)

### Testing

- **Jest + Puppeteer** for browser-based testing
- Tests located in `jest/` directory
- Tests cover block parsing, inline formatting, command bar functionality, and user interactions
- Configuration in `jest.config.js`

### Key Features

- No dependencies except `core-js` for polyfills
- Mobile-friendly with native autocorrect support
- Real-time Markdown preview with inline formatting
- Textarea replacement capability
- Drag & drop support for images
- Undo/redo functionality
- Event system for `change`, `selection`, and `drop` events