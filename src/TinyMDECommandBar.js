import svg from './svg/svg';
import { stringifyObject } from "./TinyMDE";

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
  },
  'h2': {
    name: 'h2',
    action: 'h2',
    innerHTML: svg.h2,
    title: 'Level 2 heading',
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
  },
  'insertLink': {
    name: 'insertLink',
    action: (editor) => editor.wrapSelection('[', ']()'),
    enabled: (editor, focus, anchor) => editor.isInlineFormattingAllowed(focus, anchor) ? false : null,
    innerHTML: 'L',
    title: 'Insert link',
    hotkey: 'Mod-K',
  }
}


class CommandBar {
  constructor(props) {
    this.e = null;
    this.editor = null;
    this.commands = [];
    this.buttons = {};
    this.state = {};

    let element = props.element;
    if (element && !element.tagName) {
      element = document.getElementById(props.element);
    }
    if (!element) {
      element = document.body; 
    }
    this.createCommandBarElement(element, props.commands || ['bold', 'italic', 'strikethrough', '|', 'code', '|', 'h1', 'h2', '|', 'ul', 'ol', '|', 'blockquote', '|', 'insertLink']);
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

        this.buttons[commandName] = document.createElement('div');
        this.buttons[commandName].className = 'TMCommandButton TMCommandButton_Disabled';
        this.buttons[commandName].title = this.commands[commandName].title;
        this.buttons[commandName].innerHTML = this.commands[commandName].innerHTML;

        // if (svg[command]) this.buttons[command].innerHTML = svg[command];
        // else this.buttons[command].textContent = command.substr(0, 1).toUpperCase();
        this.buttons[commandName].addEventListener('mousedown', (e) => this.handleClick(commandName, e));
        this.e.appendChild(this.buttons[commandName]);
      }
    }
    parentElement.appendChild(this.e);
  }

  handleClick(commandName, event) {
    if (!this.editor) return;
    this.editor.log(`Button click: ${commandName}`, `Selection: ${stringifyObject(this.editor.getSelection())}`);
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
      // for (let command in event.commandState) {
      //   this.state[command] = event.commandState[command];
      //   if (this.buttons[command]) {
      //     if (event.commandState[command] === true) {
      //       this.buttons[command].className = 'TMCommandButton TMCommandButton_Active';
      //     } else if (event.commandState[command] === false) {
      //       this.buttons[command].className = 'TMCommandButton TMCommandButton_Inactive';
      //     } else {
      //       this.buttons[command].className = 'TMCommandButton TMCommandButton_Disabled';
      //     }
      //   }
      // }
    }
  }
}

export default CommandBar;