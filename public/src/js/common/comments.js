// @path: src/js/common/comments.js
import { request } from './api.js';
import { showToast } from './toast.js';
import { avatarUrl } from './auth.js';
import { getTitles, renderTitleTag } from './title.js';

const $ = (id) => document.getElementById(id);

const SVG_PIN = '<svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 3v2l-1 1v5l3 2v2h-5v6l-1 1-1-1v-6H6v-2l3-2V6L8 5V3h8z"/></svg>';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export function createCommentSection(ctx) {
  const {
    endpoint,
    getTargetId,
    isLoggedIn,
    getMe,
    isAuthor,
    getComments,
    setComments,
    opLabel = '贴主'
  } = ctx;

  let openReplyIndex = -1;

  async function send(action, extra = {}) {
    return request(endpoint, {
      method: 'POST',
      auth: true,
      body: { id: getTargetId(), action, ...extra }
    });
  }

  async function apply(res) {
    if (res.comments) setComments(res.comments);
    await render(res.comments || getComments());
  }

  async function render(comments) {
    const list = $('comment-list');
    if (!list) return;
    const fragment = document.createDocumentFragment();

    if (!comments.length) {
      list.innerHTML = '<div class="empty-text">还没有评论</div>';
      return;
    }

    const ids = [];
    for (const c of comments) {
      if (c.author?.title?.choose) ids.push(c.author.title.choose);
      for (const r of c.reply || []) {
        if (r.author?.title?.choose) ids.push(r.author.title.choose);
      }
    }
    const titles = ids.length ? await getTitles(ids) : {};

    comments.forEach((c, idx) => {
      fragment.appendChild(renderComment(c, c.idx ?? idx, titles));
    });

    list.innerHTML = '';
    list.appendChild(fragment);
  }

  function renderComment(c, idx, titles) {
    const wrap = document.createElement('div');
    wrap.className = 'comment' + (c.pinned ? ' pinned' : '');

    if (c.pinned) {
      const flag = document.createElement('div');
      flag.className = 'pinned-flag';
      flag.innerHTML = `${SVG_PIN}<span>置顶评论</span>`;
      wrap.appendChild(flag);
    }

    const author = c.author || { name: '未知', nickname: '' };
    const name = escapeHtml(author.nickname || author.name);
    const tag = renderTitleTag(author.title, titles);
    const head = document.createElement('div');
    head.className = 'comment-head';
    head.innerHTML = `
      <img loading="lazy" decoding="async" src="${avatarUrl(author.avatar)}" alt="">
      <div class="name"><a href="/user.html?id=${c.from}">${name}</a>${c.isOP ? `<span class="op-badge">${opLabel}</span>` : ''}${tag}</div>
    `;
    wrap.appendChild(head);

    const body = document.createElement('div');
    body.className = 'comment-body';
    body.textContent = c.content;
    wrap.appendChild(body);

    const actions = document.createElement('div');
    actions.className = 'comment-actions';

    const likeBtn = document.createElement('button');
    likeBtn.textContent = `${c.like || 0} 赞${c.liked ? ' · 已赞' : ''}`;
    likeBtn.classList.toggle('active', !!c.liked);
    likeBtn.addEventListener('click', () => likeComment(idx, c.liked ? 'unlikeComment' : 'likeComment'));
    actions.appendChild(likeBtn);

    if (isLoggedIn()) {
      const replyBtn = document.createElement('button');
      replyBtn.textContent = '回复';
      replyBtn.addEventListener('click', () => toggleReplyForm(idx, wrap));
      actions.appendChild(replyBtn);
    }

    if (isLoggedIn() && (c.from === getMe()?.sessionKey || isAuthor())) {
      const del = document.createElement('button');
      del.textContent = '删除';
      del.addEventListener('click', () => deleteComment(idx));
      actions.appendChild(del);
    }

    if (isAuthor()) {
      const pinBtn = document.createElement('button');
      pinBtn.className = 'pin-btn';
      pinBtn.innerHTML = `${SVG_PIN}<span>${c.pinned ? '取消置顶' : '置顶'}</span>`;
      pinBtn.addEventListener('click', () => pinComment(idx, c.pinned ? 'unpinComment' : 'pinComment'));
      actions.appendChild(pinBtn);
    }

    wrap.appendChild(actions);

    if (c.reply && c.reply.length) {
      const replyList = document.createElement('div');
      replyList.className = 'reply-list';
      c.reply.forEach((r, ridx) => {
        replyList.appendChild(renderReply(r, idx, r.idx ?? ridx, titles));
      });
      wrap.appendChild(replyList);
    }
    return wrap;
  }

  function renderReply(r, cidx, ridx, titles) {
    const wrap = document.createElement('div');
    wrap.className = 'reply';

    const author = r.author || { name: '未知', nickname: '' };
    const name = escapeHtml(author.nickname || author.name);
    const tag = renderTitleTag(author.title, titles);
    const head = document.createElement('div');
    head.className = 'reply-head';
    head.innerHTML = `
      <img loading="lazy" decoding="async" src="${avatarUrl(author.avatar)}" alt="">
      <div class="name"><a href="/user.html?id=${r.from}">${name}</a>${r.isOP ? `<span class="op-badge">${opLabel}</span>` : ''}${tag}</div>
    `;
    wrap.appendChild(head);

    const body = document.createElement('div');
    body.className = 'reply-body';
    body.textContent = r.content;
    wrap.appendChild(body);

    const actions = document.createElement('div');
    actions.className = 'comment-actions';
    const likeBtn = document.createElement('button');
    likeBtn.textContent = `${r.like || 0} 赞${r.liked ? ' · 已赞' : ''}`;
    likeBtn.classList.toggle('active', !!r.liked);
    likeBtn.addEventListener('click', () => likeReply(cidx, ridx, r.liked ? 'unlikeReply' : 'likeReply'));
    actions.appendChild(likeBtn);

    if (isLoggedIn() && (r.from === getMe()?.sessionKey || isAuthor())) {
      const del = document.createElement('button');
      del.textContent = '删除';
      del.addEventListener('click', () => deleteReply(cidx, ridx));
      actions.appendChild(del);
    }
    wrap.appendChild(actions);
    return wrap;
  }

  function toggleReplyForm(idx, commentEl) {
    if (openReplyIndex === idx) {
      const f = commentEl.querySelector('.reply-form');
      if (f) f.remove();
      openReplyIndex = -1;
      return;
    }
    const old = document.querySelector('.reply-form');
    if (old) old.remove();

    const form = document.createElement('div');
    form.className = 'reply-form';
    form.innerHTML = `<input type="text" placeholder="写下你的回复..."><button>回复</button>`;
    const input = form.querySelector('input');
    const btn = form.querySelector('button');
    btn.addEventListener('click', async () => {
      const content = input.value.trim();
      if (!content) return;
      try {
        await apply(await send('reply', { content, index: idx }));
        openReplyIndex = -1;
        showToast('回复已发布');
      } catch {}
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); btn.click(); }
    });
    commentEl.appendChild(form);
    input.focus();
    openReplyIndex = idx;
  }

  async function likeComment(idx, action) {
    if (!isLoggedIn()) { showToast('请先登录', 'error'); return; }
    try { await apply(await send(action, { index: idx })); } catch {}
  }

  async function pinComment(idx, action) {
    try {
      await apply(await send(action, { index: idx }));
      showToast(action === 'pinComment' ? '已置顶该评论' : '已取消置顶');
    } catch {}
  }

  async function likeReply(cidx, ridx, action) {
    if (!isLoggedIn()) { showToast('请先登录', 'error'); return; }
    try { await apply(await send(action, { index: cidx, replyIndex: ridx })); } catch {}
  }

  async function deleteComment(idx) {
    if (!confirm('确认删除该评论？')) return;
    try {
      await apply(await send('delete', { index: idx }));
      showToast('已删除');
    } catch {}
  }

  async function deleteReply(cidx, ridx) {
    if (!confirm('确认删除该回复？')) return;
    try {
      await apply(await send('deleteReply', { index: cidx, replyIndex: ridx }));
      showToast('已删除');
    } catch {}
  }

  async function add(content) {
    await apply(await send('add', { content }));
    showToast('评论已发布');
  }

  return { render, add };
}
