import { commands } from "./grammar";

class CommandBar {
  constructor(props) {
    this.e = null;
    this.commands = [];
    this.buttons = {};

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
        this.buttons[command].textContent = command.substr(0, 2);
        this.buttons[command].addEventListener('click', (e) => this.handleClick(command, e));
        this.e.appendChild(this.buttons[command]);
      }
    }
    parentElement.appendChild(this.e);
  }

  handleClick(command, event) {
    event.preventDefault();
  }

  handleSelection(event) {
    if (event.commandState) {
      for (let command in event.commandState) {
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