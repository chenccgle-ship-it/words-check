const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const SheetJS=require('../app/vendor/xlsx.full.min.js');

class Element{
 constructor(){this.children=[];this.style={};this.value='';this.checked=false;this.open=false}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=items}
 setAttribute(){} after(){} before(){}
 showModal(){this.open=true}close(){this.open=false}
 click(){return this.onclick?.()}
}
function harness(){
 const nodes=new Map();const get=selector=>{if(!nodes.has(selector))nodes.set(selector,new Element());return nodes.get(selector)};
 get('#count').value='5';get('#mode').value='en';get('#avoid').checked=true;
 let persisted,exported;
 const XLSX={...SheetJS,writeFile:wb=>{exported=SheetJS.write(wb,{type:'buffer',bookType:'xlsx'})}};
 const ctx=vm.createContext({console,crypto:webcrypto,document:{querySelector:get,createElement:()=>new Element(),addEventListener(){}},localStorage:{getItem:()=>null,setItem:(_,value)=>{persisted=JSON.parse(value)}},window:{XLSX},XLSX,setTimeout:()=>0,clearTimeout(){},confirm:()=>true,prompt:()=>null,Date});
 for(const file of ['default-words.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../app',file),'utf8'),ctx);
 return{get,run:code=>vm.runInContext(code,ctx),persisted:()=>persisted,exported:()=>exported};
}

test('default vocabulary has 192 entries across four courses with zero statistics',()=>{
 const app=harness();assert.equal(app.run('db.length'),4);assert.equal(app.run('db.flatMap(c=>c.words).length'),192);
 assert.equal(app.run('db.flatMap(c=>c.words).every(w=>w.wrongCount===0&&w.correctCount===0)'),true);
});
test('repeated grading, corrections and undo update cumulative counts exactly once',()=>{
 const app=harness();app.run("let w=batch[0];gradeWord(w,'wrong');gradeWord(w,'wrong')");
 assert.equal(app.run('wordRecord(w.id).wrongCount'),1);
 app.run("gradeWord(w,'correct')");assert.equal(app.run('wordRecord(w.id).wrongCount'),0);assert.equal(app.run('wordRecord(w.id).correctCount'),1);
 app.run("gradeWord(w,'wrong')");assert.equal(app.run('wordRecord(w.id).wrongCount'),1);assert.equal(app.run('wordRecord(w.id).correctCount'),0);
 assert(app.persisted().flatMap(c=>c.words).some(w=>w.wrongCount===1));
 app.run('gradeWord(w,null)');assert.equal(app.run('wordRecord(w.id).wrongCount'),0);assert.equal(app.run('w.grade'),null);
});
test('pagination preserves grades and the last page only displays remaining entries',()=>{
 const app=harness();app.get('#count').value='8';app.run("draw();gradeWord(batch[0],'wrong');page=1;render()");
 assert.equal(app.get('#cards').children.length,3);app.run('page=0;render()');assert.equal(app.get('#cards').children.length,5);assert.equal(app.run('batch[0].grade'),'wrong');
});
test('Excel export and re-import restore vocabulary and cumulative statistics',async()=>{
 const app=harness();app.run("gradeWord(batch[0],'wrong');exportResults()");
 const file=app.exported();const wb=SheetJS.read(file,{type:'buffer'});assert.equal(wb.SheetNames.length,4);
 const rows=SheetJS.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});assert.equal(rows[0][4],'累计错误次数');assert(rows.some(r=>r[4]===1&&r[6]===1));
 app.run('db=[];selected.clear();batch=[]');await app.get('#file').onchange({target:{files:[{arrayBuffer:async()=>file}],value:'backup.xlsx'}});
 app.get('#modal').children.at(-1).children[1].click();assert.equal(app.run('db.length'),4);assert.equal(app.run('db.flatMap(c=>c.words).some(w=>w.wrongCount===1)'),true);
});
test('deleting a course removes its cards and words while preserving other courses',()=>{
 const app=harness();app.get('#chooseCourses').click();const list=app.get('#modal').children[2];list.children[0].children[2].click();
 assert.equal(app.run('db.length'),3);assert.equal(app.run('batch.length'),0);assert.equal(app.run('db.flatMap(c=>c.words).length'),147);
});
test('reset clears counters without deleting vocabulary',()=>{
 const app=harness();app.run("gradeWord(batch[0],'wrong');gradeWord(batch[1],'correct');resetStats()");
 assert.equal(app.run('db.flatMap(c=>c.words).length'),192);assert.equal(app.run('db.flatMap(c=>c.words).every(w=>w.wrongCount===0&&w.correctCount===0)'),true);
});
