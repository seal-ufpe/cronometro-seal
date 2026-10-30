import { CountdownStrategy, ProgressStrategy } from '../src/domain/CountStrategy';
import { Stopwatch } from '../src/domain/Stopwatch';
import { FakeClock } from '../src/infra/FakeClock';

describe('Stopwatch', () => {
  it('counts progress from an initial duration', () => {
    const clock = new FakeClock();
    const timer = new Stopwatch(clock, new ProgressStrategy());
    timer.setInitialMs(60_000);
    timer.start();
    clock.advance(61_000);
    timer.tick();
    expect(timer.displayMs()).toBe(121_000);
  });

  it('counts down and notifies finished once', () => {
    const clock = new FakeClock();
    const timer = new Stopwatch(clock, new CountdownStrategy());
    let finished = 0;
    timer.setMode('down');
    timer.setInitialMs(60_000);
    const unsubscribe = timer.subscribe({
      update: () => {
        finished += 1;
      },
    });
    timer.start();
    clock.advance(60_001);
    timer.tick();
    timer.tick();
    expect(timer.displayMs()).toBe(0);
    expect(timer.getState()).toBe('finished');
    expect(finished).toBe(1);
    unsubscribe();
  });

  it('mantém a velocidade real em segundos e não conta por tick', () => {
    const clock = new FakeClock();
    const timer = new Stopwatch(clock);
    timer.start();
    clock.advance(1_000);
    expect(timer.displayMs()).toBe(1_000);
    clock.advance(59_999);
    expect(timer.displayMs()).toBe(60_999);
    timer.tick();
    expect(timer.getElapsedMs()).toBe(60_999);
    clock.advance(5 * 60_000);
    expect(timer.displayMs()).toBe(360_999);
  });

  it('pausa e retoma sem perder milissegundos', () => {
    const clock = new FakeClock();
    const timer = new Stopwatch(clock);
    timer.start();
    clock.advance(1_234);
    timer.pause();
    clock.advance(9_000);
    expect(timer.getElapsedMs()).toBe(1_234);
    timer.start();
    clock.advance(766);
    timer.pause();
    expect(timer.getElapsedMs()).toBe(2_000);
  });

  it('arredonda regressivo para cima até o segundo final', () => {
    const clock = new FakeClock();
    const timer = new Stopwatch(clock, new CountdownStrategy());
    timer.setMode('down');
    timer.setInitialTime(2_000);
    timer.start();
    clock.advance(1);
    expect(timer.displayMs()).toBe(1_999);
    clock.advance(998);
    expect(timer.displayMs()).toBe(1_001);
    clock.advance(1_001);
    expect(timer.getState()).toBe('finished');
    expect(timer.displayMs()).toBe(0);
  });

  it('adiciona tempo sem interromper o estado running', () => {
    const clock = new FakeClock();
    const timer = new Stopwatch(clock);
    timer.start();
    clock.advance(2_500);
    timer.addMinutes(1);
    expect(timer.getState()).toBe('running');
    clock.advance(1_000);
    expect(timer.displayMs()).toBe(63_500);
  });

  it('adiciona tempo e rearma um timer finalizado', () => {
    const clock = new FakeClock();
    const timer = new Stopwatch(clock);
    timer.setMode('down');
    timer.addMinutes(1);
    timer.start();
    clock.advance(60_000);
    timer.tick();
    timer.addMinutes(5);
    expect(timer.getState()).toBe('idle');
    expect(timer.displayMs()).toBe(300_000);
  });
});
