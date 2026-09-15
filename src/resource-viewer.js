import { renderDocument } from './research-pages.js?v=20260915-medal-evidence';

const REPOSITORY_ROOT = 'assets/repository/';
const TEXT_EXTENSIONS = new Set(['md','txt','py','js','json','yaml','yml','toml','csv','fasta','faa','pdb']);
const IMAGE_EXTENSIONS = new Set(['png','jpg','jpeg','webp','gif','svg']);
const DOWNLOAD_EXTENSIONS = new Set(['xlsx','xls','docx','doc','zip','pdf']);
const escapeHtml = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const fileExtension = path => (path.split('.').pop() || '').toLowerCase();
const decodePath = url => decodeURIComponent(new URL(url,location.href).pathname).split(`/${REPOSITORY_ROOT}`)[1] || decodeURIComponent(new URL(url,location.href).pathname.split('/').pop());
const friendlyType = extension => ({md:'Markdown 文档',py:'Python 源码',js:'JavaScript 源码',json:'JSON 数据',yaml:'YAML 配置',yml:'YAML 配置',fasta:'FASTA 序列',faa:'蛋白序列',pdb:'PDB 结构坐标',xlsx:'Excel 数据表',xls:'Excel 数据表',docx:'Word 文档',doc:'Word 文档',pdf:'PDF 文档',zip:'压缩包'}[extension] || `${extension.toUpperCase()} 文件`);

export function directoryEntries(files, directory) {
  const prefix = directory.replace(/^\/+|\/+$/g,'') + '/';
  return files.filter(file=>file.startsWith(prefix) && !file.endsWith('/.gitkeep') && file!=='.gitkeep').map(file=>file.slice(prefix.length)).filter(Boolean).sort();
}

function resourceButton(url,path) {
  const extension=fileExtension(path); const label=path;
  return `<button type="button" class="resource-file" data-resource-url="${escapeHtml(url)}" data-resource-title="${escapeHtml(label)}"><span>${escapeHtml(label)}</span><small>${escapeHtml(friendlyType(extension))}</small><i aria-hidden="true">↗</i></button>`;
}

export function initResourceViewer() {
  const dialog=document.getElementById('resource-dialog');
  if(!dialog || dialog.dataset.ready) return;
  dialog.dataset.ready='true';
  const body=document.getElementById('resource-dialog-body');
  const title=document.getElementById('resource-dialog-title');
  const pathLabel=document.getElementById('resource-dialog-path');
  const raw=document.getElementById('resource-dialog-raw');
  const close=()=>dialog.close?.();
  document.getElementById('resource-dialog-close')?.addEventListener('click',close);
  dialog.addEventListener('click',event=>{if(event.target===dialog)close();});

  const open=async(trigger)=>{
    const absolute=new URL(trigger.dataset.resourceUrl,location.href);
    const path=decodePath(absolute.href); const extension=fileExtension(path);
    title.textContent=trigger.dataset.resourceTitle || path.split('/').filter(Boolean).pop() || '资料预览';
    pathLabel.textContent=path; raw.href=absolute.href; raw.hidden=absolute.pathname.endsWith('/');
    body.scrollTop=0; body.scrollLeft=0;
    body.innerHTML='<div class="resource-loading"><span></span><p>正在从项目归档载入资料…</p></div>';
    if(typeof dialog.showModal==='function'&&!dialog.open) dialog.showModal(); else dialog.setAttribute('open','');
    try {
      if(absolute.pathname.endsWith('/')) {
        const response=await fetch(new URL('assets/repository/files.json',location.href));
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        const files=await response.json(); const entries=directoryEntries(files,path);
        const base=new URL(REPOSITORY_ROOT,location.href);
        body.innerHTML=entries.length?`<div class="resource-directory-intro"><b>${entries.length} 个归档文件</b><span>选择文件在当前窗口继续查看</span></div><div class="resource-file-list">${entries.map(entry=>resourceButton(new URL(path.replace(/\/?$/,'/')+entry,base).href,entry)).join('')}</div>`:'<div class="resource-empty"><b>此目录暂无可展示文件</b><p>空目录占位符不会作为项目证据展示。</p></div>';
        return;
      }
      if(IMAGE_EXTENSIONS.has(extension)) { body.innerHTML=`<figure class="resource-image"><img src="${escapeHtml(absolute.href)}" alt="${escapeHtml(title.textContent)}"><figcaption>${escapeHtml(path)}</figcaption></figure>`; return; }
      if(DOWNLOAD_EXTENSIONS.has(extension)) { body.innerHTML=`<div class="resource-download"><span>${escapeHtml(extension.toUpperCase())}</span><h3>${escapeHtml(title.textContent)}</h3><p>${escapeHtml(friendlyType(extension))}不在浏览器中强行转码，避免表格、公式或版式损坏。可下载原文件后使用对应软件查看。</p><a href="${escapeHtml(absolute.href)}" download>下载原文件</a></div>`; return; }
      const response=await fetch(absolute.href); if(!response.ok) throw new Error(`HTTP ${response.status}`); const text=await response.text();
      if(extension==='md') body.innerHTML=`<article class="research-article resource-markdown">${renderDocument(text,absolute.href,'resource-preview').html}</article>`;
      else if(TEXT_EXTENSIONS.has(extension)) body.innerHTML=`<pre class="resource-code" data-language="${escapeHtml(extension)}"><code>${escapeHtml(text)}</code></pre>`;
      else body.innerHTML=`<div class="resource-download"><h3>${escapeHtml(title.textContent)}</h3><p>此文件类型暂不提供站内预览，请获取原文件查看。</p></div>`;
    } catch(error) { body.innerHTML=`<div class="resource-empty"><b>资料暂时无法载入</b><p>${escapeHtml(error.message)}</p></div>`; }
  };
  document.addEventListener('click',event=>{const trigger=event.target.closest('[data-resource-url]');if(!trigger)return;event.preventDefault();open(trigger);});
  return {open,close};
}
