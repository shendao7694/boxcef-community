// @path: src/js/admin/handlers/disc.js
import { $, state, adminFetch } from '../state.js';
import { showToast } from '../utils/toast.js';

let adminSelectedDisc = new Set();

export async function openUserDisc(key) {
  const user = state.users.find(u => u.key === key);
  if (!user) return;

  $('disc-user-name').textContent = user.nickname || user.name;
  $('disc-user-key').value = key;
  adminSelectedDisc.clear();

  const box = $('disc-admin-list');
  box.innerHTML = '<div class="empty-text">加载中...</div>';

  const delBtn = $('disc-admin-delete-btn');
  delBtn.style.display = 'none';
  delBtn.disabled = false;
  delBtn.textContent = '删除选中';

  let data;
  try {
    data = await adminFetch(`/api/admin/user/disc?key=${encodeURIComponent(key)}`);
  } catch {
    box.innerHTML = '<div class="empty-text">加载失败</div>';
    return;
  }

  const disc = data.imageDisc || [];
  if (!disc.length) {
    box.innerHTML = '<div class="empty-text">该用户图盘为空</div>';
  } else {
    box.innerHTML = '';
    disc.forEach(hash => {
      const item = document.createElement('div');
      item.className = 'disc-item';
      item.innerHTML = `
        <img src="/api/data/assets/${hash}" alt="">
        <div class="disc-check"><input type="checkbox" data-hash="${hash}"></div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        const cb = item.querySelector('input');
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change'));
      });

      item.querySelector('input').addEventListener('change', (e) => {
        if (e.target.checked) adminSelectedDisc.add(hash);
        else adminSelectedDisc.delete(hash);
        item.classList.toggle('selected', e.target.checked);

        if (adminSelectedDisc.size > 0) {
          delBtn.style.display = 'inline-flex';
          delBtn.textContent = `删除选中 (${adminSelectedDisc.size})`;
        } else {
          delBtn.style.display = 'none';
        }
      });

      box.appendChild(item);
    });
  }

  $('disc-modal').hidden = false;
}

export function bindDisc() {
  $('disc-admin-cancel').addEventListener('click', () => {
    $('disc-modal').hidden = true;
  });

  $('disc-admin-delete-btn').addEventListener('click', async () => {
    if (!adminSelectedDisc.size) return;
    if (!confirm(`确认删除选中的 ${adminSelectedDisc.size} 张图片？此操作不可恢复。`)) return;

    const key = $('disc-user-key').value;
    const hashes = Array.from(adminSelectedDisc);
    const btn = $('disc-admin-delete-btn');

    btn.disabled = true;
    btn.textContent = '删除中...';

    try {
      await adminFetch('/api/admin/user/disc-delete', {
        method: 'POST',
        body: { key, hashes }
      });
      showToast('已删除');
      await openUserDisc(key);
    } catch {
      btn.disabled = false;
      btn.textContent = `删除选中 (${adminSelectedDisc.size})`;
    }
  });
}