import {
  CountDownStrategy,
  CountUpStrategy,
  CountdownStrategy,
  ProgressStrategy,
} from '../src/domain/CountStrategy';
import { Stopwatch } from '../src/domain/Stopwatch';
import { CompactFormatter, HoursMinutesFormatter } from '../src/domain/TimeFormatter';
import { formatTime, parseFastTyped, parseTime, validateTime } from '../src/domain/TimeParser';
import { FakeClock } from '../src/infra/FakeClock';

describe('regras de domínio', () => {
  it('arredonda e limita as duas estratégias', () => {
    const up = new ProgressStrategy();
    const down = new CountdownStrategy();
    expect(up.display(1, 0)).toBe(1);
    expect(up.isFinished()).toBe(false);
    expect(up.isComplete()).toBe(false);
    expect(down.display(1, 0)).toBe(0);
    expect(down.isFinished(60_000, 60_000)).toBe(true);
    expect(down.isComplete(0, 0)).toBe(false);
    expect(new CountUpStrategy()).toBeInstanceOf(ProgressStrategy);
    expect(new CountDownStrategy()).toBeInstanceOf(CountdownStrategy);
  });

  it('formata rótulos acessíveis em singular, plural e formato compacto', () => {
    const formatter = new HoursMinutesFormatter();
    expect(formatter.format(0)).toBe('00:00:00');
    expect(formatter.format(59 * 60_000 + 999)).toBe('00:59:00');
    expect(formatter.format(60 * 60_000)).toBe('01:00:00');
    expect(formatter.format(99 * 60 * 60_000 + 59 * 60_000 + 59_000)).toBe('99:59:59');
    expect(formatter.accessibleLabel(60_000)).toContain('1 minuto');
    expect(formatter.accessibleLabel(2 * 60_000)).toContain('2 minutos');
    expect(formatter.accessibleLabel(85 * 60_000)).toBe('1 hora e 25 minutos decorridos');
    expect(formatter.accessibleLabel(60_000, 'remaining')).toContain('restantes');
    expect(new CompactFormatter().format(85 * 60_000)).toBe('1h25min00s');
  });

  it('rejeita entradas ambíguas, inválidas e Unicode', () => {
    expect(parseTime(' 01:05 ')).not.toBeNull();
    expect(parseTime('1:05:00')).toBeNull();
    expect(parseTime('-1:00')).toBeNull();
    expect(parseTime('100:00')).toBeNull();
    expect(parseFastTyped('125')).toMatchObject({ text: '01:25' });
    expect(parseFastTyped('5')).toMatchObject({ text: '00:05' });
    expect(parseFastTyped('１２５')).toBeNull();
    expect(parseFastTyped('12345')).toBeNull();
    expect(parseFastTyped('')).toMatchObject({ text: '00:00' });
    expect(validateTime('')).toBeTruthy();
    expect(validateTime('01:60')).toBeTruthy();
    expect(formatTime(60_001, 'ceil')).toBe('00:01:01');
    expect(formatTime(-1)).toBe('00:00:00');
  });

  it('ignora comandos inválidos e preserva milissegundos ao pausar', () => {
    const clock = new FakeClock();
    const timer = new Stopwatch(clock);
    timer.pause();
    timer.start();
    timer.start();
    clock.advance(1);
    timer.pause();
    clock.advance(10_000);
    timer.start();
    clock.advance(59_999);
    timer.pause();
    expect(timer.getElapsedMs()).toBe(60_000);
    timer.reset();
    expect(timer.getState()).toBe('idle');
    expect(timer.getElapsedMs()).toBe(0);
  });

  it('rejeita números inválidos, satura e rearma ao adicionar após finalizar', () => {
    const clock = new FakeClock();
    const timer = new Stopwatch(clock);
    expect(timer.setInitialTime(1.5)).toBe(false);
    expect(timer.setInitialTime(Number.NaN)).toBe(false);
    expect(timer.setInitialTime(Number.POSITIVE_INFINITY)).toBe(false);
    expect(timer.addTime(-1)).toBe(false);
    expect(timer.addTime(1.5)).toBe(false);
    timer.setMode('down');
    timer.setInitialTime(60_000);
    timer.start();
    clock.advance(60_000);
    timer.tick();
    expect(timer.getState()).toBe('finished');
    expect(timer.addTime(60_000)).toBe(true);
    expect(timer.getState()).toBe('idle');
    expect(timer.displayMs()).toBe(60_000);
    timer.addTime(Stopwatch.MAX_MS * 2);
    expect(timer.getInitialMs()).toBe(Stopwatch.MAX_MS);
  });

  it('notifica uma vez e isola assinante defeituoso', () => {
    const clock = new FakeClock();
    const timer = new Stopwatch(clock);
    timer.setMode('down');
    timer.setInitialTime(1);
    let calls = 0;
    timer.subscribe({
      update: () => {
        throw new Error('isolated');
      },
    });
    const unsubscribe = timer.subscribe({
      update: () => {
        calls += 1;
      },
    });
    timer.start();
    clock.advance(1);
    timer.tick();
    timer.tick();
    expect(calls).toBe(1);
    expect(unsubscribe()).toBe(true);
  });
});
