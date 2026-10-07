function cell(value){
  let text=value===null?'':String(value);
  // Leading whitespace/control characters must not bypass spreadsheet guards.
  if(/^[\s\u0000-\u001f]*[=+\-@]/u.test(text)||/^[\t\r\n]/u.test(text))text="'"+text;
  return '"'+text.replace(/"/g,'""')+'"';
}
function encode(columns,rows){return [columns.map(([label])=>cell(label)).join(','),...rows.map(row=>columns.map(([,key])=>{
  if(!Object.hasOwn(row,key)||row[key]===undefined)throw new Error('Incomplete CSV row.');return cell(row[key]);
}).join(','))].join('\r\n')+'\r\n';}
module.exports={encode};
