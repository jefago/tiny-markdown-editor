## TinyMDE demo
This is a demo page for [TinyMDE](https://github.com/jefago/tiny-markdown-editor/).


<div id="tinymde_commandbar"></div>
<div id="tinymde" style="height:300px; overflow-y:scroll; border:1px solid #c0c0c0">

<script>
var tinyMDE = new TinyMDE.Editor({element: 'tinymde'});
var commandBar = new TinyMDE.CommandBar({element: 'tinymde_commandbar', editor: tinyMDE});
</script>
