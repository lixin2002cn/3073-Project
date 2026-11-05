import fs from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import katex from 'katex';

const root = import.meta.dirname;
const out = path.join(root, 'docs');
// Recreate generated output so removed pages and downloads stay unpublished.
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(path.join(out, 'assets'), { recursive: true });
await fs.mkdir(path.join(out, 'downloads'), { recursive: true });
const md = new MarkdownIt({ html: false, typographer: false });
const formula = (text, displayMode) => katex.renderToString(text.trim(), {
  displayMode, throwOnError: true, strict: 'error', output: 'htmlAndMathml', trust: false,
});
md.inline.ruler.before('escape', 'inline_math', (state, silent) => {
  if (!state.src.startsWith('\\(', state.pos)) return false;
  const end = state.src.indexOf('\\)', state.pos + 2);
  if (end < 0) return false;
  if (!silent) {
    const token = state.push('inline_math', '', 0);
    token.content = state.src.slice(state.pos + 2, end);
  }
  state.pos = end + 2;
  return true;
});
md.renderer.rules.inline_math = (tokens, idx) => formula(tokens[idx].content, false);
md.block.ruler.before('fence', 'display_math', (state, start, end, silent) => {
  const first = state.src.slice(state.bMarks[start] + state.tShift[start], state.eMarks[start]).trim();
  if (first !== '\\[') return false;
  let next = start + 1;
  while (next < end && state.src.slice(state.bMarks[next] + state.tShift[next], state.eMarks[next]).trim() !== '\\]') next++;
  if (next === end) throw new Error('Unclosed display math block');
  if (silent) return true;
  const token = state.push('display_math', '', 0);
  token.block = true;
  token.content = state.getLines(start + 1, next, 0, false);
  token.map = [start, next + 1];
  state.line = next + 1;
  return true;
});
md.renderer.rules.display_math = (tokens, idx) => `<div class="equation" tabindex="0">${formula(tokens[idx].content, true)}</div>\n`;
const render = text => md.render(text).replaceAll('<table>', '<div class="table-wrap" tabindex="0"><table>').replaceAll('</table>', '</table></div>');
const briefs = {
  en: await fs.readFile(path.join(root, 'src/student.en.md'), 'utf8'),
  zh: await fs.readFile(path.join(root, 'src/student.md'), 'utf8'),
};
const { buildPages } = await import('./pages.mjs');
await buildPages({out,render,formula,briefs});
for(const file of ['style.css','site.js','favicon.svg']) await fs.copyFile(path.join(root,'src',file),path.join(out,'assets',file));
const katexPackage = path.join(root, 'node_modules/katex');
const katexAssets = path.join(out, 'assets/katex');
await fs.mkdir(katexAssets);
await fs.copyFile(path.join(katexPackage, 'LICENSE'), path.join(katexAssets, 'LICENSE'));
await fs.copyFile(path.join(katexPackage, 'dist/katex.min.css'), path.join(katexAssets, 'katex.min.css'));
await fs.cp(path.join(katexPackage, 'dist/fonts'), path.join(katexAssets, 'fonts'), {recursive: true});
await fs.writeFile(path.join(out, '.nojekyll'), '');
await fs.writeFile(path.join(out,'downloads/project-brief.md'), briefs.zh);
await fs.writeFile(path.join(out,'downloads/project-brief.en.md'), briefs.en);
// Keep published assignment bookmarks useful after the change of project.
const report = './#report';
const redirect = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>DSAA3073 project report</title><meta http-equiv="refresh" content="0;url=${report}"></head><body><a href="${report}">Read the project report requirements</a></body></html>\n`;
for (const oldPage of ['assignment.html', 'requirements.html']) {
  await fs.writeFile(path.join(out, oldPage), redirect);
}
console.log('Built the project site in docs/.');
