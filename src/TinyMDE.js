import { lineTypeRegExp, inlineTriggerChars, processInlineStyles } from "./grammar";

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
      this.updateInlineStyles(lineNum);
      // let te = document.createTextNode(l); // TODO inline parsing
      // le.appendChild(te);

    }


    this.recalculateAndApplyLineTypes();
  }

  recalculateAndApplyLineTypes() {
    for (let l = 0; l < this.lines.length; l++) {
      this.calculateLineType(l);
    }
    for (let l = 0; l < this.lines.length; l++) {
      this.lineElements[l].className = this.lineTypes[l];
    }
  }

  calculateLineType(lineNum, apply = true) {

    let lineType = 'TMPara';

    if (lineNum < 0 || lineNum >= this.lines.length) throw 'array out of bounds';
    // Check ongoing code blocks
    if (lineNum > 0 && (this.lineTypes[lineNum - 1] == 'TMCodeFenceBacktickOpen' || this.lineTypes[lineNum - 1] == 'TMFencedCodeBacktick')) {
      // We're in a backtick-fenced code block
      if (this.lines[lineNum].match(lineTypeRegExp.TMCodeFenceBacktickOpen)) lineType = 'TMCodeFenceBacktickClose';
      else  lineType = 'TMFencedCodeBacktick';
    }
    if (lineNum > 0 && (this.lineTypes[lineNum - 1] == 'TMCodeFenceTildeOpen' || this.lineTypes[lineNum - 1] == 'TMFencedCodeTilde')) {
      // We're in a tilde-fenced code block
      if (this.lines[lineNum].match(lineTypeRegExp.TMCodeFenceTildeOpen))  lineType = 'TMCodeFenceTildeClose';
      else  lineType = 'TMFencedCodeTilde';
    }

    // Check all regexps if we haven't applied one of the code block types
    if (lineType == 'TMPara') {
      for (let type of Object.keys(lineTypeRegExp)) {
        if (this.lines[lineNum].match(lineTypeRegExp[type])) {
          lineType = type;
          break;
        }
      }
    }

    // Setext H2 markers that can also be interpreted as an empty list item should be regarded as such (as per CommonMark spec)
    if (lineType == 'TMSetextH2Marker' && this.lines[lineNum].match(lineTypeRegExp.TMUL)) {
      lineType = 'TMUL';
    }

    // Setext headings are only valid if preceded by a paragraph (and if so, they change the type of the previous paragraph)
    if (lineType == 'TMSetextH1Marker' || lineType == 'TMSetextH2Marker') {
      if (lineNum == 0 || this.lineTypes[lineNum - 1] != 'TMPara') {
        // Setext marker is invalid. However, a H2 marker might still be a valid HR, so let's check that
        lineType = this.lines[lineNum].match(lineTypeRegExp.TMHR) ? 'TMHR' : 'TMPara';
      } else {
        // Valid setext marker. Change types of para lines
        if (apply) {
          let headingLine = lineNum - 1;
          do {
            this.lineTypes[headingLine] = (lineType == 'TMSetextH1Marker' ? 'TMSetextH1' : 'TMSetextH2');
            headingLine--;
          } while(headingLine > 0 && this.lineTypes[headingLine] == 'TMPara');
        }
      }
    }
    if (apply) this.lineTypes[lineNum] = lineType;
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
      this.recalculateAndApplyLineTypes();
      return true;
      this.log(`STYLES RECALCULATED`, stringifyEvent(this.lines));
    }
    return false; // No recalculation done
  }

  updateInlineStyles(lineNum) {
    this.lineElements[lineNum].innerHTML = processInlineStyles(this.lines[lineNum]);
  }

  handleInputEvent(event) {
    this.log(`INPUT`, `EVENT\n${stringifyEvent(event)}\n`);
    this.updateLineContentsAndTypes();
    // this.log(`INPUT`, JSON.stringify(event.data));
  }

  handleSelectionChangeEvent(event) {
    // this.log(`SELECTIONCHANGE`, `EVENT\n${stringifyEvent(event)}\n\nSELECTION\n${stringifyEvent(document.getSelection())}\n`);
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