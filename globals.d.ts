declare module "tiny-markdown-editor" {
  type CursorPosition = { col: number; row: number; node: string };

  type CommandName =
    | "bold"
    | "italic"
    | "strikethrough"
    | "code"
    | "h1"
    | "h2"
    | "ul"
    | "ol"
    | "blockquote"
    | "hr"
    | "insertLink"
    | "insertImage";

  type ChangeEvent = { content: string; linesDirty: boolean[] };

  type SelectionEvent = {
    focus: CursorPosition;
    anchor: boolean;
    commandState: Record<string | CommandName, boolean>;
  };

  type Listener<T extends "change" | "selection"> = (
    event: T extends "change" ? ChangeEvent : SelectionEvent
  ) => void;

  type EditorParams = { element: string; content?: string; textarea?: string };

  export class Editor {
    constructor(params: EditorParams);

    public getContent(): string;

    public getSelection(anchor: boolean): CursorPosition | null;

    public setSelection(focus: CursorPosition, anchor: boolean): void;

    public paste(text: string, anchor: boolean, focus: CursorPosition): void;

    public wrapSelection(
      pre: string,
      post: string,
      anchor: boolean,
      focus: CursorPosition
    );

    public addEventListener<T extends "change" | "selection">(
      type: T,
      listener: Listener<T>
    ): void;
  }

  type CommandBarParams = {
    element: string;
    editor: Editor;
    commands?: {
      name: CommandName | string;
      title: string;
      innerHTML: string;
      action: (editor: Editor) => void;
      hotkey: `${string}-${string}` | `${string}=${string}-${string}`;
    };
  };
  export class CommandBar {
    constructor(params: CommandBarParams);
  }
}
