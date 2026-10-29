/* Compact upcoming events list. Add after calendar.js in index.html. */
(() => {
  'use strict';
  const calendarView = document.getElementById('calendar-view');
  const calendarEvents = document.getElementById('cal-events');
  if (!calendarView || !calendarEvents) return;

  const style = document.createElement('style');
  style.textContent = `
    .agenda-section{margin-top:24px;padding-top:20px;border-top:1px solid #e8ebef}
    .agenda-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
    .agenda-header h3{font-size:16px;margin:0;color:#20242b}
    .agenda-count{font-size:11px;color:#69717c;background:#f2f3f5;padding:4px 8px;border-radius:30px}
    .agenda-list{display:grid;gap:8px}
    .agenda-item{display:flex;align-items:flex-start;gap:12px;padding:12px;border:1px solid #e4e6e9;border-radius:11px;background:#fff}
    .agenda-date{width:45px;flex:none;text-align:center;background:#f3f5f7;border-radius:8px;padding:6px 2px;color:#283548}
    .agenda-date small{display:block;font-size:10px;color:#737b85}
    .agenda-date strong{display:block;font-size:18px;line-height:1.3}
    .agenda-content{min-width:0;flex:1}
    .agenda-title{font-size:13px;font-weight:700;line-height:1.5;overflow-wrap:anywhere}
    .agenda-meta{font-size:11px;color:#747d87;margin-top:3px;overflow-wrap:anywhere}
    .agenda-empty{font-size:12px;color:#747d87;padding:14px;background:#f7f8fa;border-radius:9px}
    .agenda-past-toggle{width:100%;margin-top:11px;background:transparent;border:1px solid #e1e5e9;border-radius:9px;padding:10px;color:#5e6671;font-size:12px;font-weight:600}
    .agenda-past{margin-top:9px}
  `;
  document.head.appendChild(style);

  const section = document.createElement('section');
  section.className = 'agenda-section';
  section.setAttribute('aria-label', '다가오는 일정 목록');
  section.innerHTML = '<div class="agenda-header"><h3>다가오는 일정</h3><span class="agenda-count" id="agenda-count">0건</span></div><div class="agenda-list" id="agenda-upcoming"></div><button type="button" class="agenda-past-toggle" id="agenda-past-toggle" hidden>지난 일정 보기</button><div class="agenda-list agenda-past" id="agenda-past" hidden></div>';
  const status = document.getElementById('cal-status');
  calendarEvents.parentNode.insertBefore(section, status || calendarEvents.nextSibling);
  const upcoming = document.getElementById('agenda-upcoming');
  const past = document.getElementById('agenda-past');
  const toggle = document.getElementById('agenda-past-toggle');
  const count = document.getElementById('agenda-count');
  let pastOpen = false;
  let lastKey = '';

  const text = (tag, className, value) => {
    const el = document.createElement(tag);
    el.className = className;
    el.textContent = value;
    return el;
  };
  function addItem(parent, e) {
    const row = document.createElement('article');
    row.className = 'agenda-item';
    const date = text('div', 'agenda-date', '');
    date.append(text('small', '', `${Number(e.date.slice(5,7))}월`), text('strong', '', String(Number(e.date.slice(8,10)))));
    const body = text('div', 'agenda-content', '');
    body.append(text('div', 'agenda-title', e.title || '이름 없는 일정'));
    const meta = [e.time || '종일', e.location].filter(Boolean).join(' · ');
    body.append(text('div', 'agenda-meta', meta));
    row.append(date, body);
    parent.append(row);
  }
  function draw(events) {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const ordered = events.slice().sort((a,b) => `${a.date} ${a.time||''}`.localeCompare(`${b.date} ${b.time||''}`));
    const future = ordered.filter(e => e.date >= today);
    const old = ordered.filter(e => e.date < today).reverse();
    count.textContent = `${future.length}건`;
    upcoming.replaceChildren();
    past.replaceChildren();
    if (!future.length) upcoming.append(text('p', 'agenda-empty', '예정된 일정이 없습니다.'));
    future.slice(0, 12).forEach(e => addItem(upcoming, e));
    if (future.length > 12) upcoming.append(text('p','agenda-empty',`이후 일정 ${future.length - 12}건은 달력에서 확인하세요.`));
    toggle.hidden = !old.length;
    toggle.textContent = pastOpen ? `지난 일정 접기 (${old.length}건)` : `지난 일정 보기 (${old.length}건)`;
    past.hidden = !pastOpen;
    if (pastOpen) old.slice(0, 20).forEach(e => addItem(past, e));
  }
  toggle.addEventListener('click', () => {pastOpen = !pastOpen; lastKey = ''; refresh();});
  async function refresh() {
    if (document.getElementById('calendar-view').hidden) return;
    const id = new URL(location.href).searchParams.get('calendar');
    if (!id || !/^[A-Za-z0-9_-]{24}$/.test(id)) {
      count.textContent = '연결 대기';
      upcoming.replaceChildren(text('p','agenda-empty','캘린더 연결을 기다리고 있습니다.'));
      return;
    }
    try {
      const res = await fetch(`/api/calendars/${encodeURIComponent(id)}`, {cache:'no-store'});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const key = `${id}:${data.revision}:${pastOpen}`;
      if (key === lastKey) return;
      lastKey = key;
      draw(Array.isArray(data.events) ? data.events : []);
    } catch {
      count.textContent = '연결 오류';
      upcoming.replaceChildren(text('p','agenda-empty','일정 목록을 불러오지 못했습니다. 잠시 후 다시 시도합니다.'));
    }
  }
  window.addEventListener('family-calendar-open', refresh);
  setInterval(refresh, 5000);
  refresh();
})();
