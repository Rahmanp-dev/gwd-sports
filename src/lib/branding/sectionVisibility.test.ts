import { describe, it, expect } from 'vitest';
import { sectionWillRender } from './sectionVisibility';

/**
 * These guard the band-alternation bug: the page counts a band slot for every
 * section it renders, so a section that self-nulls for want of content must
 * report false here or the two sections after it come out the same colour.
 */
describe('sectionWillRender', () => {
  const empty = { theme: {} };

  it('is false for an explicit off switch', () => {
    const academy = {
      sports: ['cricket'],
      theme: { sections: { programs: false } },
    };
    expect(sectionWillRender('programs', academy)).toBe(false);
  });

  it('is false for an unknown key, which has no component', () => {
    expect(sectionWillRender('nope', empty)).toBe(false);
  });

  describe('programs', () => {
    it('falls back to the academy sports list', () => {
      expect(sectionWillRender('programs', { sports: ['cricket'], theme: {} })).toBe(true);
    });
    it('is false with neither authored programs nor sports', () => {
      expect(sectionWillRender('programs', { sports: [], theme: {} })).toBe(false);
    });
  });

  describe('gallery', () => {
    it('needs at least one image with a url', () => {
      expect(sectionWillRender('gallery', { theme: { gallery: [{ url: 'a.jpg' }] } })).toBe(true);
      expect(sectionWillRender('gallery', { theme: { gallery: [{ caption: 'x' }] } })).toBe(false);
      expect(sectionWillRender('gallery', empty)).toBe(false);
    });

    it('survives a non-array persisted where an array belongs', () => {
      // The whole public page used to throw on this, not just the section.
      expect(sectionWillRender('gallery', { theme: { gallery: 'oops' } })).toBe(false);
    });
  });

  describe('testimonials', () => {
    it('ignores entries with a blank quote', () => {
      expect(
        sectionWillRender('testimonials', { theme: { testimonials: [{ quote: '  ' }] } }),
      ).toBe(false);
      expect(
        sectionWillRender('testimonials', { theme: { testimonials: [{ quote: 'Great' }] } }),
      ).toBe(true);
    });
  });

  describe('video', () => {
    it('needs a URL that actually parses', () => {
      expect(
        sectionWillRender('video', {
          theme: { videoSection: { provider: 'youtube', url: 'not a link' } },
        }),
      ).toBe(false);
      expect(
        sectionWillRender('video', {
          theme: {
            videoSection: {
              provider: 'youtube',
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            },
          },
        }),
      ).toBe(true);
    });

    it('is false when unconfigured rather than throwing', () => {
      expect(sectionWillRender('video', empty)).toBe(false);
      expect(sectionWillRender('video', { theme: { videoSection: null } })).toBe(false);
    });
  });

  describe('stats', () => {
    it('counts derived figures', () => {
      expect(sectionWillRender('stats', { students: [{}], theme: {} })).toBe(true);
      expect(sectionWillRender('stats', { establishedYear: 2015, theme: {} })).toBe(true);
    });

    it('counts an owner-authored stat only when it has a label and a real number', () => {
      const withStat = (v: any) => ({ theme: { customStats: [v] } });
      expect(sectionWillRender('stats', withStat({ label: 'Trophies', value: 3 }))).toBe(true);
      // Number("") is 0 — a cleared field must not count as content.
      expect(sectionWillRender('stats', withStat({ label: 'Trophies', value: 0 }))).toBe(false);
      expect(sectionWillRender('stats', withStat({ label: '', value: 5 }))).toBe(false);
    });

    it('is false for an academy with nothing true to show', () => {
      expect(sectionWillRender('stats', { students: [], sports: [], theme: {} })).toBe(false);
    });
  });

  describe('achievements (The Elite Difference)', () => {
    it('is true by default — the section has platform-true fallbacks', () => {
      expect(sectionWillRender('achievements', empty)).toBe(true);
    });

    it('respects the off switch under its real key', () => {
      // Was checked as `sections.highlights`, which does not exist in the schema.
      expect(
        sectionWillRender('achievements', { theme: { sections: { achievements: false } } }),
      ).toBe(false);
    });
  });
});
