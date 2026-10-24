// @path: src/js/common/toast.js
const container = document.createElement('div');
container.className = 'toast-container';
document.body.appendChild(container);

export function showToast(message, type = 'success', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const dot = document.createElement('span');
  dot.className = 'dot';
  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(dot);
  toast.appendChild(text);
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}