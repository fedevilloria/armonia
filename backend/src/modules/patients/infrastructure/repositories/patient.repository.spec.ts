import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PatientRepository } from './patient.repository';
import { PatientOrmEntity } from '../persistence/patient.orm-entity';

describe('Patient repository access rules', () => {
  const builder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };
  const orm = {
    createQueryBuilder: () => builder,
    update: jest.fn(),
    findOne: jest.fn(),
  };
  const repository = new PatientRepository(
    orm as unknown as Repository<PatientOrmEntity>,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    builder.getOne.mockResolvedValue({ idPaciente: 1, telefono: 'old' });
    builder.getMany.mockResolvedValue([{ idPaciente: 1 }]);
    orm.update.mockResolvedValue({ affected: 1 });
    orm.findOne.mockResolvedValue({ idPaciente: 1, telefono: 'new' });
  });
  it('keeps historical ownership filters without requiring an active state', async () => {
    await repository.findAllByProfessional(42);
    const [listFilter, listParameters] = builder.where.mock.calls[0] as [
      string,
      object,
    ];
    expect(listFilter).toContain('proceso."idProfesional" = :idProfessional');
    expect(listFilter).not.toContain('idEstadoProcesoTerapeutico');
    expect(listParameters).toEqual({ idProfessional: 42 });
    await repository.update(1, { telefono: 'new' }, 42);
    const [updateFilter, updateParameters] = builder.andWhere.mock.calls[0] as [
      string,
      object,
    ];
    expect(updateFilter).toContain('proceso."idProfesional" = :idProfesional');
    expect(updateFilter).not.toContain('idEstadoProcesoTerapeutico');
    expect(updateParameters).toEqual({ idProfesional: 42 });
    expect(orm.update).toHaveBeenCalledWith(1, { telefono: 'new' });
  });
  it.each([4, 999])(
    'denies inaccessible patient %s without writing',
    async (id) => {
      builder.getOne.mockResolvedValue(null);
      await expect(
        repository.update(id, { telefono: 'new' }, 42),
      ).rejects.toMatchObject({
        message: 'Recurso no encontrado',
      });
      expect(orm.update).not.toHaveBeenCalled();
    },
  );
  it('does not reveal identifiers if the final read finds no patient', async () => {
    orm.findOne.mockResolvedValue(null);
    await expect(repository.update(1, { telefono: 'new' }, 42)).rejects.toEqual(
      new NotFoundException('Recurso no encontrado'),
    );
  });
});
