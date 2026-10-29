/* Preserve the shared calendar when a 24-hour checklist expires. */
(() => {
  'use strict';
  const button = document.getElementById('share');
  if (!button) return;

  button.addEventListener('click', async (event) => {
    // The existing app sets this label only after the checklist has expired.
    if (button.textContent.trim() !== '새 체크리스트 만들기') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.disabled = true;
    button.textContent = '새 체크리스트 준비 중…';

    const next = new URL(window.location.href);
    const oldRoom = next.searchParams.get('room');

    // Older links may have a room but no calendar query parameter.
    // Recover the calendar linked to that room before replacing the room.
    if (!next.searchParams.has('calendar') && oldRoom) {
      try {
        const response = await fetch('/api/calendars', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({room: oldRoom}),
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('Calendar recovery failed');
        const data = await response.json();
        if (!data.id) throw new Error('Calendar ID missing');
        next.searchParams.set('calendar', data.id);
      } catch (error) {
        console.error('Calendar preservation failed', error);
        button.disabled = false;
        button.textContent = '새 체크리스트 만들기';
        alert('캘린더 연결을 확인하지 못했습니다. 기존 캘린더를 잃지 않도록 새 체크리스트 생성을 중단했습니다. 다시 시도해 주세요.');
        return;
      }
    }

    next.searchParams.delete('room');
    // app.js creates a new 24-hour room; calendar.js reuses ?calendar=.
    window.location.assign(next.toString());
  }, {capture: true});
})();
