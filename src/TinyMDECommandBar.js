import svg from './svg/svg';

const isMacLike = /(Mac|iPhone|iPod|iPad)/i.test(typeof navigator !== "undefined" ? navigator.platform : "");

const DefaultCommands = {
  'bold': {
    name: 'bold',
    action: 'bold',
    innerHTML: svg.bold,
    title: 'Bold',
    hotkey: 'Mod-B',
  },
  'italic': {
    name: 'italic',
    action: 'italic',
    innerHTML: svg.italic,
    title: 'Italic',
    hotkey: 'Mod-I',
  },
  'strikethrough': {
    name: 'strikethrough',
    action: 'strikethrough',
    innerHTML: svg.strikethrough,
    title: 'Strikethrough',
    hotkey: 'Mod2-Shift-5',
  },
  'code': {
    name: 'code',
    action: 'code',
    innerHTML: svg.code,
    title: 'Format as code',
  },
  'h1': {
    name: 'h1',
    action: 'h1',
    innerHTML: svg.h1,
    title: 'Level 1 heading',
    hotkey: 'Mod-Shift-1',
  },
  'h2': {
    name: 'h2',
    action: 'h2',
    innerHTML: svg.h2,
    title: 'Level 2 heading',
    hotkey: 'Mod-Shift-2',
  },
  'ul': {
    name: 'ul',
    action: 'ul',
    innerHTML: svg.ul,
    title: 'Bulleted list',
  },
  'ol': {
    name: 'ol',
    action: 'ol',
    innerHTML: svg.ol,
    title: 'Numbered list',
  },
  'blockquote': {
    name: 'blockquote',
    action: 'blockquote',
    innerHTML: svg.blockquote,
    title: 'Quote',
    hotkey: 'Mod2-Shift-Q',
  },
  'insertLink': {
    name: 'insertLink',
    action: (editor) => {if (editor.isInlineFormattingAllowed()) editor.wrapSelection('[', ']()')},
    enabled: (editor, focus, anchor) => editor.isInlineFormattingAllowed(focus, anchor) ? false : null,
    innerHTML: svg.link,
    title: 'Insert link',
    hotkey: 'Mod-K',
  },
  'insertImage': {
    name: 'insertImage',
    action: (editor) => {if (editor.isInlineFormattingAllowed()) editor.wrapSelection('![', ']()')},
    enabled: (editor, focus, anchor) => editor.isInlineFormattingAllowed(focus, anchor) ? false : null,
    innerHTML: svg.image,
    title: 'Insert image',
    hotkey: 'Mod2-Shift-I',
  },
  'hr': {
    name: 'hr',
    action: (editor) => editor.paste('\n***\n'),
    enabled: () => false,
    innerHTML: svg.hr,
    title: 'Insert horizontal line',
    hotkey: 'Mod2-Shift-L'
  }
}


class CommandBar {
  constructor(props) {
    this.e = null;
    this.editor = null;
    this.commands = [];
    this.buttons = {};
    this.state = {};
    this.hotkeys = [];

    let element = props.element;
    if (element && !element.tagName) {
      element = document.getElementById(props.element);
    }
    if (!element) {
      element = document.body; 
    }
    this.createCommandBarElement(element, props.commands || ['bold', 'italic', 'strikethrough', '|', 'code', '|', 'h1', 'h2', '|', 'ul', 'ol', '|', 'blockquote', 'hr', '|', 'insertLink', 'insertImage']);
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    if (props.editor) this.setEditor(props.editor);
  }

  createCommandBarElement(parentElement, commands) {
    this.e = document.createElement('div');
    this.e.className = 'TMCommandBar';

    for (let command of commands) {
      if (command == '|') {
        let el = document.createElement('div');
        el.className = 'TMCommandDivider';
        this.e.appendChild(el);
      } else {
        let commandName;
        if (typeof command == "string") {
          // Reference to default command

          if (DefaultCommands[command]) {
            commandName = command;
            this.commands[commandName] = DefaultCommands[commandName];

            
          } else {
            continue;
          }
          
        } else if (typeof command == "object" && command.name) {
          commandName = command.name;
          this.commands[commandName] = {}; 
          if (DefaultCommands[commandName]) Object.assign(this.commands[commandName], DefaultCommands[commandName]);
          Object.assign(this.commands[commandName], command);
        

        } else {
          continue;
        }

        let title = this.commands[commandName].title || commandName;

        if (this.commands[commandName].hotkey) {
          const keys = this.commands[commandName].hotkey.split('-');
          // construct modifiers
          let modifiers = [];
          let modifierexplanation = [];
          for (let i = 0; i < keys.length - 1; i++) {
            switch (keys[i]) {
              case 'Ctrl': modifiers.push('ctrlKey'); modifierexplanation.push('Ctrl'); break;
              case 'Cmd': modifiers.push('metaKey'); modifierexplanation.push('⌘'); break;
              case 'Alt': modifiers.push('altKey'); modifierexplanation.push('Alt'); break;
              case 'Option': modifiers.push('altKey'); modifierexplanation.push('⌥'); break;
              case 'Win': modifiers.push('metaKey'); modifierexplanation.push('⊞ Win'); break;

              case 'Shift':  modifiers.push('shiftKey'); modifierexplanation.push('⇧'); break;

              case 'Mod': // Mod is a convenience mechanism: Ctrl on Windows, Cmd on Mac
                if (isMacLike) {modifiers.push('metaKey'); modifierexplanation.push('⌘');} 
                else {modifiers.push('ctrlKey'); modifierexplanation.push('Ctrl');} 
                break; 
              case 'Mod2': 
                modifiers.push('altKey'); 
                if (isMacLike) modifierexplanation.push('⌥');
                else modifierexplanation.push('Alt');
                break; // Mod2 is a convenience mechanism: Alt on Windows, Option on Mac
            }
          }
          modifierexplanation.push(keys[keys.length - 1]);
          let hotkey = {
            
            modifiers: modifiers,
            command: commandName,
          };
          // TODO Right now this is working only for letters and numbers
          if (keys[keys.length - 1].match(/^[0-9]$/)) {
            hotkey.code = `Digit${keys[keys.length - 1]}`;
          } else {
            hotkey.key = keys[keys.length - 1].toLowerCase();
          }
          this.hotkeys.push(hotkey);
          title = title.concat(` (${modifierexplanation.join('+')})`);
        }

        this.buttons[commandName] = document.createElement('div');
        this.buttons[commandName].className = 'TMCommandButton TMCommandButton_Disabled';
        this.buttons[commandName].title = title;
        this.buttons[commandName].innerHTML = this.commands[commandName].innerHTML;

        this.buttons[commandName].addEventListener('mousedown', (e) => this.handleClick(commandName, e));
        this.e.appendChild(this.buttons[commandName]);
      }
    }
    parentElement.appendChild(this.e);
  }

  handleClick(commandName, event) {
    if (!this.editor) return;
    event.preventDefault();
    if (typeof this.commands[commandName].action == "string") {
      if (this.state[commandName] === false) this.editor.setCommandState(commandName, true);
      else this.editor.setCommandState(commandName, false);  
    } else if (typeof this.commands[commandName].action == "function") {
      this.commands[commandName].action(this.editor);
    }
  }

  setEditor(editor) {
    this.editor = editor;
    editor.addEventListener('selection', (e) => this.handleSelection(e));
  }

  handleSelection(event) {
    if (event.commandState) {
      for (let command in this.commands) {
        if (event.commandState[command] === undefined) {
          if (this.commands[command].enabled) this.state[command] = this.commands[command].enabled(this.editor, event.focus, event.anchor);
          else this.state[command] = event.focus ? false : null;
        } else {
          this.state[command] = event.commandState[command];
        }

        if (this.state[command] === true) {
          this.buttons[command].className = 'TMCommandButton TMCommandButton_Active';
        } else if (this.state[command] === false) {
          this.buttons[command].className = 'TMCommandButton TMCommandButton_Inactive';
        } else {
          this.buttons[command].className =  'TMCommandButton TMCommandButton_Disabled';
        }
      }
    }
  }

  handleKeydown(event) {
    outer: for (let hotkey of this.hotkeys) {
      if ((hotkey.key && event.key.toLowerCase() == hotkey.key) || (hotkey.code && event.code == hotkey.code)) {
        // Key matches hotkey. Look for any required modifier that wasn't pressed
        for (let modifier of hotkey.modifiers) {
          if (!event[modifier]) continue outer;
        }
        // Everything matches.
        this.handleClick(hotkey.command, event);
        return;
      }
    }
  }
}

export default CommandBar;