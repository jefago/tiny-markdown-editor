const replacements = {
  ASCIIPunctuation: '[!"#$%&\'()*+,\\-./:;<=>?@\\[\\]^_`{|}~]',
  

}

export const inlineTriggerChars = /[`_\*\[\]\(\)]/;

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
      '^(\\\\ASCIIPunctuation)'
    ],
    replacement : '\\$1'
  },
  strong: {
    regexpUncompiled : [
      '^(__)([^\\s_])(__)(?!_)',
      '^(\\*\\*)([^\\s*])(\\*\\*)(?!\\*)',
      '^(__)([^\\s][\\s\\S]*?[^\\s])(__)(?!_)',
      '^(\\*\\*)([^\\s][\\s\\S]*?[^\\s])(\\*\\*)(?!\\*)',
    ],
    replacement: '$1<strong>$$2</strong>$3'
  },
  em: {
    regexpUncompiled : [
      '^(_)([^\\s_])(_)(?!_)',
      '^(\\*)([^\\s*])(\\*)(?!\\*)',
      '^(_)([^\\s][\\s\\S]*?[^\\s])(_)(?!_)',
      '^(\\*)([^\\s][\\s\\S]*?[^\\s])(\\*)(?!\\*)',
    ],
    replacement: '$1<em>$$2</em>$3'
  },
  default : {
    regexpUncompiled : [
      '(.)'
    ],
    replacement: '$1'
  }
};




// 
for (let rule of Object.keys(inlineGrammar)) {
  inlineGrammar[rule].regexp = [];
  for (let re of inlineGrammar[rule].regexpUncompiled) {
    for (let rp of Object.keys(replacements)) {
      re = re.replace(rp, replacements[rp]);
    }
    inlineGrammar[rule].regexp.push(new RegExp(re));
  }
};

export function processInlineStyles(string) {
  let processed = '';

  outer: while (string) {
    for (let rule of Object.keys(inlineGrammar)) {
      for (let regexp of inlineGrammar[rule].regexp) {
        let cap = regexp.exec(string);
        if (cap) {
          string = string.substr(cap[0].length);
          processed += inlineGrammar[rule].replacement
            .replace(/\$\$([1-9])/g, (str, p1) => cap[p1]) // todo recursive calling
            .replace(/\$([1-9])/g, (str, p1) => cap[p1]);
          continue outer;
        
        }
      }
    }
    throw 'Infinite loop!';
  }
  return processed;
}