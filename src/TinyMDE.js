import { lineTypeRegExp, inlineTriggerChars, processInlineStyles, lineGrammar } from "./grammar";

function stringifyEvent(event) {
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

  createEditorElement(element) {
    this.e = document.createElement('div');
    this.e.className = 'TinyMDE';
    this.e.contentEditable = true;
    element.appendChild(this.e);
    this.e.addEventListener("input", (e) => this.handleInputEvent(e));
    // this.e.addEventListener("keydown", (e) => this.handleKeydownEvent(e));
    document.addEventListener("selectionchange", (e) => this.handleSelectionChangeEvent(e));
    this.e.addEventListener("paste", (e) => { return this.handlePaste(e) });
  }

  setContent(content) {
    // Delete any existing content
    for (let e of this.lineElements) {
      e.parentElement.removeChild(e);
    }
    this.lineElements = [];

    this.lines = content.split(/(?:\r\n|\r|\n)/);
    for (let lineNum = 0; lineNum < this.lines.length; lineNum++) {
      let le = document.createElement('div');
      le.className = 'TMPara';
      this.lineTypes.push(le.className);
      this.e.appendChild(le);
      this.lineElements.push(le);
      // this.updateInlineStyles(lineNum);
      // let te = document.createTextNode(l); // TODO inline parsing
      // le.appendChild(te);

    }


    this.updateFormatting();
  }

  updateFormatting() {
    for (let l = 0; l < this.lines.length; l++) {
      this.calculateLineType(l);
    }
  }

  replace(replacement, capture) {
    return replacement
      .replace(/\$\$([0-9])/g, (str, p1) => processInlineStyles(capture[p1])) 
      .replace(/\$([0-9])/g, (str, p1) => capture[p1]);
  }

  applyLineType(lineNum, lineType, lineReplacement, lineCapture) {
    this.lineTypes[lineNum] = lineType;
    this.lineElements[lineNum].className = lineType;
    this.lineElements[lineNum].innerHTML = this.replace(lineReplacement, lineCapture);
  }

  calculateLineType(lineNum, apply = true) {

    if (lineNum < 0 || lineNum >= this.lines.length) throw 'array out of bounds';

    let lineType = 'TMPara';
    let lineCapture = [this.lines[lineNum]];
    let lineReplacement = '$$0'; // Default replacement for paragraph: Inline format the entire line


    // Check ongoing code blocks
    if (lineNum > 0 && (this.lineTypes[lineNum - 1] == 'TMCodeFenceBacktickOpen' || this.lineTypes[lineNum - 1] == 'TMFencedCodeBacktick')) {
      // We're in a backtick-fenced code block, check if the current line closes it
      let capture = lineGrammar.TMCodeFenceBacktickOpen.regex.exec(this.lines[lineNum]);
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
      let capture = lineGrammar.TMCodeFenceTildeOpen.regex.exec(this.lines[lineNum]);
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
        let capture = lineGrammar[type].regex.exec(this.lines[lineNum]);
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
      let capture = lineGrammar.TMUL.regex.exec(this.lines[lineNum]);
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
        // TODO Here need to update capture and replacement
        let capture = lineGrammar.TMHR.regex.exec(this.lines[lineNum]);
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
        // Valid setext marker. Change types of para lines if apply flag is set
        if (apply) {
          let headingLine = lineNum - 1;
          do {
            this.applyLineType(headingLine, (lineType == 'TMSetextH1Marker' ? 'TMSetextH1' : 'TMSetextH2'), '$$0', [this.lines[headingLine]]);
            headingLine--;
          } while(headingLine > 0 && this.lineTypes[headingLine] == 'TMPara');
        }
      }
    }
    if (apply) {
      this.applyLineType(lineNum, lineType, lineReplacement, lineCapture);
      // this.lineTypes[lineNum] = lineType;
    }
    return lineType;
    
  }

  updateLineContentsAndTypes() {
    let typesDirty = false;
    // Check if we have changed anything about the number of lines (inserted or deleted a paragraph)
    if (this.lineElements.length != this.e.childElementCount) {
      console.log('Para # changed');
      // yup. Recalculate everything
      this.lineElements = this.e.childNodes;
      this.lines = Array(this.lineElements.length);
      this.lineTypes = [];
      typesDirty = true;
    }
    for (let line = 0; line < this.lineElements.length; line++) {
      let e = this.lineElements[line];
      let ct = e.textContent;
      if (this.lines[line] !== ct) {
        // Line changed, update it
        this.lines[line] = ct;
        // Check whether line style has changed
        if (!typesDirty && this.calculateLineType(line, false) != this.lineTypes[line]) {
          typesDirty = true;
        }
      }
    }
    if (typesDirty) {
      this.updateFormatting();
      return true;
      this.log(`STYLES RECALCULATED`, stringifyEvent(this.lines));
    }
    return false; // No recalculation done
  }

  // updateInlineStyles(lineNum) {
  //   this.lineElements[lineNum].innerHTML = processInlineStyles(this.lines[lineNum]);
  // }

  getSelection() {
    const selection = window.getSelection();
    let node = selection.focusNode;
    if (node.nodeType != Node.TEXT_NODE) {
      // No text node selected
      this.log('SELECTIONCHANGE: NO TEXT', ``)
      return;
    }
    let col = selection.focusOffset;
    while (node && node.parentNode != this.e) {
      if (node.previousSibling) {
        node = node.previousSibling;
        col += node.textContent.length;
      } else {
        node = node.parentNode;
      }
    }
    let row = 0;
    while (node.previousSibling) {
      row++;
      node = node.previousSibling;
    }
    return {row: row, col: col};
  }

  setSelection({row, col}) {
    if (row >= this.lineElements.length) {
      // Selection past the end of text, set selection to end of text
      row = this.lineElements.length - 1;
      col = this.lines[row].length - 1;
    } 
    if (col >= this.lines[row].length) {
      col = this.lines[row].length - 1;
    }
    const parentNode = this.lineElements[row];
    let node = parentNode.firstChild;

    let range = document.createRange();
    let childrenComplete = false;

    while (node != parentNode) {
      if (!childrenComplete && node.type === Node.TEXT_NODE) {
        if (node.text.length <= col) {
          range.selectNode(node);
          range.setStart(node, col);
          range.setEnd(node, col);
          range.collapse(false); // TODO do we need this with a simple selection?
          let selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        } else {
          col -= node.text.length;
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
    // Selection past the end of the line, just keep it at the end of the line


  }

  handleInputEvent(event) {
    this.log(`INPUT`, `EVENT\n${stringifyEvent(event)}\n`);
    let sel = this.getSelection();
    this.updateFormatting();
    this.setSelection(sel);

    // this.updateLineContentsAndTypes();
    // this.log(`INPUT`, JSON.stringify(event.data));
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
  
    // Prevent regular paste
    return false;
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