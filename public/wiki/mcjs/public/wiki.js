(function() {
    'use strict';

    const CONFIG = {
        listUrl: '/docs/mcjs/list.json',
        docsDir: '/docs/mcjs/',
        cacheMax: 10 
    };

    const DOM = {
        sidebarTree: document.getElementById('sidebar-tree'),
        contentContainer: document.getElementById('content-container'),
        themeToggle: document.getElementById('theme-toggle'),
        menuToggle: document.getElementById('menu-toggle'),
        sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.getElementById('sidebar-overlay'),
        backToTop: document.getElementById('back-to-top')
    };

    const state = {
        cache: new Map(),
        currentFile: null,
        currentPageId: null
    };

    function getUrlParam(key) {
        const params = new URLSearchParams(window.location.search);
        return params.get(key);
    }

    function findLeafById(items, targetId) {
        for (const item of items) {
            if (item.id === targetId && item.type === 'leaf') return item;
            if (item.children) {
                const found = findLeafById(item.children, targetId);
                if (found) return found;
            }
        }
        return null;
    }

    function findFirstLeaf(items) {
        for (const item of items) {
            if (item.type === 'leaf') return item;
            if (item.children) {
                const found = findFirstLeaf(item.children);
                if (found) return found;
            }
        }
        return null;
    }

    async function init() {
        marked.setOptions({ breaks: true, gfm: true });

        setupTheme();
        setupMobileMenu();
        setupBackToTop();
        
        try {
            const res = await fetch(CONFIG.listUrl);
            if (!res.ok) throw new Error('无法加载 docs/list.json');
            const listData = await res.json();
            
            buildSidebar(listData);
            
            const pageId = getUrlParam('page');
            let targetPage = null;

            if (pageId) {
                targetPage = findLeafById(listData, pageId);
            }

            if (!targetPage) {
                targetPage = findFirstLeaf(listData);
            }

            if (targetPage) {
                loadMarkdown(targetPage.file, targetPage.id);
            }
        } catch (err) {
            renderError(err.message);
        }
    }

    function buildSidebar(items, container = DOM.sidebarTree) {
        items.forEach(item => {
            if (item.type === 'folder' || item.type === 'node') {
                const isDefaultOpen = item.open === true;
                
                const node = document.createElement('div');
                node.className = 'tree-node';
                node.innerHTML = `
                    <div class="tree-node-header">
                        <span class="tree-toggle">${isDefaultOpen ? '[-]' : '[+]'}</span>
                        <span class="tree-name">${item.title}</span>
                    </div>
                    <div class="tree-children" style="display:${isDefaultOpen ? 'block' : 'none'};"></div>
                `;
                container.appendChild(node);

                const header = node.querySelector('.tree-node-header');
                const childrenContainer = node.querySelector('.tree-children');
                
                header.addEventListener('click', () => {
                    const isHidden = childrenContainer.style.display === 'none';
                    childrenContainer.style.display = isHidden ? 'block' : 'none';
                    header.querySelector('.tree-toggle').textContent = isHidden ? '[-]' : '[+]';
                });

                if (item.children?.length) buildSidebar(item.children, childrenContainer);
                
            } else if (item.type === 'leaf') {
                const leaf = document.createElement('a');
                leaf.className = 'tree-leaf-item';
                leaf.href = '#';
                leaf.dataset.file = item.file;
                leaf.innerHTML = `<span>${item.title}</span>`;
                
                leaf.addEventListener('click', (e) => {
                    e.preventDefault();
                    history.pushState({page: item.id}, '', `?page=${item.id}`);
                    loadMarkdown(item.file, item.id);
                    if (window.innerWidth <= 768) closeMobileMenu();
                });
                container.appendChild(leaf);
            }
        });
    }

    async function loadMarkdown(filename, pageId) {
        state.currentFile = filename;
        state.currentPageId = pageId;

        if (state.cache.has(filename)) {
            renderContent(state.cache.get(filename));
            return;
        }

        DOM.contentContainer.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:40px 0;">加载中...</p>`;
        
        try {
            const res = await fetch(CONFIG.docsDir + filename);
            if (!res.ok) throw new Error(`文件 ${filename} 不存在或网络拒绝访问`);
            const text = await res.text();
            
            if (state.cache.size >= CONFIG.cacheMax) state.cache.delete(state.cache.keys().next().value);
            state.cache.set(filename, text);
            
            renderContent(text);
        } catch (err) {
            renderError(err.message);
        }
    }
    function executeInlineScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    function renderContent(content) {
        DOM.contentContainer.innerHTML = marked.parse(content);
        executeInlineScripts(DOM.contentContainer);

        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        document.querySelectorAll('.tree-leaf-item').forEach(el => {
            el.style.color = '';
            el.style.fontWeight = 'normal';
        });
        const activeEl = document.querySelector(`.tree-leaf-item[data-file="${state.currentFile}"]`);
        if (activeEl) {
            activeEl.style.color = 'var(--link-color)';
            activeEl.style.fontWeight = 'bold';
        }
    }

    function renderError(msg) {
        DOM.contentContainer.innerHTML = `
            <div class="warning-box" style="margin:20px;">
                加载失败：${msg}<br>
            </div>
        `;
    }

    function setupTheme() {
        const saved = localStorage.getItem('wiki-theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        DOM.themeToggle.textContent = saved === 'light' ? '🌙' : '☀️';

        DOM.themeToggle.addEventListener('click', () => {
            const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('wiki-theme', next);
            DOM.themeToggle.textContent = next === 'light' ? '🌙' : '☀️';
        });
    }

    function setupMobileMenu() {
        DOM.menuToggle.addEventListener('click', () => {
            DOM.sidebar.classList.toggle('active');
            DOM.sidebarOverlay.classList.toggle('active');
            DOM.menuToggle.classList.toggle('active');
        });
        DOM.sidebarOverlay.addEventListener('click', closeMobileMenu);
    }

    function closeMobileMenu() {
        DOM.sidebar.classList.remove('active');
        DOM.sidebarOverlay.classList.remove('active');
        DOM.menuToggle.classList.remove('active');
    }

    function setupBackToTop() {
        window.addEventListener('scroll', () => {
            DOM.backToTop.classList.toggle('visible', window.scrollY > 300);
        });
        DOM.backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();