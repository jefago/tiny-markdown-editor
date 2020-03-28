import { commands } from "./grammar";
import svg from './svg/svg';
import { stringifyObject } from "./TinyMDE";

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
    this.createCommandBarElement(element, props.commands || ['bold', 'italic', 'strikethrough', '|', 'code', '|', 'h1', 'h2', '|', 'ul', 'ol', '|', 'blockquote']);
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
        this.buttons[command] = document.createElement('div');
        this.buttons[command].className = 'TMCommandButton TMCommandButton_Disabled';
        if (svg[command]) this.buttons[command].innerHTML = svg[command];
        else this.buttons[command].textContent = command.substr(0, 1).toUpperCase();
        this.buttons[command].addEventListener('mousedown', (e) => this.handleClick(command, e));
        this.e.appendChild(this.buttons[command]);
      }
    }
    parentElement.appendChild(this.e);
  }

  handleClick(command, event) {
    if (!this.editor) return;
    this.editor.log(`Button click: ${command}`, `Selection: ${stringifyObject(this.editor.getSelection())}`);
    event.preventDefault();
    if (this.state[command] === false) this.editor.setCommandState(command, true);
    else this.editor.setCommandState(command, false);
  }

  setEditor(editor) {
    this.editor = editor;
    editor.addEventListener('selection', (e) => this.handleSelection(e));
  }

  handleSelection(event) {
    if (event.commandState) {
      for (let command in event.commandState) {
        this.state[command] = event.commandState[command];
        if (this.buttons[command]) {
          if (event.commandState[command] === true) {
            this.buttons[command].className = 'TMCommandButton TMCommandButton_Active';
          } else if (event.commandState[command] === false) {
            this.buttons[command].className = 'TMCommandButton TMCommandButton_Inactive';
          } else {
            this.buttons[command].className = 'TMCommandButton TMCommandButton_Disabled';
          }
        }
      }
    }
  }
}

export default CommandBar;