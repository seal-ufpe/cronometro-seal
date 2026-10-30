import { formatTime, parseFastTyped, parseTime, validateTime } from '../src/domain/TimeParser';

describe('TimeParser', () => {
  it('parses HH:MM and formats o relógio em HH:MM:SS', () => {
    expect(parseTime('01:25')?.milliseconds).toBe(85 * 60_000);
    expect(parseTime('99:60')).toBeNull();
    expect(parseTime('100:00')).toBeNull();
    expect(formatTime(85 * 60_000)).toBe('01:25:00');
  });

  it('supports fast typing and rounding strategies', () => {
    expect(parseFastTyped('125')?.text).toBe('01:25');
    expect(parseFastTyped('45')?.text).toBe('00:45');
    expect(formatTime(3_600_001, 'floor')).toBe('01:00:00');
    expect(formatTime(60_001, 'ceil')).toBe('00:01:01');
    expect(validateTime('99:60')).toContain('99');
  });
});
