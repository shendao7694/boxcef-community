const LANGS = {
  'zh-CN': {
    host: 'shequ.boxcef.top',
    dict: {
      badge: '欢迎来到 BOXCEF',
      heroTitle: '在这里，<br>分享你的创造',
      heroDesc: '一个轻量、专注的分享社区。发帖、发作品、互动，就这么简单。',
      enter: '进入社区',
      readRule: '社区规范',
      feat1Title: '帖子',
      feat1Desc: 'Markdown 排版，代码、图片、嵌入，随手记录',
      feat2Title: '作品',
      feat2Desc: '发布可玩的互动作品，让别人直接体验',
      feat3Title: '互动',
      feat3Desc: '评论、点赞、关注，找到同好',
      feat4Title: '图盘',
      feat4Desc: '个人图片空间，随手引用',
      feat5Title: '头衔',
      feat5Desc: '展示你的独特身份',
      feat6Title: '社交',
      feat6Desc: '关注、好友，保持联系',
      ctaTitle: '准备好了吗？',
      ctaDesc: '注册账号，开始分享你的第一条内容。',
      ctaRegister: '注册',
      ctaRule: '社区规范'
    }
  },
  'zh-TW': {
    host: 'shequ-tw.boxcef.top',
    dict: {
      badge: '歡迎來到 BOXCEF',
      heroTitle: '在這裡，<br>分享你的創造',
      heroDesc: '一個輕量、專注的分享社群。發文、發作品、互動，就這麼簡單。',
      enter: '進入社群',
      readRule: '社群規範',
      feat1Title: '貼文',
      feat1Desc: 'Markdown 排版，程式碼、圖片、嵌入，隨手記錄',
      feat2Title: '作品',
      feat2Desc: '發佈可玩的互動作品，讓別人直接體驗',
      feat3Title: '互動',
      feat3Desc: '留言、按讚、關注，找到同好',
      feat4Title: '圖盤',
      feat4Desc: '個人圖片空間，隨手引用',
      feat5Title: '頭銜',
      feat5Desc: '展示你的獨特身份',
      feat6Title: '社交',
      feat6Desc: '關注、好友，保持聯繫',
      ctaTitle: '準備好了嗎？',
      ctaDesc: '註冊帳號，開始分享你的第一條內容。',
      ctaRegister: '註冊',
      ctaRule: '社群規範'
    }
  },
  en: {
    host: 'community.boxcef.top',
    dict: {
      badge: 'WELCOME TO BOXCEF',
      heroTitle: 'Share your<br>creations here',
      heroDesc: 'A lightweight, focused sharing community. Post, publish, interact — that simple.',
      enter: 'Enter community',
      readRule: 'Community rules',
      feat1Title: 'Posts',
      feat1Desc: 'Markdown formatting — code, images, embeds, all in one place',
      feat2Title: 'Work',
      feat2Desc: 'Publish playable interactive works for others to experience',
      feat3Title: 'Interaction',
      feat3Desc: 'Comment, like, follow — find your people',
      feat4Title: 'Gallery',
      feat4Desc: 'Your personal image space, reference anytime',
      feat5Title: 'Titles',
      feat5Desc: 'Show off your unique identity',
      feat6Title: 'Social',
      feat6Desc: 'Follow, friends, stay connected',
      ctaTitle: 'Ready to join?',
      ctaDesc: 'Register an account and start sharing your first content.',
      ctaRegister: 'Register',
      ctaRule: 'Community rules'
    }
  }
};

const DEFAULT_LANG = 'zh-CN';
const STORAGE_KEY = 'lang';
const THEME_KEY = 'theme';
const TITLES = {
  'zh-CN': '关于 BOXCEF 社区',
  'zh-TW': '關於 BOXCEF 社群',
  en: 'About BOXCEF'
};

function detectLang() {
  const host = location.hostname;
  if (host === 'shequ-tw.boxcef.top') return 'zh-TW';
  if (host === 'community.boxcef.top') return 'en';
  if (host === 'shequ.boxcef.top') return 'zh-CN';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LANGS[stored]) return stored;
  return DEFAULT_LANG;
}

function hostUrl(lang, path) {
  const config = LANGS[lang] || LANGS[DEFAULT_LANG];
  if (config.host === location.hostname) return path;
  return `${location.protocol}//${config.host}${path}`;
}

function updateRoutedLinks(lang) {
  document.querySelectorAll('[data-route]').forEach((el) => {
    const path = el.getAttribute('data-route');
    el.setAttribute('href', hostUrl(lang, path));
  });
}

function applyLang(lang) {
  const config = LANGS[lang] || LANGS[DEFAULT_LANG];
  document.documentElement.setAttribute('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = config.dict[key];
    if (value === undefined) return;
    if (value.includes('<br>')) el.innerHTML = value;
    else el.textContent = value;
  });
  document.querySelectorAll('.intro-lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  document.title = TITLES[lang] || TITLES[DEFAULT_LANG];
  localStorage.setItem(STORAGE_KEY, lang);
  window.__introLang = lang;
  updateRoutedLinks(lang);
}

function switchLang(lang) {
  if (!LANGS[lang]) return;
  applyLang(lang);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const sun = document.getElementById('sun-icon');
  const moon = document.getElementById('moon-icon');
  if (sun) sun.style.display = theme === 'dark' ? 'none' : 'block';
  if (moon) moon.style.display = theme === 'dark' ? 'block' : 'none';
}

function initScrollNav() {
  const bar = document.querySelector('.intro-nav');
  if (!bar) return;

  const STIFFNESS = 180;
  const DAMPING = 28;
  const MASS = 1;
  const THRESHOLD = 80;

  const maxWidthStart = 1280;
  const maxWidthEnd = 760;
  const padStart = 32;
  const padEnd = 24;
  const heightStart = 76;
  const heightEnd = 64;
  const radiusEnd = 999;
  const marginTopEnd = 12;

  let x = 0;
  let v = 0;
  let target = 0;
  let raf = null;
  let lastT = performance.now();

  function apply(p) {
    const w = maxWidthStart + (maxWidthEnd - maxWidthStart) * p;
    const pl = padStart + (padEnd - padStart) * p;
    const pr = padStart + (padEnd - padStart) * p;
    const h = heightStart + (heightEnd - heightStart) * p;
    const r = radiusEnd * p;
    const mt = marginTopEnd * p;

    bar.style.maxWidth = w + 'px';
    bar.style.paddingLeft = pl + 'px';
    bar.style.paddingRight = pr + 'px';
    bar.style.height = h + 'px';
    bar.style.borderRadius = r + 'px';
    bar.style.top = mt + 'px';
  }

  function step(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    const accel = (-STIFFNESS * (x - target) - DAMPING * v) / MASS;
    v += accel * dt;
    x += v * dt;

    const p = Math.max(0, Math.min(1, x));
    apply(p);

    if (Math.abs(target - x) > 0.0005 || Math.abs(v) > 0.0005) {
      raf = requestAnimationFrame(step);
    } else {
      raf = null;
    }
  }

  function onScroll() {
    const y = window.scrollY;
    target = y > THRESHOLD ? 1 : 0;
    bar.classList.toggle('is-scrolled', y > THRESHOLD);

    if (!raf) {
      lastT = performance.now();
      raf = requestAnimationFrame(step);
    }
  }

  onScroll();
  apply(0);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    apply(Math.max(0, Math.min(1, x)));
  }, { passive: true });
}

function initReveal() {
  const targets = document.querySelectorAll('.intro-feature, .intro-cta');
  if (!targets.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => io.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollNav();
  initReveal();

  applyLang(detectLang());
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
  }

  document.querySelectorAll('.intro-lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchLang(btn.dataset.lang);
    });
  });

  const enterBtn = document.getElementById('enter-btn');
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      const lang = window.__introLang || DEFAULT_LANG;
      const host = (LANGS[lang] || LANGS[DEFAULT_LANG]).host;
      location.hostname = host;
    });
  }
});