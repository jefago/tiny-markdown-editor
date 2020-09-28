## TinyMDE demo
This is a demo page for [TinyMDE](https://github.com/jefago/tiny-markdown-editor/).

### Simple setup

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

```html
<div style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0">
<textarea id="txt3" style="height:100%"># Textarea
This is a <textarea> formatted in **Markdown**.</textarea>
</div>
<script>
var tinyMDE3 = new TinyMDE.Editor({textarea: 'txt3'});
</script>
```

<div>
<textarea id="txt3"># Textarea
This is a &lt;textarea&gt; formatted in **Markdown**.</textarea>
</div>
<script>
var tinyMDE3 = new TinyMDE.Editor({textarea: 'txt3'});
</script>


### Custom command bar

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
