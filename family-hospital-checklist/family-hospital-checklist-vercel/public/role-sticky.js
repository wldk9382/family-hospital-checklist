/* Role chips and sticky progress: presentation only, no API writes. */
(() => {
  'use strict';
  const roles = [
    ['아빠', 'dad'],
    ['보호자', 'guardian'],
    ['아빠', 'dad'],
    ['공동', 'shared'],
    ['아빠', 'dad'],
    ['아빠', 'dad'],
    ['아빠', 'dad'],
    ['공동', 'shared']
  ];
  const css = document.createElement('style');
  css.textContent = `
    .summary { position: sticky; top: max(8px, env(safe-area-inset-top)); z-index: 30;
      box-shadow: 0 3px 15px rgba(28,40,60,.08); border: 1px solid #e4e8ee; }
    .role-chip { flex: none; display: inline-flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; border-radius: 999px; padding: 5px 8px;
      white-space: nowrap; line-height: 1.2; }
    .role-chip--dad { background: #e4f1ff; color: #0863b7; }
    .role-chip--guardian { background: #f0e7ff; color: #713bb3; }
    .role-chip--shared { background: #eef0f3; color: #576171; }
    .stephead .role-chip { margin-left: auto; }
    .stephead .expand { margin-left: 0; }
    .stephead { gap: 7px; }
    .stepinfo { min-width: 0; }
    @media (max-width: 360px) { .role-chip { font-size: 9px; padding: 4px 6px; } }
  `;
  document.head.append(css);

  const list = document.getElementById('steps');
  if (!list) return;
  let applying = false;
  const decorate = () => {
    if (applying) return;
    applying = true;
    try {
      [...list.querySelectorAll('.step')].forEach((card, index) => {
        const head = card.querySelector('.stephead');
        if (!head || head.querySelector('.role-chip')) return;
        const [label, kind] = roles[index] || ['공동', 'shared'];
        const chip = document.createElement('span');
        chip.className = `role-chip role-chip--${kind}`;
        chip.textContent = label;
        chip.setAttribute('aria-label', `담당: ${label}`);
        const expand = head.querySelector('.expand');
        if (expand) head.insertBefore(chip, expand);
        else head.append(chip);
      });
    } finally { applying = false; }
  };
  const observer = new MutationObserver(decorate);
  observer.observe(list, { childList: true });
  decorate();
})();
