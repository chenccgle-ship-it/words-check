const $=s=>document.querySelector(s), key='words-check-nine-lower-v1';
let db;try{db=JSON.parse(localStorage.getItem(key))}catch{}if(!Array.isArray(db))db=samples.map((c,i)=>({id:crypto.randomUUID(),name:c.name,words:c.words.map(w=>({id:crypto.randomUUID(),en:w[0],cn:w[1],pos:w[2]||'',note:w[3]||'',wrongCount:0,correctCount:0}))}));
let selected=new Set(db.slice(0,1).map(c=>c.id)),seen=new Set(),batch=[],round=0,page=0;
function save(){try{localStorage.setItem(key,JSON.stringify(db))}catch{toast('浏览器保存失败，请检查存储空间')}}
function el(tag,text,cls){let e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function toast(t){$('#toast').textContent=t;$('#toast').style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').style.display='none',3200)}
function courses(){let box=$('#courses');box.replaceChildren();db.forEach(c=>{let label=el('label',undefined,'course'),check=el('input');check.type='checkbox';check.checked=selected.has(c.id);check.onchange=()=>{check.checked?selected.add(c.id):selected.delete(c.id);stats()};label.append(check,el('span',c.name),el('small',c.words.length));box.append(label)});$('#total').textContent=`/ ${db.length}`;stats()}
function pool(){return db.filter(c=>selected.has(c.id)).flatMap(c=>c.words.map(w=>({...w,course:c.name})))}
function stats(){let summary=$('#selectionSummary');if(summary)summary.textContent='当前课程：'+(db.filter(c=>selected.has(c.id)).map(c=>c.name).join('、')||'尚未选择');let p=pool();$('#remaining').textContent=`已选 ${p.length} 词 · 未抽 ${p.filter(w=>!seen.has(w.id)).length} 词`}
function draw(){let p=pool(),n=Number($('#count').value);if(!Number.isInteger(n)||n<1||n>50)return toast('请输入 1–50 之间的整数');if(!p.length)return toast('请先选择有单词的课程');if(n>p.length)toast(`所选课程共 ${p.length} 个词，已全部抽取`);n=Math.min(n,p.length);let fresh=p.filter(w=>!seen.has(w.id));let shuffle=a=>{for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};let candidates=$('#avoid').checked?[...shuffle(fresh),...shuffle(p.filter(w=>seen.has(w.id)))]:shuffle(p);batch=candidates.slice(0,n).map(w=>({...w,showEn:$('#mode').value==='en',showCn:$('#mode').value==='cn',direction:$('#mode').value,grade:null}));batch.forEach(w=>seen.add(w.id));round++;page=0;render();stats()}

function wordRecord(id){return db.flatMap(c=>c.words).find(w=>w.id===id)}
function countOf(value){return Number.isSafeInteger(Number(value))&&Number(value)>=0?Number(value):0}
function gradeWord(w,result){
 const original=wordRecord(w.id);if(!original)return;
 if(w.grade!==result){
  original.correctCount=countOf(original.correctCount);original.wrongCount=countOf(original.wrongCount);
  if(w.grade==='correct')original.correctCount=Math.max(0,original.correctCount-1);
  if(w.grade==='wrong')original.wrongCount=Math.max(0,original.wrongCount-1);
  if(result==='correct')original.correctCount++;else if(result==='wrong')original.wrongCount++;
  w.grade=result;save();
 }
 w.showEn=true;w.showCn=true;render();
}
function gradeButtons(w,withAnswer=false){let zone=el('div',undefined,'grade-buttons');
 [['correct','✓'],['wrong','✕']].forEach(([result,title])=>{let b=el('button',title,'grade-'+result+(w.grade===result?' active':''));b.setAttribute('aria-pressed',String(w.grade===result));b.setAttribute('aria-label',result==='correct'?'答对':'答错');b.title=result==='correct'?'答对':'答错';b.onclick=()=>gradeWord(w,result);zone.append(b)});return zone;
}
function render(){page=Math.max(0,Math.min(page,Math.ceil(batch.length/5)-1));let box=$('#cards');box.replaceChildren();$('#round').textContent=`/ ${batch.length} 张卡片 · 第 ${round} 轮`;batch.slice(page*5,page*5+5).forEach((w,i)=>{
 let card=el('article',undefined,'card '+(w.grade?'graded-'+w.grade:'')),head=el('div',undefined,'cardhead');head.append(el('span',String(page*5+i+1).padStart(2,'0'),'number'),el('span',w.course));card.append(head);
 const answer=w.direction==='en'?'cn':w.direction==='cn'?'en':null;
 const fields=w.direction==='cn'?[['cn','中文释义','点击显示中文'],['en','ENGLISH','点击显示英文']]:[['en','ENGLISH','点击显示英文'],['cn','中文释义','点击显示中文']];
 fields.forEach(([field,label,hint])=>{let flag=field==='en'?'showEn':'showCn';
  if(field===answer&&!w[flag]){let area=el('div',undefined,'face answer-split');area.append(el('small',label),gradeButtons(w,true));card.append(area)}
  else{let b=el('button',undefined,`face ${field} ${w[flag]?'revealed':''}`);b.append(el('small',label),el('span',w[flag]?w[field]:`＋ ${hint}`));b.setAttribute('aria-label',w[flag]?`隐藏${label}`:hint);b.onclick=()=>{w[flag]=!w[flag];render()};card.append(b)}
 });
 if(!answer||(answer==='en'?w.showEn:w.showCn))card.append(gradeButtons(w));
 let original=wordRecord(w.id);card.append(el('div',`错 ${countOf(original?.wrongCount)} 次`,'word-score'));if(w.grade){let undo=el('button','↶','undo-grade');undo.setAttribute('aria-label','撤销判断');undo.title='撤销判断';undo.onclick=()=>gradeWord(w,null);card.append(undo)}box.append(card)
 });if(!batch.length)box.append(el('div','选择课程后，点击「随机抽取」开始。','empty'));
 let good=batch.filter(w=>w.grade==='correct').length,bad=batch.filter(w=>w.grade==='wrong').length;
 $('#roundScore').textContent=`✓ ${good}　✕ ${bad}　未判 ${batch.length-good-bad}`;updatePager();
}
function modal(title){let d=$('#modal');if(d.open)d.close();d.replaceChildren(el('h2',title));d.showModal();return d}
function actions(d,primary,fn){let a=el('div',undefined,'actions'),cancel=el('button','关闭'),ok=el('button',primary,'primary');cancel.onclick=()=>d.close();ok.onclick=fn;a.append(cancel,ok);d.append(a)}
function needXlsx(){if(!window.XLSX){toast('Excel 组件尚未加载，请联网刷新后重试');return false}return true}
$('#draw').onclick=draw;$('#hide').onclick=()=>{batch.forEach(w=>{w.showEn=false;w.showCn=false});render()};$('#reveal').onclick=()=>{batch.forEach(w=>{w.showEn=true;w.showCn=true});render()};$('#fullscreen').onclick=async()=>{try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}catch{toast('请使用浏览器全屏功能')}};
$('#template').onclick=()=>{if(!needXlsx())return;let wb=XLSX.utils.book_new();samples.forEach((c,i)=>{let ws=XLSX.utils.aoa_to_sheet([['英文单词或短语','中文释义','词性（可选）','备注（可选）'],...c.words]);ws['!cols']=[{wch:26},{wch:30},{wch:18},{wch:35}];XLSX.utils.book_append_sheet(wb,ws,`Unit ${i+1}`)});XLSX.writeFile(wb,'words_check_多课程导入模板.xlsx');toast('模板包含 3 个课程页，示例可删除或替换')};
$('#import').onclick=()=>$('#file').click();$('#file').onchange=async e=>{let f=e.target.files[0];e.target.value='';if(!f||!needXlsx())return;try{let wb=XLSX.read(await f.arrayBuffer(),{type:'array'}),invalid=0;let imported=wb.SheetNames.map(name=>{let rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:'',raw:false}),headers=rows[0]||[],wrongCol=headers.indexOf('累计错误次数'),correctCol=headers.indexOf('累计正确次数'),words=[],duplicates=0,keys=new Set();rows.forEach((r,i)=>{let en=String(r[0]||'').trim(),cn=String(r[1]||'').trim();if(i===0&&(/英文|english|word/i.test(en)&&/中文|meaning|translation/i.test(cn)))return;if(!en&&!cn)return;if(!en||!cn){invalid++;return}let k=en.toLowerCase()+'\0'+cn;if(keys.has(k)){duplicates++;return}keys.add(k);words.push({id:crypto.randomUUID(),en,cn,pos:String(r[2]||''),note:String(r[3]||''),wrongCount:wrongCol>=0?countOf(r[wrongCol]):0,correctCount:correctCol>=0?countOf(r[correctCol]):0})});return {id:crypto.randomUUID(),name,words,duplicates}});let d=modal('导入课程预览');d.append(el('p',`识别到 ${imported.length} 个课程页。空白行忽略；缺失中英文 ${invalid} 行将跳过。`,'muted'));let list=el('div',undefined,'preview'),checks=[];imported.forEach(c=>{let l=el('label'),ch=el('input');ch.type='checkbox';ch.checked=c.words.length>0;ch.disabled=!c.words.length;checks.push(ch);l.append(ch,el('span',`${c.name} · ${c.words.length} 词${c.duplicates?` · 去重 ${c.duplicates} 行`:''}`));list.append(l)});d.append(list,el('p','同名课程会追加不重复的单词；不会覆盖已有课程。','muted'));actions(d,'确认导入',()=>{let count=0;imported.forEach((c,i)=>{if(!checks[i].checked)return;let existing=db.find(x=>x.name===c.name);if(existing){let k=new Set(existing.words.map(w=>w.en.toLowerCase()+'\0'+w.cn));c.words.forEach(w=>{if(!k.has(w.en.toLowerCase()+'\0'+w.cn)){existing.words.push(w);count++}});selected.add(existing.id)}else{db.push(c);selected.add(c.id);count+=c.words.length}});save();courses();d.close();toast(`成功导入 ${count} 个单词`)})}catch{toast('文件读取失败，请使用有效的 .xlsx 或 .xls 文件')}};
$('#manual').onclick=()=>{let d=modal('添加一个新单词'),course=el('input'),en=el('input'),cn=el('input');course.placeholder='课程名称，如 Unit 1';course.value=db.find(c=>selected.has(c.id))?.name||'';en.placeholder='英文单词或短语';cn.placeholder='中文释义';d.append(el('small','课程名称'),course,el('small','英文'),en,el('small','中文释义'),cn);actions(d,'保存单词',()=>{if(!course.value.trim()||!en.value.trim()||!cn.value.trim())return toast('请填写课程、英文和中文');let c=db.find(c=>c.name===course.value.trim());if(!c){c={id:crypto.randomUUID(),name:course.value.trim(),words:[]};db.push(c)}if(c.words.some(w=>w.en.toLowerCase()===en.value.trim().toLowerCase()&&w.cn===cn.value.trim()))return toast('这个单词已经在课程中');c.words.push({id:crypto.randomUUID(),en:en.value.trim(),cn:cn.value.trim()});selected.add(c.id);save();courses();d.close();toast('单词已保存')})};
$('#library').onclick=()=>{let d=modal('管理词库');appendManagementActions(d);let search=el('input'),list=el('div',undefined,'preview');search.placeholder='搜索英文、中文或课程';d.append(search,list);function refresh(){list.replaceChildren();db.forEach(c=>c.words.filter(w=>(c.name+w.en+w.cn).toLowerCase().includes(search.value.toLowerCase())).forEach(w=>{let row=el('div',undefined,'libraryrow'),del=el('button','删除'),edit=el('button','编辑');row.append(el('span',`${w.en} · ${w.cn}`),el('small',`累计错误 ${countOf(w.wrongCount)} 次`),el('small',c.name),edit,del);del.onclick=()=>{if(!confirm(`删除 ${w.en}？`))return;c.words=c.words.filter(x=>x.id!==w.id);batch=batch.filter(x=>x.id!==w.id);save();courses();render();refresh()};edit.onclick=()=>{let en=prompt('英文',w.en);if(en===null)return;let cn=prompt('中文释义',w.cn);if(cn===null)return;if(!en.trim()||!cn.trim())return toast('中英文不能为空');w.en=en.trim();w.cn=cn.trim();batch.forEach(x=>{if(x.id===w.id){x.en=w.en;x.cn=w.cn}});save();render();refresh()};list.append(row)}))}search.oninput=refresh;refresh();let close=el('button','完成','primary');close.style.marginTop='20px';close.onclick=()=>d.close();d.append(close)};

const pager=el('div',undefined,'pager'),prev=el('button','← 上一页'),pageLabel=el('span'),next=el('button','下一页 →');pager.append(prev,pageLabel,next);$('#cards').after(pager);prev.onclick=()=>{page--;render()};next.onclick=()=>{page++;render()};
function updatePager(){let pages=Math.max(1,Math.ceil(batch.length/5));pageLabel.textContent=`第 ${page+1} / ${pages} 页 · 共 ${batch.length} 个单词`;prev.disabled=page===0;next.disabled=page>=pages-1}
const summary=el('div',undefined,'selection-summary');summary.id='selectionSummary';$('.intro').after(summary);

$('#chooseCourses').onclick=()=>{
 let d=modal('选择课程'),pending=new Set(selected);d.append(el('p','可多选课程一起抽查。删除课程会同时删除其中的单词与统计记录。','muted'));let list=el('div',undefined,'preview');
 function refreshChoices(){list.replaceChildren();db.forEach(c=>{let row=el('div',undefined,'course-choice'),l=el('label'),ch=el('input'),del=el('button','删除','delete-course');ch.type='checkbox';ch.checked=pending.has(c.id);ch.onchange=()=>{ch.checked?pending.add(c.id):pending.delete(c.id)};l.append(ch,el('span',c.name));row.append(l,el('small',c.words.length+' 词'),del);
 del.onclick=()=>{if(!confirm(`确定删除课程「${c.name}」及其中的 ${c.words.length} 个单词和统计记录？删除后无法撤销，可先导出备份。`))return;let ids=new Set(c.words.map(w=>w.id));db=db.filter(x=>x.id!==c.id);pending.delete(c.id);selected.delete(c.id);batch=batch.filter(w=>!ids.has(w.id));ids.forEach(id=>seen.delete(id));save();courses();render();refreshChoices();toast('课程已删除')};list.append(row)});if(!db.length)list.append(el('p','还没有课程，请在「管理词库」中导入或添加。','muted'))}
 refreshChoices();d.append(list);actions(d,'确认并抽取',()=>{if(!db.some(c=>pending.has(c.id)&&c.words.length))return toast('请选择至少一个有单词的课程');selected=pending;courses();d.close();draw()})
};
function appendManagementActions(d){let bar=el('div',undefined,'management-actions');[['import','＋ 导入 Excel'],['template','↓ 下载模板'],['manual','＋ 添加单词'],['exportResults','↓ 导出词库与统计'],['resetStats','清零统计']].forEach(([id,title])=>{let b=el('button',title);b.onclick=()=>{if(id==='exportResults'){exportResults();return}if(id==='resetStats'){resetStats();return}if(id!=='template')d.close();$('#'+id).click()};bar.append(b)});d.append(bar)}
$('#manageWords').onclick=()=>$('#library').click();

function exportResults(){
 if(!needXlsx())return;if(!db.length)return toast('还没有可以导出的课程');let wb=XLSX.utils.book_new(),names=new Set();
 db.forEach((c,i)=>{let base=c.name.replace(/[\\/?:*\[\]]/g,' ').trim().slice(0,31)||'课程';let name=base,index=1;while(names.has(name.toLowerCase())){let suffix=' ('+(index++)+')';name=base.slice(0,31-suffix.length)+suffix}names.add(name.toLowerCase());
 let rows=[['英文单词或短语','中文释义','词性（可选）','备注（可选）','累计错误次数','累计正确次数','累计检测次数'],...c.words.map(w=>[w.en,w.cn,w.pos||'',w.note||'',countOf(w.wrongCount),countOf(w.correctCount),countOf(w.wrongCount)+countOf(w.correctCount)])];let ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=[{wch:26},{wch:36},{wch:16},{wch:36},{wch:18},{wch:18},{wch:18}];XLSX.utils.book_append_sheet(wb,ws,name)});
 XLSX.writeFile(wb,'words_check_词库与检测统计_'+new Date().toLocaleDateString('sv-SE')+'.xlsx');toast('已导出全部课程及累计统计，可重新导入新词库恢复');
}
const score=el('div',undefined,'round-score');score.id='roundScore';$('#cards').before(score);
document.querySelector('.foot span').textContent='答案区左侧答对、右侧答错。改判会修正计数；仅揭晓答案不计分。';
save();courses();draw();

document.addEventListener('fullscreenchange',()=>{document.querySelector('#fullscreen').textContent=document.fullscreenElement?'⛶ 退出全屏':'⛶ 全屏课堂'});

function resetStats(){if(!confirm('清零全部课程的累计错误、正确和检测次数？单词会保留。建议先导出备份。'))return;db.forEach(c=>c.words.forEach(w=>{w.wrongCount=0;w.correctCount=0}));batch.forEach(w=>w.grade=null);save();render();document.querySelector('#modal').close();toast('统计已清零，单词保留')}
