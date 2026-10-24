// @path: src/js/common/theme.js
const toggle = document.getElementById('theme-toggle');
const sun = document.getElementById('sun-icon');
const moon = document.getElementById('moon-icon');

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (sun) sun.style.display = theme === 'dark' ? 'none' : 'block';
  if (moon) moon.style.display = theme === 'dark' ? 'block' : 'none';
}

apply(localStorage.getItem('theme') || 'light');

if (toggle) {
  toggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    apply(cur === 'dark' ? 'light' : 'dark');
  });
}