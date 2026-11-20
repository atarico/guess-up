// Mexico is behind UTC: an API date read in local time would show the previous day (03 §9, §11).
process.env.TZ = 'America/Mexico_City';

import { describe, expect, it } from 'vitest';
import { dateFull, money, percent, points, share, signedPoints } from './format';

const MINUS = '−';
const NBSP = ' ';

describe('format (03 §9)', () => {
  it('runs these tests in the Mexico City time zone', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Mexico_City');
  });

  describe('percent', () => {
    it('shows one decimal and a sign on every value except zero', () => {
      expect(percent(0.021)).toBe('+2.1%');
      expect(percent(-0.124)).toBe(`${MINUS}12.4%`);
      expect(percent(0)).toBe('0.0%');
    });

    it('uses the real minus sign, never a hyphen', () => {
      expect(percent(-0.124)).not.toContain('-');
    });

    it('never shows a sign that the rounded value does not have', () => {
      expect(percent(-0.0004)).toBe('0.0%');
      expect(percent(0.0004)).toBe('0.0%');
    });

    it('groups thousands with a comma, as es-MX does', () => {
      expect(percent(3.1)).toBe('+310.0%');
      expect(percent(12.345)).toBe('+1,234.5%');
    });
  });

  describe('points', () => {
    it('is the absolute value in percentage points, one decimal', () => {
      expect(points(-0.013)).toBe('1.3');
      expect(points(0.013)).toBe('1.3');
      expect(points(0.02)).toBe('2.0');
    });
  });

  describe('signedPoints (coin range bounds)', () => {
    it('is signed, one decimal, with the real minus sign', () => {
      expect(signedPoints(-0.021)).toBe(`${MINUS}2.1`);
      expect(signedPoints(0.02)).toBe('+2.0');
      expect(signedPoints(0)).toBe('0.0');
      expect(signedPoints(-0.0004)).toBe('0.0');
    });
  });

  describe('money', () => {
    it('is USD, a non-breaking space and two decimals with es-MX grouping; never a bare $', () => {
      expect(money(1234.56)).toBe(`USD${NBSP}1,234.56`);
      expect(money(61.2)).toBe(`USD${NBSP}61.20`);
      expect(money(184.2)).toBe(`USD${NBSP}184.20`);
      expect(money(53.614)).toBe(`USD${NBSP}53.61`);
      expect(money(1234.56)).not.toContain('$');
    });
  });

  describe('dateFull', () => {
    it('is day, short month and year', () => {
      expect(dateFull('2019-03-12')).toBe('12 mar 2019');
      expect(dateFull('2019-06-11')).toBe('11 jun 2019');
      expect(dateFull('2018-09-03')).toBe('3 sep 2018');
    });

    it('reads the API date as UTC, so a browser behind UTC does not show the previous day', () => {
      expect(dateFull('2019-01-01')).toBe('1 ene 2019');
    });
  });

  describe('share', () => {
    it('is a whole percent, rounded down so a claim is never overstated', () => {
      expect(share(0.96)).toBe('96%');
      expect(share(0.9599)).toBe('95%');
      expect(share(0.995)).toBe('99%');
      expect(share(1)).toBe('100%');
      expect(share(0)).toBe('0%');
      expect(share(0.52)).toBe('52%');
    });
  });
});
