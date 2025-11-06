import {
  inlineGrammar,
  lineGrammar,
  punctuationLeading,
  punctuationTrailing,
  htmlescape,
  htmlBlockGrammar,
  commands,
  HTMLBlockRule,
  Command,
  GrammarRule,
  createMergedInlineGrammar,
} from "./grammar";

export interface EditorProps {
  element?: string | HTMLElement;
  editor?: string | HTMLElement;
  content?: string;
  textarea?: string | HTMLTextAreaElement;
  customInlineGrammar?: Record<string, GrammarRule>;
}

export interface Position {
  row: number;
  col: number;
}

export interface HistoryState {
  content: string;
  selection: Position | null;
  anchor: Position | null;
}

export interface ChangeEvent {
  content: string;
  linesDirty: boolean[];
}

export interface SelectionEvent {
  focus: Position;
  anchor: Position;
  commandState: Record<string, boolean | null>;
}

export interface DropEvent {
  dataTransfer: DataTransfer;
}

type EventType = 'change' | 'selection' | 'drop';
type EventHandler<T> = (event: T) => void;

export class Editor {
  public e: HTMLDivElement | null = null;
  public textarea: HTMLTextAreaElement | null = null;
  public lines: string[] = [];
  public lineElements: NodeListOf<ChildNode> | HTMLCollection | ChildNode[] = [];
  public lineTypes: string[] = [];
  public lineCaptures: RegExpExecArray[] = [];
  public lineReplacements: string[] = [];
  public linkLabels: string[] = [];
  public lineDirty: boolean[] = [];
  public lastCommandState: Record<string, boolean | null> | null = null;
  private customInlineGrammar: Record<string, GrammarRule> = {};
  private mergedInlineGrammar: Record<string, GrammarRule> = inlineGrammar;
  private hasFocus: boolean = true;

  public listeners: {
    change: EventHandler<ChangeEvent>[];
    selection: EventHandler<SelectionEvent>[];
    drop: EventHandler<DropEvent>[];
  } = {
    change: [],
    selection: [],
    drop: [],
  };

  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private isRestoringHistory: boolean = false;
  private maxHistory: number = 100;

  constructor(props: EditorProps = {}) {
    this.e = null;
    this.textarea = null;
    this.lines = [];
    this.lineElements = [] as ChildNode[];
    this.lineTypes = [];
    this.lineCaptures = [];
    this.lineReplacements = [];
    this.linkLabels = [];
    this.lineDirty = [];
    this.lastCommandState = null;
    this.hasFocus = true;
    this.customInlineGrammar = props.customInlineGrammar || {};
    this.mergedInlineGrammar = createMergedInlineGrammar(this.customInlineGrammar);

    this.listeners = {
      change: [],
      selection: [],
      drop: [],
    };

    let element: HTMLElement | null = null;
    if (typeof props.element === 'string') {
      element = document.getElementById(props.element);
    } else if (props.element) {
      element = props.element;
    }

    if (typeof props.textarea === 'string') {
      this.textarea = document.getElementById(props.textarea) as HTMLTextAreaElement;
    } else if (props.textarea) {
      this.textarea = props.textarea;
    }

    if (this.textarea) {
      if (!element) element = this.textarea;
    }

    if (!element) {
      element = document.getElementsByTagName("body")[0];
    }
    if (element && element.tagName === "TEXTAREA") {
      this.textarea = element as HTMLTextAreaElement;
      element = this.textarea.parentNode as HTMLElement;
    }

    if (this.textarea) {
      this.textarea.style.display = "none";
    }

    this.undoStack = [];
    this.redoStack = [];
    this.isRestoringHistory = false;
    this.maxHistory = 100;

    this.createEditorElement(element, props);
    this.setContent(
      typeof props.content === "string"
        ? props.content
        : this.textarea
        ? this.textarea.value
        : "# Hello TinyMDE!\nEdit **here**"
    );
    
    this.e!.addEventListener("keydown", (e) => this.handleUndoRedoKey(e));
  }

  get canUndo(): boolean {
    return this.undoStack.length >= 2;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private pushHistory(): void {
    if (this.isRestoringHistory) return;
    this.pushCurrentState();
    this.redoStack = [];
  }

  private pushCurrentState(): void {
    this.undoStack.push({
      content: this.getContent(),
      selection: this.getSelection(),
      anchor: this.getSelection(true),
    });
    if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
  }

  public undo(): void {
    if (this.undoStack.length < 2) return;
    this.isRestoringHistory = true;
    this.pushCurrentState();
    const current = this.undoStack.pop()!;
    this.redoStack.push(current);
    const prev = this.undoStack[this.undoStack.length - 1];
    this.setContent(prev.content);
    if (prev.selection) this.setSelection(prev.selection, prev.anchor);
    this.undoStack.pop();
    this.isRestoringHistory = false;
  }

  public redo(): void {
    if (!this.redoStack.length) return;
    this.isRestoringHistory = true;
    this.pushCurrentState();
    const next = this.redoStack.pop()!;
    this.setContent(next.content);
    if (next.selection) this.setSelection(next.selection, next.anchor);
    this.isRestoringHistory = false;
  }

  private handleUndoRedoKey(e: KeyboardEvent): void {
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const ctrl = isMac ? e.metaKey : e.ctrlKey;
    if (ctrl && !e.altKey) {
      if (e.key === "z" || e.key === "Z") {
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
        e.preventDefault();
      } else if (e.key === "y" || e.key === "Y") {
        this.redo();
        e.preventDefault();
      }
    }
  }

  private createEditorElement(element: HTMLElement, props: EditorProps): void {
    if (props && props.editor !== undefined) {
      if (typeof props.editor === 'string') {
        this.e = document.getElementById(props.editor) as HTMLDivElement;
      } else {
        this.e = props.editor as HTMLDivElement;
      }
    } else {
      this.e = document.createElement("div");
    }

    this.e.classList.add("TinyMDE");
    this.e.contentEditable = "true";
    this.e.style.whiteSpace = "pre-wrap";
    (this.e.style as any).webkitUserModify = "read-write-plaintext-only";

    if (props.editor === undefined) {
      if (
        this.textarea &&
        this.textarea.parentNode === element &&
        this.textarea.nextSibling
      ) {
        element.insertBefore(this.e, this.textarea.nextSibling);
      } else {
        element.appendChild(this.e);
      }
    }

    this.e.addEventListener("input", (e) => this.handleInputEvent(e));
    this.e.addEventListener("beforeinput", (e) => this.handleBeforeInputEvent(e));
    this.e.addEventListener("compositionend", (e) => this.handleInputEvent(e));
    document.addEventListener("selectionchange", (e) => {
      if (this.hasFocus) { this.handleSelectionChangeEvent(e); }
      }
    );
    this.e.addEventListener("blur", () => this.hasFocus = false );
    this.e.addEventListener("focus", () => this.hasFocus = true );
    this.e.addEventListener("paste", (e) => this.handlePaste(e));
    this.e.addEventListener("drop", (e) => this.handleDrop(e));
    this.lineElements = this.e.childNodes;
  }

  public setContent(content: string): void {
    while (this.e!.firstChild) {
      this.e!.removeChild(this.e!.firstChild);
    }
    this.lines = content.split(/(?:\r\n|\r|\n)/);
    this.lineDirty = [];
    for (let lineNum = 0; lineNum < this.lines.length; lineNum++) {
      let le = document.createElement("div");
      this.e!.appendChild(le);
      this.lineDirty.push(true);
    }
    this.lineTypes = new Array(this.lines.length);
    this.updateFormatting();
    this.fireChange();
    if (!this.isRestoringHistory) this.pushHistory();
  }

  public getContent(): string {
    return this.lines.join("\n");
  }

  private updateFormatting(): void {
    this.updateLineTypes();
    this.updateLinkLabels();
    this.applyLineTypes();
  }

  private updateLinkLabels(): void {
    this.linkLabels = [];
    for (let l = 0; l < this.lines.length; l++) {
      if (this.lineTypes[l] === "TMLinkReferenceDefinition") {
        this.linkLabels.push(
          this.lineCaptures[l][
            lineGrammar.TMLinkReferenceDefinition.labelPlaceholder!
          ]
        );
      }
    }
  }

  private replace(replacement: string, capture: RegExpExecArray): string {
    return replacement.replace(/(\${1,2})([0-9])/g, (str, p1, p2) => {
      if (p1 === "$") return htmlescape(capture[parseInt(p2)]);
      else
        return `<span class="TMInlineFormatted">${this.processInlineStyles(
          capture[parseInt(p2)]
        )}</span>`;
    });
  }

  private applyLineTypes(): void {
    for (let lineNum = 0; lineNum < this.lines.length; lineNum++) {
      if (this.lineDirty[lineNum]) {
        let contentHTML = this.replace(
          this.lineReplacements[lineNum],
          this.lineCaptures[lineNum]
        );
        (this.lineElements[lineNum] as HTMLElement).className = this.lineTypes[lineNum];
        (this.lineElements[lineNum] as HTMLElement).removeAttribute("style");
        (this.lineElements[lineNum] as HTMLElement).innerHTML =
          contentHTML === "" ? "<br />" : contentHTML;
      }
      (this.lineElements[lineNum] as HTMLElement).dataset.lineNum = lineNum.toString();
    }
  }

  private updateLineTypes(): void {
    let codeBlockType: string | false = false;
    let codeBlockSeqLength = 0;
    let htmlBlock: HTMLBlockRule | false = false;

    for (let lineNum = 0; lineNum < this.lines.length; lineNum++) {
      let lineType = "TMPara";
      let lineCapture: RegExpExecArray = [this.lines[lineNum]] as RegExpExecArray;
      let lineReplacement = "$$0";

      // Check ongoing code blocks
      if (codeBlockType === "TMCodeFenceBacktickOpen") {
        let capture = lineGrammar.TMCodeFenceBacktickClose.regexp.exec(this.lines[lineNum]);
        if (capture && capture.groups!["seq"].length >= codeBlockSeqLength) {
          lineType = "TMCodeFenceBacktickClose";
          lineReplacement = lineGrammar.TMCodeFenceBacktickClose.replacement;
          lineCapture = capture;
          codeBlockType = false;
        } else {
          lineType = "TMFencedCodeBacktick";
          lineReplacement = '<span class="TMFencedCode">$0<br /></span>';
          lineCapture = [this.lines[lineNum]] as RegExpExecArray;
        }
      } else if (codeBlockType === "TMCodeFenceTildeOpen") {
        let capture = lineGrammar.TMCodeFenceTildeClose.regexp.exec(this.lines[lineNum]);
        if (capture && capture.groups!["seq"].length >= codeBlockSeqLength) {
          lineType = "TMCodeFenceTildeClose";
          lineReplacement = lineGrammar.TMCodeFenceTildeClose.replacement;
          lineCapture = capture;
          codeBlockType = false;
        } else {
          lineType = "TMFencedCodeTilde";
          lineReplacement = '<span class="TMFencedCode">$0<br /></span>';
          lineCapture = [this.lines[lineNum]] as RegExpExecArray;
        }
      }

      // Check HTML block types
      if (lineType === "TMPara" && htmlBlock === false) {
        for (let htmlBlockType of htmlBlockGrammar) {
          if (this.lines[lineNum].match(htmlBlockType.start)) {
            if (
              htmlBlockType.paraInterrupt ||
              lineNum === 0 ||
              !(
                this.lineTypes[lineNum - 1] === "TMPara" ||
                this.lineTypes[lineNum - 1] === "TMUL" ||
                this.lineTypes[lineNum - 1] === "TMOL" ||
                this.lineTypes[lineNum - 1] === "TMBlockquote"
              )
            ) {
              htmlBlock = htmlBlockType;
              break;
            }
          }
        }
      }

      if (htmlBlock !== false) {
        lineType = "TMHTMLBlock";
        lineReplacement = '<span class="TMHTMLContent">$0<br /></span>';
        lineCapture = [this.lines[lineNum]] as RegExpExecArray;

        if (htmlBlock.end) {
          if (this.lines[lineNum].match(htmlBlock.end)) {
            htmlBlock = false;
          }
        } else {
          if (
            lineNum === this.lines.length - 1 ||
            this.lines[lineNum + 1].match(lineGrammar.TMBlankLine.regexp)
          ) {
            htmlBlock = false;
          }
        }
      }

      // Check all regexps if we haven't applied one of the code block types
      if (lineType === "TMPara") {
        for (let type in lineGrammar) {
          if (lineGrammar[type].regexp) {
            let capture = lineGrammar[type].regexp.exec(this.lines[lineNum]);
            if (capture) {
              lineType = type;
              lineReplacement = lineGrammar[type].replacement;
              lineCapture = capture;
              break;
            }
          }
        }
      }

      // If we've opened a code block, remember that
      if (lineType === "TMCodeFenceBacktickOpen" || lineType === "TMCodeFenceTildeOpen") {
        codeBlockType = lineType;
        codeBlockSeqLength = lineCapture.groups!["seq"].length;
      }

      // Link reference definition and indented code can't interrupt a paragraph
      if (
        (lineType === "TMIndentedCode" || lineType === "TMLinkReferenceDefinition") &&
        lineNum > 0 &&
        (this.lineTypes[lineNum - 1] === "TMPara" ||
          this.lineTypes[lineNum - 1] === "TMUL" ||
          this.lineTypes[lineNum - 1] === "TMOL" ||
          this.lineTypes[lineNum - 1] === "TMBlockquote")
      ) {
        lineType = "TMPara";
        lineCapture = [this.lines[lineNum]] as RegExpExecArray;
        lineReplacement = "$$0";
      }

      // Setext H2 markers that can also be interpreted as an empty list item should be regarded as such
      if (lineType === "TMSetextH2Marker") {
        let capture = lineGrammar.TMUL.regexp.exec(this.lines[lineNum]);
        if (capture) {
          lineType = "TMUL";
          lineReplacement = lineGrammar.TMUL.replacement;
          lineCapture = capture;
        }
      }

      // Setext headings are only valid if preceded by a paragraph
      if (lineType === "TMSetextH1Marker" || lineType === "TMSetextH2Marker") {
        if (lineNum === 0 || this.lineTypes[lineNum - 1] !== "TMPara") {
          let capture = lineGrammar.TMHR.regexp.exec(this.lines[lineNum]);
          if (capture) {
            lineType = "TMHR";
            lineCapture = capture;
            lineReplacement = lineGrammar.TMHR.replacement;
          } else {
            lineType = "TMPara";
            lineCapture = [this.lines[lineNum]] as RegExpExecArray;
            lineReplacement = "$$0";
          }
        } else {
          let headingLine = lineNum - 1;
          const headingLineType = lineType === "TMSetextH1Marker" ? "TMSetextH1" : "TMSetextH2";
          do {
            if (this.lineTypes[headingLine] !== headingLineType) {
              this.lineTypes[headingLine] = headingLineType;
              this.lineDirty[headingLine] = true;
            }
            this.lineReplacements[headingLine] = "$$0";
            this.lineCaptures[headingLine] = [this.lines[headingLine]] as RegExpExecArray;
            headingLine--;
          } while (headingLine >= 0 && this.lineTypes[headingLine] === "TMPara");
        }
      }

      if (this.lineTypes[lineNum] !== lineType) {
        this.lineTypes[lineNum] = lineType;
        this.lineDirty[lineNum] = true;
      }
      this.lineReplacements[lineNum] = lineReplacement;
      this.lineCaptures[lineNum] = lineCapture;
    }
  }

  public getSelection(getAnchor: boolean = false): Position | null {
    const selection = window.getSelection();
    let startNode = getAnchor ? selection!.anchorNode : selection!.focusNode;
    if (!startNode) return null;
    let offset = getAnchor ? selection!.anchorOffset : selection!.focusOffset;
    if (startNode === this.e) {
      if (offset < this.lines.length)
        return {
          row: offset,
          col: 0,
        };
      return {
        row: offset - 1,
        col: this.lines[offset - 1].length,
      };
    }

    let col = this.computeColumn(startNode, offset);
    if (col === null) return null;

    let node = startNode;
    while (node.parentElement !== this.e) {
      node = node.parentElement!;
    }

    let row = 0;
    // If the node doesn't have a previous sibling, it must be the first line
    if (node.previousSibling) {
      const currentLineNumData = (node as HTMLElement).dataset?.lineNum;
      const previousLineNumData = (node.previousSibling as HTMLElement).dataset?.lineNum;

      if (currentLineNumData && previousLineNumData) {
        const currentLineNum = parseInt(currentLineNumData);
        const previousLineNum = parseInt(previousLineNumData);
        if (currentLineNum === previousLineNum + 1) {
          row = currentLineNum;
        } else {
          // If the current line is NOT the previous line + 1, then either 
          // the current line got split in two or merged with the previous line
          // Either way, we need to recalculate the row number
          while (node.previousSibling) {
            row++;
            node = node.previousSibling;
          }
        }
      }
    }
    
    return { row: row, col: col };
  }

  public setSelection(focus: Position, anchor: Position | null = null): void {
    if (!focus) return;

    let { node: focusNode, offset: focusOffset } = this.computeNodeAndOffset(
      focus.row,
      focus.col,
      anchor ? anchor.row === focus.row && anchor.col > focus.col : false
    );
    let anchorNode = null,
      anchorOffset = null;
    if (anchor && (anchor.row !== focus.row || anchor.col !== focus.col)) {
      let { node, offset } = this.computeNodeAndOffset(
        anchor.row,
        anchor.col,
        focus.row === anchor.row && focus.col > anchor.col
      );
      anchorNode = node;
      anchorOffset = offset;
    }

    let windowSelection = window.getSelection();
    windowSelection!.setBaseAndExtent(
      focusNode,
      focusOffset,
      anchorNode || focusNode,
      anchorNode ? anchorOffset! : focusOffset
    );
  }

  public paste(text: string, anchor: Position | null = null, focus: Position | null = null): void {
    if (!anchor) anchor = this.getSelection(true);
    if (!focus) focus = this.getSelection(false);
    let beginning: Position, end: Position;
    if (!focus) {
      focus = {
        row: this.lines.length - 1,
        col: this.lines[this.lines.length - 1].length,
      };
    }
    if (!anchor) {
      anchor = focus;
    }
    if (
      anchor.row < focus.row ||
      (anchor.row === focus.row && anchor.col <= focus.col)
    ) {
      beginning = anchor;
      end = focus;
    } else {
      beginning = focus;
      end = anchor;
    }
    let insertedLines = text.split(/(?:\r\n|\r|\n)/);
    let lineBefore = this.lines[beginning.row].substr(0, beginning.col);
    let lineEnd = this.lines[end.row].substr(end.col);
    insertedLines[0] = lineBefore.concat(insertedLines[0]);
    let endColPos = insertedLines[insertedLines.length - 1].length;
    insertedLines[insertedLines.length - 1] = insertedLines[insertedLines.length - 1].concat(lineEnd);
    this.spliceLines(beginning.row, 1 + end.row - beginning.row, insertedLines);
    focus.row = beginning.row + insertedLines.length - 1;
    focus.col = endColPos;
    this.updateFormatting();
    this.setSelection(focus);
    this.fireChange();
  }

  public wrapSelection(pre: string, post: string, focus: Position | null = null, anchor: Position | null = null): void {
    if (!this.isRestoringHistory) this.pushHistory();
    if (!focus) focus = this.getSelection(false);
    if (!anchor) anchor = this.getSelection(true);
    if (!focus || !anchor || focus.row !== anchor.row) return;
    this.lineDirty[focus.row] = true;

    const startCol = focus.col < anchor.col ? focus.col : anchor.col;
    const endCol = focus.col < anchor.col ? anchor.col : focus.col;
    const left = this.lines[focus.row].substr(0, startCol).concat(pre);
    const mid = endCol === startCol ? "" : this.lines[focus.row].substr(startCol, endCol - startCol);
    const right = post.concat(this.lines[focus.row].substr(endCol));
    this.lines[focus.row] = left.concat(mid, right);
    anchor.col = left.length;
    focus.col = anchor.col + mid.length;

    this.updateFormatting();
    this.setSelection(focus, anchor);
  }

  public addEventListener<T extends EventType>(
    type: T,
    listener: T extends 'change' ? EventHandler<ChangeEvent> :
             T extends 'selection' ? EventHandler<SelectionEvent> :
             T extends 'drop' ? EventHandler<DropEvent> : never
  ): void {
    if (type.match(/^(?:change|input)$/i)) {
      this.listeners.change.push(listener as EventHandler<ChangeEvent>);
    }
    if (type.match(/^(?:selection|selectionchange)$/i)) {
      this.listeners.selection.push(listener as EventHandler<SelectionEvent>);
    }
    if (type.match(/^(?:drop)$/i)) {
      this.listeners.drop.push(listener as EventHandler<DropEvent>);
    }
  }

  private fireChange(): void {
    if (!this.textarea && !this.listeners.change.length) return;
    const content = this.getContent();
    if (this.textarea) this.textarea.value = content;
    for (let listener of this.listeners.change) {
      listener({
        content: content,
        linesDirty: [...this.lineDirty],
      });
    }
  }

  /**
   * beforeinput handler, exclusively to handle insertParagraph and
   * insertLineBreak events. These used to be handled in the input event,
   * but that caused issues with Firefox where the input event would be
   * sometimes not be fired for these input types.
   * @param event The input event
   * @returns nothing
   */
  private handleBeforeInputEvent(event: Event): void {
    const beforeInputEvent = event as InputEvent;
    if (
      beforeInputEvent.inputType !== "insertParagraph" &&
      beforeInputEvent.inputType !== "insertLineBreak"
    ) return;
    if (!this.isRestoringHistory) this.pushHistory();
    event.preventDefault();
    this.clearDirtyFlag();

    const focus = this.getSelection();
    const anchor = this.getSelection(true);

    if (!focus || !anchor) return;
    
    // If focus and anchor are in different lines, simply remove everything 
    // after the beginning of the selection and before the end of the selection
    // and remove any lines in between
    if (focus.row !== anchor.row) {
      const beginning = focus.row < anchor.row ? focus : anchor;
      const end = focus.row < anchor.row ? anchor : focus;
      this.lines[beginning.row] = this.lines[beginning.row].substring(0, beginning.col);
      this.lines[end.row] = this.lines[end.row].substring(end.col);
      this.spliceLines(beginning.row + 1, end.row - beginning.row - 1);
      focus.row = beginning.row + 1;
      focus.col = 0;
    } else {
      let continuableType: string | false = false;
      switch (this.lineTypes[focus.row]) {
        case "TMUL":
          continuableType = "TMUL";
          break;
        case "TMOL":
          continuableType = "TMOL";
          break;
        case "TMIndentedCode":
          continuableType = "TMIndentedCode";
          break;
      }
 
      const lineBeforeBreak = this.lines[focus.row].substring(0, focus.col <= anchor.col ? focus.col : anchor.col);
      const lineAfterBreak = this.lines[focus.row].substring(focus.col <= anchor.col ? anchor.col : focus.col);
      this.spliceLines(focus.row, 1, [lineBeforeBreak, lineAfterBreak]);

      focus.row += 1;
      focus.col = 0;

      if (continuableType) {
        let capture = lineGrammar[continuableType].regexp.exec(this.lines[focus.row - 1]);
        if (capture) {
          if (capture[2]) {
            if (continuableType === "TMOL") {
              capture[1] = capture[1].replace(/\d{1,9}/, (result) => {
                return (parseInt(result) + 1).toString();
              });
            }
            this.lines[focus.row] = `${capture[1]}${this.lines[focus.row]}`;
            this.lineDirty[focus.row] = true;
            focus.col = capture[1].length;
          } else {
            this.lines[focus.row - 1] = "";
            this.lineDirty[focus.row - 1] = true;
          }
        }
      }
    }
    this.updateFormatting();
    this.setSelection(focus);

    // Scroll the element containing the selection into view
    if (focus && focus.row < this.lineElements.length) {
      (this.lineElements[focus.row] as HTMLElement).scrollIntoView({
        block: 'nearest',
        inline: 'nearest'
      });
    }

    this.fireChange();
  }

  private handleInputEvent(event: Event): void {
    const inputEvent = event as InputEvent;
    if (inputEvent.inputType === "insertCompositionText") return;
    if (!this.isRestoringHistory) this.pushHistory();

    let focus = this.getSelection();

    if ((inputEvent.inputType === "insertParagraph" || inputEvent.inputType === "insertLineBreak") && focus) {
      // This should never happen since these are handled by the beforeinput handler
      return;
    } else {
      if (!this.e!.firstChild) {
        this.e!.innerHTML = '<div class="TMBlankLine"><br></div>';
      } else {
        this.fixNodeHierarchy();
      }
      this.updateLineContentsAndFormatting();
    }
    if (focus) {
      this.setSelection(focus);
    }

    this.fireChange();
  }

  private handleSelectionChangeEvent(_e: Event): void {
    this.fireSelection();
  }

  private handlePaste(event: ClipboardEvent): void {
    if (!this.isRestoringHistory) this.pushHistory();
    event.preventDefault();

    let text = (event as any).clipboardData.getData("text/plain");
    this.paste(text);
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    this.fireDrop(event.dataTransfer!);
  }

  private processInlineStyles(originalString: string): string {
    let processed = "";
    let stack: Array<{delimiter: string, delimString: string, count: number, output: string}> = [];
    let offset = 0;
    let string = originalString;

    outer: while (string) {
      // Process simple rules (non-delimiter)
      for (let rule of ["escape", "code", "autolink", "html"]) {
        if (this.mergedInlineGrammar[rule]) {
          let cap = this.mergedInlineGrammar[rule].regexp.exec(string);
          if (cap) {
            string = string.substr(cap[0].length);
            offset += cap[0].length;
            processed += this.mergedInlineGrammar[rule].replacement.replace(/\$([1-9])/g, (str, p1) => htmlescape(cap[p1]));
            continue outer;
          }
        }
      }
      
      // Process custom inline grammar rules
      for (let rule in this.customInlineGrammar) {
        if (rule !== "escape" && rule !== "code" && rule !== "autolink" && rule !== "html" && rule !== "linkOpen" && rule !== "imageOpen" && rule !== "linkLabel" && rule !== "default") {
          let cap = this.mergedInlineGrammar[rule].regexp.exec(string);
          if (cap) {
            string = string.substr(cap[0].length);
            offset += cap[0].length;
            processed += this.mergedInlineGrammar[rule].replacement.replace(/\$([1-9])/g, (str, p1) => htmlescape(cap[p1]));
            continue outer;
          }
        }
      }

      // Check for links / images
      let potentialLink = string.match(this.mergedInlineGrammar.linkOpen.regexp);
      let potentialImage = string.match(this.mergedInlineGrammar.imageOpen.regexp);
      if (potentialImage || potentialLink) {
        let result = this.parseLinkOrImage(string, !!potentialImage);
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
        const currentDelimiter = cap[0][0];

        string = string.substr(cap[0].length);

        const preceding = offset > 0 ? originalString.substr(0, offset) : " ";
        const following = offset + cap[0].length < originalString.length ? string : " ";

        const punctuationFollows = following.match(punctuationLeading);
        const punctuationPrecedes = preceding.match(punctuationTrailing);
        const whitespaceFollows = following.match(/^\s/);
        const whitespacePrecedes = preceding.match(/\s$/);

        let canOpen = !whitespaceFollows && (!punctuationFollows || !!whitespacePrecedes || !!punctuationPrecedes);
        let canClose = !whitespacePrecedes && (!punctuationPrecedes || !!whitespaceFollows || !!punctuationFollows);

        if (currentDelimiter === "_" && canOpen && canClose) {
          canOpen = !!punctuationPrecedes;
          canClose = !!punctuationFollows;
        }

        if (canClose) {
          let stackPointer = stack.length - 1;
          while (delimCount && stackPointer >= 0) {
            if (stack[stackPointer].delimiter === currentDelimiter) {
              while (stackPointer < stack.length - 1) {
                const entry = stack.pop()!;
                processed = `${entry.output}${entry.delimString.substr(0, entry.count)}${processed}`;
              }

              if (delimCount >= 2 && stack[stackPointer].count >= 2) {
                processed = `<span class="TMMark">${currentDelimiter}${currentDelimiter}</span><strong class="TMStrong">${processed}</strong><span class="TMMark">${currentDelimiter}${currentDelimiter}</span>`;
                delimCount -= 2;
                stack[stackPointer].count -= 2;
              } else {
                processed = `<span class="TMMark">${currentDelimiter}</span><em class="TMEm">${processed}</em><span class="TMMark">${currentDelimiter}</span>`;
                delimCount -= 1;
                stack[stackPointer].count -= 1;
              }

              if (stack[stackPointer].count === 0) {
                let entry = stack.pop()!;
                processed = `${entry.output}${processed}`;
                stackPointer--;
              }
            } else {
              stackPointer--;
            }
          }
        }

        if (delimCount && canOpen) {
          stack.push({
            delimiter: currentDelimiter,
            delimString: delimString,
            count: delimCount,
            output: processed,
          });
          processed = "";
          delimCount = 0;
        }

        if (delimCount) {
          processed = `${processed}${delimString.substr(0, delimCount)}`;
        }

        offset += cap[0].length;
        continue outer;
      }

      // Check for strikethrough delimiter
      cap = /^~~/.exec(string);
      if (cap) {
        let consumed = false;
        let stackPointer = stack.length - 1;
        while (!consumed && stackPointer >= 0) {
          if (stack[stackPointer].delimiter === "~") {
            while (stackPointer < stack.length - 1) {
              const entry = stack.pop()!;
              processed = `${entry.output}${entry.delimString.substr(0, entry.count)}${processed}`;
            }

            processed = `<span class="TMMark">~~</span><del class="TMStrikethrough">${processed}</del><span class="TMMark">~~</span>`;
            let entry = stack.pop()!;
            processed = `${entry.output}${processed}`;
            consumed = true;
          } else {
            stackPointer--;
          }
        }

        if (!consumed) {
          stack.push({
            delimiter: "~",
            delimString: "~~",
            count: 2,
            output: processed,
          });
          processed = "";
        }

        offset += cap[0].length;
        string = string.substr(cap[0].length);
        continue outer;
      }

      // Process 'default' rule
      cap = this.mergedInlineGrammar.default.regexp.exec(string);
      if (cap) {
        string = string.substr(cap[0].length);
        offset += cap[0].length;
        processed += this.mergedInlineGrammar.default.replacement.replace(/\$([1-9])/g, (str, p1) => htmlescape(cap[p1]));
        continue outer;
      }
      throw "Infinite loop!";
    }

    while (stack.length) {
      const entry = stack.pop()!;
      processed = `${entry.output}${entry.delimString.substr(0, entry.count)}${processed}`;
    }

    return processed;
  }

  private computeColumn(startNode: Node, offset: number): number | null {
    let node = startNode;
    let col: number;
    while (node && node.parentNode !== this.e) {
      node = node.parentNode!;
    }
    if (node === null) return null;

    if (startNode.nodeType === Node.TEXT_NODE || offset === 0) {
      col = offset;
      node = startNode;
    } else if (offset > 0) {
      node = startNode.childNodes[offset - 1];
      col = node.textContent!.length;
    } else {
      col = 0;
      node = startNode;
    }
    while (node.parentNode !== this.e) {
      if (node.previousSibling) {
        node = node.previousSibling;
        col += node.textContent!.length;
      } else {
        node = node.parentNode as unknown as ChildNode;
      }
    }
    return col;
  }

  private computeNodeAndOffset(row: number, col: number, bindRight: boolean = false): {node: Node, offset: number} {
    if (row >= this.lineElements.length) {
      row = this.lineElements.length - 1;
      col = this.lines[row].length;
    }
    if (col > this.lines[row].length) {
      col = this.lines[row].length;
    }
    const parentNode = this.lineElements[row] as HTMLElement;
    let node = parentNode.firstChild;

    let childrenComplete = false;
    let rv = {
      node: parentNode.firstChild ? parentNode.firstChild : parentNode,
      offset: 0,
    };

    while (node !== parentNode) {
      if (!childrenComplete && node!.nodeType === Node.TEXT_NODE) {
        if (node!.nodeValue!.length >= col) {
          if (bindRight && node!.nodeValue!.length === col) {
            rv = { node: node!, offset: col };
            col = 0;
          } else {
            return { node: node!, offset: col };
          }
        } else {
          col -= node!.nodeValue!.length;
        }
      }
      if (!childrenComplete && node!.firstChild) {
        node = node!.firstChild;
      } else if (node!.nextSibling) {
        childrenComplete = false;
        node = node!.nextSibling;
      } else {
        childrenComplete = true;
        node = node!.parentNode as unknown as ChildNode;
      }
    }

    return rv;
  }

  private updateLineContentsAndFormatting(): void {
    this.clearDirtyFlag();
    this.updateLineContents();
    this.updateFormatting();
  }

  private clearDirtyFlag(): void {
    this.lineDirty = new Array(this.lines.length);
    for (let i = 0; i < this.lineDirty.length; i++) {
      this.lineDirty[i] = false;
    }
  }

  private updateLineContents(): void {
    let lineDelta = this.e!.childElementCount - this.lines.length;
    if (lineDelta) {
      let firstChangedLine = 0;
      while (
        firstChangedLine <= this.lines.length &&
        firstChangedLine <= this.lineElements.length &&
        this.lineElements[firstChangedLine] &&
        this.lines[firstChangedLine] === (this.lineElements[firstChangedLine] as HTMLElement).textContent &&
        this.lineTypes[firstChangedLine] === (this.lineElements[firstChangedLine] as HTMLElement).className
      ) {
        firstChangedLine++;
      }

      let lastChangedLine = -1;
      while (
        -lastChangedLine < this.lines.length &&
        -lastChangedLine < this.lineElements.length &&
        this.lines[this.lines.length + lastChangedLine] ===
          (this.lineElements[this.lineElements.length + lastChangedLine] as HTMLElement).textContent &&
        this.lineTypes[this.lines.length + lastChangedLine] ===
          (this.lineElements[this.lineElements.length + lastChangedLine] as HTMLElement).className
      ) {
        lastChangedLine--;
      }

      let linesToDelete = this.lines.length + lastChangedLine + 1 - firstChangedLine;
      if (linesToDelete < -lineDelta) linesToDelete = -lineDelta;
      if (linesToDelete < 0) linesToDelete = 0;

      let linesToAdd = [];
      for (let l = 0; l < linesToDelete + lineDelta; l++) {
        linesToAdd.push((this.lineElements[firstChangedLine + l] as HTMLElement).textContent || "");
      }
      this.spliceLines(firstChangedLine, linesToDelete, linesToAdd, false);
    } else {
      for (let line = 0; line < this.lineElements.length; line++) {
        let e = this.lineElements[line] as HTMLElement;
        let ct = e.textContent || "";
        if (this.lines[line] !== ct || this.lineTypes[line] !== e.className) {
          this.lines[line] = ct;
          this.lineTypes[line] = e.className;
          this.lineDirty[line] = true;
        }
      }
    }
  }

  private spliceLines(
    startLine: number,
    linesToDelete: number = 0,
    linesToInsert: string[] = [],
    adjustLineElements: boolean = true
  ): void {
    if (adjustLineElements) {
      for (let i = 0; i < linesToDelete; i++) {
        this.e!.removeChild(this.e!.childNodes[startLine]);
      }
    }

    let insertedBlank = [];
    let insertedDirty = [];

    for (let i = 0; i < linesToInsert.length; i++) {
      insertedBlank.push("");
      insertedDirty.push(true);
      if (adjustLineElements) {
        if (this.e!.childNodes[startLine])
          this.e!.insertBefore(document.createElement("div"), this.e!.childNodes[startLine]);
        else this.e!.appendChild(document.createElement("div"));
      }
    }

    this.lines.splice(startLine, linesToDelete, ...linesToInsert);
    this.lineTypes.splice(startLine, linesToDelete, ...insertedBlank);
    this.lineDirty.splice(startLine, linesToDelete, ...insertedDirty);
  }

  private fixNodeHierarchy(): void {
    const originalChildren = Array.from(this.e!.childNodes);

    const replaceChild = (child: Node, ...newChildren: Node[]) => {
      const parent = child.parentElement!;
      const nextSibling = child.nextSibling;
      parent.removeChild(child);
      newChildren.forEach((newChild) =>
        nextSibling ? parent.insertBefore(newChild, nextSibling) : parent.appendChild(newChild)
      );
    };

    originalChildren.forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE || (child as HTMLElement).tagName !== "DIV") {
        const divWrapper = document.createElement("div");
        replaceChild(child, divWrapper);
        divWrapper.appendChild(child);
      } else if (child.childNodes.length === 0) {
        child.appendChild(document.createElement("br"));
      } else {
        const grandChildren = Array.from(child.childNodes);
        if (
          grandChildren.some(
            (grandChild) =>
              grandChild.nodeType === Node.ELEMENT_NODE && (grandChild as HTMLElement).tagName === "DIV"
          )
        ) {
          return replaceChild(child, ...grandChildren);
        }
      }
    });
  }

  private parseLinkOrImage(originalString: string, isImage: boolean): {output: string, charCount: number} | false {
    // Skip the opening bracket
    let textOffset = isImage ? 2 : 1;
    let opener = originalString.substr(0, textOffset);
    let type = isImage ? "TMImage" : "TMLink";
    let currentOffset = textOffset;

    let bracketLevel = 1;
    let linkText: string | false = false;
    let linkRef: string | false = false;
    let linkLabel: string[] = [];
    let linkDetails: string[] = [];

    textOuter: while (
      currentOffset < originalString.length &&
      linkText === false
    ) {
      let string = originalString.substr(currentOffset);

      // Capture any escapes and code blocks at current position
      for (let rule of ["escape", "code", "autolink", "html"]) {
        let cap = this.mergedInlineGrammar[rule].regexp.exec(string);
        if (cap) {
          currentOffset += cap[0].length;
          continue textOuter;
        }
      }

      // Check for image
      if (string.match(this.mergedInlineGrammar.imageOpen.regexp)) {
        bracketLevel++;
        currentOffset += 2;
        continue textOuter;
      }

      // Check for link
      if (string.match(this.mergedInlineGrammar.linkOpen.regexp)) {
        bracketLevel++;
        if (!isImage) {
          if (this.parseLinkOrImage(string, false)) {
            return false;
          }
        }
        currentOffset += 1;
        continue textOuter;
      }

      // Check for closing bracket
      if (string.match(/^\]/)) {
        bracketLevel--;
        if (bracketLevel === 0) {
          linkText = originalString.substr(textOffset, currentOffset - textOffset);
          currentOffset++;
          continue textOuter;
        }
      }

      // Nothing matches, proceed to next char
      currentOffset++;
    }

    // Did we find a link text?
    if (linkText === false) return false;

    // Check what type of link this is
    let nextChar = currentOffset < originalString.length ? originalString.substr(currentOffset, 1) : "";

    // REFERENCE LINKS
    if (nextChar === "[") {
      let string = originalString.substr(currentOffset);
      let cap = this.mergedInlineGrammar.linkLabel.regexp.exec(string);
      if (cap) {
        currentOffset += cap[0].length;
        linkLabel.push(cap[1], cap[2], cap[3]);
        if (cap[this.mergedInlineGrammar.linkLabel.labelPlaceholder!]) {
          linkRef = cap[this.mergedInlineGrammar.linkLabel.labelPlaceholder!];
        } else {
          linkRef = linkText.trim();
        }
      } else {
        return false;
      }
    } else if (nextChar !== "(") {
      // Shortcut ref link
      linkRef = linkText.trim();
    } else {
      // INLINE LINKS
      currentOffset++;
      let parenthesisLevel = 1;

      inlineOuter: while (currentOffset < originalString.length && parenthesisLevel > 0) {
        let string = originalString.substr(currentOffset);

        // Process whitespace
        let cap = /^\s+/.exec(string);
        if (cap) {
          switch (linkDetails.length) {
            case 0:
              linkDetails.push(cap[0]);
              break;
            case 1:
              linkDetails.push(cap[0]);
              break;
            case 2:
              if (linkDetails[0].match(/</)) {
                linkDetails[1] = linkDetails[1].concat(cap[0]);
              } else {
                if (parenthesisLevel !== 1) return false;
                linkDetails.push("");
                linkDetails.push(cap[0]);
              }
              break;
            case 3:
              linkDetails.push(cap[0]);
              break;
            case 4:
              return false;
            case 5:
              linkDetails.push("");
            case 6:
              linkDetails[5] = linkDetails[5].concat(cap[0]);
              break;
            case 7:
              linkDetails[6] = linkDetails[6].concat(cap[0]);
              break;
            default:
              return false;
          }
          currentOffset += cap[0].length;
          continue inlineOuter;
        }

        // Process backslash escapes
        cap = this.mergedInlineGrammar.escape.regexp.exec(string);
        if (cap) {
          switch (linkDetails.length) {
            case 0:
              linkDetails.push("");
            case 1:
              linkDetails.push(cap[0]);
              break;
            case 2:
              linkDetails[1] = linkDetails[1].concat(cap[0]);
              break;
            case 3:
              return false;
            case 4:
              return false;
            case 5:
              linkDetails.push("");
            case 6:
              linkDetails[5] = linkDetails[5].concat(cap[0]);
              break;
            default:
              return false;
          }
          currentOffset += cap[0].length;
          continue inlineOuter;
        }

        // Process opening angle bracket
        if (linkDetails.length < 2 && string.match(/^</)) {
          if (linkDetails.length === 0) linkDetails.push("");
          linkDetails[0] = linkDetails[0].concat("<");
          currentOffset++;
          continue inlineOuter;
        }

        // Process closing angle bracket
        if ((linkDetails.length === 1 || linkDetails.length === 2) && string.match(/^>/)) {
          if (linkDetails.length === 1) linkDetails.push("");
          linkDetails.push(">");
          currentOffset++;
          continue inlineOuter;
        }

        // Process non-parenthesis delimiter for title
        cap = /^["']/.exec(string);
        if (cap && (linkDetails.length === 0 || linkDetails.length === 1 || linkDetails.length === 4)) {
          while (linkDetails.length < 4) linkDetails.push("");
          linkDetails.push(cap[0]);
          currentOffset++;
          continue inlineOuter;
        }

        if (cap && (linkDetails.length === 5 || linkDetails.length === 6) && linkDetails[4] === cap[0]) {
          if (linkDetails.length === 5) linkDetails.push("");
          linkDetails.push(cap[0]);
          currentOffset++;
          continue inlineOuter;
        }

        // Process opening parenthesis
        if (string.match(/^\(/)) {
          switch (linkDetails.length) {
            case 0:
              linkDetails.push("");
            case 1:
              linkDetails.push("");
            case 2:
              linkDetails[1] = linkDetails[1].concat("(");
              if (!linkDetails[0].match(/<$/)) parenthesisLevel++;
              break;
            case 3:
              linkDetails.push("");
            case 4:
              linkDetails.push("(");
              break;
            case 5:
              linkDetails.push("");
            case 6:
              if (linkDetails[4] === "(") return false;
              linkDetails[5] = linkDetails[5].concat("(");
              break;
            default:
              return false;
          }
          currentOffset++;
          continue inlineOuter;
        }

        // Process closing parenthesis
        if (string.match(/^\)/)) {
          if (linkDetails.length <= 2) {
            while (linkDetails.length < 2) linkDetails.push("");
            if (!linkDetails[0].match(/<$/)) parenthesisLevel--;
            if (parenthesisLevel > 0) {
              linkDetails[1] = linkDetails[1].concat(")");
            }
          } else if (linkDetails.length === 5 || linkDetails.length === 6) {
            if (linkDetails[4] === "(") {
              if (linkDetails.length === 5) linkDetails.push("");
              linkDetails.push(")");
            } else {
              if (linkDetails.length === 5) linkDetails.push(")");
              else linkDetails[5] = linkDetails[5].concat(")");
            }
          } else {
            parenthesisLevel--;
          }

          if (parenthesisLevel === 0) {
            while (linkDetails.length < 7) linkDetails.push("");
          }

          currentOffset++;
          continue inlineOuter;
        }

        // Any old character
        cap = /^./.exec(string);
        if (cap) {
          switch (linkDetails.length) {
            case 0:
              linkDetails.push("");
            case 1:
              linkDetails.push(cap[0]);
              break;
            case 2:
              linkDetails[1] = linkDetails[1].concat(cap[0]);
              break;
            case 3:
              return false;
            case 4:
              return false;
            case 5:
              linkDetails.push("");
            case 6:
              linkDetails[5] = linkDetails[5].concat(cap[0]);
              break;
            default:
              return false;
          }
          currentOffset += cap[0].length;
          continue inlineOuter;
        }
        throw "Infinite loop";
      }
      if (parenthesisLevel > 0) return false;
    }

    if (linkRef !== false) {
      // Reference link; check that linkRef is valid
      let valid = false;
      for (let label of this.linkLabels) {
        if (label === linkRef) {
          valid = true;
          break;
        }
      }
      let labelClass = valid ? "TMLinkLabel TMLinkLabel_Valid" : "TMLinkLabel TMLinkLabel_Invalid";
      let output = `<span class="TMMark TMMark_${type}">${opener}</span><span class="${type} ${
        linkLabel.length < 3 || !linkLabel[1] ? labelClass : ""
      }">${this.processInlineStyles(linkText)}</span><span class="TMMark TMMark_${type}">]</span>`;

      if (linkLabel.length >= 3) {
        output = output.concat(
          `<span class="TMMark TMMark_${type}">${linkLabel[0]}</span>`,
          `<span class="${labelClass}">${linkLabel[1]}</span>`,
          `<span class="TMMark TMMark_${type}">${linkLabel[2]}</span>`
        );
      }
      return {
        output: output,
        charCount: currentOffset,
      };
    } else if (linkDetails.length > 0) {
      // Inline link
      while (linkDetails.length < 7) {
        linkDetails.push("");
      }

      return {
        output: `<span class="TMMark TMMark_${type}">${opener}</span><span class="${type}">${this.processInlineStyles(
          linkText
        )}</span><span class="TMMark TMMark_${type}">](${
          linkDetails[0]
        }</span><span class="${type}Destination">${
          linkDetails[1]
        }</span><span class="TMMark TMMark_${type}">${linkDetails[2]}${
          linkDetails[3]
        }${linkDetails[4]}</span><span class="${type}Title">${
          linkDetails[5]
        }</span><span class="TMMark TMMark_${type}">${linkDetails[6]})</span>`,
        charCount: currentOffset,
      };
    }

    return false;
  }

  private computeCommonAncestor(node1: Node | null, node2: Node | null): Node | null {
    if (!node1 || !node2) return null;
    if (node1 === node2) return node1;
    const ancestry = (node: Node) => {
      let ancestry = [];
      while (node) {
        ancestry.unshift(node);
        node = node.parentNode!;
      }
      return ancestry;
    };

    const ancestry1 = ancestry(node1);
    const ancestry2 = ancestry(node2);

    if (ancestry1[0] !== ancestry2[0]) return null;
    let i;
    for (i = 0; ancestry1[i] === ancestry2[i]; i++);
    return ancestry1[i - 1];
  }

  private computeEnclosingMarkupNode(focus: Position, anchor: Position | null, className: string): Node | null {
    let node = null;
    if (!focus) return null;
    if (!anchor) {
      const sel = window.getSelection();
      if (!sel || !sel.focusNode) return null;
      node = sel.focusNode;
    } else {
      if (focus.row !== anchor.row) return null;
      const sel = window.getSelection();
      if (!sel) return null;
      node = this.computeCommonAncestor(sel.focusNode, sel.anchorNode);
    }
    if (!node) return null;
    while (node !== this.e) {
      if ((node as HTMLElement).className && (node as HTMLElement).className.includes(className)) return node;
      node = node.parentNode!;
    }
    return null;
  }

  public getCommandState(focus: Position | null = null, anchor: Position | null = null): Record<string, boolean | null> {
    let commandState: Record<string, boolean | null> = {};
    if (!focus) focus = this.getSelection(false);
    if (!anchor) anchor = this.getSelection(true);
    if (!focus) {
      for (let cmd in commands) {
        commandState[cmd] = null;
      }
      return commandState;
    }
    if (!anchor) anchor = focus;

    let start: Position, end: Position;
    if (anchor.row < focus.row || (anchor.row === focus.row && anchor.col < focus.col)) {
      start = anchor;
      end = focus;
    } else {
      start = focus;
      end = anchor;
    }
    if (end.row > start.row && end.col === 0) {
      end.row--;
      end.col = this.lines[end.row].length;
    }

    for (let cmd in commands) {
      if (commands[cmd].type === "inline") {
        if (!focus || focus.row !== anchor!.row || !this.isInlineFormattingAllowed()) {
          commandState[cmd] = null;
        } else {
          commandState[cmd] =
            !!this.computeEnclosingMarkupNode(focus, anchor, commands[cmd].className) ||
            (focus.col === anchor!.col &&
              !!this.lines[focus.row].substr(0, focus.col).match(commands[cmd].unset.prePattern) &&
              !!this.lines[focus.row].substr(focus.col).match(commands[cmd].unset.postPattern));
        }
      }
      if (commands[cmd].type === "line") {
        if (!focus) {
          commandState[cmd] = null;
        } else {
          let state: boolean | null = this.lineTypes[start.row] === commands[cmd].className;
          for (let line = start.row; line <= end.row; line++) {
            if ((this.lineTypes[line] === commands[cmd].className) !== state) {
              state = null;
              break;
            }
          }
          commandState[cmd] = state;
        }
      }
    }
    return commandState;
  }

  public setCommandState(command: string, state: boolean): void {
    if (!this.isRestoringHistory) this.pushHistory();
    if (commands[command].type === "inline") {
      let anchor = this.getSelection(true);
      let focus = this.getSelection(false);
      if (!anchor) anchor = focus;
      if (!anchor) return;
      if (anchor.row !== focus!.row) return;
      if (!this.isInlineFormattingAllowed()) return;
      let markupNode = this.computeEnclosingMarkupNode(focus!, anchor, commands[command].className);
      this.clearDirtyFlag();

      if (markupNode) {
        this.lineDirty[focus!.row] = true;
        const startCol = this.computeColumn(markupNode, 0)!;
        const len = markupNode.textContent!.length;
        const left = this.lines[focus!.row]
          .substr(0, startCol)
          .replace(commands[command].unset.prePattern, "");
        const mid = this.lines[focus!.row].substr(startCol, len);
        const right = this.lines[focus!.row]
          .substr(startCol + len)
          .replace(commands[command].unset.postPattern, "");
        this.lines[focus!.row] = left.concat(mid, right);
        anchor.col = left.length;
        focus!.col = anchor.col + len;
        this.updateFormatting();
        this.setSelection(focus!, anchor);
        this.fireChange();
      } else if (
        focus!.col === anchor.col &&
        !!this.lines[focus!.row].substr(0, focus!.col).match(commands[command].unset.prePattern) &&
        !!this.lines[focus!.row].substr(focus!.col).match(commands[command].unset.postPattern)
      ) {
        this.lineDirty[focus!.row] = true;
        const left = this.lines[focus!.row]
          .substr(0, focus!.col)
          .replace(commands[command].unset.prePattern, "");
        const right = this.lines[focus!.row]
          .substr(focus!.col)
          .replace(commands[command].unset.postPattern, "");
        this.lines[focus!.row] = left.concat(right);
        focus!.col = anchor.col = left.length;
        this.updateFormatting();
        this.setSelection(focus!, anchor);
        this.fireChange();
      } else {
        let { startCol, endCol } =
          focus!.col < anchor.col
            ? { startCol: focus!.col, endCol: anchor.col }
            : { startCol: anchor.col, endCol: focus!.col };

        let match = this.lines[focus!.row]
          .substr(startCol, endCol - startCol)
          .match(/^(?<leading>\s*).*\S(?<trailing>\s*)$/);
        if (match) {
          startCol += match.groups!.leading.length;
          endCol -= match.groups!.trailing.length;
        }

        focus!.col = startCol;
        anchor.col = endCol;

        this.wrapSelection(commands[command].set.pre, commands[command].set.post, focus, anchor);
        this.fireChange();
      }
    } else if (commands[command].type === "line") {
      let anchor = this.getSelection(true);
      let focus = this.getSelection(false);
      if (!anchor) anchor = focus;
      if (!focus) return;
      this.clearDirtyFlag();
      let start = anchor!.row > focus!.row ? focus! : anchor!;
      let end = anchor!.row > focus!.row ? anchor! : focus!;
      if (end.row > start.row && end.col === 0) {
        end.row--;
      }

      for (let line = start.row; line <= end.row; line++) {
        if (state && this.lineTypes[line] !== commands[command].className) {
          this.lines[line] = this.lines[line].replace(
            commands[command].set.pattern,
            commands[command].set.replacement.replace("$#", (line - start.row + 1).toString())
          );
          this.lineDirty[line] = true;
        }
        if (!state && this.lineTypes[line] === commands[command].className) {
          this.lines[line] = this.lines[line].replace(
            commands[command].unset.pattern,
            commands[command].unset.replacement
          );
          this.lineDirty[line] = true;
        }
      }
      this.updateFormatting();
      this.setSelection(
        { row: end.row, col: this.lines[end.row].length },
        { row: start.row, col: 0 }
      );
      this.fireChange();
    }
  }

  private isInlineFormattingAllowed(): boolean {
    const sel = window.getSelection();
    if (!sel || !sel.focusNode || !sel.anchorNode) return false;

    if (
      sel.isCollapsed &&
      sel.focusNode.nodeType === 3 &&
      sel.focusOffset === sel.focusNode.nodeValue!.length
    ) {
      let node;
      for (node = sel.focusNode; node && node.nextSibling === null; node = node.parentNode!);
      if (
        node &&
        node.nextSibling &&
        (node.nextSibling as HTMLElement).className &&
        (node.nextSibling as HTMLElement).className.includes("TMInlineFormatted")
      )
        return true;
    }

    let ancestor = this.computeCommonAncestor(sel.focusNode, sel.anchorNode);
    if (!ancestor) return false;

    while (ancestor && ancestor !== this.e) {
      if (
        (ancestor as HTMLElement).className &&
        typeof (ancestor as HTMLElement).className.includes === "function" &&
        ((ancestor as HTMLElement).className.includes("TMInlineFormatted") ||
          (ancestor as HTMLElement).className.includes("TMBlankLine"))
      )
        return true;
      ancestor = ancestor.parentNode!;
    }

    return false;
  }

  public toggleCommandState(command: string): void {
    if (!this.lastCommandState) this.lastCommandState = this.getCommandState();
    this.setCommandState(command, !this.lastCommandState[command]);
  }

  private fireDrop(dataTransfer: DataTransfer): void {
    for (let listener of this.listeners.drop) {
      listener({ dataTransfer });
    }
  }

  private fireSelection(): void {
    if (this.listeners.selection && this.listeners.selection.length) {
      let focus = this.getSelection(false);
      let anchor = this.getSelection(true);
      let commandState = this.getCommandState(focus, anchor);
      if (this.lastCommandState) {
        Object.assign(this.lastCommandState, commandState);
      } else {
        this.lastCommandState = Object.assign({}, commandState);
      }
      for (let listener of this.listeners.selection) {
        listener({
          focus: focus!,
          anchor: anchor!,
          commandState: this.lastCommandState,
        });
      }
    }
  }
}

export default Editor;
