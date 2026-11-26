let YRS=[],NY=5;
const TR=['ลดลง','คงที่','เพิ่มขึ้น'],RK=['ลดลง','เท่าเดิม','เพิ่มขึ้น'],WL=['ต่ำ','ปานกลาง','สูง'];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('th-TH');
const pct=(a,b)=>b?((a-b)/b*100):null;
const S={p:0,amp:'',y:4,metric:'total',cmp:'year',sort:['tot',-1],sw:'',sel:-1};
let D,G,R=[],P=[];

function chgTxt(cur,prev,unit=' จุด'){
  if(prev==null)return '<span class="b flat">–</span>';
  const d=cur-prev;if(!d)return '<span class="b flat">● เท่าเดิม</span>';
  const p=prev?` (ร้อยละ ${Math.abs(d/prev*100).toFixed(1)})`:' (จาก 0)';
  return `<span class="b ${d>0?'up':'down'}">${d>0?'▲ เพิ่มขึ้น':'▼ ลดลง'} ${fmt(Math.abs(d))}${unit}${p}</span>`;
}
function watchLv(r){return r.yrs>=4&&(r.risk===2||r.tr===2)?2:r.yrs>=3?1:0}
function rowsP(){return R.filter(r=>r.p===S.p)}
function scope(){return rowsP().filter(r=>!S.amp||r.a===S.amp)}
function sumY(rows){return YRS.map((_,i)=>rows.reduce((s,r)=>s+r.v[i],0))}

function fixKey(k){return (G.fix&&G.fix[k])||k}
function buildRows(){
  NY=D.years.length;YRS=D.years.map(y=>String(y+543));
  R=D.rows.map((x,i)=>{const v=x.slice(3,3+NY);const key=fixKey(`${D.provs[x[0]]}|${x[1]}|${x[2]}`);
    const r={i,p:x[0],a:x[1],t:x[2],v,risk:x[3+NY],sl:x[4+NY],tr:x[5+NY],tot:v.reduce((a,b)=>a+b,0),yrs:v.filter(n=>n>0).length,g:G.tam[key]||null,key};r.w=watchLv(r);return r});
  P=D.provs.map((n,i)=>{const v=sumY(R.filter(r=>r.p===i));return{n,i,v,tot:v.reduce((a,b)=>a+b,0)}});
}
function boot(data,geo){
  D=data;G=geo;buildRows();
  S.p=Math.max(0,D.provs.indexOf('พิษณุโลก'));S.y=NY-1;
  $('#prov').innerHTML=D.provs.map((n,i)=>`<option value="${i}">จังหวัด${esc(n)}</option>`).join('');
  $('#prov').value=S.p;
  $('#year').innerHTML=YRS.map((y,i)=>`<option value="${i}">ปี ${y}</option>`).join('');$('#year').value=S.y;
  $$('.ex-btns').forEach(e=>e.innerHTML=['JPG','PDF','Excel'].map(t=>`<button data-ex="${e.dataset.card}" data-ty="${t}">${t}</button>`).join(''));
  initMap();render();
  window.APP=Object.assign(window.APP||{},{D,G,R,P,S,YRS,render,ready:true});
}
Promise.all(['data/data.json','data/geo.json'].map(u=>fetch(u,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(u);return r.json()})))
  .then(([d,g])=>boot(d,g))
  .catch(e=>{document.querySelector('.tray').insertAdjacentHTML('afterbegin',`<div class="card" style="border:2px solid var(--up)">โหลดข้อมูลไม่สำเร็จ (${esc(e.message)}) กรุณาตรวจการเชื่อมต่ออินเทอร์เน็ตแล้วโหลดหน้าใหม่</div>`)});

function render(){
  $$('[data-ny]').forEach(e=>e.textContent=NY);$$('[data-y0]').forEach(e=>e.textContent=YRS[0]);if($('#built')&&D.built)$('#built').textContent='ปรับปรุงข้อมูลเมื่อ '+new Date(D.built).toLocaleDateString('th-TH',{dateStyle:'long'});$$('[data-yr]').forEach(e=>e.textContent=`${YRS[0]}–${YRS[NY-1]}`);
  const pn=D.provs[S.p];
  const amps=[...new Set(rowsP().map(r=>r.a))].sort((a,b)=>a.localeCompare(b,'th'));
  if(S.amp&&!amps.includes(S.amp))S.amp='';
  $('#amp').innerHTML='<option value="">ทุกอำเภอ</option>'+amps.map(a=>`<option${a===S.amp?' selected':''}>${esc(a)}</option>`).join('');
  $('#tlist').innerHTML=rowsP().map(r=>`<option value="${esc(r.t)}">อ.${esc(r.a)}</option>`).join('');
  $('#title').textContent=`การเผาซ้ำซ้อนในพื้นที่เกษตร จังหวัด${pn}`;
  overview();watch();rings();compare();paintMap();table();chips();
}

function overview(){
  const rows=scope(),v=sumY(rows),y=S.y,where=S.amp?`อำเภอ${S.amp}`:`จังหวัด${D.provs[S.p]}`;
  $('#ovsub').textContent=`${where} ปี ${YRS[y]}`;
  $('#big').innerHTML=`${fmt(v[y])}<small>จุด</small>`;
  $('#chg').innerHTML=`<div>เทียบปี ${YRS[y-1]||'–'}: ${chgTxt(v[y],y?v[y-1]:null)}</div><div>เทียบปี ${YRS[0]}: ${y?chgTxt(v[y],v[0]):'<span class="b flat">–</span>'}</div>`;
  const rk=[...P].sort((a,b)=>b.v[y]-a.v[y]).findIndex(p=>p.i===S.p)+1;
  $('#rkbar').style.width=((18-rk)/17*100)+'%';
  $('#rktxt').textContent=`จังหวัด${D.provs[S.p]} มีจุดความร้อนมากเป็นอันดับ ${rk} จาก 17 จังหวัด ในปี ${YRS[y]}`;
  const mx=Math.max(...v,1);
  $('#bars').innerHTML=v.map((n,i)=>`<button class="bar${i===y?' on':''}" data-y="${i}" aria-label="ปี ${YRS[i]} ${n} จุด"><strong>${fmt(n)}</strong><i style="height:${Math.max(6,n/mx*100)}px"></i><em>${YRS[i]}</em></button>`).join('');
}

function watch(){
  const rows=scope();
  const items=[
    ['w2','สูง','ตำบลเฝ้าระวังสูง','พบ ≥ 4 ปี และความเสี่ยงหรือแนวโน้มเพิ่มขึ้น',rows.filter(r=>r.w===2).length],
    ['y5',String(NY),`พบการเผาครบ ${NY} ปี`,`เผาซ้ำทุกปี ปี ${YRS[0]}–${YRS[NY-1]}`,rows.filter(r=>r.yrs===NY).length],
    ['tr2','▲','แนวโน้ม 5 ปี เพิ่มขึ้น','ความชันเส้นแนวโน้มมากกว่า 0.5',rows.filter(r=>r.tr===2).length],
    ['rk2','!','ความเสี่ยงเกิน 1 ปี เพิ่มขึ้น','ตามคอลัมน์ Risk 1 year ของไฟล์ต้นทาง',rows.filter(r=>r.risk===2).length]];
  $('#watch').innerHTML=items.map(([k,ic,t,s,n])=>`<div class="wrow"><span class="wic">${ic}</span><span><b>${t}</b><small>${s}</small></span><span class="n">${fmt(n)}</span><button class="sw" data-sw="${k}" aria-pressed="${S.sw===k}" aria-label="กรอง ${t}"></button></div>`).join('');
}
function swOk(r){return !S.sw||(S.sw==='w2'&&r.w===2)||(S.sw==='y5'&&r.yrs===NY)||(S.sw==='tr2'&&r.tr===2)||(S.sw==='rk2'&&r.risk===2)}

function rings(){
  const rows=rowsP(),all=rows.reduce((s,r)=>s+r.tot,0)||1,y=S.y;
  const amps=[...new Set(rows.map(r=>r.a))].map(a=>{const rr=rows.filter(r=>r.a===a),v=sumY(rr);return{a,v,tot:v.reduce((x,z)=>x+z,0)}}).sort((a,b)=>b.tot-a.tot);
  const C=2*Math.PI*40;
  $('#rings').innerHTML=amps.map(o=>{const sh=o.tot/all,col=sh>.2?'#c8412b':sh>.1?'#e0663f':'#f0a07f';
    return `<div class="ring${S.amp===o.a?' sel':''}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="var(--tray)" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C*sh} ${C}" transform="rotate(-90 50 50)"/><text x="50" y="50" text-anchor="middle" font-family="Prompt" font-weight="600" font-size="19" fill="currentColor">${(sh*100).toFixed(0)}%</text><text x="50" y="66" text-anchor="middle" font-size="10" fill="var(--mut)">ของจังหวัด</text></svg><h3>อ.${esc(o.a)}</h3><small>ปี ${YRS[y]}: <b>${fmt(o.v[y])}</b> จุด · รวม ${fmt(o.tot)}</small><span style="font-size:13px">${y?chgTxt(o.v[y],o.v[y-1]):''}</span><button data-amp="${esc(o.a)}">${S.amp===o.a?'ดูทุกอำเภอ':'ดูตำบล'}</button></div>`}).join('')
  +`<div class="ring all"><button class="plus" data-amp="" aria-label="ดูทุกอำเภอ" style="padding:0">⟲</button><h3>ทุกอำเภอ</h3><small>ล้างการเลือกอำเภอ</small></div>`;
}

function compare(){
  const y=S.y,m=S.cmp,me=P[S.p];
  $('#cmpsub').textContent=`จังหวัด${me.n}เทียบกับ 16 จังหวัดภาคเหนือและภาคเหนือตอนล่าง`;
  $('#lgme').textContent='จังหวัด'+me.n;
  const val=p=>m==='year'?p.v[y]:m==='tot'?p.tot:(pct(p.v[y],p.v[0])??0);
  const arr=[...P].sort((a,b)=>val(b)-val(a));
  const mx=Math.max(...arr.map(p=>Math.abs(val(p))),1),neg=m==='pct'&&arr.some(p=>val(p)<0);
  $('#hbars').innerHTML=arr.map(p=>{const v=val(p),w=Math.abs(v)/mx*(neg?50:100),l=neg?(v<0?50-w:50):0;
    return `<div class="hb${p.i===S.p?' me':''}"><span>${esc(p.n)}</span><span class="t"><i style="left:${l}%;width:${w}%"></i>${neg?'<span class="zero" style="left:50%"></span>':''}</span><span class="v">${m==='pct'?(v>0?'+':'')+v.toFixed(0)+'%':fmt(v)}</span></div>`}).join('');
  drawLine();
}
const lineEl=$('#line svg');
function drawLine(){
  if(!D)return;const W=lineEl.clientWidth,H=lineEl.clientHeight;if(!W)return;
  const me=P[S.p].v,av=YRS.map((_,i)=>P.reduce((s,p)=>s+p.v[i],0)/P.length);
  const mx=Math.max(...me,...av)*1.15,pl=44,pr=16,pt=16,pb=30;
  const x=i=>pl+i*(W-pl-pr)/Math.max(1,NY-1),yy=v=>pt+(1-v/mx)*(H-pt-pb);
  const path=a=>a.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+yy(v).toFixed(1)).join('');
  let g='';for(let k=0;k<=4;k++){const v=mx*k/4;g+=`<line x1="${pl}" x2="${W-pr}" y1="${yy(v)}" y2="${yy(v)}" stroke="var(--line)"/>`+(W>380?`<text x="${pl-8}" y="${yy(v)+4}" text-anchor="end" font-size="11" fill="var(--mut)">${fmt(Math.round(v))}</text>`:'')}
  lineEl.innerHTML=g+YRS.map((t,i)=>`<text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="12" fill="${i===S.y?'var(--acc)':'var(--mut)'}" font-weight="${i===S.y?600:400}">${t}</text>`).join('')
   +`<path d="${path(av)}" fill="none" stroke="var(--mut)" stroke-width="2" stroke-dasharray="5 5"/><path d="${path(me)}" fill="none" stroke="var(--acc)" stroke-width="3"/>`
   +me.map((v,i)=>`<circle cx="${x(i)}" cy="${yy(v)}" r="${i===S.y?6:4}" fill="var(--acc)" stroke="var(--card)" stroke-width="2"/><text x="${x(i)}" y="${yy(v)-11}" text-anchor="middle" font-size="12" font-weight="600" fill="currentColor">${fmt(v)}</text>`).join('');
}
new ResizeObserver(drawLine).observe(lineEl);

/* ---------- table ---------- */
const cols=()=>[['a','อำเภอ'],['t','ตำบล'],...YRS.map((y,i)=>['y'+i,y,1]),['tot','รวม',1],['yrs','ปีที่พบ',1],['tr','แนวโน้ม 5 ปี'],['risk','ความเสี่ยงเกิน 1 ปี'],['w','เฝ้าระวัง']];
function sv(r,k){return k[0]==='y'&&k!=='yrs'?r.v[+k.slice(1)]:r[k]}
function filtered(){
  const ft=$('#ftrend').value,fr=$('#frisk').value,fy=$('#fyrs').value,fw=$('#fwatch').value,q=$('#fq').value.trim();
  return scope().filter(r=>swOk(r)&&(ft===''||r.tr==ft)&&(fr===''||r.risk==fr)&&(fy===''||(fy==='all'?r.yrs===NY:r.yrs>=+fy))&&(fw===''||r.w==fw)&&(!q||r.t.includes(q)||r.a.includes(q)));
}
function table(){
  const [k,d]=S.sort;
  $('#thr').innerHTML=cols().map(([c,t,n])=>`<th class="${n?'n':''}" data-k="${c}" tabindex="0" ${c===k?`aria-sort="${d>0?'ascending':'descending'}"`:''}>${t}</th>`).join('');
  const rows=filtered().sort((a,b)=>{const x=sv(a,k),y=sv(b,k);return (typeof x==='string'?x.localeCompare(y,'th'):x-y)*d});
  const cls=v=>v===2?'up':v===0?'down':'flat';
  $('#tb').innerHTML=rows.map(r=>`<tr data-i="${r.i}"><td>${esc(r.a)}</td><td><b>${esc(r.t)}</b></td>${r.v.map((n,i)=>`<td class="n"${i===S.y?' style="font-weight:700"':''}>${n||'<span style="color:var(--mut)">0</span>'}</td>`).join('')}<td class="n"><b>${r.tot}</b></td><td class="n">${r.yrs}</td><td><span class="b ${cls(r.tr)}">${TR[r.tr]}</span></td><td><span class="b ${cls(r.risk)}">${RK[r.risk]}</span></td><td><span class="tag w${r.w}">${WL[r.w]}</span></td></tr>`).join('')||'<tr><td colspan="${cols().length}" style="text-align:center;padding:30px;color:var(--mut)">ไม่พบตำบลตามเงื่อนไข</td></tr>';
  $('#cnt').textContent=`แสดง ${rows.length} จาก ${scope().length} ตำบล · เฝ้าระวังสูง ${rows.filter(r=>r.w===2).length} ตำบล`;
}

/* ---------- export preview ---------- */
function summary(card){
  const y=S.y,pn=D.provs[S.p],rows=scope(),v=sumY(rows),where=S.amp?`อำเภอ${S.amp} จังหวัด${pn}`:`จังหวัด${pn}`;
  const ch=(a,b)=>{if(b==null)return 'เปรียบเทียบไม่ได้';const d=a-b;return d===0?'เท่ากับปีที่เทียบ':`${d>0?'เพิ่มขึ้น':'ลดลง'} ${fmt(Math.abs(d))} จุด${b?` คิดเป็นร้อยละ ${Math.abs(d/b*100).toFixed(1)}`:''}`};
  const rk=[...P].sort((a,b)=>b.v[y]-a.v[y]).findIndex(p=>p.i===S.p)+1;
  const top=[...rows].sort((a,b)=>b.tot-a.tot).slice(0,3).map(r=>`ต.${r.t} (${r.tot} จุด)`).join(', ');
  const amps=[...new Set(rowsP().map(r=>r.a))].map(a=>({a,v:sumY(rowsP().filter(r=>r.a===a))})).sort((a,b)=>b.v.reduce((s,n)=>s+n,0)-a.v.reduce((s,n)=>s+n,0));
  const ups=y?amps.filter(o=>o.v[y]>o.v[y-1]).map(o=>'อ.'+o.a):[];
  const avg=P.reduce((s,p)=>s+p.v[y],0)/P.length;
  const S1=`ปี ${YRS[y]} ${where} พบจุดความร้อนในพื้นที่เกษตร ${fmt(v[y])} จุด ${y?(v[y]===v[y-1]?`เท่ากับปี ${YRS[y-1]}`:`${ch(v[y],v[y-1])} จากปี ${YRS[y-1]}`):''}`;
  const M={
    overview:[S1,y?`เมื่อเทียบกับปี ${YRS[0]} ${ch(v[y],v[0])}`:`ปี ${YRS[0]} เป็นปีฐาน จึงเปรียบเทียบกับปีก่อนหน้าไม่ได้`,`จังหวัด${pn}มีจุดความร้อนมากเป็นอันดับ ${rk} จาก 17 จังหวัด`],
    watch:[`${where} มีตำบลเฝ้าระวังสูง ${rows.filter(r=>r.w===2).length} ตำบล จากทั้งหมด ${rows.length} ตำบล`,`ตำบลที่พบการเผาครบ ${NY} ปี มี ${rows.filter(r=>r.yrs===NY).length} ตำบล ควรจัดชุดเฝ้าระวังเป็นลำดับแรก`,`ตำบลที่แนวโน้ม 5 ปีเพิ่มขึ้น มี ${rows.filter(r=>r.tr===2).length} ตำบล`],
    district:[`อ.${amps[0].a} มีสัดส่วนจุดความร้อนรวม ${NY} ปีสูงสุด ร้อยละ ${(amps[0].v.reduce((s,n)=>s+n,0)/rowsP().reduce((s,r)=>s+r.tot,0)*100).toFixed(1)} ของจังหวัด`,ups.length?`อำเภอที่จุดความร้อนปี ${YRS[y]} เพิ่มขึ้นจากปีก่อนหน้า ได้แก่ ${ups.join(' ')}`:`ปี ${YRS[y]} ไม่มีอำเภอที่จุดความร้อนเพิ่มขึ้นจากปีก่อนหน้า`],
    compare:[`ปี ${YRS[y]} จังหวัด${pn} มีจุดความร้อน ${fmt(P[S.p].v[y])} จุด อยู่อันดับที่ ${rk} จาก 17 จังหวัด`,`ค่าเฉลี่ย 17 จังหวัด ${fmt(Math.round(avg))} จุดต่อจังหวัด จังหวัด${pn}${P[S.p].v[y]>avg?'สูงกว่า':'ต่ำกว่า'}ค่าเฉลี่ย`,`จังหวัดที่มีจุดความร้อนสูงสุด คือ จังหวัด${[...P].sort((a,b)=>b.v[y]-a.v[y])[0].n}`],
    map:[`แผนที่แสดง${$('#metric .on').textContent}รายตำบล ${where}`,`ตำบลที่มีจุดความร้อนรวม ${NY} ปีสูงสุด 3 อันดับ ได้แก่ ${top}`],
    table:[`ตารางแสดง ${filtered().length} ตำบล ตามเงื่อนไขที่เลือก`,`ตำบลที่มีจุดความร้อนรวม ${NY} ปีสูงสุด ได้แก่ ${top}`]};
  M.report=[...M.overview,...M.district,...M.watch.slice(0,2)];
  return M[card];
}
const TITLES={overview:'จุดความร้อนในพื้นที่เกษตร',watch:'ตำบลที่ต้องเฝ้าระวัง',district:'อำเภอที่พบการเผาซ้ำซ้อน',compare:'เปรียบเทียบ 17 จังหวัด',map:'แผนที่ระดับสีรายตำบล',table:'ตารางตำบล',report:'รายงานสรุปการเผาซ้ำซ้อนในพื้นที่เกษตร'};
/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('button,[data-k]');if(!t)return;
  if(t.dataset.ex){if(t.dataset.ex==='report')openReport();else exportCard(t.dataset.ex,t.dataset.ty);return}
  if(t.dataset.orient){$('#dlg').close();exportReport(t.dataset.orient);return}
  if(t.dataset.y){S.y=+t.dataset.y;$('#year').value=S.y;render();return}
  if(t.dataset.sw){S.sw=S.sw===t.dataset.sw?'':t.dataset.sw;watch();paintMap();table();chips();return}
  if(t.dataset.clr){if(t.dataset.clr==='amp')S.amp='';else S.sw='';render();if(t.dataset.clr==='amp')fitProv();return}
  if(t.dataset.amp!==undefined){S.amp=S.amp===t.dataset.amp?'':t.dataset.amp;render();fitArea();return}
  if(t.dataset.k){S.sort=[t.dataset.k,S.sort[0]===t.dataset.k?-S.sort[1]:(['a','t'].includes(t.dataset.k)?1:-1)];table();return}
  const seg=t.closest('.seg');
  if(seg&&t.dataset.m){seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===t));if(seg.id==='cmpmode'){S.cmp=t.dataset.m;compare()}else{S.metric=t.dataset.m;paintMap()}}
});
$('#thr').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.k)e.target.click()});
$('#prov').onchange=e=>{S.p=+e.target.value;S.amp='';S.sw='';S.sel=-1;render();fitProv()};
$('#amp').onchange=e=>{S.amp=e.target.value;render();fitArea()};
$('#mprov').onchange=e=>{S.p=+e.target.value;S.amp='';S.sw='';S.sel=-1;$('#prov').value=S.p;render();fitProv()};
$('#mamp').onchange=e=>{S.amp=e.target.value;S.sel=-1;render();fitArea()};
$('#mtam').onchange=e=>{if(e.target.value===''){fitArea();return}const i=+e.target.value;pick(i);const el=$(`#gt path[data-i="${i}"]`);if(el)fitBox(el.getBBox(),4)};
$('#year').onchange=e=>{S.y=+e.target.value;render()};
['#ftrend','#frisk','#fyrs','#fwatch'].forEach(s=>$(s).onchange=table);
$('#fq').oninput=table;
const findT=e=>{const r=rowsP().find(r=>r.t===e.target.value.trim());if(r){pick(r.i);$('#map').scrollIntoView({behavior:'smooth'});const el=$(`#gt path[data-i="${r.i}"]`);if(el)fitBox(el.getBBox(),4);$('#fq').value=r.t;table()}};
$('#q').onchange=findT;$('#q2').onchange=findT;
$('#dclose').onclick=()=>$('#dlg').close();
const secs=['overview','district','compare','map','table'];
const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting)$$('.rail a,.dock a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+en.target.id))}),{rootMargin:'-40% 0px -55% 0px'});
secs.forEach(id=>io.observe(document.getElementById(id)));
