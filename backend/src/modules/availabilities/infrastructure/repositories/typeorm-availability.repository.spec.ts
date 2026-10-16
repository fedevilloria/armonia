import { Repository } from 'typeorm';
import { Availability } from '../../domain/entities/availability.entity';
import { DayOfWeek } from '../../domain/enums/day-of-week.enum';
import { AvailabilityOrmEntity } from '../persistence/availability.orm-entity';
import { TypeOrmAvailabilityRepository } from './typeorm-availability.repository';

describe('Availability civil date mapping', () => {
  const row = {
    id: 1,
    professionalId: 42,
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: '09:00:00',
    endTime: '10:00:00',
    duration: 30,
    validFrom: '2026-10-19',
    validUntil: '2026-10-26',
  };
  const repository = { find: jest.fn(), create: jest.fn(), save: jest.fn() };
  const adapter = new TypeOrmAvailabilityRepository(
    repository as unknown as Repository<AvailabilityOrmEntity>,
  );
  beforeEach(() => jest.clearAllMocks());
  it('loads civil dates at midnight UTC and filters by professional and weekday', async () => {
    repository.find.mockResolvedValue([row]);
    const [result] = await adapter.findByProfessionalAndDay(
      42,
      DayOfWeek.MONDAY,
    );
    expect(repository.find).toHaveBeenCalledWith({
      where: { professionalId: 42, dayOfWeek: DayOfWeek.MONDAY },
    });
    expect(result.validFrom.toISOString()).toBe('2026-10-19T00:00:00.000Z');
    expect(result.validUntil.toISOString()).toBe('2026-10-26T00:00:00.000Z');
    expect(result.startTime).toBe('09:00');
  });
  it('saves civil dates without changing their day', async () => {
    repository.create.mockImplementation((value) => value);
    repository.save.mockResolvedValue(row);
    await adapter.save(
      new Availability(
        null,
        42,
        DayOfWeek.MONDAY,
        '09:00',
        '10:00',
        30,
        new Date('2026-10-19T00:00:00.000Z'),
        new Date('2026-10-26T00:00:00.000Z'),
      ),
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        validFrom: '2026-10-19',
        validUntil: '2026-10-26',
      }),
    );
  });
});
