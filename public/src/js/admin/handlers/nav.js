// @path: src/js/admin/handlers/nav.js
import { $, setCurrentView } from '../state.js';
import { loadComments } from './comments.js';

export function switchView(view) {
  setCurrentView(view);
  document.querySelectorAll('.admin-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  document.querySelectorAll('.admin-main > [data-panel]').forEach(sec => {
    sec.classList.toggle('panel-active', sec.dataset.panel === view);
  });
  if (view === 'comments') {
    const pid = $('comment-post-select').value;
    if (pid) loadComments(pid);
  }
}

export function bindNav() {
  document.querySelectorAll('.admin-nav-item').forEach(b => {
    b.addEventListener('click', () => switchView(b.dataset.view));
  });
  document.querySelectorAll('.admin-group-head').forEach(h => {
    h.addEventListener('click', () => h.closest('.admin-group').classList.toggle('collapsed'));
  });
}