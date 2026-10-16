import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Availability } from '../../../availabilities/domain/entities/availability.entity';
import { DayOfWeek } from '../../../availabilities/domain/enums/day-of-week.enum';
import { Appointment } from '../../domain/entities/appointment.entity';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { GetFreeSlotsService } from './get-free-slots.service';

const date = (value = '2026-10-19') => new Date(value + 'T00:00:00.000Z');
const block = (changes: Partial<Availability> = {}): Availability =>
  Object.assign(
    new Availability(
      1,
      42,
      DayOfWeek.MONDAY,
      '09:00',
      '11:00',
      30,
      date('2026-10-01'),
      date('2026-10-31'),
    ),
    changes,
  );
const appointment = (changes: Partial<Appointment> = {}): Appointment => ({
  id: 1,
  professionalId: 42,
  patientId: 9,
  date: date(),
  startTime: '09:30',
  endTime: '10:00',
  status: AppointmentStatus.RESERVED,
  ...changes,
});

describe('GetFreeSlotsService', () => {
  const availabilityRepository = {
    findByProfessionalAndDay: jest.fn(),
    save: jest.fn(),
  };
  const appointmentRepository = {
    findByProfessionalAndDate: jest.fn(),
    save: jest.fn(),
  };
  const service = new GetFreeSlotsService(
    availabilityRepository,
    appointmentRepository,
  );
  const query = (value = '2026-10-19') => service.execute(42, { date: value });
  beforeEach(() => {
    jest.clearAllMocks();
    availabilityRepository.findByProfessionalAndDay.mockResolvedValue([
      block(),
    ]);
    appointmentRepository.findByProfessionalAndDate.mockResolvedValue([]);
  });
  afterEach(() => {
    expect(availabilityRepository.save).not.toHaveBeenCalled();
    expect(appointmentRepository.save).not.toHaveBeenCalled();
  });
  it('generates complete consecutive slots and scopes both queries', async () => {
    expect(await query()).toEqual({
      date: '2026-10-19',
      slots: [
        { startTime: '09:00', endTime: '09:30', duration: 30 },
        { startTime: '09:30', endTime: '10:00', duration: 30 },
        { startTime: '10:00', endTime: '10:30', duration: 30 },
        { startTime: '10:30', endTime: '11:00', duration: 30 },
      ],
    });
    expect(
      availabilityRepository.findByProfessionalAndDay,
    ).toHaveBeenCalledWith(42, DayOfWeek.MONDAY);
    expect(
      appointmentRepository.findByProfessionalAndDate,
    ).toHaveBeenCalledWith(42, date(), [
      AppointmentStatus.RESERVED,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.ATTENDED,
      AppointmentStatus.NOT_ATTENDED,
    ]);
  });
  it.each([
    AppointmentStatus.RESERVED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ATTENDED,
    AppointmentStatus.NOT_ATTENDED,
  ])('excludes slots occupied by %s', async (status) => {
    appointmentRepository.findByProfessionalAndDate.mockResolvedValue([
      appointment({ status }),
    ]);
    expect((await query()).slots.map((slot) => slot.startTime)).toEqual([
      '09:00',
      '10:00',
      '10:30',
    ]);
  });
  it.each([AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED])(
    'does not block on %s',
    async (status) => {
      appointmentRepository.findByProfessionalAndDate.mockResolvedValue([
        appointment({ status }),
      ]);
      expect((await query()).slots).toHaveLength(4);
    },
  );
  it('excludes partial overlaps while preserving the fixed grid', async () => {
    appointmentRepository.findByProfessionalAndDate.mockResolvedValue([
      appointment({ startTime: '09:15', endTime: '09:45' }),
    ]);
    expect((await query()).slots.map((slot) => slot.startTime)).toEqual([
      '10:00',
      '10:30',
    ]);
  });
  it('permits touching endpoints and ignores appointments outside the block', async () => {
    appointmentRepository.findByProfessionalAndDate.mockResolvedValue([
      appointment({ startTime: '08:00', endTime: '09:00' }),
      appointment({ startTime: '11:00', endTime: '12:00' }),
    ]);
    expect((await query()).slots).toHaveLength(4);
  });
  it('returns an empty list when the entire block is occupied', async () => {
    appointmentRepository.findByProfessionalAndDate.mockResolvedValue([
      appointment({ startTime: '08:00', endTime: '12:00' }),
    ]);
    expect((await query()).slots).toEqual([]);
  });
  it('returns an empty list without querying appointments if no blocks exist', async () => {
    availabilityRepository.findByProfessionalAndDay.mockResolvedValue([]);
    expect((await query()).slots).toEqual([]);
    expect(
      appointmentRepository.findByProfessionalAndDate,
    ).not.toHaveBeenCalled();
  });
  it.each([
    { validFrom: date('2026-10-20') },
    { validUntil: date('2026-10-18') },
    { dayOfWeek: DayOfWeek.TUESDAY },
    { professionalId: 99 },
  ])(
    'excludes a block outside the date/day/owner scope: %p',
    async (changes) => {
      availabilityRepository.findByProfessionalAndDay.mockResolvedValue([
        block(changes),
      ]);
      expect((await query()).slots).toEqual([]);
    },
  );
  it('includes both validity endpoints, including a single-day block', async () => {
    availabilityRepository.findByProfessionalAndDay.mockResolvedValue([
      block({ validFrom: date(), validUntil: date() }),
    ]);
    expect((await query()).slots).toHaveLength(4);
  });
  it('uses independent durations, discards remainders and sorts multiple blocks', async () => {
    availabilityRepository.findByProfessionalAndDay.mockResolvedValue([
      block({ startTime: '14:00', endTime: '14:50', duration: 45 }),
      block({ endTime: '10:10' }),
    ]);
    expect((await query()).slots).toEqual([
      { startTime: '09:00', endTime: '09:30', duration: 30 },
      { startTime: '09:30', endTime: '10:00', duration: 30 },
      { startTime: '14:00', endTime: '14:45', duration: 45 },
    ]);
  });
  it('does not generate a partial slot shorter than its duration', async () => {
    availabilityRepository.findByProfessionalAndDay.mockResolvedValue([
      block({ endTime: '09:20' }),
    ]);
    expect((await query()).slots).toEqual([]);
  });
  it('deduplicates identical slots from overlapping blocks', async () => {
    availabilityRepository.findByProfessionalAndDay.mockResolvedValue([
      block(),
      block({ startTime: '09:30' }),
      block(),
    ]);
    expect((await query()).slots).toHaveLength(4);
  });
  it.each([0, -30, 0.5, NaN, Infinity])(
    'rejects invalid stored duration %s without looping',
    async (duration) => {
      availabilityRepository.findByProfessionalAndDay.mockResolvedValue([
        block({ duration }),
      ]);
      await expect(query()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    },
  );
  it.each([
    { startTime: '11:00', endTime: '09:00' },
    { startTime: '09:99' },
    { endTime: '09:00' },
  ])('rejects invalid stored bounds: %p', async (changes) => {
    availabilityRepository.findByProfessionalAndDay.mockResolvedValue([
      block(changes),
    ]);
    await expect(query()).rejects.toBeInstanceOf(InternalServerErrorException);
  });
  it('keeps midnight and day-end slots inside their block', async () => {
    availabilityRepository.findByProfessionalAndDay.mockResolvedValue([
      block({ startTime: '00:00', endTime: '00:30' }),
      block({ startTime: '23:00', endTime: '23:59' }),
    ]);
    expect(
      (await query()).slots.map((slot) => [slot.startTime, slot.endTime]),
    ).toEqual([
      ['00:00', '00:30'],
      ['23:00', '23:30'],
    ]);
  });
  it('ignores appointments from other dates or professionals', async () => {
    appointmentRepository.findByProfessionalAndDate.mockResolvedValue([
      appointment({ professionalId: 99 }),
      appointment({ date: date('2026-10-20') }),
    ]);
    expect((await query()).slots).toHaveLength(4);
  });
  it.each([
    '2026-02-30',
    '2025-02-29',
    '2026-13-01',
    '2026-10-19T00:00:00Z',
    '19/10/2026',
    '',
    '0000-01-01',
  ])('rejects invalid civil date %s', async (value) => {
    await expect(query(value)).rejects.toBeInstanceOf(BadRequestException);
    expect(
      availabilityRepository.findByProfessionalAndDay,
    ).not.toHaveBeenCalled();
  });
  it('accepts a leap date and derives the weekday using UTC', async () => {
    availabilityRepository.findByProfessionalAndDay.mockResolvedValue([
      block({
        dayOfWeek: DayOfWeek.THURSDAY,
        validFrom: date('2024-02-29'),
        validUntil: date('2024-02-29'),
      }),
    ]);
    expect((await query('2024-02-29')).slots).toHaveLength(4);
    expect(
      availabilityRepository.findByProfessionalAndDay,
    ).toHaveBeenCalledWith(42, DayOfWeek.THURSDAY);
  });
  it('does not filter elapsed hours of the current day', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(date('2026-10-19').getTime() + 23 * 60 * 60 * 1000);
    try {
      expect((await query()).slots).toHaveLength(4);
    } finally {
      jest.useRealTimers();
    }
  });
});
