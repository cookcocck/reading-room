import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, destroyTestDb, seedAll } from '../helpers/test-db';
import type { DbWrapper } from '../../src/types';
import {
  getSummary, getOverall, getHeatmap, getTrends,
  getWeekdayDistribution, getReadingStats,
  getDeepThinking, getBookTimeline, getYearlyIntensity,
  getHomepageStats,
} from '../../src/db/models/stats';

let db: DbWrapper;

beforeAll(async () => {
  db = await createTestDb();
  seedAll(db);
});

afterAll(() => {
  destroyTestDb();
});

describe('stats - getSummary()', () => {
  it('返回摘要信息', () => {
    const summary = getSummary();
    expect(summary.totalBooks).toBeGreaterThanOrEqual(0);
    expect(summary.finishedCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(summary.categories)).toBe(true);
    expect(Array.isArray(summary.topAuthors)).toBe(true);
    expect(Array.isArray(summary.archives)).toBe(true);
  });
});

describe('stats - getOverall()', () => {
  it('返回 overall 和 annual 数据', () => {
    const overall = getOverall();
    expect(overall.overall).toBeDefined();
    expect(overall.annual).toBeDefined();
    expect(overall.overall!.totalReadTimeSec).toBe(59000);
  });
});

describe('stats - getHeatmap()', () => {
  it('返回热力图数据', () => {
    const heatmap = getHeatmap();
    expect(Array.isArray(heatmap)).toBe(true);
    // 种子数据中有 3 天 reading_sessions
    expect(heatmap.length).toBeGreaterThanOrEqual(3);
    heatmap.forEach(entry => {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.seconds).toBeGreaterThan(0);
    });
  });
});

describe('stats - getTrends()', () => {
  it('返回阅读趋势', () => {
    const trends = getTrends();
    expect(trends.length).toBeGreaterThanOrEqual(2);
    trends.forEach(t => {
      expect(t.year).toBeGreaterThan(0);
      expect(t.month).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('stats - getWeekdayDistribution()', () => {
  it('返回 7 个值', () => {
    const dist = getWeekdayDistribution();
    expect(dist.length).toBe(7);
    const sum = dist.reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(0);
  });
});

describe('stats - getReadingStats()', () => {
  it('返回阅读统计', () => {
    const stats = getReadingStats();
    expect(stats.totalReadTimeSec).toBeGreaterThanOrEqual(0);
    expect(stats.readDays).toBeGreaterThanOrEqual(0);
  });
});

describe('stats - getDeepThinking()', () => {
  it('返回深度阅读排行', () => {
    const deep = getDeepThinking();
    expect(Array.isArray(deep)).toBe(true);
    deep.forEach(item => {
      expect(item.id).toBeTruthy();
      expect(item.totalNotes).toBeGreaterThan(0);
    });
  });
});

describe('stats - getBookTimeline()', () => {
  it('返回时间线', () => {
    const timeline = getBookTimeline();
    expect(timeline.length).toBeGreaterThanOrEqual(3);
    // 时间线按 update_time 排序
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].addedAt).toBeGreaterThanOrEqual(timeline[i - 1].addedAt);
    }
  });
});

describe('stats - getYearlyIntensity()', () => {
  it('返回年度阅读强度', () => {
    const intensity = getYearlyIntensity();
    expect(intensity.length).toBeGreaterThanOrEqual(1);
    intensity.forEach(item => {
      expect(item.year).toBeGreaterThan(0);
    });
  });
});

describe('stats - getHomepageStats()', () => {
  it('返回首页统计', () => {
    const stats = getHomepageStats();
    expect(stats.readingCount).toBeGreaterThanOrEqual(0);
    expect(stats.newNotes).toBeGreaterThanOrEqual(0);
    expect(typeof stats.todayRead).toBe('boolean');
  });
});
