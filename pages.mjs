import fs from 'node:fs/promises';
import path from 'node:path';

const siteRoot = '/3073-Project/';

const locales = {
  en: {
    lang: 'en', home: siteRoot, brief: siteRoot + 'downloads/project-brief.en.md',
    skip: 'Skip to the project', homeLabel: 'DSAA3073 project home', language: 'Page language',
    print: 'Print or save as PDF', printShort: 'Print / PDF',
    course: 'Course and learning sheets', term: 'Fall 2026', project: 'Individual project',
    footer: 'DSAA3073 / Final project', top: 'Back to top',
    kicker: 'FINAL PROJECT · FALL 2026', read: 'Read the brief', download: 'Download the brief',
    hero: 'Learn the voting weights from a sample. Then compare the vote with the best single model on new examples.',
    diagram: 'From base models to a weighted vote', sum: 'Weighted sum', score: 'Vote score',
    diagramNote: 'The models are fixed. The sample determines the weights.',
    contents: 'On this page', navigation: ['Problem setup', 'Research questions', 'Report and presentations'],
    questions: 'The three questions', sectionLabels: ['SETUP', 'QUESTIONS', 'REPORT'],
    steps: [
      ['Q1', 'Basics', 'Classification error', 'How many ways can the vote label a set of inputs?'],
      ['Q2', 'Next step', 'Exponential risk', 'What error bound can we get from exponential risk?'],
      ['Q3', 'Open question', 'Gain from voting', 'What changes the gain from voting?'],
    ],
  },
  zh: {
    lang: 'zh-CN', home: siteRoot + 'zh.html', brief: siteRoot + 'downloads/project-brief.md',
    skip: '跳到项目题面', homeLabel: 'DSAA3073 项目首页', language: '页面语言',
    print: '打印或保存为 PDF', printShort: '打印 / PDF',
    course: '课程与学习讲义', term: '2026 年秋季', project: '个人项目',
    footer: 'DSAA3073 / 期末项目', top: '回到顶部',
    kicker: '期末项目 · 2026 年秋季', read: '阅读项目题面', download: '下载题面',
    hero: '用样本学习投票权重，再比较加权投票与最佳单模型在新样本上的分类错误率。',
    diagram: '从基模型到加权投票', sum: '加权求和', score: '投票分数',
    diagramNote: '基模型固定，投票权重由样本确定。',
    contents: '阅读目录', navigation: ['统一设定', '三个研究问题', '报告与汇报'],
    questions: '三个研究问题', sectionLabels: ['问题设定', '研究问题', '项目报告'],
    steps: [
      ['第一问', '基础', '分类错误率', '组合能产生多少种分类结果？'],
      ['第二问', '进阶', '指数风险', '从指数风险可以推导出怎样的分类界？'],
      ['第三问', '开放研究', '组合的收益', '什么条件会影响组合的收益？'],
    ],
  },
};

const sectionIds = ['setting', 'question-1', 'report'];
const headingIds = [
  ['voting-models', 'risk-definitions', 'potential-gain'],
  ['question-1-1', 'question-1-2', 'question-1-3'],
  ['presentation-order'],
];
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5"/></svg>';
const printer = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 8V3h10v5M7 17H4V8h16v9h-3M7 14h10v7H7z" stroke="currentColor" stroke-width="1.5"/><circle cx="17" cy="11" r="1" fill="currentColor"/></svg>';
const escape = s => s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');

function readBrief(source) {
  const [overview, ...sections] = source.split(/^## /m).slice(1);
  const title = overview.split('\n')[0].trim();
  const intro = overview.split(/^### [^\n]+\n/m)[1]?.trim();
  if (!title || !intro || sections.length !== sectionIds.length) throw new Error('Expected an introduction and three project sections.');
  return { title, intro, sections };
}

function languageNav(t) {
  const choices = Object.entries(locales).map(([key, choice]) => {
    const state = t === choice ? 'aria-current="page"' : 'data-switch-language';
    return `<a href="${choice.home}" hreflang="${choice.lang}" lang="${choice.lang}" ${state}>${key === 'en' ? 'English' : '中文'}</a>`;
  }).join('');
  return `<nav class="language-nav" aria-label="${t.language}">${choices}</nav>`;
}

function header(t) {
  return `<a class="skip-link" href="#main">${t.skip}</a><header class="site-header"><div class="header-inner">
    <a class="wordmark" href="${t.home}" aria-label="${t.homeLabel}"><span class="wordmark-icon">∑</span><span>DSAA<span class="wordmark-number">3073</span><small lang="en">THEORIES IN DATA SCIENCE</small></span></a>
    ${languageNav(t)}
    <button class="print-button" type="button" data-print aria-label="${t.print}">${printer}<span>${t.printShort}</span></button>
  </div></header>`;
}

function diagram(t, formula) {
  return `<div class="hero-diagram"><div class="diagram-caption"><span class="tiny-dot"></span>${t.diagram}</div>
    <div class="model-flow"><div class="model-stack"><span>h<sub>1</sub>(x)</span><span>h<sub>2</sub>(x)</span><span class="model-ellipsis">⋮</span><span>h<sub>M</sub>(x)</span></div>
    <svg class="flow-lines" viewBox="0 0 95 170" fill="none" aria-hidden="true"><path d="M0 15C55 15 30 85 95 85M0 60C55 60 30 85 95 85M0 155C55 155 30 85 95 85" stroke="currentColor"/></svg>
    <div class="combine-symbol">∑<small>${t.sum}</small></div><span class="flow-arrow">⟶</span><div class="flow-output">f<sub>w</sub>(x)<small>${t.score}</small></div></div>
    <div class="diagram-equation">${formula(String.raw`w\in\Delta_M,\qquad f_w(x)=\sum_{j=1}^{M}w_jh_j(x)`,false)}</div><p>${t.diagramNote}</p></div>`;
}

function section(t, source, i, render) {
  const id = sectionIds[i];
  const end = source.indexOf('\n');
  const title = source.slice(0, end).replace(/^(?:[一二三]、|\d+[.)]\s*)/, '').trim();
  let body = render(source.slice(end+1));
  if (headingIds[i]) {
    let count = 0;
    body = body.replace(/<h3>/g, () => {
      const anchor = headingIds[i][count++];
      return `<h3 id="${anchor}"${i === 1 ? ' class="question-step-heading"' : ''}>`;
    });
    if (count !== headingIds[i].length) throw new Error(`Unexpected headings in ${t.lang} / ${id}`);
  }
  if (i === 1) {
    const steps = t.steps.map(([label,level,topic],j) =>
      `<a href="#${headingIds[1][j]}"><span>${label} · ${level}</span><strong>${topic}</strong></a>`).join('');
    body = `<nav class="question-path" aria-label="${t.questions}">${steps}</nav>` + body;
  }
  return `<section class="paper-section" id="${id}" aria-labelledby="${id}-title"><header class="section-heading">
    <span class="section-number">0${i}</span><div><p class="eyebrow">${t.sectionLabels[i]}</p><h2 id="${id}-title">${escape(title)}</h2></div>
  </header><div class="prose">${body}</div></section>`;
}

function sideNav(t) {
  const items = t.navigation.map((title, i) =>
    `<a href="#${sectionIds[i]}"><span>0${i}</span>${title}</a>`).join('');
  return `<aside class="side-nav"><p class="side-label">${t.contents}</p><nav aria-label="${t.contents}">${items}</nav>
    <div class="side-foot"><span class="status-dot"></span>DSAA3073 · ${t.term}<p>${t.project}</p><a href="https://lixin2002cn.github.io/dsaa3073/" target="_blank" rel="noopener">${t.course} ↗</a></div></aside>`;
}

function documentPage(t, source, render, formula) {
  const { title, intro, sections } = readBrief(source);
  const overview = t.steps.map(([label,,topic,prompt], j) =>
    `<a href="#${headingIds[1][j]}"><span class="overview-number">${label}</span><div><strong>${topic}</strong><p>${prompt}</p></div>${arrow}</a>`).join('');
  return `<!doctype html><html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="theme-color" content="#f6f5ef"><meta name="description" content="${escape(t.hero)}"><meta name="robots" content="noindex,nofollow">
    <title>${escape(title)} · DSAA3073</title><link rel="alternate" hreflang="en" href="${locales.en.home}"><link rel="alternate" hreflang="zh-CN" href="${locales.zh.home}">
    <link rel="icon" href="${siteRoot}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${siteRoot}assets/katex/katex.min.css"><link rel="stylesheet" href="${siteRoot}assets/style.css">
    <script defer src="${siteRoot}assets/site.js"></script></head><body class="student-page">${header(t)}<main id="main"><div id="top"></div>
    <section class="hero shell"><div class="hero-copy"><p class="eyebrow">${t.kicker}</p><h1>${escape(title.slice(0,-1))}<span class="title-question">${escape(title.slice(-1))}</span></h1>
    <p class="hero-description">${t.hero}</p><div class="hero-actions"><a class="primary-link" href="#setting">${t.read} ${arrow}</a>
    <a class="text-link" href="${t.brief}" download>${t.download} ↓</a></div></div>${diagram(t, formula)}</section>
    <div class="overview shell" aria-label="${t.questions}">${overview}</div>
    <div class="reading-layout shell">${sideNav(t)}<article class="paper"><div class="project-intro">${render(intro)}</div>${sections.map((s,i)=>section(t,s,i,render)).join('')}</article></div>
    </main><footer class="site-footer"><span>${t.footer}</span><span>${t.project}</span><a href="#top">${t.top} ↑</a></footer></body></html>`;
}

export async function buildPages({out,render,formula,briefs}) {
  for (const [key,t] of Object.entries(locales)) {
    const name = key === 'en' ? 'index.html' : 'zh.html';
    await fs.writeFile(path.join(out,name), documentPage(t, briefs[key], render, formula));
  }
  const notFound = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Page not found · DSAA3073</title><link rel="stylesheet" href="${siteRoot}assets/style.css"></head><body><main class="not-found shell"><h1>Page not found</h1><p lang="zh-CN">页面不存在</p><a class="primary-link" href="${locales.en.home}">Project brief in English</a><a class="text-link" lang="zh-CN" href="${locales.zh.home}">返回中文题面</a></main></body></html>`;
  await fs.writeFile(path.join(out,'404.html'), notFound);
}
