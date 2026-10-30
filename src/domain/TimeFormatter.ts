import type { TimeFormatter } from '../abstractions/ports';

const secondsOf = (milliseconds: number): number => Math.max(0, Math.floor(milliseconds / 1000));

export class ClockFormatter implements TimeFormatter {
  format(milliseconds: number): string {
    const totalSeconds = secondsOf(milliseconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  }

  accessibleLabel(milliseconds: number, context = 'elapsed'): string {
    const totalSeconds = secondsOf(milliseconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (hours) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
    if (minutes || hours === 0) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
    if (seconds || (hours === 0 && minutes === 0)) {
      parts.push(`${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`);
    }
    return `${parts.join(' e ')} ${context === 'remaining' ? 'restantes' : 'decorridos'}`;
  }
}

export class CompactFormatter implements TimeFormatter {
  format(milliseconds: number): string {
    const totalSeconds = secondsOf(milliseconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h${String(minutes).padStart(2, '0')}min${String(seconds).padStart(2, '0')}s`;
  }

  accessibleLabel(milliseconds: number, context = 'elapsed'): string {
    return new ClockFormatter().accessibleLabel(milliseconds, context);
  }
}

export { ClockFormatter as HoursMinutesFormatter };
