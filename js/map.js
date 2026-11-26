/* ---------- map ---------- */
const SEQ=['#fbeee4','#f6c9ad','#ef9a72','#e0663f','#b8361f','#7d1d10'];
const CAT3=['#5f9a72','#cbbfb2','#c8412b'];
const WC=['#e8dccf','#f0b04f','#c8412b'];
let VB,proj,AMP=[],EX=[];
const ringD=r=>'M'+r.map(p=>proj(p).join(' ')).join('L')+'Z';
const geoD=g=>g.map(pl=>pl.map(ringD).join('')).join('');
function initMap(){
  const lat0=17.5,k=100,c=Math.cos(lat0*Math.PI/180);
  proj=([x,y])=>[+((x-97)*c*k).toFixed(1),+((lat0-y)*k).toFixed(1)];
  
  AMP=G.amps.map(([p,a,g,lp])=>({p,a,g,lp:proj(lp)}));
  buildPaths();
  $('#gp').innerHTML=G.pout.map((pp,i)=>`<path class="p" data-p="${i}" d="${geoD(pp)}"/>`).join('');
  const box=$('#mapbox'),tip=$('#tip');let drag=null,moved=0;
  const hit=el=>{const t=el&&el.closest&&el.closest('path.t');if(!t)return null;return t.dataset.i!=null?{r:R[+t.dataset.i]}:{e:EX[+t.dataset.x]}};
  box.addEventListener('pointermove',e=>{
    if(drag){const s=VB[2]/box.clientWidth,dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);VB[0]=drag.vb[0]-dx*s;VB[1]=drag.vb[1]-dy*s;setVB();tip.style.opacity=0;return}
    const h=hit(e.target);if(!h){tip.style.opacity=0;return}
    const o=h.r||h.e,b=box.getBoundingClientRect(),other=o.p!==S.p;
    tip.innerHTML=`ต.${esc(o.t)} อ.${esc(o.a)} จ.${esc(D.provs[o.p])} · ${h.r?esc(mlabel(h.r)):`ไม่พบจุดความร้อน ${NY} ปี`}${other?'<br><small>แตะเพื่อเปลี่ยนเป็นจังหวัดนี้</small>':''}`;
    tip.style.left=Math.max(4,Math.min(e.clientX-b.left+12,b.width-230))+'px';tip.style.top=(e.clientY-b.top+14)+'px';tip.style.opacity=1});
  box.addEventListener('pointerleave',()=>tip.style.opacity=0);
  box.addEventListener('pointerdown',e=>{if(e.target.closest('.zoom'))return;drag={x:e.clientX,y:e.clientY,vb:[...VB]};moved=0;box.setPointerCapture(e.pointerId)});
  box.addEventListener('pointerup',e=>{const was=drag;drag=null;if(!was||moved>=6)return;
    const h=hit(document.elementFromPoint(e.clientX,e.clientY));if(!h)return;const o=h.r||h.e;
    if(o.p!==S.p){S.p=o.p;S.amp='';S.sw='';render();fitProv()}
    if(h.r)pick(h.r.i);else showEmpty(o)});
  box.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.2:.83)},{passive:false});
  $('#zi').onclick=()=>zoom(.7);$('#zo').onclick=()=>zoom(1.4);$('#zr').onclick=()=>fitArea();
  $('#zall').onclick=()=>{const b=$('#gp').getBBox();fitBox(b,1.04)};
  fitProv();
  new ResizeObserver(()=>{if(VB)setVB()}).observe(box);
}
function buildPaths(){
  const used=new Set(R.map(r=>r.key));
  EX=Object.keys(G.tam).filter(k=>!used.has(k)).map(k=>{const [pv,a,t]=k.split('|');return{p:D.provs.indexOf(pv),a,t,g:G.tam[k]}});
  $('#gt').innerHTML=R.map(r=>r.g?`<path class="t" data-i="${r.i}" data-k="${esc(r.key)}" d="${geoD(r.g)}"/>`:'').join('')
    +EX.map((e,j)=>`<path class="t nd" data-x="${j}" d="${geoD(e.g)}"/>`).join('');
}
function setVB(){
  $('#msvg').setAttribute('viewBox',VB.map(n=>n.toFixed(1)).join(' '));
  if(typeof queueBase==='function')queueBase();
  const W=$('#mapbox').clientWidth||600,u=VB[2]/W;
  const pl=G.plab.map((c,i)=>{const [x,y]=proj(c),fs=(i===S.p?15:13)*u;return `<text class="pl${i===S.p?' me':''}" x="${x}" y="${y}" font-size="${fs}" stroke-width="${3.5*u}" text-anchor="middle">${esc(D.provs[i])}</text>`}).join('');
  const al=VB[2]<520?AMP.filter(a=>a.p===S.p).map(a=>`<text class="al" x="${a.lp[0]}" y="${a.lp[1]+16*u}" font-size="${11.5*u}" stroke-width="${3*u}" text-anchor="middle">อ.${esc(a.a)}</text>`).join(''):'';
  $('#gl').innerHTML=al+pl;
}
function zoom(f){const cx=VB[0]+VB[2]/2,cy=VB[1]+VB[3]/2;VB[2]*=f;VB[3]*=f;VB[0]=cx-VB[2]/2;VB[1]=cy-VB[3]/2;setVB()}
function fitBox(b,pad=1.12){const box=$('#mapbox'),ar=box.clientWidth/box.clientHeight||1.4;let w=Math.max(b.width,30)*pad,h=Math.max(b.height,30)*pad;if(w/h<ar)w=h*ar;else h=w/ar;VB=[b.x+b.width/2-w/2,b.y+b.height/2-h/2,w,h];setVB()}
function fitProv(){const el=$(`#gp path[data-p="${S.p}"]`);if(el)fitBox(el.getBBox())}
function fitArea(){
  if(S.sel>=0&&R[S.sel].p===S.p&&$('#mtam').value){const el=$(`#gt path[data-i="${S.sel}"]`);if(el){fitBox(el.getBBox(),4);return}}
  if(S.amp){const el=$(`#ga path[data-a="${CSS.escape(S.amp)}"]`);if(el){fitBox(el.getBBox(),1.5);return}}
  fitProv();
}
const yc=n=>n<=0?0:Math.min(5,Math.max(1,Math.round(n*5/NY)));
function mval(r){const m=S.metric;return m==='total'?r.tot:m==='year'?r.v[S.y]:m==='yrs'?r.yrs:m==='trend'?r.tr:m==='risk'?r.risk:r.w}
function mlabel(r){const m=S.metric;return m==='total'?`รวม ${NY} ปี ${r.tot} จุด`:m==='year'?`ปี ${YRS[S.y]} ${r.v[S.y]} จุด`:m==='yrs'?`พบ ${r.yrs} ปี`:m==='trend'?`แนวโน้ม${TR[r.tr]}`:m==='risk'?`ความเสี่ยง${RK[r.risk]}`:`เฝ้าระวัง${WL[r.w]}`}
function bins(){const m=S.metric;return m==='total'?[0,5,10,20,40,80]:m==='year'?[0,1,3,6,10,20]:null}
function color(r){const m=S.metric,v=mval(r);
  if(m==='trend'||m==='risk')return CAT3[v];
  if(m==='watch')return WC[v];
  if(m==='yrs')return SEQ[yc(v)];
  const b=bins();let k=0;for(let i=0;i<b.length;i++)if(v>=b[i])k=i;return v===0?'#efe9e1':SEQ[k];}
function paintMap(){
  if(!VB)return;
  $('#ga').innerHTML=AMP.filter(a=>a.p===S.p).map(a=>`<path class="a" data-a="${esc(a.a)}" d="${geoD(a.g)}"/>`).join('');
  $$('#gt path[data-i]').forEach(el=>{const r=R[+el.dataset.i];el.setAttribute('fill',color(r));el.classList.toggle('dim',r.p===S.p&&((!!S.amp&&r.a!==S.amp)||!swOk(r)));el.classList.toggle('sel',r.i===S.sel)});
  $$('#gt path.nd').forEach(el=>{const e=EX[+el.dataset.x];el.classList.toggle('dim',e.p===S.p&&(!!S.amp&&e.a!==S.amp||!!S.sw))});
  $$('#gp path').forEach(el=>el.classList.toggle('me',+el.dataset.p===S.p));
  const m=S.metric;let L;
  if(m==='trend')L=TR.map((t,i)=>[CAT3[i],t]);else if(m==='risk')L=RK.map((t,i)=>[CAT3[i],t]);
  else if(m==='watch')L=WL.map((t,i)=>[WC[i],t]);
  else if(m==='yrs')L=Array.from({length:NY},(_,k)=>k+1).map(n=>[SEQ[yc(n)],`${n} ปี`]);
  else{const b=bins();L=[['#efe9e1','0 จุด']].concat(b.slice(1).map((v,i)=>[SEQ[i+1],i===b.length-2?`${v}+ จุด`:`${v}–${b[i+2]-1} จุด`]))}
  $('#mlg').innerHTML=L.map(([c,t])=>`<span><i style="background:${c}"></i>${esc(t)}</span>`).join('')+'<span><i class="ndk"></i>ไม่พบจุดความร้อน '+NY+' ปี</span><span><i style="background:none;border:2px solid #000;background:#fff"></i>เขตจังหวัด</span><span><i style="background:none;border:1.5px dashed currentColor"></i>เขตอำเภอ</span>';
  setVB();mapFilters();
}
function mapFilters(){
  $('#mprov').innerHTML=D.provs.map((n,i)=>`<option value="${i}"${i===S.p?' selected':''}>จังหวัด${esc(n)}</option>`).join('');
  const amps=[...new Set(AMP.filter(a=>a.p===S.p).map(a=>a.a))].sort((a,b)=>a.localeCompare(b,'th'));
  $('#mamp').innerHTML='<option value="">ทุกอำเภอ</option>'+amps.map(a=>`<option${a===S.amp?' selected':''}>${esc(a)}</option>`).join('');
  const ts=scope().filter(r=>r.g).sort((a,b)=>a.t.localeCompare(b.t,'th'));
  const cur=S.sel>=0&&ts.some(r=>r.i===S.sel)?S.sel:-1;
  $('#mtam').innerHTML=`<option value="">ตำบล: เลือกเพื่อซูม (${ts.length} ตำบลที่พบจุด)</option>`+ts.map(r=>`<option value="${r.i}"${r.i===cur?' selected':''}>ต.${esc(r.t)}${S.amp?'':' · อ.'+esc(r.a)}</option>`).join('');
}
function showEmpty(e){
  $('#info').innerHTML=`<h3>ต.${esc(e.t)}</h3><div style="color:var(--mut)">อ.${esc(e.a)} จ.${esc(D.provs[e.p])}</div><p style="margin:12px 0 0">ไม่พบจุดความร้อนในพื้นที่เกษตร ปี ${YRS[0]}–${YRS[NY-1]}</p>`;
}
function pick(i){
  const r=R[i];S.sel=i;const mx=Math.max(...r.v,1);
  $$('#gt path.sel').forEach(el=>el.classList.remove('sel'));const el=$(`#gt path[data-i="${i}"]`);if(el)el.classList.add('sel');
  if(r.p===S.p&&$('#mtam').querySelector(`option[value="${i}"]`))$('#mtam').value=i;
  $('#info').innerHTML=`<h3>ต.${esc(r.t)}</h3><div style="color:var(--mut)">อ.${esc(r.a)} จ.${esc(D.provs[r.p])}</div>
  <div class="mini">${r.v.map((n,k)=>`<div><span style="font-weight:600;color:var(--ink)">${n}</span><i style="height:${Math.max(3,n/mx*52)}px;${k===S.y?'':'opacity:.45'}"></i>${YRS[k].slice(-2)}</div>`).join('')}</div>
  <dl><dt>รวม ${NY} ปี</dt><dd>${fmt(r.tot)} จุด</dd><dt>จำนวนปีที่พบ</dt><dd>${r.yrs} ปี</dd><dt>แนวโน้ม 5 ปี</dt><dd>${TR[r.tr]} (${r.sl>0?'+':''}${r.sl})</dd><dt>ความเสี่ยงเกิน 1 ปี</dt><dd>${RK[r.risk]}</dd><dt>ระดับเฝ้าระวัง</dt><dd><span class="tag w${r.w}">${WL[r.w]}</span></dd></dl>`;
}
function chips(){
  const SWN={w2:'ตำบลเฝ้าระวังสูง',y5:`พบการเผาครบ ${NY} ปี`,tr2:'แนวโน้ม 5 ปี เพิ่มขึ้น',rk2:'ความเสี่ยงเกิน 1 ปี เพิ่มขึ้น'};
  const c=[];if(S.amp)c.push(['amp',`อำเภอ: <b>${esc(S.amp)}</b>`]);if(S.sw)c.push(['sw',`แสดงเฉพาะ: <b>${SWN[S.sw]}</b>`]);
  $('#chips').innerHTML=c.length?`<span style="font-size:14px;color:var(--mut);align-self:center">ตัวกรองที่ใช้อยู่</span>`+c.map(([k,t])=>`<button class="chip" data-clr="${k}" aria-label="ล้างตัวกรอง">${t}<span>✕</span></button>`).join(''):'';
}

/* ---------- basemap ---------- */
const BASES={
  sat:{url:(z,x,y)=>`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,attr:'ภาพ: Esri, Maxar, Earthstar Geographics'},
  street:{url:(z,x,y)=>`https://a.basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`,attr:'แผนที่: © OpenStreetMap contributors © CARTO'}
};
let BASE='sat',baseRaf=0;
const LAT0=17.5,KX=100*Math.cos(17.5*Math.PI/180),KY=100;
const t2lng=(x,z)=>x/2**z*360-180;
const t2lat=(y,z)=>{const n=Math.PI-2*Math.PI*y/2**z;return 180/Math.PI*Math.atan(Math.sinh(n))};
const lng2t=(l,z)=>Math.floor((l+180)/360*2**z);
const lat2t=(l,z)=>{const r=l*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*2**z)};
function setBase(kind){
  BASE=kind;$$('#basesel button').forEach(b=>b.classList.toggle('on',b.dataset.base===kind));drawBase();
}
function drawBase(){
  const g=$('#gbase'),svg=$('#msvg'),at=$('#attr');if(!g||!VB)return;
  const B=BASES[BASE];svg.classList.toggle('hasbase',!!B);
  if(!B){g.innerHTML='';at.textContent='';return}
  at.textContent=B.attr;
  const W=$('#mapbox').clientWidth||800;
  const pxPerDeg=W/(VB[2]/KX);
  const z=Math.max(5,Math.min(16,Math.round(Math.log2(pxPerDeg*360/256))));
  const lngA=97+VB[0]/KX,lngB=97+(VB[0]+VB[2])/KX,latT=LAT0-VB[1]/KY,latB=LAT0-(VB[1]+VB[3])/KY;
  const x0=lng2t(lngA,z),x1=lng2t(lngB,z),y0=lat2t(latT,z),y1=lat2t(latB,z);
  if((x1-x0+1)*(y1-y0+1)>120){g.innerHTML='';return}
  let out='';
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
    const X=(t2lng(x,z)-97)*KX,X2=(t2lng(x+1,z)-97)*KX,Y=(LAT0-t2lat(y,z))*KY,Y2=(LAT0-t2lat(y+1,z))*KY;
    out+=`<image href="${B.url(z,x,y)}" x="${X.toFixed(2)}" y="${Y.toFixed(2)}" width="${(X2-X+0.05).toFixed(2)}" height="${(Y2-Y+0.05).toFixed(2)}" preserveAspectRatio="none"/>`;
  }
  g.innerHTML=out;
}
function queueBase(){cancelAnimationFrame(baseRaf);baseRaf=requestAnimationFrame(drawBase)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-base]');if(b)setBase(b.dataset.base)});
