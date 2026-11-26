/* ---------- เครื่องมือผู้ดูแล (?admin): นำเข้า Excel ปีใหม่ → data.json ---------- */
const ADM_RISK={'ลดลง':0,'เท่าเดิม':1,'เพิ่มขึ้น':2},ADM_TREND={'Decreasing':0,'Stable':1,'Increasing':2,'ลดลง':0,'คงที่':1,'เพิ่มขึ้น':2};
const ADM_COLS=['จังหวัด','AMPHOE','TAMBOL','Risk 1 year','Slope','แนวโน้ม'];
const ADM_TREND_RE=/^แนวโน้ม\s*\d*\s*ปี$/;
let ADM=null;

function parseWorkbook(ab){
  const wb=XLSX.read(ab,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]];
  const aoa=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null});
  const head=(aoa[0]||[]).map(h=>h==null?'':String(h).trim());
  const ti=head.findIndex(h=>ADM_TREND_RE.test(h));
  const miss=ADM_COLS.filter(c=>c==='แนวโน้ม'?ti<0:!head.includes(c)).map(c=>c==='แนวโน้ม'?'แนวโน้ม N ปี':c);
  if(miss.length)throw new Error(`ไม่พบคอลัมน์ ${miss.join(', ')} ในแถวแรกของชีตแรก กรุณาใช้รูปแบบเดียวกับไฟล์เดิม`);
  const yc=head.map((h,i)=>[h,i]).filter(([h])=>/^\d{4}$/.test(h)).sort((a,b)=>+a[0]-+b[0]);
  if(yc.length<2)throw new Error('ไม่พบคอลัมน์ปี (ค.ศ. 4 หลัก เช่น 2021) อย่างน้อย 2 ปี');
  const ix=Object.fromEntries(ADM_COLS.map(c=>[c,c==='แนวโน้ม'?ti:head.indexOf(c)]));
  const body=aoa.slice(1).filter(r=>r&&r[ix['TAMBOL']]!=null&&String(r[ix['TAMBOL']]).trim());
  const provs=[...new Set(body.map(r=>String(r[ix['จังหวัด']]).trim()))].sort();
  const bad=[],rows=body.map((r,n)=>{
    const p=String(r[ix['จังหวัด']]).trim(),risk=ADM_RISK[String(r[ix['Risk 1 year']]).trim()],tr=ADM_TREND[String(r[ix['แนวโน้ม']]).trim()];
    const v=yc.map(([,i])=>Number(r[i])||0),sl=Number(r[ix['Slope']]);
    if(risk==null||tr==null||!isFinite(sl))bad.push(n+2);
    return [provs.indexOf(p),String(r[ix['AMPHOE']]).trim(),String(r[ix['TAMBOL']]).trim(),...v,risk??1,isFinite(sl)?Number(sl.toFixed(2)):0,tr??1];
  });
  if(bad.length)throw new Error(`ค่าคอลัมน์ Risk 1 year / Slope / แนวโน้ม 5 ปี ไม่ถูกต้องที่แถว ${bad.slice(0,10).join(', ')}${bad.length>10?' …':''}`);
  const data={years:yc.map(([h])=>+h),provs,rows,built:new Date().toISOString().slice(0,19)};
  const unmatched=rows.map(r=>`${provs[r[0]]}|${r[1]}|${r[2]}`).filter(k=>!G.tam[(G.fix&&G.fix[k])||k]);
  return {data,unmatched,years:data.years};
}

function adminUI(){
  const el=document.createElement('section');el.id='admin';el.className='card';el.style.marginBottom='18px';
  el.innerHTML=`<div class="ch"><div><h2>เครื่องมือผู้ดูแล: นำเข้าข้อมูลปีใหม่</h2><p>ใช้ไฟล์ Excel รูปแบบเดียวกับไฟล์เดิม (ชีตแรก มีคอลัมน์ จังหวัด · AMPHOE · TAMBOL · คอลัมน์ปี ค.ศ. · Risk 1 year · Slope · แนวโน้ม 5 ปี)</p></div></div>
  <ol class="adm-steps"><li>เลือกไฟล์ Excel แล้วตรวจสรุปและตัวอย่างด้านล่าง</li><li>กด "แสดงผลบนหน้านี้" เพื่อทดลองดู (ไม่กระทบผู้ใช้อื่น)</li><li>กด "ดาวน์โหลด data.json" แล้วอัปโหลดไฟล์นี้ทับไฟล์เดิมในโฟลเดอร์ <b>data</b> บน GitHub</li></ol>
  <div class="filters"><input type="file" id="adminFile" accept=".xlsx,.xls" aria-label="เลือกไฟล์ Excel"></div>
  <div id="adminMsg" role="alert" class="adm-msg"></div>
  <div id="adminSummary" class="adm-sum"></div>
  <div class="tw" style="max-height:300px;margin:10px 0"><table id="adminPreviewTable"></table></div>
  <details><summary>ตำบลที่จับคู่ขอบเขตแผนที่ไม่ได้ (<span id="adminUmN">0</span>) — แสดงในตารางและตัวเลขสรุป แต่ไม่แสดงบนแผนที่</summary><ul id="adminUnmatched" class="adm-um"></ul></details>
  <div class="ctl" style="margin-top:12px"><button class="pill" id="adminPreview" disabled>แสดงผลบนหน้านี้</button><button class="pill dark" id="adminSave" disabled>ดาวน์โหลด data.json</button></div>`;
  $('.tray').insertBefore(el,$('.tray').firstElementChild);
  $('#adminFile').onchange=async e=>{
    const f=e.target.files[0];if(!f)return;
    ADM=null;$('#adminSave').disabled=$('#adminPreview').disabled=true;$('#adminMsg').textContent='';$('#adminSummary').textContent='';$('#adminPreviewTable').innerHTML='';$('#adminUnmatched').innerHTML='';$('#adminUmN').textContent='0';
    try{
      const res=parseWorkbook(await f.arrayBuffer());ADM=res;const d=res.data,Y=d.years.map(y=>y+543);
      $('#adminSummary').textContent=`อ่านได้ ${d.rows.length.toLocaleString('th-TH')} ตำบล · ${d.provs.length} จังหวัด · ${d.years.length} ปี (พ.ศ. ${Y[0]}–${Y[Y.length-1]}) · จับคู่แผนที่ไม่ได้ ${res.unmatched.length} ตำบล`;
      $('#adminPreviewTable').innerHTML=`<thead><tr><th>จังหวัด</th><th>อำเภอ</th><th>ตำบล</th>${Y.map(y=>`<th class="n">${y}</th>`).join('')}</tr></thead><tbody>`+d.rows.slice(0,10).map(r=>`<tr><td>${esc(d.provs[r[0]])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td>${r.slice(3,3+Y.length).map(n=>`<td class="n">${n}</td>`).join('')}</tr>`).join('')+'</tbody>';
      $('#adminUnmatched').innerHTML=res.unmatched.map(k=>`<li>${esc(k.split('|').reverse().map((x,i)=>['ต.','อ.','จ.'][i]+x).join(' '))}</li>`).join('');
      $('#adminUmN').textContent=res.unmatched.length;
      $('#adminSave').disabled=$('#adminPreview').disabled=false;
    }catch(err){$('#adminMsg').textContent=err.message||String(err)}
  };
  $('#adminSave').onclick=()=>{if(ADM)saveBlob(new Blob([JSON.stringify(ADM.data)],{type:'application/json'}),'data.json')};
  $('#adminPreview').onclick=()=>{if(!ADM)return;D=ADM.data;buildRows();buildPaths();S.y=NY-1;S.sel=-1;
    $('#year').innerHTML=YRS.map((y,i)=>`<option value="${i}">ปี ${y}</option>`).join('');$('#year').value=S.y;
    render();Object.assign(window.APP,{D,R,P,YRS});
    $('#adminMsg').textContent='กำลังแสดงข้อมูลจากไฟล์ที่เลือกบนหน้านี้เท่านั้น (ผู้ใช้อื่นยังเห็นข้อมูลเดิมจนกว่าจะอัปโหลด data.json ขึ้น GitHub)';};
}
if(new URLSearchParams(location.search).has('admin')){
  const wait=()=>window.APP&&APP.ready?adminUI():setTimeout(wait,100);wait();
}
