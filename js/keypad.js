// Big number pad (1-9, ⌫, 0, ✔) for typed answers. What is typed shows in `slot` (any element, also SVG text).
import { h, replay } from './util.js';
import { sfx } from './sound.js';

export function keypad({ slot, maxLen = 3, onSubmit, onChange }) {
  let val = '';
  let locked = false;
  const show = () => {
    slot.textContent = val === '' ? '?' : val;
    slot.classList.toggle('typed', val !== '');
    onChange?.(val);
  };
  const el = h('div', { class: 'keypad' });
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✔']) {
    const label = k === '✔' ? 'Check' : k === '⌫' ? 'Delete' : k;
    const b = h('button', { class: 'key' + (k === '✔' ? ' ok' : k === '⌫' ? ' del' : ''), 'aria-label': label }, k);
    b.addEventListener('click', () => {
      if (locked) return;
      replay(b, 'tapped');
      if (k === '✔') {
        if (val === '') { sfx.boing(); replay(slot, 'shake-it'); return; }
        onSubmit(Number(val));
        return;
      }
      if (k === '⌫') { val = val.slice(0, -1); sfx.whoosh(); }
      else if (val.length >= maxLen) { sfx.boing(); replay(slot, 'shake-it'); return; }
      else { val = val === '0' ? k : val + k; sfx.note(+k); }
      show();
    });
    el.append(b);
  }
  show();
  return {
    el,
    clear() { val = ''; show(); },
    set(v) { val = String(v); show(); },
    lock(v = true) { locked = v; el.classList.toggle('locked', v); },
    // Wrong answer: shake the slot, then empty it.
    wrong() { replay(slot, 'shake-it'); setTimeout(() => { if (!locked) { val = ''; show(); } }, 450); },
  };
}

// Problem on the left (or top), number pad on the right (or bottom).
export function qaLayout(stage, problem, pad) {
  stage.replaceChildren(h('div', { class: 'qa' }, h('div', { class: 'problem' }, problem), h('div', { class: 'pad-col' }, pad)));
}
