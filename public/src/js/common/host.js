// @path: src/js/common/host.js
import { setLang } from './i18n.js';

const BASE_URL = "boxcef.top";

const HOSTS = {
    "shequ.boxcef.top": 'zh-CN',
    "shequ-tw.boxcef.top": 'zh-TW',
    "community.boxcef.top": 'en'
};

function getUrl() {
    return location.hostname;
}

function getBaseUrl() {
    return location.hostname.split('.').slice(-2).join('.');
}

function setUrl(hostname) {
    location.hostname = hostname;
}

function isIntroPath() {
    const path = location.pathname.replace(/\/+$/, '');
    return path === '/intro' || path === '/intro.html';
}

function check() {
    const url = getUrl();
    const base = getBaseUrl();

    if (base !== BASE_URL) {
        setUrl(BASE_URL);
        return;
    }

    if (url === BASE_URL || url === 'www.' + BASE_URL) {
        if (!isIntroPath()) {
            location.href = '/intro.html';
        }
        return;
    }

    if (HOSTS[url]) {
        setLang(HOSTS[url]);
        if (isIntroPath()) {
            location.href = '/';
        }
        return;
    }

    if (url === BASE_URL) {
        setUrl('www.' + BASE_URL);
    }
}

check();