// Diagrams describe relationships, never synthetic experimental results.
export function feedbackDiagram() {
  return `<figure class="feedback-diagram" aria-label="设计与实验通过数据反馈形成循环">
    <svg viewBox="0 0 500 460" role="img" aria-label="设计、实验、数据、学习相连，回到下一轮设计">
      <circle class="loop-guide" cx="250" cy="220" r="153" />
      <path class="feedback-path" d="M250 67 A153 153 0 1 1 97 220 A153 153 0 0 1 250 67" />
      <g class="loop-node"><circle cx="250" cy="67" r="33"/><text x="250" y="73">设计</text></g>
      <g class="loop-node"><circle cx="403" cy="220" r="33"/><text x="403" y="226">实验</text></g>
      <g class="loop-node"><circle cx="250" cy="373" r="33"/><text x="250" y="379">数据</text></g>
      <g class="loop-node"><circle cx="97" cy="220" r="33"/><text x="97" y="226">学习</text></g>
      <text class="loop-center-small" x="250" y="200">NEXT ITERATION</text><text class="loop-center-title" x="250" y="237">下一轮，更有依据</text>
      <text class="loop-direction" x="365" y="116">↘</text><text class="loop-direction" x="365" y="342">↙</text><text class="loop-direction" x="129" y="342">↖</text><text class="loop-direction" x="129" y="116">↗</text>
    </svg><figcaption>研究流程示意 · 推荐仍需实验验证</figcaption></figure>`;
}

export function initNarrative() {
  const root = document.querySelector('[data-app-view="overview"]');
  if (!root || root.dataset.narrativeReady) return;
  root.dataset.narrativeReady = 'true';
  // Reuse the complete source paragraphs, pairing each with its design step.
  const design = root.querySelector('#home-design-story');
  const paragraphs = [...design.querySelectorAll('.editorial-body > p')];
  const stepTitles = [['01 / 理解', '分析序列与结构'], ['02 / 实验', '构建变体并检测'], ['03 / 反馈', '从不同结果中学习']];
  design.querySelectorAll('.design-evidence-line li').forEach((step, i) => {
    if (paragraphs[i]) step.querySelector('p').replaceWith(paragraphs[i]);
    step.querySelector('span').textContent = stepTitles[i][0];
    step.querySelector('strong').textContent = stepTitles[i][1];
  });
  design.querySelector('.editorial-body').remove();
  const loop = root.querySelector('.learning-loop');
  const stage = document.createElement('div'); stage.className = 'feedback-stage';
  loop.before(stage); stage.innerHTML = feedbackDiagram(); stage.append(loop);
  const mechanism = root.querySelector('.mechanism-questions');
  mechanism.insertAdjacentHTML('beforebegin', `<div class="mechanism-map home-reveal" aria-label="机制分析的三个观察尺度"><span class="mechanism-map-title">同一个酶，三个观察尺度</span><div><span><b>01</b>局部结合<small>底物与活性中心</small></span><i>↔</i><span><b>02</b>结构域协同<small>部件之间的配合</small></span><i>↔</i><span><b>03</b>整体功能<small>可测量的活性</small></span></div><small>分析视角示意 · 不表示空间结构或已验证机制</small></div>`);
  const outlook = root.querySelector('.story-outlook-action');
  outlook.insertAdjacentHTML('afterend', `<nav class="research-doors home-reveal" aria-label="深入研究"><span>继续深入 / EXPLORE THE RESEARCH</span><a href="#wet-lab" data-project-topic="wet-lab"><small>01 / EVIDENCE</small>实验如何验证？<i>↗</i></a><a href="#ai-methods" data-project-topic="ai-methods"><small>02 / METHODS</small>模型如何学习？<i>↗</i></a><a href="#verifiability" data-project-topic="verifiability"><small>03 / SOURCES</small>证据从哪里来？<i>↗</i></a></nav>`);
  root.querySelectorAll('h1, h2').forEach(wrapTitleLines);
  const transitions = [
    ['home-background', '路线有了，关键酶能否胜任？'],
    ['home-problem', '从理解酶开始，寻找改变的依据。'],
    ['home-design-story', '实验留下的数据，如何指导下一步？'],
    ['home-loop', '除了知道是否有效，还要追问为什么。'],
    ['home-mechanism', '把对一个酶的认识，积累成一种方法。'],
  ];
  transitions.forEach(([id, text]) => {
    const bridge = document.createElement('div'); bridge.className = 'chapter-transition story-shell'; bridge.textContent = text;
    root.querySelector(`#${id}`).append(bridge);
  });
}

// Preserve semantic heading text and inline emphasis, with no duplicated screen-reader copy.
export function wrapTitleLines(heading) {
  if (heading.querySelector('.title-line')) return;
  const nodes = [...heading.childNodes];
  const fragment = document.createDocumentFragment();
  let line;
  const nextLine = () => {
    const mask = document.createElement('span'); mask.className = 'title-line';
    line = document.createElement('span'); line.className = 'title-line-inner';
    mask.append(line); fragment.append(mask);
  };
  nextLine();
  const hasBreak = nodes.some((node) => node.nodeName === 'BR');
  nodes.forEach((node) => {
    if (node.nodeName === 'BR') { nextLine(); return; }
    if (!hasBreak && node.nodeType === Node.TEXT_NODE && node.textContent.includes('，')) {
      const parts = node.textContent.split('，');
      parts.forEach((part, i) => { line.append(document.createTextNode(part + (i < parts.length - 1 ? '，' : ''))); if (i < parts.length - 1) nextLine(); });
    } else line.append(node);
  });
  heading.replaceChildren(fragment);
}
