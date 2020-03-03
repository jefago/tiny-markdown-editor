const replacements = {
  ASCIIPunctuation: '!"#$%&\'()*+,\\-./:;<=>?@\\[\\]^_`{|}~',
  TriggerChars: '`_\*\[\]\(\)',

}

// From CommonMark.js. 
const punctuationLeading = new RegExp(/^(?:[!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B])/);

const punctuationTrailing = new RegExp(/(?:[!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B])$/);

export const inlineTriggerChars = new RegExp(`[${replacements.TriggerChars}]`);

export const lineTypeRegExp = {
  TMH1: /^ {0,3}# +/,
  TMH2: /^ {0,3}## +/,
  TMH3: /^ {0,3}### +/,
  TMH4: /^ {0,3}#### +/,
  TMH5: /^ {0,3}##### +/,
  TMH6: /^ {0,3}###### +/,
  TMBlockquote: /^ {0,3}> +/,
  TMCodeFenceBacktickOpen: /^ {0,3}(```)/,
  TMCodeFenceTildeOpen: /^ {0,3}(~~~)/,
  TMBlankLine: /^[ \t]*$/,
  TMSetextH1Marker: /^ {0,3}=+\s*$/,
  TMSetextH2Marker: /^ {0,3}-+\s*$/,
  TMHR: /^ {0,3}((\*[ \t]*\*[ \t]*\*[ \t\*]*)|(-[ \t]*-[ \t]*-[ \t-]*)|(_[ \t]*_[ \t]*_[ \t_]*))$/,
  TMUL: /^ {0,3}[+*-] +/,
  TMOL: /^ {0,3}\d{1,9}[.)] +/,
  TMIndentedCode: /^(    |\t)/,
};



// Structure of the following object:
// Top level entries are rules, each consisting of an array of regular expressions (in string format) as well as a replacement.
// In the regular expressions, replacements from the object 'replacements' will be processed before compiling.
// The replacement can be a regular string as used in 'String.replace()', a function, or alternatively it can contain processed placeholders.
// Processed placeholders look like regular placeholders ($1) but with two dollar symbols ($$1). For these, the formatting function is called 
// recursively before replacing.

var inlineGrammar = {
  escape : {
    regexpUncompiled : [
      '^(\\\\[ASCIIPunctuation])'
    ],
    replacement : '\\$1'
  },
  code : {
    regexpUncompiled : [
      '^(`+)([^`])(\\1)', // Single character, not backtick
      '^(`+)([^`].*?[^`])(\\1)' // Multiple characters, starting and ending in not backtick
    ],
    replacement : '$1<code>$2</code>$3' // No recursive application of rules
  },
  // strong: {
  //   regexpUncompiled : [
  //     '^(__)([^\\s_])(__)(?!_)',
  //     '^(\\*\\*)([^\\s*])(\\*\\*)(?!\\*)',
  //     '^(__)([^\\s][\\s\\S]*?[^\\s])(__)(?!_)',
  //     '^(\\*\\*)([^\\s][\\s\\S]*?[^\\s])(\\*\\*)(?!\\*)',
  //   ],
  //   replacement: '$1<strong>$$2</strong>$3'
  // },
  // em: {
  //   regexpUncompiled : [
  //     '^(_)([^\\s_])(_)(?!_)',
  //     '^(\\*)([^\\s*])(\\*)(?!\\*)',
  //     '^(_)([^\\s][\\s\\S]*?[^\\s])(_)(?!_)',
  //     '^(\\*)([^\\s][\\s\\S]*?[^\\s])(\\*)(?!\\*)',
  //   ],
  //   replacement: '$1<em>$$2</em>$3'
  // },
  default : {
    regexpUncompiled : [
      '(.|(?:[^TriggerChars]+))'
    ],
    replacement: '$1'
  }
};



for (let rule of Object.keys(inlineGrammar)) {
  inlineGrammar[rule].regexp = [];
  for (let re of inlineGrammar[rule].regexpUncompiled) {
    for (let rp of Object.keys(replacements)) {
      re = re.replace(rp, replacements[rp]);
    }
    inlineGrammar[rule].regexp.push(new RegExp(re));
  }
};

// export function processInlineStyles(string) {
//   let processed = '';

//   outer: while (string) {
//     for (let rule of Object.keys(inlineGrammar)) {
//       for (let regexp of inlineGrammar[rule].regexp) {
//         let cap = regexp.exec(string);
//         if (cap) {
//           string = string.substr(cap[0].length);
//           processed += inlineGrammar[rule].replacement
//             .replace(/\$\$([1-9])/g, (str, p1) => processInlineStyles(cap[p1])) // todo recursive calling
//             .replace(/\$([1-9])/g, (str, p1) => cap[p1]);
//           continue outer;
        
//         }
//       }
//     }
//     throw 'Infinite loop!';
//   }
//   return processed;
// }

export function processInlineStyles(originalString) {
  let processed = '';
  let stack = []; // Stack is an array of objects of the format: {delimiter, count, output}
  let offset = 0;
  let string = originalString;


  outer: while (string) {
    // Process simple rules (non-delimiter)
    for (let rule of ['escape', 'code']) {
      for (let regexp of inlineGrammar[rule].regexp) {
        let cap = regexp.exec(string);
        if (cap) {
          string = string.substr(cap[0].length);
          offset += cap[0].length;
          processed += inlineGrammar[rule].replacement
            .replace(/\$\$([1-9])/g, (str, p1) => processInlineStyles(cap[p1])) // todo recursive calling
            .replace(/\$([1-9])/g, (str, p1) => cap[p1]);
          continue outer; 
        }
      }
    }
    // Check for delimiters
    let cap = /(^\*+)|(^_+)/.exec(string);
    if (cap) {
      let delimCount = cap[0].length;
      let currentDelimiter = cap[0][0]; // This should be * or _

      string = string.substr(cap[0].length);
    
      // We have a delimiter run. Let's check if it can open or close an emphasis.
      
      let preceding = (offset > 0) ? originalString.substr(0, offset) : ' '; // beginning and end of line count as whitespace
      let following = (offset + cap[0].length < originalString.length) ? string : ' ';

      // TODO need to differentiate by asterisk and underscore
      // Asterisk can open emphasis only if it's part of a left-flanking delimter run (cf CommonMark spec)
      let canOpen = following.match(/^\S/) 
        && (!following.match(punctuationLeading) || preceding.match(/\s$/) || preceding.match(punctuationTrailing));

      let canClose = preceding.match(/\S$/)
        && (!preceding.match(punctuationTrailing) || following.match(/^\s/) || following.match(punctuationLeading));

      // If the delimiter can close, check the stack if there's something it can close
      if (canClose) {
        let stackPointer = stack.length - 1;
        // See if we can find a matching opening delimiter, move down through the stack
        while (delimCount && stackPointer >= 0) {
          if (stack[stackPointer].delimiter == currentDelimiter) {
            // We found a matching delimiter, let's construct the formatted string

            // Firstly, if we skipped any stack levels, pop them immediately (non-matching delimiters)
            while (stackPointer < stack.length - 1) {
              let entry = stack.pop();
              let delimRun = '';
              for (let i = 0; i < entry.count; i++) {
                delimRun += entry.delimiter; 
              }
              processed = `${entry.output}${delimRun}${processed}`;
            }

            // Then, format the string
            if (delimCount >= 2 && stack[stackPointer].count >= 2) {
              // Strong
              processed = `${currentDelimiter}${currentDelimiter}<strong>${processed}</strong>${currentDelimiter}${currentDelimiter}`;
              delimCount -= 2;
              stack[stackPointer].count -= 2;
            } else {
              // Em
              processed = `${currentDelimiter}<em>${processed}</em>${currentDelimiter}`;
              delimCount -= 1;
              stack[stackPointer].count -= 1;
            }

            // If that stack level is empty now, pop it
            if (stack[stackPointer].count == 0) {
              let entry = stack.pop();
              processed = `${entry.output}${processed}`
              stackPointer--;
            }

          } else {
            // Go down one level in the stack
            stackPointer--;
          }
        }

      }
      // If there are still delimiters left, and the delimiter run can open, push it on the stack
      if (delimCount && canOpen) {
        stack.push({
          delimiter: currentDelimiter,
          count: delimCount,
          output: processed
        });
        processed = ''; // Current formatted output has been pushed on the stack and will be prepended when the stack gets popped
        delimCount = 0;
      }

      // Any delimiters that are left (closing unmatched) are appended to the output.
      while (delimCount) {
        processed = `${processed}${currentDelimiter}`;
        delimCount--;
      }

      offset += cap[0].length;
      continue outer;
    }
  

    cap = /^_+/.exec(string);
    if (cap) {
      // let delimCount = cap[0].length;
      string = string.substr(cap[0].length);

      processed += cap[0];

      offset += cap[0].length;
      continue outer;
    }


    // Proces 'default' rule
    cap = inlineGrammar.default.regexp[0].exec(string);
    if (cap) {
      string = string.substr(cap[0].length);
      offset += cap[0].length;
      processed += inlineGrammar.default.replacement
        .replace(/\$\$([1-9])/g, (str, p1) => processInlineStyles(cap[p1])) // todo recursive calling
        .replace(/\$([1-9])/g, (str, p1) => cap[p1]);
      continue outer; 
    }
    throw 'Infinite loop!';
  }

  // Empty the stack, any opening delimiters are unused
  while (stack.length) {
    let entry = stack.pop();
    let delimRun = '';
    for (let i = 0; i < entry.count; i++) {
      delimRun += entry.delimiter; 
    }
    processed = `${entry.output}${delimRun}${processed}`;
  }

  return processed;

}