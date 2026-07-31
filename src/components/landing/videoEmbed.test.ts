import { describe, it, expect } from 'vitest';
import {
  buildEmbedUrl,
  parseInstagramShortcode,
  parseYouTubeId,
  detectShape,
  resolveAspect,
  VIDEO_ASPECTS,
  isVideoAspect,
} from "./videoEmbed";

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

// ─────────────────────────────────────────────────────────────────────────────
// ASPECT RATIO
//
// The frame was hard-coded to 16:9, so a Short, a Reel or a portrait post was
// letterboxed into a black slab. These pin the shape detection and the
// explicit override, which is the difference between a video that looks right
// and one an owner reports as broken.
// ─────────────────────────────────────────────────────────────────────────────
describe('detectShape', () => {
  it('reads portrait from a YouTube Shorts link', () => {
    expect(detectShape('youtube', 'https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('portrait');
    expect(detectShape('youtube', 'https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share')).toBe('portrait');
  });

  it('treats an ordinary YouTube video as landscape', () => {
    expect(detectShape('youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('landscape');
    expect(detectShape('youtube', 'https://youtu.be/dQw4w9WgXcQ')).toBe('landscape');
  });

  it('reads portrait from an Instagram reel', () => {
    expect(detectShape('instagram', 'https://www.instagram.com/reel/Cx1y2z3AbCd/')).toBe('portrait');
    expect(detectShape('instagram', 'https://instagram.com/reels/Cx1y2z3AbCd/')).toBe('portrait');
  });

  it('treats an Instagram post as square, the safer of the two guesses', () => {
    // A 4:5 post in a square frame gets modest padding; a square post in a 4:5
    // frame gets side bars. Guessing the less-tall option errs smaller.
    expect(detectShape('instagram', 'https://www.instagram.com/p/Cx1y2z3AbCd/')).toBe('square');
  });

  it('does not fall over on junk', () => {
    expect(detectShape('youtube', '')).toBe('landscape');
    expect(detectShape('instagram', 'nonsense')).toBe('square');
  });
});

describe('resolveAspect', () => {
  const SHORT = 'https://youtube.com/shorts/dQw4w9WgXcQ';
  const WATCH = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

  it('auto-detects when nothing is configured', () => {
    expect(resolveAspect(undefined, 'youtube', SHORT)).toBe('9:16');
    expect(resolveAspect('auto', 'youtube', SHORT)).toBe('9:16');
    expect(resolveAspect('auto', 'youtube', WATCH)).toBe('16:9');
    expect(resolveAspect('auto', 'instagram', 'https://instagram.com/reel/Ab1/')).toBe('9:16');
  });

  it('lets an explicit choice beat detection', () => {
    // The case detection cannot get right: a landscape clip posted to Reels.
    expect(resolveAspect('16:9', 'instagram', 'https://instagram.com/reel/Ab1/')).toBe('16:9');
    expect(resolveAspect('4:5', 'youtube', SHORT)).toBe('4:5');
  });

  it('ignores a junk value rather than rendering an invalid ratio', () => {
    expect(resolveAspect('banana', 'youtube', SHORT)).toBe('9:16');
    expect(resolveAspect(null, 'youtube', WATCH)).toBe('16:9');
    expect(resolveAspect(42, 'youtube', WATCH)).toBe('16:9');
  });

  it('always resolves to a ratio the renderer has a definition for', () => {
    for (const url of [SHORT, WATCH, 'https://instagram.com/p/Ab1/', '']) {
      for (const provider of ['youtube', 'instagram'] as const) {
        const aspect = resolveAspect('auto', provider, url);
        expect(VIDEO_ASPECTS[aspect]).toBeDefined();
        expect(VIDEO_ASPECTS[aspect].css).toMatch(/^\d+ \/ \d+$/);
      }
    }
  });
});

describe('isVideoAspect', () => {
  it('accepts auto and every defined ratio, and nothing else', () => {
    expect(isVideoAspect('auto')).toBe(true);
    for (const key of Object.keys(VIDEO_ASPECTS)) expect(isVideoAspect(key)).toBe(true);
    expect(isVideoAspect('3:2')).toBe(false);
    expect(isVideoAspect('')).toBe(false);
    expect(isVideoAspect(undefined)).toBe(false);
  });
});
