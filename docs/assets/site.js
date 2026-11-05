const links = [...document.querySelectorAll('.side-nav nav a')];
const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
function updateActiveSection() {
  let active = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 160) active = section;
  }
  links.forEach(link => {
    const isActive = link.getAttribute('href') === `#${active?.id}`;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
let pending = false;
window.addEventListener('scroll', () => {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {updateActiveSection();pending = false;});
}, {passive:true});
updateActiveSection();
let openBeforePrint = [];
window.addEventListener('beforeprint', () => {
  openBeforePrint = [...document.querySelectorAll('details')].map(el => [el, el.open]);
  openBeforePrint.forEach(([el]) => {el.open = true;});
});
window.addEventListener('afterprint', () => {
  openBeforePrint.forEach(([el, open]) => {el.open = open;});
});
document.querySelectorAll('[data-print]').forEach(button => button.addEventListener('click',()=>window.print()));

const languageLink = document.querySelector('[data-switch-language]');
if (languageLink) {
  const alternate = languageLink.getAttribute('href');
  const headings = [...document.querySelectorAll('.paper-section[id], .paper-section h3[id]')];
  function linkToTranslation() {
    languageLink.href = alternate + window.location.hash;
  }
  linkToTranslation();
  window.addEventListener('hashchange', linkToTranslation);
  languageLink.addEventListener('click', () => {
    if (window.location.hash) return;
    const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
    const current = headings.filter(el => el.getBoundingClientRect().top <= headerBottom + 80).at(-1);
    languageLink.href = alternate + (current ? '#' + current.id : window.location.hash);
  });
}
