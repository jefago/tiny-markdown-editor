// TODO Remove this
export function assert(condition) {
  if (!condition) {
    console.log('Assertion false');
    throw "Assertion false";
  }
}
export function stringifyObject(event) {
  let keys = [];
  let obj = event;
  if (!event)
    return 'null';

  do {
    Object.getOwnPropertyNames(obj).forEach(function (prop) {
      if (keys.indexOf(prop) === -1) {
        keys.push(prop);
      }
    });
    obj = Object.getPrototypeOf(obj)
  } while (obj);

  return '{\n' + keys.reduce(function (str, key) {
    switch (typeof event[key]) {
      case 'number':
      case 'boolean':
      case 'bigint':
        str = `${str}  ${key}: ${event[key]},\n`;
        break;
      case 'string':
        str = `${str}  ${key}: '${event[key]}',\n`;
        break;
      case 'object':
        str = `${str}  ${key}: {...},\n`;
        break;
      case 'function':
        str = `${str}  ${key}: () => {...},\n`;
        break;
      case 'undefined':
        str = `${str}  ${key}: undefined,\n`;
        break;
      default:
        str = `${str}  ${key}: ?,\n`;
    }
    return str;
  }, '') + '}';
}

export function log(message, details) {
  // TODO Remove logging
  if (document.getElementById('log')) {
    let e = document.createElement('details');
    let s = document.createElement('summary');
    let t = document.createTextNode(message);
    s.appendChild(t);
    e.appendChild(s);
    let c = document.createElement('code');
    let p = document.createElement('pre');
    t = document.createTextNode(details);
    c.appendChild(t);
    p.appendChild(c);
    e.appendChild(p);
    document.getElementById('log').appendChild(e);
  }
  
}
