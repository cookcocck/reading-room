import fs from 'fs';
import path from 'path';
import type { Classic, ClassicMeta, ClassicParagraph } from '../../types';

// dist/db/models/classics.js → 项目根/data/classics
const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data', 'classics');

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 把段落渲染为含高亮标记（span.cls-hl）与可点击字词（span.cls-term）的 HTML。
 * 先按高亮句切分，再在每块内把注解词包成可点击标记（带注音 ruby）。
 */
export function renderParagraphHtml(p: ClassicParagraph): string {
  const escapedText = escapeHtml(p.text);
  const terms = p.annotations.map(a => a.term);

  // 1) 按高亮句切分文本（先按原文出现位置排序，防止乱序导致漏匹配）
  const segments: Array<{ kind: 'text' | 'hl'; s: string; type?: string }> = [];
  const orderedHls = p.highlights
    .map(h => ({ h, esc: escapeHtml(h.text), idx: escapedText.indexOf(escapeHtml(h.text)) }))
    .filter(x => x.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  let rest = escapedText;
  for (const { h, esc } of orderedHls) {
    const idx = rest.indexOf(esc);
    if (idx === -1) continue;
    if (idx > 0) segments.push({ kind: 'text', s: rest.slice(0, idx) });
    segments.push({ kind: 'hl', s: esc, type: h.type });
    rest = rest.slice(idx + esc.length);
  }
  if (rest) segments.push({ kind: 'text', s: rest });

  // 2) 每块内把注解词包成可点击标记（最长词优先）
  const re = terms.length > 0
    ? new RegExp(
        '(' + terms.map(t => escapeRegExp(escapeHtml(t))).sort((a, b) => b.length - a.length).join('|') + ')',
        'g'
      )
    : null;

  function wrapTerms(text: string): string {
    if (!re) return text;
    return text.replace(re, (m) => {
      const term = m.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      const ann = p.annotations.find(a => a.term === term);
      const rt = ann && ann.phonetic
        ? `<rt>${escapeHtml(ann.phonetic)}</rt>`
        : '';
      return `<span class="cls-term" data-term="${escapeHtml(term)}"><ruby>${m}${rt}</ruby></span>`;
    });
  }

  return segments.map(seg =>
    seg.kind === 'hl'
      ? `<span class="cls-hl" data-type="${seg.type}">${wrapTerms(seg.s)}</span>`
      : wrapTerms(seg.s)
  ).join('');
}

export function getAllClassicMetas(): ClassicMeta[] {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'index.json'), 'utf-8');
    return JSON.parse(raw) as ClassicMeta[];
  } catch (e) {
    console.error('[classics] failed to read index.json:', (e as Error).message);
    return [];
  }
}

export function getClassicById(id: string): Classic | null {
  // 只允许小写字母、数字、连字符，防路径穿越
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  const file = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const classic = JSON.parse(raw) as Classic;
    classic.paragraphs = classic.paragraphs.map(p => ({ ...p, html: renderParagraphHtml(p) }));
    return classic;
  } catch (e) {
    console.error(`[classics] failed to load ${id}:`, (e as Error).message);
    return null;
  }
}
