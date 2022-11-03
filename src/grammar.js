// const replacements = {
//   ASCIIPunctuation: '!"#$%&\'()*+,\\-./:;<=>?@\\[\\]^_`{|}~',
//   TriggerChars: '`_\*\[\]\(\)',
//   Scheme: `[A-Za-z][A-Za-z0-9\+\.\-]{1,31}`,
//   Email: `[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*`, // From CommonMark spec

// }
const replacements = {
  ASCIIPunctuation: /[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~\\]/,  
  NotTriggerChar: /[^`_*[\]()<>!~]/,
  Scheme: /[A-Za-z][A-Za-z0-9+.-]{1,31}/,
  Email: /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/, // From CommonMark spec
  HTMLOpenTag: /<HTMLTagName(?:HTMLAttribute)*\s*\/?>/,
  HTMLCloseTag: /<\/HTMLTagName\s*>/,
  HTMLTagName: /[A-Za-z][A-Za-z0-9-]*/, 
  HTMLComment: /<!--(?:[^>-]|(?:[^>-](?:[^-]|-[^-])*[^-]))-->/,
  HTMLPI: /<\?(?:|.|(?:[^?]|\?[^>])*)\?>/,
  HTMLDeclaration: /<![A-Z]+\s[^>]*>/,
  HTMLCDATA: /<!\[CDATA\[.*?\]\]>/,
  HTMLAttribute: /\s+[A-Za-z_:][A-Za-z0-9_.:-]*(?:HTMLAttValue)?/,
  HTMLAttValue: /\s*=\s*(?:(?:'[^']*')|(?:"[^"]*")|(?:[^\s"'=<>`]+))/,
  KnownTag: /address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul/
}

// From CommonMark.js. 
const punctuationLeading = new RegExp(/^(?:[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B])/);

const punctuationTrailing = new RegExp(/(?:[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B])$/);

// export const inlineTriggerChars = new RegExp(`[${replacements.TriggerChars}]`);

/**
 * This is CommonMark's block grammar, but we're ignoring nested blocks here.  
 */ 
const lineGrammar = { 
  TMH1: { 
    regexp: /^( {0,3}#\s)(.*?)((?:\s+#+\s*)?)$/, 
    replacement: '<span class="TMMark TMMark_TMH1">$1</span>$$2<span class="TMMark TMMark_TMH1">$3</span>'
  },
  TMH2: { 
    regexp: /^( {0,3}##\s)(.*?)((?:\s+#+\s*)?)$/, 
    replacement: '<span class="TMMark TMMark_TMH2">$1</span>$$2<span class="TMMark TMMark_TMH2">$3</span>'
  },
  TMH3: { 
    regexp: /^( {0,3}###\s)(.*?)((?:\s+#+\s*)?)$/, 
    replacement: '<span class="TMMark TMMark_TMH3">$1</span>$$2<span class="TMMark TMMark_TMH3">$3</span>'
  },
  TMH4: { 
    regexp: /^( {0,3}####\s)(.*?)((?:\s+#+\s*)?)$/, 
    replacement: '<span class="TMMark TMMark_TMH4">$1</span>$$2<span class="TMMark TMMark_TMH4">$3</span>'
  },
  TMH5: { 
    regexp: /^( {0,3}#####\s)(.*?)((?:\s+#+\s*)?)$/, 
    replacement: '<span class="TMMark TMMark_TMH5">$1</span>$$2<span class="TMMark TMMark_TMH5">$3</span>'
  },
  TMH6: { 
    regexp: /^( {0,3}######\s)(.*?)((?:\s+#+\s*)?)$/, 
    replacement: '<span class="TMMark TMMark_TMH6">$1</span>$$2<span class="TMMark TMMark_TMH6">$3</span>'
  },
  TMBlockquote: { 
    regexp: /^( {0,3}>[ ]?)(.*)$/, 
    replacement: '<span class="TMMark TMMark_TMBlockquote">$1</span>$$2'
  },
  TMCodeFenceBacktickOpen: { 
    regexp: /^( {0,3}(?<seq>````*)\s*)([^`]*?)(\s*)$/, 
    replacement: '<span class="TMMark TMMark_TMCodeFenceBacktick">$1</span><span class="TMInfoString">$3</span>$4'
  },
  TMCodeFenceTildeOpen: { 
    regexp: /^( {0,3}(?<seq>~~~~*)\s*)(.*?)(\s*)$/, 
    replacement: '<span class="TMMark TMMark_TMCodeFenceTilde">$1</span><span class="TMInfoString">$3</span>$4'
  },
  TMCodeFenceBacktickClose: { 
    regexp: /^( {0,3}(?<seq>````*))(\s*)$/, 
    replacement: '<span class="TMMark TMMark_TMCodeFenceBacktick">$1</span>$3'
  },
  TMCodeFenceTildeClose: { 
    regexp: /^( {0,3}(?<seq>~~~~*))(\s*)$/, 
    replacement: '<span class="TMMark TMMark_TMCodeFenceTilde">$1</span>$3'
  },
  TMBlankLine: { 
    regexp: /^([ \t]*)$/, 
    replacement: '$0'
  },
  TMSetextH1Marker: { 
    regexp: /^ {0,3}=+\s*$/, 
    replacement: '<span class="TMMark TMMark_TMSetextH1Marker">$0</span>'
  },
  TMSetextH2Marker: { 
    regexp: /^ {0,3}-+\s*$/, 
    replacement: '<span class="TMMark TMMark_TMSetextH1Marker">$0</span>'
  },
  TMHR: { 
    regexp: /^( {0,3}(\*[ \t]*\*[ \t]*\*[ \t*]*)|(-[ \t]*-[ \t]*-[ \t-]*)|(_[ \t]*_[ \t]*_[ \t_]*))$/, 
    replacement: '<span class="TMMark TMMark_TMHR">$0</span>'
  },
  TMUL: { 
    regexp: /^( {0,3}[+*-] {1,4})(.*)$/, 
    replacement: '<span class="TMMark TMMark_TMUL">$1</span>$$2'
  },
  TMOL: { 
    regexp: /^( {0,3}\d{1,9}[.)] {1,4})(.*)$/, 
    replacement: '<span class="TMMark TMMark_TMOL">$1</span>$$2'
  },
  // TODO: This is currently preventing sublists (and any content within list items, really) from working
  TMIndentedCode: { 
    regexp: /^( {4}|\t)(.*)$/, 
    replacement: '<span class="TMMark TMMark_TMIndentedCode">$1</span>$2'
  },
  TMLinkReferenceDefinition: {
    // TODO: Link destination can't include unbalanced parantheses, but we just ignore that here 
    regexp: /^( {0,3}\[\s*)([^\s\]](?:[^\]]|\\\])*?)(\s*\]:\s*)((?:[^\s<>]+)|(?:<(?:[^<>\\]|\\.)*>))?(\s*)((?:\((?:[^()\\]|\\.)*\))|(?:"(?:[^"\\]|\\.)*")|(?:'(?:[^'\\]|\\.)*'))?(\s*)$/, 
    replacement: '<span class="TMMark TMMark_TMLinkReferenceDefinition">$1</span><span class="TMLinkLabel TMLinkLabel_Definition">$2</span><span class="TMMark TMMark_TMLinkReferenceDefinition">$3</span><span class="TMLinkDestination">$4</span>$5<span class="TMLinkTitle">$6</span>$7',
    labelPlaceholder: 2, // this defines which placeholder in the above regex is the link "label"
  },
};

/**
 * HTML blocks have multiple different classes of opener and closer. This array defines all the cases
 */
var htmlBlockGrammar = [
  { start: /^ {0,3}<(?:script|pre|style)(?:\s|>|$)/i, end: /(?:<\/script>|<\/pre>|<\/style>)/i, paraInterrupt: true },
  { start: /^ {0,3}<!--/, end: /-->/, paraInterrupt: true },
  { start: /^ {0,3}<\?/, end: /\?>/, paraInterrupt: true },
  { start: /^ {0,3}<![A-Z]/, end: />/, paraInterrupt : true},
  { start: /^ {0,3}<!\[CDATA\[/, end: /\]\]>/, paraInterrupt : true},
  { start: /^ {0,3}(?:<|<\/)(?:KnownTag)(?:\s|>|\/>|$)/i, end: false, paraInterrupt: true},
  { start: /^ {0,3}(?:HTMLOpenTag|HTMLCloseTag)\s*$/, end: false, paraInterrupt: false},
];

/**
 * Structure of the object:
 * Top level entries are rules, each consisting of a regular expressions (in string format) as well as a replacement.
 * In the regular expressions, replacements from the object 'replacements' will be processed before compiling into the property regexp.
 */
var inlineGrammar = {
  escape : {
    regexp: /^\\(ASCIIPunctuation)/,
    replacement : '<span class="TMMark TMMark_TMEscape">\\</span>$1'
  },
  code : {
    regexp: /^(`+)((?:[^`])|(?:[^`].*?[^`]))(\1)/,
    replacement : '<span class="TMMark TMMark_TMCode">$1</span><code class="TMCode">$2</code><span class="TMMark TMMark_TMCode">$3</span>' 
  },
  autolink : {
    regexp: /^<((?:Scheme:[^\s<>]*)|(?:Email))>/,
    replacement: '<span class="TMMark TMMark_TMAutolink">&lt;</span><span class="TMAutolink">$1</span><span class="TMMark TMMark_TMAutolink">&gt;</span>'
  },
  html : {
    regexp: /^((?:HTMLOpenTag)|(?:HTMLCloseTag)|(?:HTMLComment)|(?:HTMLPI)|(?:HTMLDeclaration)|(?:HTMLCDATA))/,
    replacement: '<span class="TMHTML">$1</span>',
  },
  linkOpen : {
    regexp: /^\[/,
    replacement: ''
  },
  imageOpen : {
    regexp: /^!\[/,
    replacement : ''
  },
  linkLabel : {
    regexp: /^(\[\s*)([^\]]*?)(\s*\])/,
    replacement: '',
    labelPlaceholder: 2
  },
  default : {
    regexp: /^(.|(?:NotTriggerChar+))/,
    replacement: '$1'
  }
};

// Process replacements in regexps
const replacementRegexp = new RegExp(Object.keys(replacements).join('|'));

// Inline
const inlineRules =[...Object.keys(inlineGrammar)];
for (let rule of inlineRules) {
  let re = inlineGrammar[rule].regexp.source;
  // Replace while there is something to replace. This means it also works over multiple levels (replacements containing replacements)
  while (re.match(replacementRegexp)) {
    re = re.replace(replacementRegexp, (string) => { return replacements[string].source; });
  }
  inlineGrammar[rule].regexp = new RegExp(re, inlineGrammar[rule].regexp.flags);
}

// HTML Block (only opening rule is processed currently)
for (let rule of htmlBlockGrammar) {
  let re = rule.start.source;
  // Replace while there is something to replace. This means it also works over multiple levels (replacements containing replacements)
  while (re.match(replacementRegexp)) {
    re = re.replace(replacementRegexp, (string) => { return replacements[string].source; });
  }
  rule.start = new RegExp(re, rule.start.flags);
}

/**
 * Escapes HTML special characters (<, >, and &) in the string.
 * @param {string} string The raw string to be escaped
 * @returns {string} The string, ready to be used in HTML
 */
function htmlescape(string) {
  return (string ? string : '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
/**
 * Contains the commands that can be sent to the editor. Contains objects with a name representing the name of the command.
 * Each of the objects contains the following keys:
 * 
 *   - type: Can be either inline (for inline formatting) or line (for block / line formatting).
 *   - className: Used to determine whether the command is active at a given position. 
 *     For line formatting, this looks at the class of the line element. For inline elements, tries to find an enclosing element with that class.
 *   - set / unset: Contain instructions how to set and unset the command. For line type commands, both consist of a pattern and replacement that 
 *     will be applied to each line (using String.replace). For inline type commands, the set object contains a pre and post string which will
 *     be inserted before and after the selection. The unset object contains a prePattern and a postPattern. Both should be regular expressions and 
 *     they will be applied to the portion of the line before and after the selection (using String.replace, with an empty replacement string).
 */
const commands = {
  // Replacements for unset for inline commands are '' by default
  bold: {
    type: 'inline', 
    className: 'TMStrong', 
    set: {pre: '**', post: '**'}, 
    unset: {prePattern: /(?:\*\*|__)$/, postPattern: /^(?:\*\*|__)/}
  }, 
  italic: {
    type: 'inline', 
    className: 'TMEm', 
    set: {pre: '*', post: '*'}, 
    unset: {prePattern: /(?:\*|_)$/, postPattern: /^(?:\*|_)/}
  },
  code: {
    type: 'inline', 
    className: 'TMCode', 
    set: {pre: '`', post: '`'}, 
    unset: {prePattern: /`+$/, postPattern: /^`+/} // FIXME this doesn't ensure balanced backticks right now
  }, 
  strikethrough: {
    type: 'inline', 
    className: 'TMStrikethrough', 
    set: {pre: '~~', post: '~~'}, 
    unset: {prePattern:/~~$/, postPattern: /^~~/ }
  },
  h1: {
    type: 'line', 
    className: 'TMH1', 
    set: {pattern: /^( {0,3}(?:(?:#+|[0-9]{1,9}[).]|[>\-*+])\s+)?)(.*)$/, replacement: '# $2'}, 
    unset: {pattern: /^( {0,3}#\s+)(.*?)((?:\s+#+\s*)?)$/, replacement: '$2'}
  },
  h2: {
    type: 'line', 
    className: 'TMH2', 
    set: {pattern: /^( {0,3}(?:(?:#+|[0-9]{1,9}[).]|[>\-*+])\s+)?)(.*)$/, replacement: '## $2'}, 
    unset: {pattern: /^( {0,3}##\s+)(.*?)((?:\s+#+\s*)?)$/, replacement: '$2'}
  },
  h3: {
    type: 'line', 
    className: 'TMH3', 
    set: {pattern: /^( {0,3}(?:(?:#+|[0-9]{1,9}[).]|[>\-*+])\s+)?)(.*)$/, replacement: '### $2'}, 
    unset: {pattern: /^( {0,3}###\s+)(.*?)((?:\s+#+\s*)?)$/, replacement: '$2'}
  },
  h4: {
    type: 'line', 
    className: 'TMH4', 
    set: {pattern: /^( {0,3}(?:(?:#+|[0-9]{1,9}[).]|[>\-*+])\s+)?)(.*)$/, replacement: '#### $2'}, 
    unset: {pattern: /^( {0,3}####\s+)(.*?)((?:\s+#+\s*)?)$/, replacement: '$2'}
  },
  h5: {
    type: 'line', 
    className: 'TMH5', 
    set: {pattern: /^( {0,3}(?:(?:#+|[0-9]{1,9}[).]|[>\-*+])\s+)?)(.*)$/, replacement: '##### $2'}, 
    unset: {pattern: /^( {0,3}#####\s+)(.*?)((?:\s+#+\s*)?)$/, replacement: '$2'}
  },
  h6: {
    type: 'line', 
    className: 'TMH6', 
    set: {pattern: /^( {0,3}(?:(?:#+|[0-9]{1,9}[).]|[>\-*+])\s+)?)(.*)$/, replacement: '###### $2'}, 
    unset: {pattern: /^( {0,3}######\s+)(.*?)((?:\s+#+\s*)?)$/, replacement: '$2'}
  },
  ul: {
    type: 'line', 
    className: 'TMUL', 
    set: {pattern: /^( {0,3}(?:(?:#+|[0-9]{1,9}[).]|[>\-*+])\s+)?)(.*)$/, replacement: '- $2'}, 
    unset: {pattern: /^( {0,3}[+*-] {1,4})(.*)$/, replacement: '$2'}
  },
  ol: {
    type: 'line', 
    className: 'TMOL', 
    set: {pattern: /^( {0,3}(?:(?:#+|[0-9]{1,9}[).]|[>\-*+])\s+)?)(.*)$/, replacement: '$#. $2'}, 
    unset: {pattern: /^( {0,3}\d{1,9}[.)] {1,4})(.*)$/, replacement: '$2'}
  }, 
  blockquote: {
    type: 'line', 
    className: 'TMBlockquote', 
    set: {pattern: /^( {0,3}(?:(?:#+|[0-9]{1,9}[).]|[>\-*+])\s+)?)(.*)$/, replacement: '> $2'}, 
    unset: {pattern: /^( {0,3}>[ ]?)(.*)$/, replacement: '$2'}
  },
};

export { lineGrammar, inlineGrammar, punctuationLeading, punctuationTrailing, htmlescape, htmlBlockGrammar, commands };