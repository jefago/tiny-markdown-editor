test('Correctly parses ATX headings: # H1', () => {
  let heading = ' XXXA';
  for (let level = 1; level <= 6; level++) {
    heading = `#${heading}`;
    expect(initTinyMDE(heading).lineType(0)).toMatch(`TMH${level}`);
  }
});



// H1
// ==
// Hello *there*.
// ~~~
// Code
// block
// ~~~
// [ref]: https://www.jefago.com
// [ref link]: </this has spaces> "and a title"
// [  link label  ]: "Only title, spaces in the label"


// > Quote and
//     Indented code block

//   * * * 
  
// - UL
// - UL (and an empty one below)
// - 

// 1) OL
// 2) OL