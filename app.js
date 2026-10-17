const ST=['มา','ลา','สาย','ขาด','ครึ่งวัน'],SYM={'มา':'✓','ลา':'ล','สาย':'ส','ขาด':'ข','ครึ่งวัน':'½'},CLS={'มา':'p','ลา':'l','สาย':'s','ขาด':'a','ครึ่งวัน':'h'};
const DOW=['อา','จ','อ','พ','พฤ','ศ','ส'],MON=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const $=s=>document.querySelector(s),KEY='attendance-v1',PIN='5555'; // เปลี่ยนรหัสแอดมินที่นี่
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0'),iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const thDate=s=>{const d=new Date(s+'T00:00');return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()+543}`};
let DB;try{DB=JSON.parse(localStorage.getItem(KEY))}catch(e){}
DB=DB||structuredClone(SEED);
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){toast('บันทึกลงเครื่องไม่ได้')}};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
let admin=false;
function ask(fn){if(admin)return fn();const p=prompt('ใส่รหัสแอดมินเพื่อแก้ไขรายชื่อ');if(p===null)return;if(p===PIN){admin=true;fn()}else toast('รหัสไม่ถูกต้อง')}
const act=()=>DB.workers.filter(w=>w.active!==false);
const telA=w=>w.phone?`<a class="tel" href="tel:${w.phone.replace(/[^\d+]/g,'')}">📞 ${esc(w.phone)}</a>`:'<span class="nophone">ยังไม่มีเบอร์โทร</span>';
const wsub=w=>esc(`${w.first} ${w.last}`)+(w.pos?' · '+esc(w.pos):'');

/* ---------- เช็คชื่อ ---------- */
let day=iso(new Date()),draft={},dirty=false;
const load=()=>{draft=structuredClone(DB.att[day]||{});dirty=false};
function commit(){const o={};for(const k in draft)if(draft[k].s||draft[k].n)o[k]=draft[k];DB.att[day]=o;persist();dirty=false}
function setDay(d){if(dirty)commit();day=d;load();rCheck()}
function rCheck(){
 const d=new Date(day+'T00:00'),ws=act(),c={};
 ws.forEach(w=>{const s=(draft[w.id]||{}).s;if(s)c[s]=(c[s]||0)+1});
 const done=Object.values(c).reduce((a,b)=>a+b,0);
 const strip=[-2,-1,0,1,2].map(o=>{const x=new Date(d);x.setDate(d.getDate()+o);return `<button class="dy${o?'':' on'}" data-d="${iso(x)}"><small>${DOW[x.getDay()]}</small><b>${x.getDate()}</b></button>`}).join('');
 $('#check').innerHTML=`<h1>เช็คชื่อรายวัน</h1>
 <div class="card"><div class="strip">${strip}</div><div class="dpick"><input type="date" id="dp" value="${day}"><span>${thDate(day)}</span></div></div>
 <div class="chips">${ST.map(s=>`<span class="chip ${CLS[s]}">${s} ${c[s]||0}</span>`).join('')}<span class="chip">ยังไม่เช็ค ${ws.length-done}</span></div>
 <button class="ghost" id="allp">ตั้งคนที่ยังไม่เช็คเป็น “มา” ทั้งหมด</button>
 ${ws.map(w=>{const r=draft[w.id]||{};return `<div class="row ${CLS[r.s]&&r.s!='มา'&&r.s!='ครึ่งวัน'?CLS[r.s]:''}" data-id="${w.id}">
  <div class="who"><b>${esc(w.nick)}</b><small>${wsub(w)}</small>${telA(w)}</div>
  <div class="seg">${ST.map(s=>`<button data-s="${s}" class="${r.s==s?'on '+CLS[s]:''}">${s}</button>`).join('')}</div>
  <input class="note" placeholder="หมายเหตุ" value="${esc(r.n)}"></div>`}).join('')}
 <button class="cta" id="sv"><span><b>บันทึกข้อมูล</b><small>${thDate(day)}</small></span><i>➜</i></button>`}
$('#check').addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
 if(t.dataset.d)return setDay(t.dataset.d);
 if(t.id=='sv'){commit();rCheck();return toast('บันทึกแล้ว ✓')}
 if(t.id=='allp'){act().forEach(w=>{const r=draft[w.id]=draft[w.id]||{};if(!r.s)r.s='มา'});dirty=true;return rCheck()}
 if(t.dataset.s){const id=t.closest('.row').dataset.id,r=draft[id]=draft[id]||{};r.s=r.s==t.dataset.s?'':t.dataset.s;dirty=true;rCheck()}});
$('#check').addEventListener('change',e=>{if(e.target.id=='dp'&&e.target.value)setDay(e.target.value)});
$('#check').addEventListener('input',e=>{if(e.target.classList.contains('note')){const id=e.target.closest('.row').dataset.id;(draft[id]=draft[id]||{}).n=e.target.value;dirty=true}});

/* ---------- จัดการรายชื่อ ---------- */
let showOld=false;
function rWorkers(){
 const ws=DB.workers.filter(w=>showOld?w.active===false:w.active!==false);
 $('#workers').innerHTML=`<h1>จัดการรายชื่อ<small>${admin?'🔓 โหมดแอดมิน':'🔒 ต้องใช้รหัสแอดมินจึงแก้ไขได้'}</small></h1>
 <button class="cta" id="add"><span><b>+ เพิ่มคนงานใหม่</b><small>ชื่อ-นามสกุล ชื่อเล่น เบอร์โทร</small></span><i>➜</i></button>
 <div class="tabs"><button data-o="0" class="${showOld?'':'on'}">ทำงานอยู่ (${act().length})</button><button data-o="1" class="${showOld?'on':''}">ออกแล้ว</button></div>
 ${ws.map(w=>`<div class="card wk" data-id="${w.id}"><div class="who"><b>${esc(w.nick)}</b><small>${wsub(w)}</small>${telA(w)}</div>
  <div class="acts"><button data-a="e">แก้ไข</button><button data-a="${showOld?'r':'d'}">${showOld?'กู้คืน':'ลบ'}</button></div></div>`).join('')||'<p class="empty">ยังไม่มีรายชื่อ</p>'}
 <div class="card"><b>สำรองข้อมูล</b><small>ข้อมูลเก็บในเบราว์เซอร์เครื่องนี้ ควรสำรองไว้เป็นระยะ</small>
 <div class="acts"><button id="bk">ดาวน์โหลดไฟล์สำรอง</button><button id="rs">นำเข้าไฟล์สำรอง</button></div></div>`}
function form(id){
 const w=DB.workers.find(x=>x.id==id)||{first:'',last:'',nick:'',phone:'',pos:''},dlg=$('#dlg');
 dlg.innerHTML=`<form method="dialog"><h2>${id?'แก้ไขข้อมูลคนงาน':'เพิ่มคนงานใหม่'}</h2>
 ${[['first','ชื่อ (เช่น นายสมชาย)'],['last','นามสกุล'],['nick','ชื่อเล่น'],['phone','เบอร์โทร'],['pos','ตำแหน่ง (ไม่บังคับ)']].map(([k,l])=>`<label>${l}<input name="${k}" value="${esc(w[k])}" ${k=='phone'?'type="tel" inputmode="tel"':''}></label>`).join('')}
 <div class="acts"><button value="x">ยกเลิก</button><button value="ok" class="y">บันทึก</button></div></form>`;
 dlg.showModal();
 dlg.querySelector('form').onsubmit=e=>{
  if(e.submitter.value!='ok')return;
  const f=Object.fromEntries([...new FormData(e.target)].map(([k,v])=>[k,v.trim()]));
  if(!f.first&&!f.nick){e.preventDefault();return toast('กรุณากรอกชื่อ')}
  f.nick=f.nick||f.first;
  if(id)Object.assign(w,f);else DB.workers.push({id:'w'+Date.now(),active:true,...f});
  persist();rWorkers();toast('บันทึกรายชื่อแล้ว ✓')}}
$('#workers').addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
 const id=t.closest('.wk')?.dataset.id,w=DB.workers.find(x=>x.id==id);
 if(t.dataset.o)return(showOld=t.dataset.o=='1',rWorkers());
 if(t.id=='add')return ask(()=>form());
 if(t.dataset.a=='e')return ask(()=>form(id));
 if(t.dataset.a=='d')return ask(()=>{if(confirm(`ลบ “${w.nick}” ออกจากรายชื่อ?\n(ประวัติเก่ายังอยู่ในรายงาน กู้คืนได้ที่แท็บ “ออกแล้ว”)`)){w.active=false;persist();rWorkers()}});
 if(t.dataset.a=='r')return ask(()=>{w.active=true;persist();rWorkers()});
 if(t.id=='bk'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DB)],{type:'application/json'}));a.download=`สำรองเช็คชื่อ_${iso(new Date())}.json`;a.click()}
 if(t.id=='rs')ask(()=>$('#file').click())});
$('#file').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!d.workers||!d.att)throw 0;DB=d;persist();rWorkers();toast('นำเข้าแล้ว ✓')}catch(x){toast('ไฟล์ไม่ถูกต้อง')}e.target.value=''};

/* ---------- รายงาน ---------- */
let ym=iso(new Date()).slice(0,7),view='all',pid=null;
function monthData(){
 const[y,m]=ym.split('-').map(Number),n=new Date(y,m,0).getDate();
 const has=w=>Array.from({length:n},(_,i)=>(DB.att[`${ym}-${pad(i+1)}`]||{})[w.id]?.s).some(Boolean);
 const rows=DB.workers.filter(w=>w.active!==false||has(w)).map(w=>{
  const t={},days=[];
  for(let d=1;d<=n;d++){const r=(DB.att[`${ym}-${pad(d)}`]||{})[w.id]||{};days.push(r);if(r.s)t[r.s]=(t[r.s]||0)+1}
  t.work=(t['มา']||0)+(t['สาย']||0)+.5*(t['ครึ่งวัน']||0);return{w,days,t}});
 return{y,m,n,rows}}
function rReport(){
 const D=monthData(),mt=`${MON[D.m-1]} ${D.y+543}`;
 const r1=D.rows.find(r=>r.w.id==pid)||D.rows[0];pid=r1?.w.id;
 const legend=`<div class="chips">${ST.map(s=>`<span class="chip ${CLS[s]}">${SYM[s]} ${s}</span>`).join('')}<span class="chip">รวมวัน = มา + สาย + ½×ครึ่งวัน</span></div>`;
 let body,title;
 if(view=='all'){
  title=`ตารางสรุปการมาทำงาน ประจำเดือน ${mt}`;
  const th=Array.from({length:D.n},(_,i)=>{const dw=DOW[new Date(D.y,D.m-1,i+1).getDay()];return `<th class="${dw=='อา'?'sun':''}">${i+1}<br><small>${dw}</small></th>`}).join('');
  const tr=D.rows.map((r,i)=>`<tr><td>${i+1}</td><td class="nm">${esc(r.w.nick)}</td>${r.days.map(x=>`<td class="${CLS[x.s]||''}">${x.s?SYM[x.s]:''}</td>`).join('')}${ST.map(s=>`<td class="tot ${s!='มา'&&r.t[s]?CLS[s]:''}">${r.t[s]||''}</td>`).join('')}<td class="tot">${r.t.work}</td></tr>`).join('');
  body=`<div class="tw"><table><thead><tr><th>ที่</th><th>ชื่อเล่น</th>${th}${ST.map(s=>`<th>${s}</th>`).join('')}<th>รวมวัน</th></tr></thead><tbody>${tr}</tbody></table></div>`;
 }else if(r1){
  title=`สรุปรายบุคคล: ${r1.w.nick} (${r1.w.first} ${r1.w.last}) ประจำเดือน ${mt}`;
  const tr=r1.days.map((x,i)=>{const dt=new Date(D.y,D.m-1,i+1);return `<tr><td>${i+1} ${MON[D.m-1]}</td><td>${DOW[dt.getDay()]}</td><td class="${CLS[x.s]||''}">${x.s||'-'}</td><td class="note-c">${esc(x.n)}</td></tr>`}).join('');
  body=`<div class="chips">${ST.map(s=>`<span class="chip ${CLS[s]}">${s} ${r1.t[s]||0}</span>`).join('')}<span class="chip">รวมวันทำงาน ${r1.t.work}</span></div>
  <div class="tw"><table><thead><tr><th>วันที่</th><th>วัน</th><th>สถานะ</th><th>หมายเหตุ</th></tr></thead><tbody>${tr}</tbody></table></div>`;
 }else body='<p class="empty">ยังไม่มีข้อมูล</p>',title='';
 $('#report').innerHTML=`<h1>รายงาน</h1>
 <div class="tool"><input type="month" id="mp" value="${ym}">
  <button data-v="all" class="${view=='all'?'y':''}">ภาพรวมทุกคน</button><button data-v="one" class="${view=='one'?'y':''}">รายบุคคล</button>
  ${view=='one'?`<select id="ps">${D.rows.map(r=>`<option value="${r.w.id}" ${r.w.id==pid?'selected':''}>${esc(r.w.nick)}</option>`).join('')}</select>`:''}</div>
 <div class="tool"><button data-x="print">🖨 พิมพ์ / บันทึก PDF</button><button data-x="xls">📗 Excel</button><button data-x="img">🖼 รูปภาพ</button></div>
 <div id="rep"><h2>${esc(title)}</h2>${legend}${body}</div>`}
const fname=()=>`เช็คชื่อ_${ym}${view=='one'?'_'+pid:''}`;
$('#report').addEventListener('change',e=>{if(e.target.id=='mp'&&e.target.value)ym=e.target.value;if(e.target.id=='ps')pid=e.target.value;rReport()});
$('#report').addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
 if(t.dataset.v){view=t.dataset.v;return rReport()}
 if(t.dataset.x=='print')return window.print();
 if(t.dataset.x=='xls'){if(!window.XLSX)return toast('โหลดตัวสร้าง Excel ไม่ได้ (ต้องต่ออินเทอร์เน็ต)');XLSX.writeFile(XLSX.utils.table_to_book($('#rep table')),fname()+'.xlsx')}
 if(t.dataset.x=='img'){if(!window.html2canvas)return toast('โหลดตัวสร้างรูปไม่ได้ (ต้องต่ออินเทอร์เน็ต)');
  const el=$('#rep'),w=($('#rep .tw')?.scrollWidth||el.scrollWidth)+40;
  html2canvas(el,{scale:2,backgroundColor:'#fff',windowWidth:w,onclone:d=>{d.querySelectorAll('.tw').forEach(x=>x.style.overflow='visible');d.getElementById('rep').style.width=w+'px'}})
  .then(c=>{const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download=fname()+'.png';a.click()})}});

/* ---------- เมนู ---------- */
const R={check:rCheck,workers:rWorkers,report:rReport};
function go(p){if(dirty)commit();document.querySelectorAll('.page').forEach(e=>e.classList.toggle('on',e.id==p));document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.p==p));R[p]();scrollTo(0,0)}
$('#nav').addEventListener('click',e=>{const b=e.target.closest('button');if(b)go(b.dataset.p)});
addEventListener('pagehide',()=>dirty&&commit());
load();rCheck();
