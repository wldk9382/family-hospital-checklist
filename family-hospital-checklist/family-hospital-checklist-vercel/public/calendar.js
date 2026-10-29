(()=>{
'use strict';
const $=id=>document.getElementById(id);
const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=localDate(new Date());
let selected=today, month=new Date().getMonth(), year=new Date().getFullYear(), calendarId=new URL(location.href).searchParams.get('calendar'), events=[], revision=-1, editing=null, ready=false, saving=false;
const message=text=>{$('cal-status').textContent=text};
const path=()=>`/api/calendars/${encodeURIComponent(calendarId)}`;
const request=async(url,options={})=>{const r=await fetch(url,{...options,cache:'no-store'});const body=await r.json().catch(()=>({}));if(!r.ok)throw Error(body.error||`HTTP ${r.status}`);return body};
async function init(){
 try{
  if(!calendarId){for(let n=0;n<12&&!new URL(location.href).searchParams.get('room');n++)await new Promise(resolve=>setTimeout(resolve,250))}
  if(!calendarId){
   const room=new URL(location.href).searchParams.get('room');
   const data=await request('/api/calendars',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room})});
   calendarId=data.id;
   const url=new URL(location.href);url.searchParams.set('calendar',calendarId);history.replaceState(null,'',url);
  }
  await refresh();ready=true;message('가족 공동 캘린더 연결됨 · 약 5초 간격 동기화');
 }catch(e){ready=false;message('캘린더 연결에 실패했습니다. 새로고침 후 다시 확인해 주세요.');console.error('calendar init',e)}
 render();
}
async function refresh(){if(!calendarId||saving)return;const data=await request(path());if(data.revision!==revision){events=data.events||[];revision=data.revision;render()}}
function render(){
 $('cal-month').textContent=`${year}년 ${month+1}월`;
 $('cal-selected').textContent=`${Number(selected.slice(5,7))}월 ${Number(selected.slice(8,10))}일 일정`;
 $('cal-add').disabled=!ready;
 const first=new Date(year,month,1),offset=first.getDay(),days=new Date(year,month+1,0).getDate();
 const grid=$('cal-grid');grid.replaceChildren();
 for(const w of ['일','월','화','수','목','금','토']){const d=document.createElement('div');d.className='cal-weekday';d.textContent=w;grid.append(d)}
 for(let i=0;i<offset;i++){const d=document.createElement('div');grid.append(d)}
 for(let day=1;day<=days;day++){
  const date=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const button=document.createElement('button');button.type='button';button.className='cal-date'+(date===selected?' selected':'')+(date===today?' today':'')+(events.some(e=>e.date===date)?' has-events':'');button.setAttribute('aria-label',`${date} 일정 선택`);button.setAttribute('aria-pressed',String(date===selected));
  const num=document.createElement('span');num.textContent=String(day);const dot=document.createElement('span');dot.className='cal-dot';button.append(num,dot);button.onclick=()=>{selected=date;render()};grid.append(button)
 }
 const list=$('cal-events');list.replaceChildren();const daily=events.filter(e=>e.date===selected).sort((a,b)=>a.time.localeCompare(b.time));
 if(!daily.length){const empty=document.createElement('div');empty.className='cal-empty';empty.textContent='등록된 일정이 없습니다.';list.append(empty)}
 for(const e of daily){const card=document.createElement('article');card.className='cal-event';const top=document.createElement('div');top.className='cal-event-top';const title=document.createElement('div');title.className='cal-event-title';title.textContent=e.title;
  const actions=document.createElement('div');actions.className='cal-event-actions';const edit=document.createElement('button');edit.type='button';edit.className='cal-small';edit.textContent='수정';edit.disabled=!ready;edit.onclick=()=>openForm(e);
  const del=document.createElement('button');del.type='button';del.className='cal-small';del.textContent='삭제';del.disabled=!ready;del.onclick=()=>remove(e);actions.append(edit,del);top.append(title,actions);
  const meta=document.createElement('div');meta.className='cal-event-meta';meta.textContent=[e.time,e.location,e.note].filter(Boolean).join(' · ');card.append(top,meta);list.append(card)
 }
}
function openForm(e=null){if(!ready)return;editing=e?.id||null;$('cal-form-title').textContent=e?'일정 수정':'일정 추가';$('cal-date').value=e?.date||selected;$('cal-time').value=e?.time||'';$('cal-title').value=e?.title||'';$('cal-location').value=e?.location||'';$('cal-note').value=e?.note||'';$('cal-form-error').textContent='';$('cal-dialog').showModal()}
async function save(ev){ev.preventDefault();if(saving||!ready)return;const data={date:$('cal-date').value,time:$('cal-time').value,title:$('cal-title').value.trim(),location:$('cal-location').value.trim(),note:$('cal-note').value.trim()};if(!data.date||!data.title){$('cal-form-error').textContent='날짜와 일정 이름을 입력해 주세요.';return}
 saving=true;$('cal-save').disabled=true;try{await request(path(),{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,...(editing?{eventId:editing}:{})})});$('cal-dialog').close();selected=data.date;year=Number(selected.slice(0,4));month=Number(selected.slice(5,7))-1;await refresh();message('일정이 저장됐습니다. 가족에게도 반영됩니다.')}catch(e){$('cal-form-error').textContent='저장에 실패했습니다. 다시 시도해 주세요.';console.error(e)}finally{saving=false;$('cal-save').disabled=false}}
async function remove(e){if(!ready||saving||!confirm(`'${e.title}' 일정을 삭제할까요?`))return;saving=true;try{await request(path(),{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:e.id})});await refresh();message('일정이 삭제됐습니다.')}catch(err){alert('삭제하지 못했습니다. 다시 시도해 주세요.')}finally{saving=false}}
$('cal-prev').onclick=()=>{const d=new Date(year,month-1,1);year=d.getFullYear();month=d.getMonth();render()};
$('cal-next').onclick=()=>{const d=new Date(year,month+1,1);year=d.getFullYear();month=d.getMonth();render()};
$('cal-add').onclick=()=>openForm();$('cal-cancel').onclick=()=>$('cal-dialog').close();$('cal-form').addEventListener('submit',save);
window.addEventListener('family-calendar-open',()=>{if(ready)refresh().catch(()=>message('동기화 실패 · 다시 시도해 주세요.'))});
setInterval(()=>{if(ready&&!document.hidden)refresh().catch(()=>message('동기화가 지연되고 있습니다.'))},5000);
render();init();
})();
