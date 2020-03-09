import { inlineGrammar, lineGrammar, punctuationLeading, punctuationTrailing, htmlescape } from "./grammar";

function stringifyObject(event) {
  let keys = [];
  let obj = event;

  do {
    Object.getOwnPropertyNames(obj).forEach(function(prop) {
      if (keys.indexOf(prop) === -1) {
        keys.push(prop);
      }
    });
  } while (obj = Object.getPrototypeOf(obj));

  return '{\n' + keys.reduce(function (str, key) {
    switch (typeof event[key]) {
      case 'number':
      case 'boolean':
      case 'bigint':
        str = `${str}  ${key}: ${event[key]},\n`
        break;
      case 'string':
        str = `${str}  ${key}: '${event[key]}',\n`
        break;
      case 'object':
        str = `${str}  ${key}: {...},\n`
        break;
      case 'function':
        str = `${str}  ${key}: () => {...},\n`
        break;
      case 'undefined':
        str = `${str}  ${key}: undefined,\n`
        break;
      default:
        str = `${str}  ${key}: ?,\n`
    }
    return str;
  }, '') + '}';
}

class TinyMDE {

  constructor(props = {}) {    
    this.e = null;
    this.lines = [];
    this.lineElements = [];
    this.lineTypes = [];
    this.lineCaptures = [];
    this.lineReplacements = [];
    this.linkLabels = [];

    if (props.element && !props.element.tagName) {
      props.element = document.getElementById(props.element);
    }
    if (!props.element) {
      props.element = document.createElement('div');
      document.getElementsByTagName('body')[0].appendChild(props.element);
    }
    this.createEditorElement(props.element);
    this.setContent(props.content || '# Hello TinyMDE!\nEdit **here**');
  }

  /**
   * Creates the editor element inside the target element of the DOM tree
   * @param element The target element of the DOM tree
   */
  createEditorElement(element) {
    this.e = document.createElement('div');
    this.e.className = 'TinyMDE';
    this.e.contentEditable = true;
    // The following is important for formatting purposes, but also since otherwise the browser replaces subsequent spaces with  &nbsp; &nbsp;
    // That breaks a lot of stuff, so we do this here and not in CSS—therefore, you don't have to remember to but this in the CSS file
    this.e.style.whiteSpace = 'pre-wrap'; 
    element.appendChild(this.e);
    this.e.addEventListener("input", (e) => this.handleInputEvent(e));
    // this.e.addEventListener("keydown", (e) => this.handleKeydownEvent(e));
    document.addEventListener("selectionchange", (e) => this.handleSelectionChangeEvent(e));
    this.e.addEventListener("paste", (e) => this.handlePaste(e));
  }

  /**
   * Sets the editor content.
   * @param {string} content The new Markdown content
   */
  setContent(content) {
    // Delete any existing content
    for (let e of this.lineElements) {
      e.parentElement.removeChild(e);
    }
    this.lineElements = [];

    this.lines = content.split(/(?:\r\n|\r|\n)/);
    for (let lineNum = 0; lineNum < this.lines.length; lineNum++) {
      let le = document.createElement('div');
      this.e.appendChild(le);
      this.lineElements.push(le);
    }
    this.lineTypes = new Array(this.lines.length);
    this.updateFormatting();
  }

  /**
   * This is the main method to update the formatting (from this.lines to HTML output)
   */
  updateFormatting() {
    // First, parse line types. This will update this.lineTypes, this.lineReplacements, and this.lineCaptures
    // We don't apply the formatting yet
    this.updateLineTypes();
    // Collect any valid link labels from link reference definitions—we need that for formatting to determine what's a valid link
    this.updateLinkLabels();
    // Now, apply the formatting
    this.applyLineTypes();
  }

  /**
   * Updates this.linkLabels: For every link reference definition (line type TMLinkReferenceDefinition), we collect the label
   */
  updateLinkLabels() {
    this.linkLabels = [];
    for (let l = 0; l < this.lines.length; l++) {
      if (this.lineTypes[l] == 'TMLinkReferenceDefinition') {
        this.linkLabels.push(this.lineCaptures[l][lineGrammar.TMLinkReferenceDefinition.labelPlaceholder]);
      }
    }
    this.log(`Link labels`, stringifyObject(this.linkLabels));
  }

  /**
   * Helper function to replace placeholders from a RegExp capture. The replacement string can contain regular dollar placeholders (e.g., $1),
   * which are interpreted like in String.replace(), but also double dollar placeholders ($$1). In the case of double dollar placeholders, 
   * Markdown inline grammar is applied on the content of the captured subgroup, i.e., $$1 processes inline Markdown grammar in the content of the
   * first captured subgroup, and replaces `$$1` with the result.
   * 
   * @param {string} replacement The replacement string, including placeholders.
   * @param  capture The result of a RegExp.exec() call
   * @returns The replacement string, with placeholders replaced from the capture result.
   */
  replace(replacement, capture) {
    return replacement
      .replace(/\$\$([0-9])/g, (str, p1) => this.processInlineStyles(capture[p1])) 
      .replace(/\$([0-9])/g, (str, p1) => htmlescape(capture[p1]));
  }

  /**
   * Applies the line types (from this.lineTypes as well as the capture result in this.lineReplacements and this.lineCaptures) 
   * and processes inline formatting for all lines.
   */
  applyLineTypes() {
    for (let lineNum = 0; lineNum < this.lines.length; lineNum++) {
      this.lineElements[lineNum].className = this.lineTypes[lineNum];
      this.lineElements[lineNum].innerHTML = this.replace(this.lineReplacements[lineNum], this.lineCaptures[lineNum]);
    }    
  }

  /**
   * Determines line types for all lines based on the line / block grammar. Captures the results of the respective line
   * grammar regular expressions.
   * Updates this.lineTypes, this.lineCaptures, and this.lineReplacements.
   */
  updateLineTypes() {
    for (let lineNum = 0; lineNum < this.lines.length; lineNum++) {
      let lineType = 'TMPara';
      let lineCapture = [this.lines[lineNum]];
      let lineReplacement = '$$0'; // Default replacement for paragraph: Inline format the entire line

      // Check ongoing code blocks
      if (lineNum > 0 && (this.lineTypes[lineNum - 1] == 'TMCodeFenceBacktickOpen' || this.lineTypes[lineNum - 1] == 'TMFencedCodeBacktick')) {
        // We're in a backtick-fenced code block, check if the current line closes it
        let capture = lineGrammar.TMCodeFenceBacktickOpen.regexp.exec(this.lines[lineNum]);
        if (capture) {
          lineType = 'TMCodeFenceBacktickClose';
          lineReplacement = lineGrammar.TMCodeFenceBacktickOpen.replacement;
          lineCapture = capture;
        } else {
          lineType = 'TMFencedCodeBacktick';
          lineReplacement = '$0';
          lineCapture = [this.lines[lineNum]];
        } 
      }
      if (lineNum > 0 && (this.lineTypes[lineNum - 1] == 'TMCodeFenceTildeOpen' || this.lineTypes[lineNum - 1] == 'TMFencedCodeTilde')) {
        // We're in a tilde-fenced code block
        let capture = lineGrammar.TMCodeFenceTildeOpen.regexp.exec(this.lines[lineNum]);
        if (capture)  {
          lineType = 'TMCodeFenceTildeClose';
          lineReplacement = lineGrammar.TMCodeFenceTildeOpen.replacement;
          lineCapture = capture;
        }
        else {
          lineType = 'TMFencedCodeTilde';
          lineReplacement = '$0';
          lineCapture = [this.lines[lineNum]];
        } 
      }

      // Check all regexps if we haven't applied one of the code block types
      if (lineType == 'TMPara') {
        for (let type of Object.keys(lineGrammar)) {
          let capture = lineGrammar[type].regexp.exec(this.lines[lineNum]);
          if (capture) {
            lineType = type;
            lineReplacement = lineGrammar[type].replacement;
            lineCapture = capture;
            break;
          }
        }
      }

      // Setext H2 markers that can also be interpreted as an empty list item should be regarded as such (as per CommonMark spec)
      if (lineType == 'TMSetextH2Marker') {
        let capture = lineGrammar.TMUL.regexp.exec(this.lines[lineNum]);
        if (capture) {
          lineType = 'TMUL';
          lineReplacement = lineGrammar.TMUL.replacement;
          lineCapture = capture;
        }      
      }

      // Setext headings are only valid if preceded by a paragraph (and if so, they change the type of the previous paragraph)
      if (lineType == 'TMSetextH1Marker' || lineType == 'TMSetextH2Marker') {
        if (lineNum == 0 || this.lineTypes[lineNum - 1] != 'TMPara') {
          // Setext marker is invalid. However, a H2 marker might still be a valid HR, so let's check that
          let capture = lineGrammar.TMHR.regexp.exec(this.lines[lineNum]);
          if (capture) {
            // Valid HR
            lineType = 'TMHR';
            lineCapture = capture;
            lineReplacement = lineGrammar.TMHR.replacement;
          } else {
            // Not valid HR, format as TMPara
            lineType = 'TMPara';
            lineCapture = [this.lines[lineNum]];
            lineReplacement = '$$0';
          }
        } else {
          // Valid setext marker. Change types of preceding para lines
          let headingLine = lineNum - 1;
          do {
            this.lineTypes[headingLine] = (lineType == 'TMSetextH1Marker' ? 'TMSetextH1' : 'TMSetextH2');
            this.lineReplacements[headingLine] = '$$0';
            this.lineCaptures[headingLine] = [this.lines[headingLine]];

            headingLine--;
          } while(headingLine > 0 && this.lineTypes[headingLine] == 'TMPara'); 
        }
      }
      // Lastly, save the line style to be applied later
      this.lineTypes[lineNum] = lineType;
      this.lineReplacements[lineNum] = lineReplacement;
      this.lineCaptures[lineNum] = lineCapture;
    }
  }

  updateLineContentsAndFormatting() {
    if (this.updateLineContents()) {
      this.updateFormatting();
    }
  }

  /**
   * Attempts to parse a link or image at the current position. This assumes that the opening [ or ![ has already been matched. 
   * Returns false if this is not a valid link, image. See below for more information
   * @param {string} originalString The original string, starting at the opening marker ([ or ![)
   * @param {boolean} isImage Whether or not this is an image (opener == ![)
   * @returns false if not a valid link / image. 
   * Otherwise returns an object with two properties: output is the string to be included in the processed output, 
   * charCount is the number of input characters (from originalString) consumed.
   */
  parseLinkOrImage(originalString, isImage) {
    // Skip the opening bracket
    let textOffset = isImage ? 2 : 1;
    let opener = originalString.substr(0, textOffset);
    let type = isImage ? 'TMImage' : 'TMLink';
    let currentOffset = textOffset;
    
    let bracketLevel = 1;
    let linkText = false;
    let linkRef = false;
    let linkLabel = [];
    let linkDetails = []; // If matched, this will be an array: [whitespace + link destination delimiter, link destination, link destination delimiter, whitespace, link title delimiter, link title, link title delimiter + whitespace]. All can be empty strings.

  
    textOuter: while (currentOffset < originalString.length && !linkText) {
      let string = originalString.substr(currentOffset);
  
      // Capture any escapes and code blocks at current position, they bind more strongly than links
      // We don't have to actually process them here, that'll be done later in case the link / image is valid, but we need to skip over them.
      // TODO: Autolinks, HTML tags also bind more strongly
      for (let rule of ['escape', 'code']) {
        let cap = inlineGrammar[rule].regexp.exec(string);
        if (cap) {
          currentOffset += cap[0].length;
          continue textOuter; 
        }
      }
  
      // Check for image. It's okay for an image to be included in a link or image
      if (string.match(inlineGrammar.imageOpen.regexp)) {
        // Opening image. It's okay if this is a matching pair of brackets
        bracketLevel++;
        currentOffset += 2;
        continue textOuter;
      }
  
      // Check for link (not an image because that would have been captured and skipped over above)
      if (string.match(inlineGrammar.linkOpen.regexp)) {
        // Opening bracket. Two things to do:
        // 1) it's okay if this part of a pair of brackets.
        // 2) If we are currently trying to parse a link, this nested bracket musn't start a valid link (no nested links allowed)
        bracketLevel++;
        // if (bracketLevel >= 2) return false; // Nested unescaped brackets, this doesn't qualify as a link / image
        if (!isImage) {
          if (this.parseLinkOrImage(string, false)) {
            // Valid link inside this possible link, which makes this link invalid (inner links beat outer ones)
            return false;
          }
        }
        currentOffset += 1;
        continue textOuter;
      }
  
      // Check for closing bracket
      if (string.match(/^\]/)) {
        bracketLevel--;
        if (bracketLevel == 0) {
          // Found matching bracket and haven't found anything disqualifying this as link / image.
          linkText = originalString.substr(textOffset, currentOffset - textOffset);
          currentOffset++;
          continue textOuter;
        }
      }
  
      // Nothing matches, proceed to next char
      currentOffset++;
    }
  
    // Did we find a link text (i.e., find a matching closing bracket?)
    if (!linkText) return false; // Nope
  
    // So far, so good. We've got a valid link text. Let's see what type of link this is
    let nextChar = currentOffset < originalString.length ? originalString.substr(currentOffset, 1) : ''; 

    // REFERENCE LINKS
    if (nextChar == '[') {
      let string = originalString.substr(currentOffset);
      let cap = inlineGrammar.linkLabel.regexp.exec(string);
      if (cap) {
        // Valid link label
        currentOffset += cap[0].length;
        linkLabel.push(cap[1], cap[2], cap[3]);
        if (cap[inlineGrammar.linkLabel.labelPlaceholder]) {
          // Full reference link
          linkRef = cap[inlineGrammar.linkLabel.labelPlaceholder];
        } else {
          // Collapsed reference link
          linkRef = linkText.trim();
        }
      } else {
        // Not a valid link label
        return false;
      }   
    } else if (nextChar != '(') {
      
      // Shortcut ref link
      linkRef = linkText.trim();

    // INLINE LINKS
    } else { // nextChar == '('
      
      // Potential inline link
      currentOffset++;
      let done = false;

      let parenthesisLevel = 1;
      inlineOuter: while (currentOffset < originalString.length && parenthesisLevel > 0) {
        let string = originalString.substr(currentOffset);

        // Process whitespace
        let cap = /^\s+/.exec(string);
        if (cap) {
          switch (linkDetails.length) {
            case 0: linkDetails.push(cap[0]); break; // Opening whitespace
            case 1: linkDetails.push(cap[0]); break;// Open destination, but not a destination yet; desination opened with <
            case 2: // Open destination with content in it. Whitespace only allowed if opened by angle bracket, otherwise this closes the destination
              if (linkDetails[0].match(/</)) {
                linkDetails[1] = linkDetails[1].concat(cap[0]);
              } else {
                if (parenthesisLevel != 1) return false; // Unbalanced parenthesis
                linkDetails.push(''); // Empty end delimiter for destination
                linkDetails.push(cap[0]); // Whitespace in between destination and title
              }
              break;
            case 3: linkDetails.push(cap[0]); break; // Whitespace between destination and title
            case 4: return false; // This should never happen (no opener for title yet, but more whitespace to capture)
            case 5: linkDetails.push(''); // Whitespace at beginning of title, push empty title and continue
            case 6: linkDetails[5] = linkDetails[5].concat(cap[0]); break; // Whitespace in title
            case 7: linkDetails[6] = linkDetails[6].concat(cap[0]); break; // Whitespace after closing delimiter
            default: return false; // We should never get here
          }
          currentOffset += cap[0].length;
          continue inlineOuter;
        }

        // Process backslash escapes
        cap = inlineGrammar.escape.regexp.exec(string);
        if (cap) {
          switch (linkDetails.length) {
            case 0: linkDetails.push(''); // this opens the link destination, add empty opening delimiter and proceed to next case
            case 1: linkDetails.push(cap[0]); break; // This opens the link destination, append it
            case 2: linkDetails[1] = linkDetails[1].concat(cap[0]); break; // Part of the link destination
            case 3: return false; // Lacking opening delimiter for link title
            case 4: return false; // Lcaking opening delimiter for link title
            case 5: linkDetails.push(''); // This opens the link title
            case 6: linkDetails[5] = linkDetails[5].concat(cap[0]); break; // Part of the link title
            default: return false; // After link title was closed, without closing parenthesis
          }
          currentOffset += cap[0].length;
          continue inlineOuter;
        }

        // Process opening angle bracket as deilimiter of destination
        if (linkDetails.length < 2 && string.match(/^</)) {
          if (linkDetails.length == 0) linkDetails.push('');
          linkDetails[0] = linkDetails[0].concat('<');
          currentOffset++;
          continue inlineOuter;
        }

        // Process closing angle bracket as delimiter of destination
        if ((linkDetails.length == 1 || linkDetails.length == 2) && string.match(/^>/)) {
          if (linkDetails.length == 1) linkDetails.push(''); // Empty link destination
          linkDetails.push('>');
          currentOffset++;
          continue inlineOuter;
        }

        // Process  non-parenthesis delimiter for title. 
        cap = /^["']/.exec(string)
        // For this to be a valid opener, we have to either have no destination, only whitespace so far,
        // or a destination with trailing whitespace.
        if (cap && (linkDetails.length == 0 || linkDetails.length == 1 || linkDetails.length == 4)) {
          while (linkDetails.length < 4) linkDetails.push('');
          linkDetails.push(cap[0]);
          currentOffset++;
          continue inlineOuter;
        }

        // For this to be a valid closer, we have to have an opener and some or no title, and this has to match the opener
        if (cap && (linkDetails.length == 5 || linkDetails.length == 6) && linkDetails[4] == cap[0]) {
          if (linkDetails.length == 5) linkDetails.push(''); // Empty link title
          linkDetails.push(cap[0]);
          currentOffset++;
          continue inlineOuter;
        }
        // Other cases (linkDetails.length == 2, 3, 7) will be handled with the "default" case below.

        // Process opening parenthesis
        if (string.match(/^\(/)) {
          switch (linkDetails.length) {
            case 0: linkDetails.push(''); // this opens the link destination, add empty opening delimiter and proceed to next case
            case 1: linkDetails.push(''); // This opens the link destination
            case 2: // Part of the link destination
              linkDetails[1] = linkDetails[1].concat('('); 
              if (!linkDetails[0].match(/<$/)) parenthesisLevel++;  
              break; 
            case 3: linkDetails.push('');  //  opening delimiter for link title
            case 4: linkDetails.push('('); break;// opening delimiter for link title
            case 5: linkDetails.push(''); // opens the link title, add empty title content and proceed to next case 
            case 6:// Part of the link title. Un-escaped parenthesis only allowed in " or ' delimited title
              if (linkDetails[4] == '(') return false;
              linkDetails[5] = linkDetails[5].concat('('); 
              break; 
            default: return false; // After link title was closed, without closing parenthesis
          }
          currentOffset++;
          continue inlineOuter;
        }

        // Process closing parenthesis
        if (string.match(/^\)/)) {
          if (linkDetails.length <= 2) {
            // We are inside the link destination. Parentheses have to be matched if not in angle brackets
            while (linkDetails.length < 2) linkDetails.push('');

            if (!linkDetails[0].match(/<$/)) parenthesisLevel--;

            if (parenthesisLevel > 0) {
              linkDetails[1] = linkDetails[1].concat(')');
            }
            
          } else if (linkDetails.length == 5 || linkDetails.length == 6) {
            // We are inside the link title. 
            if (linkDetails[4] == '(') {
              // This closes the link title
              if (linkDetails.length == 5) linkDetails.push('');
              linkDetails.push(')');
            } else {
              // Just regular ol' content
              if (linkDetails.length == 5) linkDetails.push(')');
              else linkDetails[5] = linkDetails[5].concat(')');
            }
          } else  {
            parenthesisLevel--; // This should decrease it from 1 to 0...
          }

          if (parenthesisLevel == 0) {
            // No invalid condition, let's make sure the linkDetails array is complete
            while (linkDetails.length < 7) linkDetails.push('');
          } 

          currentOffset++;
          continue inlineOuter;
        }

        // Any old character
        cap = /^./.exec(string);
        if (cap) {
          switch (linkDetails.length) {
            case 0: linkDetails.push(''); // this opens the link destination, add empty opening delimiter and proceed to next case
            case 1: linkDetails.push(cap[0]); break; // This opens the link destination, append it
            case 2: linkDetails[1] = linkDetails[1].concat(cap[0]); break; // Part of the link destination
            case 3: return false; // Lacking opening delimiter for link title
            case 4: return false; // Lcaking opening delimiter for link title
            case 5: linkDetails.push(''); // This opens the link title
            case 6: linkDetails[5] = linkDetails[5].concat(cap[0]); break; // Part of the link title
            default: return false; // After link title was closed, without closing parenthesis
          }
          currentOffset += cap[0].length;
          continue inlineOuter;
        }
        throw "Infinite loop"; // we should never get here since the last test matches any character
      }

    }

    if (linkRef) {
      // Ref link; check that linkRef is valid
      let valid = false;
      for (let label of this.linkLabels) {
        if (label == linkRef) {
          valid = true;
          break;
        }
      }
      let label = valid ? "TMLinkLabel TMLinkLabel_Valid" : "TMLinkLabel TMLinkLabel_Invalid"
      let output = `<span class="TMMark TMMark_${type}">${opener}</span><span class="${type} ${(linkLabel.length < 3 || !linkLabel[1]) ? label : ""}">${this.processInlineStyles(linkText)}</span><span class="TMMark TMMark_${type}">]</span>`;

      if (linkLabel.length >= 3) {
        output = output.concat(
          `<span class="TMMark TMMark_${type}">${linkLabel[0]}</span>`,
          `<span class="${label}">${linkLabel[1]}</span>`,
          `<span class="TMMark TMMark_${type}">${linkLabel[2]}</span>`
        );
      }
      return {
        output : output,
        charCount :  currentOffset
      }
    }
    else if (linkDetails) {
      // Inline link

      // This should never happen, but better safe than sorry.
      while (linkDetails.length < 7) {
        linkDetails.push('');
      }

      return {
        output: `<span class="TMMark TMMark_${type}">${opener}</span><span class="${type}">${this.processInlineStyles(linkText)}</span><span class="TMMark TMMark_${type}">](${linkDetails[0]}</span><span class="TMLinkDestination">${linkDetails[1]}</span><span class="TMMark TMMark_${type}">${linkDetails[2]}${linkDetails[3]}${linkDetails[4]}</span><span class="TMLinkTitle">${linkDetails[5]}</span><span class="TMMark TMMark_${type}">${linkDetails[6]})</span>`,
        charCount: currentOffset
      }
    }

    return false;
  }
  
  /**
   * Formats a markdown string as HTML, using Markdown inline formatting.
   * @param {string} originalString The input (markdown inline formatted) string
   * @returns {string} The HTML formatted output
   */
  processInlineStyles(originalString) {
    let processed = '';
    let stack = []; // Stack is an array of objects of the format: {delimiter, delimString, count, output}
    let offset = 0;
    let string = originalString;
  
  
    outer: while (string) {
      // Process simple rules (non-delimiter)
      for (let rule of ['escape', 'code']) {
        let cap = inlineGrammar[rule].regexp.exec(string);
        if (cap) {
          string = string.substr(cap[0].length);
          offset += cap[0].length;
          processed += inlineGrammar[rule].replacement
            // .replace(/\$\$([1-9])/g, (str, p1) => processInlineStyles(cap[p1])) // todo recursive calling
            .replace(/\$([1-9])/g, (str, p1) => htmlescape(cap[p1]));
          continue outer; 
        }
      }
  
      // Check for links / images
      let potentialLink = string.match(inlineGrammar.linkOpen.regexp);
      let potentialImage = string.match(inlineGrammar.imageOpen.regexp);
      if (potentialImage || potentialLink) {
        let result = this.parseLinkOrImage(string, potentialImage);
        if (result) {
          processed = `${processed}${result.output}`;
          string = string.substr(result.charCount);
          offset += result.charCount;
          continue outer;
        }
      }
      
      // Check for em / strong delimiters
      let cap = /(^\*+)|(^_+)/.exec(string);
      if (cap) {
        let delimCount = cap[0].length;
        const delimString = cap[0];
        const currentDelimiter = cap[0][0]; // This should be * or _
  
        string = string.substr(cap[0].length);
      
        // We have a delimiter run. Let's check if it can open or close an emphasis.
        
        const preceding = (offset > 0) ? originalString.substr(0, offset) : ' '; // beginning and end of line count as whitespace
        const following = (offset + cap[0].length < originalString.length) ? string : ' ';
  
        const punctuationFollows = following.match(punctuationLeading);
        const punctuationPrecedes = preceding.match(punctuationTrailing);
        const whitespaceFollows = following.match(/^\s/);
        const whitespacePrecedes = preceding.match(/\s$/);
  
        // These are the rules for right-flanking and left-flanking delimiter runs as per CommonMark spec
        let canOpen = !whitespaceFollows && (!punctuationFollows || !!whitespacePrecedes || !!punctuationPrecedes);
        let canClose = !whitespacePrecedes && (!punctuationPrecedes || !!whitespaceFollows || !!punctuationFollows);
  
        // Underscores have more detailed rules than just being part of left- or right-flanking run:
        if (currentDelimiter == '_' && canOpen && canClose) {
          canOpen = punctuationPrecedes;
          canClose = punctuationFollows;
        }
  
        // If the delimiter can close, check the stack if there's something it can close
        if (canClose) {
          let stackPointer = stack.length - 1;
          // See if we can find a matching opening delimiter, move down through the stack
          while (delimCount && stackPointer >= 0) {
            if (stack[stackPointer].delimiter == currentDelimiter) {
              // We found a matching delimiter, let's construct the formatted string
  
              // Firstly, if we skipped any stack levels, pop them immediately (non-matching delimiters)
              while (stackPointer < stack.length - 1) {
                const entry = stack.pop();
                processed = `${entry.output}${entry.delimString.substr(0, entry.count)}${processed}`;
              }
  
              // Then, format the string
              if (delimCount >= 2 && stack[stackPointer].count >= 2) {
                // Strong
                processed = `<span class="TMMark">${currentDelimiter}${currentDelimiter}</span><strong class="TMStrong">${processed}</strong><span class="TMMark">${currentDelimiter}${currentDelimiter}</span>`;
                delimCount -= 2;
                stack[stackPointer].count -= 2;
              } else {
                // Em
                processed = `<span class="TMMark">${currentDelimiter}</span><em class="TMEm">${processed}</em><span class="TMMark">${currentDelimiter}</span>`;
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
              // This stack level's delimiter type doesn't match the current delimiter type
              // Go down one level in the stack
              stackPointer--;
            }
          }
        }
        // If there are still delimiters left, and the delimiter run can open, push it on the stack
        if (delimCount && canOpen) {
          stack.push({
            delimiter: currentDelimiter,
            delimString: delimString,
            count: delimCount,
            output: processed
          });
          processed = ''; // Current formatted output has been pushed on the stack and will be prepended when the stack gets popped
          delimCount = 0;
        }
  
        // Any delimiters that are left (closing unmatched) are appended to the output.
        if (delimCount) {
          processed = `${processed}${delimString.substr(0,delimCount)}`;
        }
  
        offset += cap[0].length;
        continue outer;
      }
  
      // Process 'default' rule
      cap = inlineGrammar.default.regexp.exec(string);
      if (cap) {
        string = string.substr(cap[0].length);
        offset += cap[0].length;
        processed += inlineGrammar.default.replacement
          // .replace(/\$\$([1-9])/g, (str, p1) => processInlineStyles(cap[p1])) // todo recursive calling
          .replace(/\$([1-9])/g, (str, p1) => htmlescape(cap[p1]));
        continue outer; 
      }
      throw 'Infinite loop!';
    }
  
    // Empty the stack, any opening delimiters are unused
    while (stack.length) {
      const entry = stack.pop();
      processed = `${entry.output}${entry.delimString.substr(0, entry.count)}${processed}`;
    }
  
    return processed;
  }

  /**
   * Updates the class properties (lines, lineElements) from the DOM.
   * @returns true if contents changed
   */
  updateLineContents() {
    let dirty = false;
    // Check if we have changed anything about the number of lines (inserted or deleted a paragraph)
    if (this.lines.length != this.e.childElementCount) {
      // yup. Recalculate everything
      this.lineElements = this.e.childNodes;
      this.lines = Array(this.lineElements.length);
      this.lineTypes = [];
      dirty = true;
    }
    for (let line = 0; line < this.lineElements.length; line++) {
      let e = this.lineElements[line];
      let ct = e.textContent;
      if (this.lines[line] !== ct) {
        // Line changed, update it
        this.lines[line] = ct;
        dirty = true;
      }
    }
    return dirty;
  }

  processNewParagraph(sel) {
    let continuableType = false;
    // Let's see if we need to continue a list
    if (sel && sel.row > 0) {
      switch (this.lineTypes[sel.row - 1]) {
        case 'TMUL': continuableType = 'TMUL'; break;
        case 'TMOL': continuableType = 'TMOL'; break;
        case 'TMIndentedCode': continuableType = 'TMIndentedCode'; break;
      }
    }
    // Update lines from content
    this.updateLineContents();
    if (continuableType) {
      // Check if the previous line was non-empty
      let capture = lineGrammar[continuableType].regexp.exec(this.lines[sel.row - 1]);
      if (capture) {
        // Convention: capture[1] is the line type marker, capture[2] is the content
        if (capture[2]) {
          // Previous line has content, continue the continuable type

          // Hack for OL: increment number
          if (continuableType == 'TMOL') {
            capture[1] = capture[1].replace(/\d{1,9}/, (result) => { return parseInt(result[0]) + 1});
          }
          this.lines[sel.row] = `${capture[1]}${this.lines[sel.row]}`;
          sel.col = capture[1].length;
        } else {
          // Previous line has no content, remove the continuable type from the previous row
          this.lines[sel.row - 1] = '';
        }     
      }
    }
    this.updateFormatting();
  }

  getSelection() {
    const selection = window.getSelection();
    let node = selection.focusNode;
    let col = node.nodeType === Node.TEXT_NODE ? selection.focusOffset : 0;
    while (node && node.parentNode != this.e) {
      if (node.previousSibling) {
        node = node.previousSibling;
        col += node.textContent.length;
      } else {
        node = node.parentNode;
      }
    }
    // Check that the selection was inside our text. If not, we'd have ascended to the root of the DOM (node == null)
    if (!node) {
      return null;
    }
    let row = 0;
    while (node.previousSibling) {
      row++;
      node = node.previousSibling;
    }
    return {row: row, col: col};
  }

  setSelection(para) {
    if (!para) return;
    let {row, col} = para; 
    if (row >= this.lineElements.length) {
      // Selection past the end of text, set selection to end of text
      row = this.lineElements.length - 1;
      col = this.lines[row].length;
    } 
    if (col > this.lines[row].length) {
      col = this.lines[row].length;
    }
    const parentNode = this.lineElements[row];
    let node = parentNode.firstChild;

    let range = document.createRange();
    let childrenComplete = false;

    while (node != parentNode) {
      if (!childrenComplete && node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue.length >= col) {
          this.log(`Selection at node, offset ${col}`, stringifyObject(node));
          range.selectNode(node);
          range.setStart(node, col);
          range.setEnd(node, col);
          range.collapse(false); // TODO do we need this with a simple selection?
          let selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        } else {
          col -= node.nodeValue.length;
        }
      } 
      if (!childrenComplete && node.firstChild) {
        node = node.firstChild;
      } else if (node.nextSibling) {
        childrenComplete = false;
        node = node.nextSibling;
      } else {
        childrenComplete = true;
        node = node.parentNode;
      }
    }

    // Somehow, the position was invalid; just keep it at the beginning of the line
    node = parentNode.firstChild ? parentNode.firstChild : parentNode;
    range.selectNode(node);
    range.collapse(true);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /** 
   * Event handler for input events 
   */
  handleInputEvent(event) {
    let sel = this.getSelection();
    if (event.inputType == 'insertParagraph' && sel) {
      this.processNewParagraph(sel);
    } else {
      this.log(`INPUT at ${sel ? sel.row : '-'}:${sel ? sel.col : '-'}`, `EVENT\n${stringifyObject(event)}\n`);
      this.updateLineContentsAndFormatting();  
    }
    
    if (sel) this.setSelection(sel);

  }

  handleSelectionChangeEvent(event) {
    // this.log(`SELECTIONCHANGE`, `EVENT\n${stringifyEvent(event)}\n\nSELECTION\n${stringifyEvent(document.getSelection())}\n`);
  }

  handlePaste(event) {
    event.preventDefault();
  
    // get text representation of clipboard
    let text = (event.originalEvent || event).clipboardData.getData('text/plain');

    // insert text manually
    document.execCommand("insertText", false, text);
    let sel = this.getSelection();
    this.updateLineContentsAndFormatting();
    if (sel) this.setSelection(sel);
  
    // Prevent regular paste
    // return false;
  }

  // handleKeydownEvent(event) {
  //   this.log(`KEYDOWN`, stringifyEvent(event));
  // }

  log(message, details) {
    let e = document.createElement('details');
    let s = document.createElement('summary');
    let t = document.createTextNode(message);
    s.appendChild(t);
    e.appendChild(s);
    let c = document.createElement('code');
    let p = document.createElement('pre');
    t = document.createTextNode(details);
    c.appendChild(t);
    p.appendChild(c);
    e.appendChild(p);
    document.getElementById('log').appendChild(e);
    
  }


}

export default TinyMDE;