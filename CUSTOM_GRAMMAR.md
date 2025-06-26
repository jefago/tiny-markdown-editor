# Custom Inline Grammar for TinyMDE

This document describes the custom inline grammar feature that allows you to define your own inline formatting rules when initializing the TinyMDE editor.

## Overview

The custom inline grammar feature allows you to extend TinyMDE with your own inline formatting syntax. This is useful for adding domain-specific formatting or extending the editor with custom markdown-like syntax.

## Usage

To use custom inline grammar, pass a `customInlineRules` array to the editor constructor:

```javascript
import { Editor } from 'tiny-mde';

const editor = new Editor({
  element: 'my-editor',
  content: 'Your content here',
  customInlineRules: [
    {
      regexp: /^::([^:]+)::/,
      replacement: '<span class="highlight">$1</span>'
    }
  ]
});
```

## CustomInlineRule Interface

Each custom rule is an object with the following properties:

```typescript
interface CustomInlineRule {
  regexp: RegExp;
  replacement: string;
}
```

- **regexp**: A regular expression that matches the custom syntax. The regex should start with `^` to match from the beginning of the remaining string.
- **replacement**: A replacement string that defines how the matched content should be rendered. Use `$1`, `$2`, etc. to reference captured groups from the regex.

## Important Notes

### Processing Order

Custom inline rules are processed **before** the built-in markdown rules. This means:

1. Custom rules are checked first
2. Built-in rules (bold, italic, code, etc.) are checked second
3. If a custom rule matches, the built-in rules won't be applied to that text

### HTML Escaping

Content captured by your regex groups (referenced as `$1`, `$2`, etc.) is automatically HTML-escaped for security. This prevents XSS attacks but means you cannot inject HTML through captured content.

### Regex Requirements

- Your regex must start with `^` to match from the beginning of the string
- Use parentheses `()` to create capture groups for content you want to reference in the replacement
- The regex should match the complete syntax you want to replace

## Examples

### Basic Highlighting

```javascript
const editor = new Editor({
  content: 'This ::highlighted text:: stands out',
  customInlineRules: [
    {
      regexp: /^::([^:]+)::/,
      replacement: '<span class="highlight">$1</span>'
    }
  ]
});
```

### Multiple Custom Rules

```javascript
const editor = new Editor({
  content: 'Use ::highlighting:: and {{custom code}} together',
  customInlineRules: [
    {
      regexp: /^::([^:]+)::/,
      replacement: '<span class="highlight">$1</span>'
    },
    {
      regexp: /^\{\{([^}]+)\}\}/,
      replacement: '<code class="custom-code">$1</code>'
    }
  ]
});
```

### Advanced Example with Multiple Capture Groups

```javascript
const editor = new Editor({
  content: 'Create a [[link|https://example.com]] with custom syntax',
  customInlineRules: [
    {
      regexp: /^\[\[([^|]+)\|([^\]]+)\]\]/,
      replacement: '<a href="$2" class="custom-link">$1</a>'
    }
  ]
});
```

## CSS Styling

Since custom rules generate HTML with your specified classes, you can style them with CSS:

```css
.highlight {
  background-color: yellow;
  font-weight: bold;
}

.custom-code {
  background-color: #f5f5f5;
  font-family: monospace;
  padding: 2px 4px;
  border-radius: 3px;
}

.custom-link {
  color: #0066cc;
  text-decoration: underline;
}
```

## Best Practices

1. **Keep regex simple**: Complex regex patterns can impact performance
2. **Use unique delimiters**: Choose syntax that won't conflict with standard markdown
3. **Test thoroughly**: Ensure your custom syntax doesn't interfere with existing functionality
4. **Consider edge cases**: Test with malformed input to ensure graceful handling
5. **Document your syntax**: If sharing code, document the custom syntax for other developers

## Integration with Standard Markdown

Custom inline rules work alongside all standard markdown formatting:

```javascript
const editor = new Editor({
  content: '**Bold**, *italic*, and ::highlighted:: text all work together!',
  customInlineRules: [
    {
      regexp: /^::([^:]+)::/,
      replacement: '<span class="highlight">$1</span>'
    }
  ]
});
```

## Security Considerations

- All captured content is automatically HTML-escaped
- Only the replacement template you provide can contain HTML
- This prevents XSS attacks through user-generated content
- Always validate and sanitize any dynamic content you use in replacement strings

## Limitations

- Custom rules only apply to inline formatting (not block-level)
- Rules are processed in the order they're defined
- Once a rule matches, that portion of text won't be processed by subsequent rules
- Custom rules cannot be nested within each other
