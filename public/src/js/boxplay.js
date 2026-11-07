// @path: src/js/boxplay.js
import { t } from './common/i18n.js';

const boxId = new URLSearchParams(location.search).get('id');
const errorLayer = document.getElementById('error-layer');
const loadingLayer = document.getElementById('loading-layer');
const gameArea = document.getElementById('game-area');
let frame = null;

function showError(text) {
  errorLayer.textContent = text;
  errorLayer.style.display = 'block';
  loadingLayer.style.display = 'none';
}

function mountIframe(url) {
  frame = document.createElement('iframe');
  frame.className = 'game-frame';
  frame.src = url;
  frame.allow = 'fullscreen; autoplay; clipboard-write; gamepad; microphone; camera';
  frame.allowFullscreen = true;
  frame.setAttribute('allowfullscreen', '');
  gameArea.appendChild(frame);
  loadingLayer.style.display = 'none';
}

async function init() {
  if (!boxId) {
    showError(t('缺少作品 ID'));
    return;
  }

  try {
    const settingsRes = await fetch('/api/settings');
    const settingsData = await settingsRes.json();
    if (settingsData.success && settingsData.settings) {
      if (settingsData.settings.boxPlayStatus === false) {
        showError(settingsData.settings.boxPlayVaildText || t('BoxPlay 服务暂时关闭'));
        return;
      }
    }

    const playRes = await fetch(`/api/works/boxplay/get?id=${encodeURIComponent(boxId)}`);
    const playData = await playRes.json();

    if (playData.success && playData.boxplay && playData.boxplay.playurl) {
      if (playData.boxplay.isInIframe) {
        mountIframe(playData.boxplay.playurl);
      } else {
        location.href = playData.boxplay.playurl;
      }
    } else {
      showError(t('获取游玩链接失败'));
    }
  } catch {
    showError(t('网络错误'));
  }
}

function exitGame() {
  if (boxId) location.href = `/boxview.html?id=${boxId}`;
  else location.href = '/';
}

function toggleFullscreen() {
  const target = frame || gameArea;
  if (!document.fullscreenElement) {
    if (target.requestFullscreen) target.requestFullscreen();
    else if (target.mozRequestFullScreen) target.mozRequestFullScreen();
    else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
    else if (target.msRequestFullscreen) target.msRequestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

document.getElementById('exit-btn').addEventListener('click', exitGame);
document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);

init();
