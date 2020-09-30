## TinyMDE demo
This is a demo page for [TinyMDE](https://github.com/jefago/tiny-markdown-editor/).

### Simple setup
This is a very basic setup with two containers for command bar and editor. 

```html
<div id="tinymde_commandbar1"></div>
<div id="tinymde1" style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0"></div>
<script>
var tinyMDE1 = new TinyMDE.Editor({element: 'tinymde1'});
var commandBar1 = new TinyMDE.CommandBar({element: 'tinymde_commandbar1', editor: tinyMDE1});
</script>
```

<div id="tinymde_commandbar1"></div>
<div id="tinymde1" style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0"></div>
<script>
var tinyMDE1 = new TinyMDE.Editor({element: 'tinymde1'});
var commandBar1 = new TinyMDE.CommandBar({element: 'tinymde_commandbar1', editor: tinyMDE1});
</script>

### Editor without command bar
An even simpler setup can be achieved if you don't need a command bar.

```html
<div id="tinymde2" style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0"></div>
<script>
var tinyMDE2 = new TinyMDE.Editor({element: 'tinymde2'});
</script>
```

<div id="tinymde2" style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0"></div>
<script>
var tinyMDE2 = new TinyMDE.Editor({element: 'tinymde2'});
</script>


### Editor from text field
This example shows how you can use TinyMDE as a drop-in textarea replacement. The editor content is synced to the textarea.

```html
<div style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0">
<textarea id="txt3" style="height:100%"># Textarea
This is a <textarea> formatted in **Markdown**.</textarea>
</div>
<script>
var tinyMDE3 = new TinyMDE.Editor({textarea: 'txt3'});
</script>
```

<div style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0">
<textarea id="txt3"># Textarea
This is a &lt;textarea&gt; formatted in **Markdown**.</textarea>
</div>
<script>
var tinyMDE3 = new TinyMDE.Editor({textarea: 'txt3'});
</script>


### Custom command bar
This example shows how the command bar can be customized—showing only a subset of commands, customizing existing commands, and even adding completely new commands. 

```html
<div id="tinymde_commandbar4"></div>
<div id="tinymde4" style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0"></div>
<script>
var tinyMDE4 = new TinyMDE.Editor({element: 'tinymde4'});
var commandBar4 = new TinyMDE.CommandBar({
  element: 'tinymde_commandbar4', 
  editor: tinyMDE4,
  commands: [
    'bold',
    'italic',
    'strikethrough',
    '|',
    {
      name: 'insertLink', 
      action: editor => {
        let dest = window.prompt('Link destination'); 
        if (dest) editor.wrapSelection('[', `](<${dest}>)`);
      }
    },
    {
      name: 'moreInfo',
      title: 'More information about TinyMDE',
      innerHTML: '<b>?</b>',
      action: editor => window.open('https://github.com/jefago/tiny-markdown-editor', '_blank')
    }
  ]
});
```

<div id="tinymde_commandbar4"></div>
<div id="tinymde4" style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0"></div>
<script>
var tinyMDE4 = new TinyMDE.Editor({element: 'tinymde4'});
var commandBar4 = new TinyMDE.CommandBar({
  element: 'tinymde_commandbar4', 
  editor: tinyMDE4,
  commands: [
    'bold',
    'italic',
    'strikethrough',
    '|',
    {
      name: 'insertLink', 
      action: editor => {
        let dest = window.prompt('Link destination'); 
        if (dest) editor.wrapSelection('[', `](<${dest}>)`);
      }
    },
    {
      name: 'moreInfo',
      title: 'More information about TinyMDE',
      innerHTML: '<b>?</b>',
      action: editor => window.open('https://github.com/jefago/tiny-markdown-editor', '_blank')
    }
  ]
});
</script>

### Using event listeners
This demo uses event listeners to display a status bar.

```html
<div id="tinymde_commandbar5"></div>
<div id="tinymde5" style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0"></div>
<div id="tinymde_status5" style="display:flex">
  <div id="wc" style="box-sizing:border-box; width:50%; padding:4px 0px; text-align:left"></div>
  <div id="pos" style="box-sizing:border-box; width:50%; padding:4px 0px; text-align:right">– : –</div>
</div>
<script>
  var tinyMDE5 = new TinyMDE.Editor({element: 'tinymde5', content: '# Event listener demo\nThis is a demo for TinyMDE event listeners'});
  var commandBar5 = new TinyMDE.CommandBar({
    element: 'tinymde_commandbar5', 
    editor: tinyMDE5,
  });
  tinyMDE5.addEventListener('selection', e => { 
    let st = `${e.focus ? e.focus.row : '–'} : ${e.focus ? e.focus.col : '–'}`;
    for (let command in e.commandState) {
      if (e.commandState[command]) st = command.concat(' ', st);
    }
    document.getElementById('pos').innerHTML = st; 
  });
  tinyMDE5.addEventListener('change', e => { 
    document.getElementById('wc').innerHTML = `${e.content.length} characters, ${e.content.split(/\s+/).length} words`; 
  });
</script>
```

<div id="tinymde_commandbar5"></div>
<div id="tinymde5" style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0"></div>
<div id="tinymde_status5" style="display:flex">
  <div id="wc" style="box-sizing:border-box; width:50%; padding:4px 0px; text-align:left"></div>
  <div id="pos" style="box-sizing:border-box; width:50%; padding:4px 0px; text-align:right">– : –</div>
</div>
<script>
  var tinyMDE5 = new TinyMDE.Editor({element: 'tinymde5', content: '# Event listener demo\nThis is a demo for TinyMDE event listeners'});
  var commandBar5 = new TinyMDE.CommandBar({
    element: 'tinymde_commandbar5', 
    editor: tinyMDE5,
  });
  tinyMDE5.addEventListener('selection', e => { 
    let st = `${e.focus ? e.focus.row : '–'} : ${e.focus ? e.focus.col : '–'}`;
    for (let command in e.commandState) {
      if (e.commandState[command]) st = command.concat(' ', st);
    }
    document.getElementById('pos').innerHTML = st; 
  });
  tinyMDE5.addEventListener('change', e => { 
    document.getElementById('wc').innerHTML = `${e.content.length} characters, ${e.content.split(/\s+/).length} words`; 
  });
</script>
