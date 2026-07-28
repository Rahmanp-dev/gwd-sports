import { describe, it, expect } from 'vitest';
import {
  buildEmbedUrl,
  parseInstagramShortcode,
  parseYouTubeId,
} from './videoEmbed';

/**
 * These parsers are the difference between "paste the link from your address
 * bar" and "go find the embed code", so the shapes an owner will actually
 * paste are the cases that matter.
 */
describe('parseYouTubeId', () => {
  it('reads every URL shape a person actually copies', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('survives the tracking junk share buttons append', () => {
    expect(
      parseYouTubeId('https://youtu.be/dQw4w9WgXcQ?si=abc123&t=42'),
    ).toBe('dQw4w9WgXcQ');
    expect(
      parseYouTubeId('https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('accepts a bare id but rejects anything that is not one', () => {
    expect(parseYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('')).toBeNull();
    expect(parseYouTubeId('   ')).toBeNull();
    expect(parseYouTubeId('not a link')).toBeNull();
    // Right shape, wrong length — must not be treated as an id.
    expect(parseYouTubeId('tooshort')).toBeNull();
  });
});

describe('parseInstagramShortcode', () => {
  it('handles posts, reels and tv', () => {
    expect(parseInstagramShortcode('https://www.instagram.com/p/CxYzAbCdEfG/')).toBe('CxYzAbCdEfG');
    expect(parseInstagramShortcode('https://instagram.com/reel/CxYzAbCdEfG/')).toBe('CxYzAbCdEfG');
    expect(parseInstagramShortcode('https://www.instagram.com/tv/CxYzAbCdEfG/')).toBe('CxYzAbCdEfG');
  });

  it('returns null for a profile URL, which is not embeddable here', () => {
    expect(parseInstagramShortcode('https://instagram.com/someacademy')).toBeNull();
  });
});

describe('buildEmbedUrl', () => {
  it('never returns the raw pasted string', () => {
    const url = buildEmbedUrl('youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(url).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1',
    );
  });

  it('refuses anything it cannot parse, so no arbitrary host reaches an iframe src', () => {
    expect(buildEmbedUrl('youtube', 'javascript:alert(1)')).toBeNull();
    expect(buildEmbedUrl('youtube', 'https://evil.example.com/x')).toBeNull();
    expect(buildEmbedUrl('instagram', 'https://evil.example.com/p/abc')).toBeNull();
    expect(buildEmbedUrl('youtube', '')).toBeNull();
  });

  it('builds the instagram embed path', () => {
    expect(buildEmbedUrl('instagram', 'https://www.instagram.com/reel/CxYzAbCdEfG/')).toBe(
      'https://www.instagram.com/p/CxYzAbCdEfG/embed',
    );
  });
});
