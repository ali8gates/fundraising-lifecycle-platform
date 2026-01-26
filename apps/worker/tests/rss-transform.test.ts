import { describe, it, expect } from 'vitest';
import { mapRssItemToSignal } from '../src/connectors/rss';

describe('rss transform', () => {
  it('maps item to Signal shape', () => {
    const item = { title: 'Hello', link: 'https://example.com/a', contentSnippet: 'Summary', isoDate: '2024-01-01T00:00:00.000Z' };
    const s = mapRssItemToSignal('Test', item);
    expect(s.source_name).toBe('Test');
    expect(s.source_type).toBe('news');
    expect(s.title).toBe('Hello');
    expect(s.url).toBe('https://example.com/a');
    expect(s.summary).toBe('Summary');
    expect(s.published_at).toBe('2024-01-01T00:00:00.000Z');
  });
});

