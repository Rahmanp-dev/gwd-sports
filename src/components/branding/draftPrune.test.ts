import { describe, it, expect } from 'vitest';
// From the .ts module, not the .tsx — a VALUE import from the component file
// would make vite load JSX it cannot transform in this setup.
import { draftToThemeUpdate } from './draftSerialize';

/** Minimal draft. Only the array fields matter here; the rest just has to exist. */
function defaultBrandingDraft() {
  return {
    primaryColor: '#1e40af',
    accentColor: '#f59e0b',
    style: 'classic',
    fontPreset: 'sans',
    backgroundStyle: 'light',
    backgroundColor: '',
    gradientType: 'linear',
    gradientAngle: 160,
    gradientStops: [],
    logoScale: 100,
    logoShape: 'rounded',
    logoAlign: 'center',
    logoFit: 'contain',
    heroBlur: 3,
    heroOverlay: 55,
    heroMode: 'video',
    heroVideoUrl: '',
    heroEyebrow: '',
    heroImages: [],
    tagline: '',
    logoUrl: '',
    programs: [],
    testimonials: [],
    gallery: [],
    highlights: [],
    customStats: [],
    videoSection: {
      provider: 'youtube',
      url: '',
      heading: '',
      subheading: '',
      layout: 'cinematic',
    },
    achievements: [],
    density: 'spacious',
    accentSection: '',
    sections: {
      programs: true,
      achievements: true,
      testimonials: true,
      gallery: true,
      stats: true,
      video: false,
      order: [],
    },
    footer: {
      phone: '',
      email: '',
      address: '',
      aboutText: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
      youtubeUrl: '',
      copyrightText: '',
    },
  };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BLANK ROWS MUST NOT REACH THE DATABASE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every "Add …" button appends an empty row to type into. Several of those
 * subdocuments have `required` fields, and the update route runs validators —
 * so one untouched blank row rejected the ENTIRE save, discarding the colour,
 * hero and footer edits made in the same sitting with only a generic error.
 *
 * Clicking "Add number" and thinking better of it was enough to trigger it,
 * which is why this is worth locking down.
 */
describe('draftToThemeUpdate row pruning', () => {
  it('drops rows the owner never filled in', () => {
    const draft = {
      ...defaultBrandingDraft(),
      programs: [{ id: '', label: '' }],
      testimonials: [{ name: '', quote: '' }],
      gallery: [{ url: '' }],
      highlights: [{ icon: 'award', title: '', description: '' }],
      customStats: [{ icon: 'trophy', label: '', value: 0, suffix: '' }],
      achievements: ['', '   '],
    };

    const update = draftToThemeUpdate(draft as any);
    expect(update['theme.programs']).toEqual([]);
    expect(update['theme.testimonials']).toEqual([]);
    expect(update['theme.gallery']).toEqual([]);
    expect(update['theme.highlights']).toEqual([]);
    expect(update['theme.customStats']).toEqual([]);
    expect(update.achievements).toEqual([]);
  });

  it('keeps rows that are complete', () => {
    const draft = {
      ...defaultBrandingDraft(),
      programs: [{ id: 'cricket-1', label: 'Cricket' }],
      testimonials: [{ name: 'Akheel', quote: 'Rehan loves it.' }],
      gallery: [{ url: 'https://example.com/a.jpg' }],
      highlights: [{ icon: 'award', title: 'Qualified coaching', description: 'x' }],
      customStats: [{ icon: 'trophy', label: 'Trophies', value: 12, suffix: '' }],
      achievements: ['District champions 2024'],
    };

    const update = draftToThemeUpdate(draft as any);
    expect((update['theme.programs'] as any[]).length).toBe(1);
    expect((update['theme.testimonials'] as any[]).length).toBe(1);
    expect((update['theme.gallery'] as any[]).length).toBe(1);
    expect((update['theme.highlights'] as any[]).length).toBe(1);
    expect((update['theme.customStats'] as any[]).length).toBe(1);
    expect((update.achievements as any[]).length).toBe(1);
  });

  it('drops a row missing a REQUIRED field even when partly filled', () => {
    // A discipline with a label but no id still fails schema validation, so
    // sending it would reject the whole save rather than just that row.
    const draft = {
      ...defaultBrandingDraft(),
      programs: [{ id: '', label: 'Cricket' }],
      testimonials: [{ name: 'Akheel', quote: '' }],
    };
    const update = draftToThemeUpdate(draft as any);
    expect(update['theme.programs']).toEqual([]);
    expect(update['theme.testimonials']).toEqual([]);
  });

  it('drops a stat whose number was cleared, rather than saving "0"', () => {
    // Number("") is 0, and the public section hides value <= 0 — so this would
    // have persisted a stat that silently never appears.
    const draft = {
      ...defaultBrandingDraft(),
      customStats: [{ icon: 'trophy', label: 'Trophies', value: 0, suffix: '' }],
    };
    expect(draftToThemeUpdate(draft as any)['theme.customStats']).toEqual([]);
  });

  it('leaves the non-array theme fields untouched', () => {
    const draft = { ...defaultBrandingDraft(), tagline: 'Where legends are born' };
    const update = draftToThemeUpdate(draft as any);
    expect(update['theme.tagline']).toBe('Where legends are born');
  });
});
