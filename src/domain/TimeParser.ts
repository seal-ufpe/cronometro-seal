export interface ParsedTime {
  milliseconds: number;
  text: string;
}
export const MAX_HOURS = 99;
export const MAX_TIME_MS = (99 * 60 * 60 + 59 * 60 + 59) * 1000;

export function formatTime(milliseconds: number, rounding: 'floor' | 'ceil' = 'floor'): string {
  const rounded =
    rounding === 'ceil'
      ? Math.ceil(milliseconds / 1000) * 1000
      : Math.floor(milliseconds / 1000) * 1000;
  const totalSeconds = Math.min(Math.floor(MAX_TIME_MS / 1000), Math.max(0, rounded / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function parseTime(value: string): ParsedTime | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 99 || minutes > 59) return null;
  const milliseconds = (hours * 60 + minutes) * 60_000;
  return {
    milliseconds,
    text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
  };
}

export function parseFastTyped(value: string): ParsedTime | null {
  const trimmed = value.trim();
  if (!/^\d{0,4}$/.test(trimmed)) return null;
  const digits = trimmed;
  if (!digits) return { milliseconds: 0, text: '00:00' };
  const padded = digits.padStart(4, '0');
  const minutes = Number(padded.slice(-2));
  const hours = Number(padded.slice(0, -2));
  return parseTime(`${hours}:${minutes}`);
}

export function validateTime(value: string): string | null {
  if (!value.trim()) return 'Informe um tempo.';
  if (!parseTime(value))
    return 'Use HH:MM, com horas até 99 e minutos entre 00 e 59. Segundos não são aceitos.';
  return null;
}
