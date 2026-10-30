import { InMemoryRepository } from '../src/infra/Repositories';

describe('InMemoryRepository', () => {
  it('persists and clears values', () => {
    const repository = new InMemoryRepository<{ value: number }>();
    repository.save({ value: 2 });
    expect(repository.load()).toEqual({ value: 2 });
    repository.clear();
    expect(repository.load()).toBeNull();
  });
});
