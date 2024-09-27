declare module "tiny-markdown-editor" {
  type CursorPosition = {
    col: number;
    row: number;
    node?: HTMLElement;
  };

  type CommonCommandName =
    | "bold"
    | "italic"
    | "strikethrough"
    | "code"
    | "h1"
    | "h2"
    | "ul"
    | "ol"
    | "blockquote";

  type CommandBarCommandName =
    | CommonCommandName
    | "hr"
    | "insertLink"
    | "insertImage";

  type EditorCommandName = CommonCommandName | "h3" | "h4" | "h5" | "h6";

  type ChangeEvent = {
    content: string;
    linesDirty: boolean[];
  };

  type SelectionEvent = {
    focus: CursorPosition;
    anchor: CursorPosition;
    commandState: Record<EditorCommandName, boolean>;
  };

  type Listener<T extends "change" | "selection"> = (
    event: T extends "change" ? ChangeEvent : SelectionEvent
  ) => void;

  type EditorParams = {
    element?: string | HTMLElement;
    content?: string;
    textarea?: string | HTMLElement;
  };

  export class Editor {
    constructor(params: EditorParams?);

    public getContent(): string;

    public setContent(content: string): void;

    public getSelection(getAnchor: boolean): CursorPosition | null;

    public setSelection(
      focus: CursorPosition,
      anchor?: CursorPosition | null
    ): void;

    public paste(
      text: string,
      anchor: CursorPosition,
      focus: CursorPosition
    ): void;

    public wrapSelection(
      pre: string,
      post: string,
      anchor?: CursorPosition | null,
      focus?: CursorPosition | null
    ): void;

    public addEventListener<T extends "change" | "selection">(
      type: T,
      listener: Listener<T>
    ): void;
  }

  type ModifierKey =
    | "Ctrl"
    | "Cmd"
    | "Alt"
    | "Option"
    | "Win"
    | "Shift"
    | "Mod"
    | "Mod2";
  type AlphanumericKey =
    | "A"
    | "B"
    | "C"
    | "D"
    | "E"
    | "F"
    | "G"
    | "H"
    | "I"
    | "J"
    | "K"
    | "L"
    | "M"
    | "N"
    | "O"
    | "P"
    | "Q"
    | "R"
    | "S"
    | "T"
    | "U"
    | "V"
    | "W"
    | "X"
    | "Y"
    | "Z"
    | "a"
    | "b"
    | "c"
    | "d"
    | "e"
    | "f"
    | "g"
    | "h"
    | "i"
    | "j"
    | "k"
    | "l"
    | "m"
    | "n"
    | "o"
    | "p"
    | "q"
    | "r"
    | "s"
    | "t"
    | "u"
    | "v"
    | "w"
    | "x"
    | "y"
    | "z"
    | "0"
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9";
  type HotKey = AlphanumericKey | `${ModifierKey}-${HotKey}`;

  type CommandBarCommand =
    | CommandBarCommandName
    | "|"
    | {
        name: CommandBarCommandName | string;
        title?: string | undefined;
        innerHTML?: string;
        action?: EditorCommandName | ((editor: Editor) => void);
        hotkey?: HotKey;
      };

  type CommandBarParams = {
    element?: string | HTMLElement;
    editor: Editor;
    commands?: CommandBarCommand[];
  };
  export class CommandBar {
    constructor(params: CommandBarParams);
  }
}
