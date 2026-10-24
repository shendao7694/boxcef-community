// @path: src/js/resource.js
const $ = (id) => document.getElementById(id);

const SVG_CARET = '<svg class="tree-caret" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>';
const SVG_LINK = '<svg class="icon" viewBox="0 0 24 24"><path d="M10.59 13.41a1.996 1.996 0 010-2.82l4.24-4.24a2 2 0 112.83 2.83l-1.41 1.41 1.41 1.41 1.41-1.41a4 4 0 10-5.66-5.66l-4.24 4.24a4 4 0 000 5.66l1.42-1.42zM13.41 10.59a1.996 1.996 0 010 2.82l-4.24 4.24a2 2 0 11-2.83-2.83l1.41-1.41-1.41-1.41-1.41 1.41a4 4 0 105.66 5.66l4.24-4.24a4 4 0 000-5.66l-1.42 1.42z"/></svg>';

const DATA = [
  {
    name: '官方',
    children: [
      { name: '首页', href: '/' },
      { name: '发布帖子', href: '/publish-post.html' },
    ]
  },
  {
    name: '账号',
    children: [
      { name: '登录', href: '/login.html' },
      { name: '注册', href: '/register.html' },
      { name: '重置密码', href: '/reset.html' },
      { name: '个人主页', href: '/profile.html' }
    ]
  },
  {
    name: '游戏',
    children: [
      { name: '彩蛋', href: '/assets/easter-egg' },
      { name: 'MJE Texture', href: 'http://app.boxcef.top/mjetexture' },
      { name: 'Box Local Play', href: 'http://box-play.boxcef.top' },
      { name: 'ID Tool', href: '/assets/idTool' },
      { name: 'Mite Equilibrium Extension', href: '/assets/mite-equilibrium-extension' },
      { name: 'Wordle', href: '/assets/wordle' }
    ]
  },
];

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function renderTree(nodes, keyword = '') {
  const container = $('tree');
  container.innerHTML = '';
  const filtered = filterNodes(nodes, keyword);

  if (!filtered.length) {
    container.innerHTML = '<div class="tree-empty">没有匹配的结果</div>';
    return;
  }

  const root = document.createElement('ul');
  root.className = 'tree-group';
  filtered.forEach(n => root.appendChild(renderNode(n, keyword)));
  container.appendChild(root);
}

function filterNodes(nodes, keyword) {
  if (!keyword) return nodes;
  const k = keyword.toLowerCase();
  const out = [];
  for (const n of nodes) {
    if (n.children) {
      const kids = filterNodes(n.children, keyword);
      if (kids.length) out.push({ ...n, children: kids });
      else if (n.name.toLowerCase().includes(k)) out.push({ ...n });
    } else {
      const hay = `${n.name} ${n.href || ''}`.toLowerCase();
      if (hay.includes(k)) out.push(n);
    }
  }
  return out;
}

function renderNode(node, keyword) {
  const li = document.createElement('li');
  li.className = 'tree-item';

  if (node.children && node.children.length) {
    li.classList.add('open');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tree-toggle';
    btn.innerHTML = `${SVG_CARET}<span>${escapeHtml(node.name)}</span>`;
    btn.addEventListener('click', () => li.classList.toggle('open'));
    li.appendChild(btn);

    const sub = document.createElement('ul');
    sub.className = 'tree-group';
    node.children.forEach(c => sub.appendChild(renderNode(c, keyword)));
    li.appendChild(sub);
  } else if (node.href) {
    const a = document.createElement('a');
    a.className = 'tree-link';
    a.href = node.href;
    const isExternal = /^https?:\/\//i.test(node.href);
    if (isExternal) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    a.innerHTML = `${SVG_LINK}<span>${escapeHtml(node.name)}</span>`;
    li.appendChild(a);
  } else {
    const span = document.createElement('div');
    span.className = 'tree-toggle';
    span.textContent = node.name;
    li.appendChild(span);
  }

  return li;
}

$('res-search').addEventListener('input', (e) => {
  renderTree(DATA, e.target.value.trim());
});

renderTree(DATA);