import { Router, Request, Response } from 'express';
import { getAllClassicMetas, getClassicById } from '../db/models/classics';
import type { Classic } from '../types';

const router = Router();

// ─── 经典篇目 · 列表（按作者分组） ───
router.get('/', (_req: Request, res: Response) => {
  const metas = getAllClassicMetas();

  const groupsMap = new Map<string, { author: string; dynasty: string; items: typeof metas }>();
  metas.forEach(m => {
    if (!groupsMap.has(m.author)) {
      groupsMap.set(m.author, { author: m.author, dynasty: m.dynasty, items: [] });
    }
    groupsMap.get(m.author)!.items.push(m);
  });
  const authorGroups = Array.from(groupsMap.values());
  const dynasties = Array.from(new Set(metas.map(m => m.dynasty)));

  res.render('classics', {
    title: '经典篇目',
    authorGroups,
    totalCount: metas.length,
    authorCount: authorGroups.length,
    dynastyCount: dynasties.length,
    isClassics: true,
    path: '/classics',
  });
});

// ─── 经典篇目 · 详情阅读页 ───
router.get('/:id', (req: Request, res: Response) => {
  const classicId = req.params.id as string;
  const classic = getClassicById(classicId);
  if (!classic) {
    res.status(404).send('未找到该篇目');
    return;
  }

  const annotationCount = classic.paragraphs.reduce((s, p) => s + p.annotations.length, 0);
  const allusionCount = classic.allusions.length;
  const segmentCount = classic.paragraphs.length;

  // 前端交互所需数据（去除已渲染的 html，避免重复）
  const payload = {
    id: classic.id,
    title: classic.title,
    paragraphs: classic.paragraphs.map(p => ({
      text: p.text,
      translation: p.translation,
      annotations: p.annotations,
    })),
    allusions: classic.allusions,
  };

  res.render('classic-detail', {
    title: classic.title,
    classic,
    annotationCount,
    allusionCount,
    segmentCount,
    classicDataJson: JSON.stringify(payload).replace(/</g, '\\u003c'),
    isClassics: true,
    path: '/classics',
  });
});

export default router;
