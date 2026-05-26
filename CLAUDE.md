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

1. **Editor (`src/TinyMDE.ts`)** - The main Markdown editor class
   - Handles content parsing, rendering, and user interaction
   - Manages undo/redo stack and event listeners

2. **CommandBar (`src/TinyMDECommandBar.ts`)** - Optional toolbar component
   - Provides UI buttons for formatting commands (bold, italic, etc.)
   - Handles keyboard shortcuts and command execution
   - Customizable command set with default commands

3. **Grammar (`src/grammar.ts`)** - Markdown parsing rules
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

- `src/index.ts` - Full build (Editor + CommandBar)
- `src/tiny.ts` - Minimal build (Editor only)

### Testing

- **Jest + Puppeteer** for browser-based testing
- Tests located in `jest/` directory
- Tests cover block parsing, inline formatting, command bar functionality, and user interactions
- Configuration in `jest.config.js`
- Run all tests with `npm run test`
- Run an individual test with `npm run test ${file}`, eg. `npm run test jest/commandbar.test.js`

### Key Features

- No dependencies except `core-js` for polyfills
- Mobile-friendly with native autocorrect support
- Real-time Markdown preview with inline formatting
- Textarea replacement capability
- Drag & drop support for images
- Undo/redo functionality
- Event system for `change`, `selection`, and `drop` events

## Dependency Supply-Chain Protection

This repo enforces a **minimum release age** for dependencies via `.npmrc` to mitigate supply-chain attacks. Compromised package versions are usually detected and unpublished within days of being published, so installing only older releases avoids the window of greatest risk.

- `min-release-age=7` — npm refuses to install any package version published less than 7 days ago (requires npm 11.10+).

**Do not remove, lower, or override this setting** to pull in a newer dependency. It is a deliberate security control. If a recent version is genuinely required, raise it with the repo owner rather than circumventing the check.