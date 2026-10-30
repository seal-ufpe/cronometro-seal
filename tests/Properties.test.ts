import fc from 'fast-check';
import { formatTime, parseTime } from '../src/domain/TimeParser';
import { Stopwatch } from '../src/domain/Stopwatch';
import { FakeClock } from '../src/infra/FakeClock';

describe('propriedades do timer', () => {
  it('mantém estado e display válidos para comandos aleatórios', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.constant('start'),
            fc.constant('pause'),
            fc.constant('reset'),
            fc.integer({ min: 0, max: 600_000 }),
          ),
        ),
        (commands) => {
          const clock = new FakeClock();
          const timer = new Stopwatch(clock);
          for (const command of commands) {
            if (typeof command === 'number') clock.advance(command);
            else if (command === 'start') timer.start();
            else if (command === 'pause') timer.pause();
            else timer.reset();
            expect(timer.displayMs()).toBeGreaterThanOrEqual(0);
            expect(timer.displayMs()).toBeLessThanOrEqual(Stopwatch.MAX_MS);
            expect(['idle', 'running', 'paused', 'finished']).toContain(timer.getState());
          }
        },
      ),
    );
  });

  it('faz ida e volta entre parse e formato para todos os tempos válidos', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 99 * 60 + 59 }), (minutes) => {
        const parsed = parseTime(formatTime(minutes * 60_000).slice(0, 5));
        expect(parsed?.milliseconds).toBe(minutes * 60_000);
      }),
    );
  });

  it('acumula adições de forma equivalente e saturada', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: Stopwatch.MAX_MS }),
        fc.integer({ min: 0, max: Stopwatch.MAX_MS }),
        (a, b) => {
          const first = new Stopwatch(new FakeClock());
          const second = new Stopwatch(new FakeClock());
          first.addTime(a);
          first.addTime(b);
          second.addTime(Math.min(Stopwatch.MAX_MS, a + b));
          expect(first.getInitialMs()).toBe(second.getInitialMs());
        },
      ),
    );
  });
});
