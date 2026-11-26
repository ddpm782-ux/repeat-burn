/* ---------- ส่งออก JPG / PDF / Excel ---------- */
const CARD_TH={overview:'ภาพรวม',watch:'เฝ้าระวัง',district:'อำเภอ',compare:'เทียบจังหวัด',map:'แผนที่',table:'ตารางตำบล',report:'รายงาน'};
const PIX='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const ORG='สำนักงานป้องกันและบรรเทาสาธารณภัยจังหวัดพิษณุโลก';
const SRC_LINE=()=>`แหล่งที่มาข้อมูล: สำนักงานเกษตรจังหวัดพิษณุโลก · จุดความร้อนดาวเทียม VIIRS ในพื้นที่เกษตร ปี พ.ศ. ${YRS[0]}–${YRS[NY-1]} · หน่วย: จุด`;

function fname(card,ext){return `เผาซ้ำซ้อน_${CARD_TH[card]}_${D.provs[S.p]}_${YRS[S.y]}.${ext}`}
function metaLine(){return `จังหวัด${D.provs[S.p]} · ${S.amp?'อำเภอ'+S.amp:'ทุกอำเภอ'} · ปี ${YRS[S.y]}`}
function nowTH(){return new Date().toLocaleString('th-TH',{dateStyle:'long',timeStyle:'short'})+' น.'}
function toast(msg){const t=$('#toast');t.textContent=msg||'';t.classList.toggle('on',!!msg)}

async function saveBlob(blob,name){
  const file=new File([blob],name,{type:blob.type});
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if((APP.forceShare||(standalone&&ios))&&navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:name});return}catch(e){if(e.name==='AbortError')return}
  }
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),60000);
}

function section(card,withHead){
  const el=document.createElement('div');el.className='exsec';
  const head=withHead?`<div class="rh"><img src="img/logo-ddpm.png" alt="" class="rlogo"><div class="rtitle"><h3>${esc(withHead)}</h3><div class="meta">${esc(metaLine())}</div></div><div class="meta rorg">${esc(ORG)}<br>ส่งออกเมื่อ ${esc(nowTH())}</div></div>`:'';
  el.innerHTML=`${head}${withHead===TITLES[card]?'':`<h4 class="sth">${esc(TITLES[card])}</h4>`}<div class="exfig"></div>
    <div class="sum"><b>สรุปข้อมูล</b><ol>${summary(card).map(t=>`<li>${esc(t)}</li>`).join('')}</ol></div>`;
  const fig=$('#c-'+card+' .ex').cloneNode(true);
  fig.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
  fig.querySelectorAll('.zoom,.tip').forEach(e=>e.remove());
  if(card==='table')fig.style.maxHeight='none';
  el.querySelector('.exfig').appendChild(fig);
  return el;
}
function stage(nodes,foot=true){
  const st=$('#exstage');st.innerHTML='';st.style.width=(APP.exWidth||1100)+'px';
  const wrap=document.createElement('div');wrap.className='sheet exwrap';
  nodes.forEach(n=>wrap.appendChild(n));
  if(foot)wrap.insertAdjacentHTML('beforeend',`<div class="src">${esc(SRC_LINE())}</div>`);
  st.appendChild(wrap);APP.lastStageText=wrap.textContent;return wrap;
}
async function snap(el){
  await document.fonts.ready;
  await Promise.all([...el.querySelectorAll('img')].map(i=>i.decode?i.decode().catch(()=>{}):null));
  return htmlToImage.toCanvas(el,{pixelRatio:2,backgroundColor:'#ffffff',imagePlaceholder:PIX,cacheBust:false});
}
function canvasBlob(cv,type='image/jpeg',q=.93){return new Promise(r=>cv.toBlob(r,type,q))}

function pdfFrom(canvases,orient,title,subject){
  const {jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:orient,unit:'mm',format:'a4'});
  const PW=orient==='l'?297:210,PH=orient==='l'?210:297,M=10,CW=PW-2*M,CH=PH-2*M;
  let y=M,first=true;
  for(const cv of canvases){
    const scale=CW/cv.width,h=cv.height*scale;
    if(!first&&y+Math.min(h,CH)>PH-M){pdf.addPage();y=M}
    let sy=0;
    while(sy<cv.height){
      const room=(PH-M-y)/scale,take=Math.min(room,cv.height-sy);
      if(take<40&&sy<cv.height){pdf.addPage();y=M;continue}
      const part=document.createElement('canvas');part.width=cv.width;part.height=Math.ceil(take);
      part.getContext('2d').drawImage(cv,0,sy,cv.width,take,0,0,cv.width,take);
      pdf.addImage(part.toDataURL('image/jpeg',.92),'JPEG',M,y,CW,take*scale);
      sy+=take;y+=take*scale+4;
      if(sy<cv.height){pdf.addPage();y=M}
    }
    first=false;
  }
  pdf.setProperties({title,subject,author:ORG,creator:'Dashboard การเผาซ้ำซ้อนในพื้นที่เกษตร'});
  return pdf.output('blob');
}

/* ---------- Excel ---------- */
function tambonTable(rows){
  const head=['จังหวัด','อำเภอ','ตำบล',...YRS.map(y=>`ปี ${y} (จุด)`),`รวม ${NY} ปี (จุด)`,'จำนวนปีที่พบ','แนวโน้ม 5 ปี','ความเสี่ยงเผาซ้ำซ้อนเกิน 1 ปี','ระดับเฝ้าระวัง'];
  return [head,...rows.map(r=>[D.provs[r.p],r.a,r.t,...r.v,r.tot,r.yrs,TR[r.tr],RK[r.risk],WL[r.w]])];
}
function sheetData(card){
  const rows=scope();
  if(card==='overview'){const v=sumY(rows);return [['ปี','จำนวนจุด','เปลี่ยนแปลงจากปีก่อนหน้า (จุด)','ร้อยละการเปลี่ยนแปลง'],...v.map((n,i)=>[YRS[i],n,i?n-v[i-1]:'',i&&v[i-1]?+((n-v[i-1])/v[i-1]*100).toFixed(1):''])]}
  if(card==='district'){const all=rowsP().reduce((s,r)=>s+r.tot,0)||1;const amps=[...new Set(rowsP().map(r=>r.a))];
    return [['อำเภอ',...YRS.map(y=>`ปี ${y}`),`รวม ${NY} ปี`,'ร้อยละของจังหวัด'],...amps.map(a=>{const v=sumY(rowsP().filter(r=>r.a===a)),t=v.reduce((x,z)=>x+z,0);return [a,...v,t,+(t/all*100).toFixed(1)]}).sort((x,z)=>z[NY+1]-x[NY+1])]}
  if(card==='compare')return [['จังหวัด',...YRS.map(y=>`ปี ${y}`),`รวม ${NY} ปี`],...[...P].sort((a,b)=>b.v[S.y]-a.v[S.y]).map(p=>[p.n,...p.v,p.tot])];
  if(card==='table')return tambonTable(filtered());
  return tambonTable(rows.filter(swOk));
}
function defSheet(){
  return [['คอลัมน์','ความหมาย'],
    [`ปี ${YRS[0]}–${YRS[NY-1]}`,'จำนวนจุดความร้อนดาวเทียม VIIRS ที่พบในพื้นที่เกษตรของแต่ละปี (หน่วย: จุด)'],
    [`รวม ${NY} ปี`,'ผลรวมจุดความร้อนทุกปี'],
    ['จำนวนปีที่พบ',`จำนวนปีที่พบจุดความร้อนอย่างน้อย 1 จุด (1–${NY} ปี)`],
    ['แนวโน้ม 5 ปี','ความชันเส้นแนวโน้มจากไฟล์ต้นทาง: มากกว่า 0.5 = เพิ่มขึ้น · −0.5 ถึง 0.5 = คงที่ · น้อยกว่า −0.5 = ลดลง'],
    ['ความเสี่ยงเผาซ้ำซ้อนเกิน 1 ปี','ค่าตามคอลัมน์ Risk 1 year ของไฟล์ต้นทาง (เพิ่มขึ้น / เท่าเดิม / ลดลง)'],
    ['ระดับเฝ้าระวัง','สูง = พบ 4 ปีขึ้นไป และความเสี่ยงหรือแนวโน้มเพิ่มขึ้น · ปานกลาง = พบ 3 ปีขึ้นไป · ต่ำ = กรณีอื่น'],
    ['แหล่งที่มาข้อมูล','สำนักงานเกษตรจังหวัดพิษณุโลก'],['จัดทำโดย',ORG]];
}
function xlsxBlob(card){
  const wb=XLSX.utils.book_new();
  const add=(aoa,name,widths)=>{const ws=XLSX.utils.aoa_to_sheet(aoa);if(widths)ws['!cols']=widths.map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,ws,name)};
  const data=sheetData(card);
  add(data,'ข้อมูล',data[0].map(h=>Math.max(10,String(h).length+2)));
  add(defSheet(),'คำอธิบาย',[26,90]);
  add([[TITLES[card]],[metaLine()],[`ส่งออกเมื่อ ${nowTH()}`],[SRC_LINE()],[],['สรุปข้อมูล'],...summary(card).map((t,i)=>[`${i+1}. ${t}`])],'สรุปข้อมูล',[110]);
  return new Blob([XLSX.write(wb,{bookType:'xlsx',type:'array'})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

/* ---------- ทางเข้า ---------- */
let exBusy=false;
async function exportCard(card,type){
  if(exBusy)return;exBusy=true;toast(`กำลังสร้างไฟล์ ${type}…`);
  try{
    if(type==='Excel'){await saveBlob(xlsxBlob(card),fname(card,'xlsx'));return}
    const wrap=stage([section(card,TITLES[card])]);
    const cv=await snap(wrap);
    if(type==='JPG')await saveBlob(await canvasBlob(cv),fname(card,'jpg'));
    else await saveBlob(pdfFrom([cv],cv.width>cv.height*1.15?'l':'p',TITLES[card],'สรุปข้อมูล: '+summary(card).join(' ')),fname(card,'pdf'));
  }catch(e){console.error(e);toast('สร้างไฟล์ไม่สำเร็จ กรุณาลองใหม่');setTimeout(()=>toast(''),4000);exBusy=false;return}
  finally{$('#exstage').innerHTML='';if(exBusy){exBusy=false;toast('')}}
}
function openReport(){
  $('#dt').textContent='รายงาน PDF ทั้งฉบับ';
  $('#dbody').innerHTML=`<p style="margin:0 0 14px">รายงานประกอบด้วย ภาพรวม ตำบลที่ต้องเฝ้าระวัง อำเภอ เปรียบเทียบ 17 จังหวัด แผนที่ และตารางตำบล ตามตัวกรองที่เลือกอยู่ (${esc(metaLine())})</p>
  <div class="orient"><button data-orient="p"><span class="pg p"></span>A4 แนวตั้ง</button><button data-orient="l"><span class="pg l"></span>A4 แนวนอน</button></div>`;
  $('#dlg').showModal();
}
async function exportReport(orient){
  if(exBusy)return;exBusy=true;
  try{
    APP.exWidth=orient==='l'?1400:1100;
    const order=['overview','watch','district','compare','map','table'],cvs=[];
    for(let i=0;i<order.length;i++){
      toast(`กำลังสร้างรายงาน ${i+1}/${order.length}…`);
      const wrap=stage([section(order[i],i===0?TITLES.report:'')],i===order.length-1);
      cvs.push(await snap(wrap));
    }
    await saveBlob(pdfFrom(cvs,orient,TITLES.report,'สรุปข้อมูล: '+summary('report').join(' ')),fname('report','pdf'));
  }catch(e){console.error(e);toast('สร้างรายงานไม่สำเร็จ กรุณาลองใหม่');setTimeout(()=>toast(''),4000);exBusy=false;return}
  finally{APP.exWidth=0;$('#exstage').innerHTML='';if(exBusy){exBusy=false;toast('')}}
}
Object.assign(window.APP=window.APP||{},{exportCard,exportReport});
