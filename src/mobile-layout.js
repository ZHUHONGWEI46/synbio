export function initMobileLayout() {
  const narrow = matchMedia('(max-width: 760px)');
  const header = document.querySelector('.site-header');
  const toggle = document.getElementById('mobile-menu-toggle');
  const nav = document.getElementById('primary-navigation');
  const close = (focus = false) => {
    header.classList.remove('is-mobile-menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (focus) toggle.focus();
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    header.classList.toggle('is-mobile-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', event => {
    if (narrow.matches && event.target.closest('button')) close(true);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('is-mobile-menu-open')) close(true);
  });
  document.addEventListener('pointerdown', event => {
    if (!header.contains(event.target)) close();
  });
  const workbench = document.getElementById('workbench');
  const shortcuts = document.createElement('nav');
  shortcuts.className = 'mobile-workbench-shortcuts';
  shortcuts.setAttribute('aria-label', '工作台区域快捷跳转');
  [['突变设置','.control-panel'],['三维结构','.structure-panel'],['实验结果','.score-panel']].forEach(([label,selector]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label;
    button.addEventListener('click', () => {
      const panel = workbench.querySelector(selector);
      const top = workbench.scrollTop + panel.getBoundingClientRect().top - workbench.getBoundingClientRect().top - 68;
      workbench.scrollTo({top:Math.max(0,top),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    });
    shortcuts.append(button);
  });
  workbench.prepend(shortcuts);
  const orientationHint = document.createElement('aside');
  orientationHint.className = 'workbench-orientation-hint';
  orientationHint.setAttribute('aria-label', '工作台显示建议');
  orientationHint.innerHTML = '<span class="orientation-hint-icon" aria-hidden="true">↻</span><div><strong>横屏查看结构，体验更佳</strong><p>也可以继续竖屏使用；横屏能提供更宽的结构视野。</p></div><button type="button" aria-label="关闭横屏提示">×</button>';
  orientationHint.querySelector('button').addEventListener('click', () => { orientationHint.hidden = true; });
  shortcuts.after(orientationHint);
  const directories = [...document.querySelectorAll('.research-contents')].map(nav => {
    const details = document.createElement('details');
    details.className = 'mobile-research-directory';
    const summary = document.createElement('summary');
    summary.textContent = '本页目录';
    nav.before(details); details.append(summary, nav);
    details.addEventListener('click', event => {
      if (narrow.matches && event.target.closest('[data-research-anchor]')) {
        details.open = false;
        summary.focus({preventScroll:true});
      }
    }, true);
    return details;
  });
  const update = () => {
    close();
    directories.forEach(details => { details.open = !narrow.matches; });
  };
  narrow.addEventListener('change', update);
  update();
}
