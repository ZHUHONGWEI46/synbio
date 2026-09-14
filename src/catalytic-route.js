import { gsap } from '../vendor/gsap/index.js';
import { ScrollTrigger } from '../vendor/gsap/ScrollTrigger.js';

const names = [
  ['L-谷氨酸', 'L-Glutamate', '起始原料'],
  ['GABA', 'γ-氨基丁酸', 'CAR 的目标底物'],
  ['4-氨基丁醛', '4-Aminobutyraldehyde', '中间产物'],
  ['1,4-丁二胺', 'Putrescine', '目标产物'],
];
const molecules = ["<g id=\"molecule-glutamate\" transform=\"translate(12 4)\">\n    <text x=\"0\" y=\"79\" class=\"atom\">HO</text>\n    <path class=\"bond\" d=\"M34 68L59 54L96 76L133 54L170 76L207 54L236 70M56 51V25M63 51V25M204 51V25M211 51V25\"/>\n    <text x=\"51\" y=\"18\" class=\"atom\">O</text><text x=\"200\" y=\"18\" class=\"atom\">O</text><text x=\"239\" y=\"81\" class=\"atom\">OH</text>\n    <path d=\"M170 77L164 111H176Z\" fill=\"#294a69\"/>\n    <text x=\"155\" y=\"134\" class=\"atom\">NH<tspan baseline-shift=\"sub\" font-size=\"13\">2</tspan></text>\n    \n    \n    \n  </g>","<g id=\"molecule-gaba\" transform=\"translate(12 4)\">\n    <text x=\"0\" y=\"80\" class=\"atom\">H<tspan baseline-shift=\"sub\" font-size=\"13\">2</tspan>N</text>\n    <path class=\"bond\" d=\"M43 68L66 80L102 58L138 80L174 58L202 74M171 55V29M178 55V29\"/>\n    <text x=\"166\" y=\"21\" class=\"atom\">O</text><text x=\"205\" y=\"85\" class=\"atom\">OH</text>\n    \n    \n    \n  </g>","<g id=\"molecule-aldehyde\" transform=\"translate(12 4)\">\n    <text x=\"0\" y=\"80\" class=\"atom\">H<tspan baseline-shift=\"sub\" font-size=\"13\">2</tspan>N</text>\n    <path class=\"bond\" d=\"M43 68L66 80L102 58L138 80L174 58L202 74M171 55V29M178 55V29\"/>\n    <text x=\"166\" y=\"21\" class=\"atom\">O</text><text x=\"207\" y=\"85\" class=\"atom\">H</text>\n    \n    \n    \n  </g>","<g id=\"molecule-putrescine\" transform=\"translate(12 4)\">\n    <text x=\"0\" y=\"80\" class=\"atom\">H<tspan baseline-shift=\"sub\" font-size=\"13\">2</tspan>N</text>\n    <path class=\"bond\" d=\"M43 68L66 80L102 58L138 80L174 58L201 74\"/>\n    <text x=\"205\" y=\"85\" class=\"atom\">NH<tspan baseline-shift=\"sub\" font-size=\"13\">2</tspan></text>\n    \n    \n    \n  </g>"];
export function catalyticRouteMarkup() {
  const card = (i) => `<div class="catalytic-step" data-catalytic-step="${i}"><small>0${i+1} / ${names[i][2]}</small><svg viewBox="0 0 300 156" aria-hidden="true">${molecules[i]}</svg><strong>${names[i][0]}</strong><span>${names[i][1]}</span></div>`;
  const link = (i, enzyme, description) => `<div class="catalytic-link ${i===1?'catalytic-car':''}" data-catalytic-link="${i}"><b>${enzyme}</b>${i===1?'<span class="catalytic-limit">关键限速酶</span><img class="catalytic-gateway" loading="lazy" decoding="async" width="1536" height="1024" src="assets/home/car-catalytic-gateway.png" alt="银蓝透明 CAR 分子引擎概念舱，内部为抽象酶轮廓"/><span class="catalytic-target">本项目改造对象</span>':''}<svg class="catalytic-flow" viewBox="0 0 160 34" aria-hidden="true"><path class="catalytic-track" d="M5 17H150"/><path class="catalytic-charge" pathLength="1" d="M5 17H150"/><path d="M142 11L152 17L142 23" class="catalytic-arrow"/><circle class="catalytic-particle" cx="9" cy="17" r="3"/>${i===1?'<circle class="catalytic-queue" cx="23" cy="17" r="2.5"/><circle class="catalytic-queue" cx="35" cy="17" r="2.5"/>':''}</svg><small>${description}</small></div>`;
  const captions = [
    ['01 / DECARBOXYLATION', '从 L-谷氨酸出发', 'GadA 催化脱羧，释放 CO₂，生成 GABA。'],
    ['02 / THE CAR ENGINE', '进入关键限速环节', 'CAR 利用 ATP 与 NADPH，将 GABA 的羧酸基团还原为醛。'],
    ['03 / TRANSAMINATION', '最后一次转化', 'TA 催化转氨，将 4-氨基丁醛转化为 1,4-丁二胺。'],
    ['04 / ROUTE COMPLETE', '完整路线，在这里相连', '本项目聚焦 CAR 改造，为整条生物制造路线提供关键酶元件。'],
  ];
  return '<div class="catalytic-heading"><span>THE CATALYTIC ROUTE / 完整催化路线</span><small>向下滚动，驱动反应 →</small></div><div class="catalytic-grid">'+card(0)+link(0,'GadA','脱羧 · 释放 CO₂')+card(1)+link(1,'CAR','羧酸 → 醛')+card(2)+link(2,'TA','转氨 · 醛 → 胺')+card(3)+'</div><div class="catalytic-journey"><div class="catalytic-scenes">'+captions.map(([kicker,title,copy],i)=>`<div class="catalytic-scene" data-reaction-scene="${i}"><small>${kicker}</small><h3>${title}</h3><p>${copy}</p></div>`).join('')+'</div><div class="catalytic-progress" aria-hidden="true"><i></i></div><div class="catalytic-summary">L-谷氨酸 <span>→ GadA →</span> GABA <span>→ CAR →</span> 4-氨基丁醛 <span>→ TA →</span> 1,4-丁二胺</div></div><div class="catalytic-footer"><span>GadA：谷氨酸脱羧酶 · CAR：羧酸还原酶 · TA：转氨酶</span><small>路线与限速环节示意 · 概念舱非结构模型 · 不表示实测反应速率</small></div>';
}
export function initCatalyticRoute() {
  const root = document.querySelector('.reaction-route');
  const scroller = document.getElementById('home-scroll');
  if (!root || !scroller) return;
  root.innerHTML = catalyticRouteMarkup();
  root.classList.add('catalytic-route');
  root.setAttribute('aria-label', 'L-谷氨酸经 GadA 生成 GABA，经关键限速酶 CAR 生成4-氨基丁醛，经 TA 生成1,4-丁二胺');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  const responsive = gsap.matchMedia();
  responsive.add({motion:'(prefers-reduced-motion: no-preference)',compact:'(max-width: 760px)'}, (context) => {
    if (!context.conditions.motion) return;
    root.classList.add('is-journey');
    const chapter = root.closest('.catalytic-chapter');
    chapter.classList.add('is-sticky-journey');
    const compact = context.conditions.compact;
    const setHeight = () => {
      root.style.setProperty('--reaction-height', `${scroller.clientHeight}px`);
      chapter.style.setProperty('--journey-distance', `${scroller.clientHeight*5.2}px`);
    };
    setHeight();
    const steps = root.querySelectorAll('.catalytic-step');
    const links = root.querySelectorAll('.catalytic-link');
    const scenes = root.querySelectorAll('.catalytic-scene');
    const travelers = [...links].map((link,i) => {
      const traveler = document.createElement('div');
      traveler.className = 'catalytic-traveler';
      traveler.setAttribute('aria-hidden','true');
      traveler.innerHTML = `<svg viewBox="0 0 300 156">${molecules[i].replace(/id="[^"]+"/g,'')}</svg>`;
      root.append(traveler);
      return traveler;
    });
    const byproduct = document.createElement('span');
    byproduct.className = 'catalytic-release'; byproduct.textContent = 'CO₂ ↑';
    byproduct.setAttribute('aria-hidden','true'); root.append(byproduct);
    // Geometry is re-read on every refresh, not hard-coded to a desktop viewport.
    const center = (element) => {
      const rect = element.getBoundingClientRect(), bounds = root.getBoundingClientRect();
      return {x:rect.left-bounds.left+rect.width/2-90,y:rect.top-bounds.top+rect.height/2-48};
    };
    const timeline = gsap.timeline({scrollTrigger:{
      trigger:chapter, scroller, start:'top top', end:()=>`+=${scroller.clientHeight*4.2}`,
      // Native sticky handles layout. ScrollTrigger only scrubs the internal scene:
      // no per-frame transform on the panel, no pin-spacer/refresh layout jumps.
      scrub:.35, invalidateOnRefresh:true,
      onRefreshInit:setHeight,
      onUpdate:self=>root.dataset.reactionProgress=String(self.progress),
    }});
    timeline.fromTo(steps[0],{opacity:0,scale:.72,y:45},{opacity:1,scale:1,y:0,duration:.65},0);
    [...steps].slice(1).forEach(step => timeline.set(step,{opacity:0},0));
    timeline.set(links,{opacity:0},0);
    timeline.set(scenes,{opacity:0,y:16},0);
    timeline.to(scenes[0],{opacity:1,y:0,duration:.5},0);
    timeline.fromTo('.catalytic-progress i',{scaleX:0},{scaleX:1,duration:10,ease:'none'},0);
    timeline.set('.catalytic-summary',{opacity:0},0);
    links.forEach((link,i) => {
      const start = .9+i*2.65;
      const traveler = travelers[i];
      if (i) {
        timeline.to(scenes[i-1],{opacity:0,y:-12,duration:.3},start-.3);
        timeline.to(scenes[i],{opacity:1,y:0,duration:.45},start);
      }
      timeline.fromTo(link,{opacity:0,scale:.75},{opacity:1,scale:1,duration:.5},start);
      timeline.fromTo(traveler,{x:()=>center(steps[i].querySelector('svg')).x,y:()=>center(steps[i].querySelector('svg')).y,opacity:0,scale:.95},
        {opacity:1,duration:.15},start+.25);
      timeline.to(steps[i],{opacity:compact?0:.4,duration:.35},start+.3);
      timeline.to(traveler,{x:()=>center(link).x,y:()=>center(link).y,scale:.38,duration:.65,ease:'power2.inOut'},start+.45);
      timeline.fromTo(link.querySelector('.catalytic-charge'),{strokeDashoffset:1},{strokeDashoffset:0,duration:1.3,ease:'none'},start+.4);
      timeline.fromTo(link.querySelector('.catalytic-particle'),{x:0,opacity:0},{x:139,opacity:1,duration:1.2,ease:'power2.inOut'},start+.6);
      timeline.to(traveler,{opacity:0,scale:.12,duration:.3},start+1.1);
      timeline.fromTo(steps[i+1],{opacity:0,scale:.65,y:24},{opacity:1,scale:1,y:0,duration:.7,ease:'back.out(1.3)'},start+1.4);
      timeline.to(link.querySelector('.catalytic-particle'),{opacity:0,duration:.2},start+1.8);
      if (compact) timeline.to(link,{opacity:0,duration:.3},start+2.15);
    });
    timeline.fromTo('.catalytic-gateway',{scale:.85},{scale:1.2,duration:.8},3.9);
    timeline.to('.catalytic-gateway',{scale:1,duration:.65},5);
    timeline.fromTo('.catalytic-limit',{scale:1},{scale:1.18,duration:.5,yoyo:true,repeat:1},3.7);
    timeline.fromTo('.catalytic-queue',{opacity:0},{opacity:1,stagger:.12,duration:.3},3.8);
    timeline.to('.catalytic-queue',{opacity:0,duration:.5},4.9);
    timeline.fromTo(byproduct,{x:()=>center(links[0]).x+80,y:()=>center(links[0]).y,opacity:0,scale:.6},
      {y:()=>center(links[0]).y-70,opacity:1,scale:1,duration:.65},1.9);
    timeline.to(byproduct,{opacity:0,y:'-=30',duration:.4},2.6);
    timeline.to(scenes[2],{opacity:0,y:-12,duration:.3},8.8);
    timeline.to(scenes[3],{opacity:1,y:0,duration:.5},9.1);
    if (!compact) timeline.to(steps,{opacity:1,duration:.6},9.1);
    timeline.to('.catalytic-summary',{opacity:1,duration:.6},9.2);
    // A final hold gives the completed reaction time to read before the pin releases.
    timeline.to({}, {duration:.8},10);
    return () => {
      timeline.scrollTrigger?.kill(); timeline.kill();
      travelers.forEach(element=>element.remove()); byproduct.remove();
      root.classList.remove('is-journey');
      chapter.classList.remove('is-sticky-journey');
      chapter.style.removeProperty('--journey-distance');
      gsap.set([...steps,...links,...scenes],{clearProps:'all'});
    };
  },root);
  const refresh = () => ScrollTrigger.refresh();
  root.querySelector('.catalytic-gateway')?.addEventListener('load',refresh,{once:true});
  requestAnimationFrame(refresh);
  return {destroy:()=>{responsive.revert();root.querySelector('.catalytic-gateway')?.removeEventListener('load',refresh);}};
}
