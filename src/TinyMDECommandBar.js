import { commands } from "./grammar";

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
    this.createCommandBarElement(element, props.commands || ['bold', 'italic', '|', 'h1', 'h2']);
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
        if (command == 'h1') this.buttons[command].innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4.762 4.762" height="18" width="18"><path d="M.794.53s0-.265.264-.265h.265c.264 0 .264.264.264.264v1.588h1.588V.529s0-.264.265-.264h.264c.265 0 .265.264.265.264v3.704s0 .265-.265.265H3.44c-.265 0-.265-.265-.265-.265V2.646H1.587v1.587s0 .265-.264.265h-.265c-.264 0-.264-.265-.264-.265z"/></svg>`;
        else this.buttons[command].textContent = command.substr(0, 2);
        this.buttons[command].addEventListener('click', (e) => this.handleClick(command, e));
        this.e.appendChild(this.buttons[command]);
      }
    }
    parentElement.appendChild(this.e);
  }

  handleClick(command, event) {
    if (!this.editor) return;
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