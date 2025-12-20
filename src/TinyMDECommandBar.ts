import svg from "./svg/svg";
import { Editor, Position, SelectionEvent } from "./TinyMDE";

const isMacLike = /(Mac|iPhone|iPod|iPad)/i.test(
  typeof navigator !== "undefined" ? navigator.platform : ""
);

export interface CommandAction {
  (editor: Editor): void;
}

export interface CommandEnabled {
  (editor: Editor, focus?: Position, anchor?: Position): boolean | null;
}

export interface CommandDefinition {
  name: string;
  action: string | CommandAction;
  innerHTML: string;
  title: string;
  hotkey?: string;
  enabled?: CommandEnabled;
}

export interface CommandBarProps {
  element?: string | HTMLElement;
  editor?: Editor;
  commands?: (string | CommandDefinition)[];
}

interface Hotkey {
  modifiers: string[];
  command: string;
  key?: string;
  code?: string;
}

const DefaultCommands: Record<string, CommandDefinition> = {
  bold: {
    name: "bold",
    action: "bold",
    innerHTML: svg.bold,
    title: "Bold",
    hotkey: "Mod-B",
  },
  italic: {
    name: "italic",
    action: "italic",
    innerHTML: svg.italic,
    title: "Italic",
    hotkey: "Mod-I",
  },
  strikethrough: {
    name: "strikethrough",
    action: "strikethrough",
    innerHTML: svg.strikethrough,
    title: "Strikethrough",
    hotkey: "Mod2-Shift-5",
  },
  code: {
    name: "code",
    action: "code",
    innerHTML: svg.code,
    title: "Format as code",
  },
  h1: {
    name: "h1",
    action: "h1",
    innerHTML: svg.h1,
    title: "Level 1 heading",
    hotkey: "Mod-Shift-1",
  },
  h2: {
    name: "h2",
    action: "h2",
    innerHTML: svg.h2,
    title: "Level 2 heading",
    hotkey: "Mod-Shift-2",
  },
  ul: {
    name: "ul",
    action: "ul",
    innerHTML: svg.ul,
    title: "Bulleted list",
  },
  ol: {
    name: "ol",
    action: "ol",
    innerHTML: svg.ol,
    title: "Numbered list",
  },
  blockquote: {
    name: "blockquote",
    action: "blockquote",
    innerHTML: svg.blockquote,
    title: "Quote",
    hotkey: "Mod2-Shift-Q",
  },
  insertLink: {
    name: "insertLink",
    action: (editor: Editor) => {
      if (editor.isInlineFormattingAllowed()) editor.wrapSelection("[", "]()");
    },
    enabled: (editor: Editor) =>
      editor.isInlineFormattingAllowed() ? false : null,
    innerHTML: svg.link,
    title: "Insert link",
    hotkey: "Mod-K",
  },
  insertImage: {
    name: "insertImage",
    action: (editor: Editor) => {
      if (editor.isInlineFormattingAllowed()) editor.wrapSelection("![", "]()");
    },
    enabled: (editor: Editor) =>
      editor.isInlineFormattingAllowed() ? false : null,
    innerHTML: svg.image,
    title: "Insert image",
    hotkey: "Mod2-Shift-I",
  },
  hr: {
    name: "hr",
    action: (editor: Editor) => editor.paste("\n***\n"),
    enabled: () => false,
    innerHTML: svg.hr,
    title: "Insert horizontal line",
    hotkey: "Mod2-Shift-L",
  },
  undo: {
    name: "undo",
    action: (editor: Editor) => editor.undo(),
    enabled: (editor: Editor) => (editor.canUndo ? false : null),
    innerHTML: svg.undo,
    title: "Undo",
  },
  redo: {
    name: "redo",
    action: (editor: Editor) => editor.redo(),
    enabled: (editor: Editor) => (editor.canRedo ? false : null),
    innerHTML: svg.redo,
    title: "Redo",
  },
};

export class CommandBar {
  public e: HTMLDivElement | null = null;
  public editor: Editor | null = null;
  public commands: Record<string, CommandDefinition> = {};
  public buttons: Record<string, HTMLDivElement> = {};
  public state: Record<string, boolean | null> = {};
  private hotkeys: Hotkey[] = [];

  constructor(props: CommandBarProps) {
    this.e = null;
    this.editor = null;
    this.commands = {};
    this.buttons = {};
    this.state = {};
    this.hotkeys = [];

    let element: HTMLElement | null = null;
    if (typeof props.element === 'string') {
      element = document.getElementById(props.element);
    } else if (props.element) {
      element = props.element;
    }
    
    if (!element) {
      element = document.body;
    }

    this.createCommandBarElement(
      element,
      props.commands || [
        "bold",
        "italic",
        "strikethrough",
        "|",
        "code",
        "|",
        "h1",
        "h2",
        "|",
        "ul",
        "ol",
        "|",
        "blockquote",
        "hr",
        "|",
        "undo",
        "redo",
        "|",
        "insertLink",
        "insertImage",
      ]
    );
    document.addEventListener("keydown", (e) => this.handleKeydown(e));
    if (props.editor) this.setEditor(props.editor);
  }

  private createCommandBarElement(parentElement: HTMLElement, commands: (string | CommandDefinition)[]): void {
    this.e = document.createElement("div");
    this.e.className = "TMCommandBar";

    for (let command of commands) {
      if (command === "|") {
        let el = document.createElement("div");
        el.className = "TMCommandDivider";
        this.e.appendChild(el);
      } else {
        let commandName: string;
        if (typeof command === "string") {
          if (DefaultCommands[command]) {
            commandName = command;
            this.commands[commandName] = DefaultCommands[commandName];
          } else {
            continue;
          }
        } else if (typeof command === "object" && command.name) {
          commandName = command.name;
          this.commands[commandName] = {} as CommandDefinition;
          if (DefaultCommands[commandName]) {
            Object.assign(this.commands[commandName], DefaultCommands[commandName]);
          }
          Object.assign(this.commands[commandName], command);
        } else {
          continue;
        }

        let title = this.commands[commandName].title || commandName;

        if (this.commands[commandName].hotkey) {
          const keys = this.commands[commandName].hotkey!.split("-");
          let modifiers: string[] = [];
          let modifierexplanation: string[] = [];
          
          for (let i = 0; i < keys.length - 1; i++) {
            switch (keys[i]) {
              case "Ctrl":
                modifiers.push("ctrlKey");
                modifierexplanation.push("Ctrl");
                break;
              case "Cmd":
                modifiers.push("metaKey");
                modifierexplanation.push("⌘");
                break;
              case "Alt":
                modifiers.push("altKey");
                modifierexplanation.push("Alt");
                break;
              case "Option":
                modifiers.push("altKey");
                modifierexplanation.push("⌥");
                break;
              case "Win":
                modifiers.push("metaKey");
                modifierexplanation.push("⊞ Win");
                break;
              case "Shift":
                modifiers.push("shiftKey");
                modifierexplanation.push("⇧");
                break;
              case "Mod":
                if (isMacLike) {
                  modifiers.push("metaKey");
                  modifierexplanation.push("⌘");
                } else {
                  modifiers.push("ctrlKey");
                  modifierexplanation.push("Ctrl");
                }
                break;
              case "Mod2":
                modifiers.push("altKey");
                if (isMacLike) modifierexplanation.push("⌥");
                else modifierexplanation.push("Alt");
                break;
            }
          }
          
          modifierexplanation.push(keys[keys.length - 1]);
          let hotkey: Hotkey = {
            modifiers: modifiers,
            command: commandName,
          };
          
          const lastKey = keys[keys.length - 1];
          if (lastKey.match(/^[0-9]$/)) {
            hotkey.code = `Digit${lastKey}`;
          } else if (lastKey.match(/^[a-zA-Z]$/)) {
            hotkey.code = `Key${lastKey.toUpperCase()}`;
          } else {
            hotkey.key = lastKey.toLowerCase();
          }
          this.hotkeys.push(hotkey);
          title = title.concat(` (${modifierexplanation.join("+")})`);
        }

        this.buttons[commandName] = document.createElement("div");
        this.buttons[commandName].className = "TMCommandButton TMCommandButton_Disabled";
        this.buttons[commandName].title = title;
        this.buttons[commandName].innerHTML = this.commands[commandName].innerHTML;

        this.buttons[commandName].addEventListener("mousedown", (e) =>
          this.handleClick(commandName, e)
        );
        this.e.appendChild(this.buttons[commandName]);
      }
    }
    parentElement.appendChild(this.e);
  }

  private handleClick(commandName: string, event: Event): void {
    if (!this.editor) return;
    event.preventDefault();

    // Focus the editor if it's not already focused
    if (this.editor.e) {
      const editorHadFocus = this.editor.e.contains(document.activeElement);
      this.editor.e.focus();
      // Only restore the last selection if the editor was not focused before
      if (!editorHadFocus) {
        this.editor.restoreLastSelection();
      }
    }

    if (typeof this.commands[commandName].action === "string") {
      if (this.state[commandName] === false)
        (this.editor as any).setCommandState(commandName, true);
      else (this.editor as any).setCommandState(commandName, false);
    } else if (typeof this.commands[commandName].action === "function") {
      (this.commands[commandName].action as CommandAction)(this.editor);
    }
  }

  public setEditor(editor: Editor): void {
    this.editor = editor;
    editor.addEventListener("selection", (e) => this.handleSelection(e));
  }

  private handleSelection(event: SelectionEvent): void {
    if (event.commandState) {
      for (let command in this.commands) {
        if (event.commandState[command] === undefined) {
          if (this.commands[command].enabled) {
            this.state[command] = this.commands[command].enabled!(
              this.editor!,
              event.focus,
              event.anchor
            );
          } else {
            this.state[command] = event.focus ? false : null;
          }
        } else {
          this.state[command] = event.commandState[command];
        }

        if (this.state[command] === true) {
          this.buttons[command].className = "TMCommandButton TMCommandButton_Active";
        } else if (this.state[command] === false) {
          this.buttons[command].className = "TMCommandButton TMCommandButton_Inactive";
        } else {
          this.buttons[command].className = "TMCommandButton TMCommandButton_Disabled";
        }
      }
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    // Only handle keyboard shortcuts if this editor is currently focused
    if (!this.editor || !this.editor.e) return;
    if (!this.editor.e.contains(document.activeElement)) return;

    outer: for (let hotkey of this.hotkeys) {
      if (
        (hotkey.key && event.key.toLowerCase() === hotkey.key) ||
        (hotkey.code && event.code === hotkey.code)
      ) {
        for (let modifier of hotkey.modifiers) {
          if (!(event as any)[modifier]) continue outer;
        }
        this.handleClick(hotkey.command, event);
        return;
      }
    }
  }
}

export default CommandBar;