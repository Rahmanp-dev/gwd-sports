import { describe, it, expect } from 'vitest';
import { buildGradient, buildThemeVariables } from './palette';

describe('buildGradient', () => {
  it('spaces stops evenly and honours the angle', () => {
    const { css } = buildGradient({
      type: 'linear',
      angle: 90,
      stops: ['#ff0000', '#00ff00', '#0000ff'],
    });
    expect(css).toBe('linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)');
  });

  it('wraps angles instead of clamping them', () => {
    // A dial dragged past the end should keep meaning something.
    expect(buildGradient({ angle: 370, stops: ['#000000', '#ffffff'] }).css).toContain('10deg');
    expect(buildGradient({ angle: -10, stops: ['#000000', '#ffffff'] }).css).toContain('350deg');
  });

  it('emits a radial gradient without an angle', () => {
    const { css } = buildGradient({
      type: 'radial',
      angle: 90,
      stops: ['#ff0000', '#0000ff'],
    });
    expect(css).toContain('radial-gradient');
    expect(css).not.toContain('90deg');
  });

  it('returns empty css below two usable stops, so callers fall back', () => {
    expect(buildGradient({ stops: [] }).css).toBe('');
    expect(buildGradient({ stops: ['#ff0000'] }).css).toBe('');
    // One valid, one garbage — still only one usable stop.
    expect(buildGradient({ stops: ['#ff0000', 'not-a-colour'] }).css).toBe('');
  });

  it('caps at four stops rather than emitting an unbounded gradient', () => {
    const { stops } = buildGradient({
      stops: ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666'],
    });
    expect(stops).toHaveLength(4);
  });
});

describe('buildThemeVariables — gradient backgrounds', () => {
  it('flags gradient mode so the section bands stop repeating the gradient', () => {
    const vars = buildThemeVariables({
      backgroundStyle: 'gradient',
      gradientStops: ['#ff0000', '#0000ff'],
    });
    expect(vars['--page-bg-mode']).toBe('gradient');
    expect(vars['--page-bg']).toContain('linear-gradient');
  });

  it('marks every non-gradient treatment as solid', () => {
    for (const style of ['light', 'soft', 'dark', 'slate', 'vivid', 'midnight'] as const) {
      expect(buildThemeVariables({ backgroundStyle: style })['--page-bg-mode']).toBe('solid');
    }
  });

  it('still emits a gradient when the owner has authored no stops', () => {
    // Academies saved before gradient controls existed must look unchanged.
    const vars = buildThemeVariables({ backgroundStyle: 'gradient' });
    expect(vars['--page-bg']).toContain('linear-gradient');
    expect(vars['--page-bg-mode']).toBe('gradient');
  });

  it('derives readable text from the authored stops, not the brand colour', () => {
    // Dark stops with a light brand colour: text must respond to the stops.
    const dark = buildThemeVariables({
      primaryColor: '#ffffff',
      backgroundStyle: 'gradient',
      gradientStops: ['#000000', '#111111'],
    });
    expect(dark['--page-scheme']).toBe('dark');

    const light = buildThemeVariables({
      primaryColor: '#000000',
      backgroundStyle: 'gradient',
      gradientStops: ['#ffffff', '#eeeeee'],
    });
    expect(light['--page-scheme']).toBe('light');
  });
});
