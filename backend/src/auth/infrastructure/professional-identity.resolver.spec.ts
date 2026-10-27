import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ProfesionalesService } from '../../profesionales/profesionales.service';
import { PersistedProfessionalIdentityResolver } from './professional-identity.resolver';

describe('PersistedProfessionalIdentityResolver', () => {
  const professionalsService = { buscarPorUsuario: jest.fn() };
  const resolver = new PersistedProfessionalIdentityResolver(
    professionalsService as unknown as ProfesionalesService,
  );
  beforeEach(() => jest.clearAllMocks());
  it('resolves the persisted professional id from the user id', async () => {
    professionalsService.buscarPorUsuario.mockResolvedValue({
      idProfesional: 42,
      fechaBaja: null,
    });
    expect(await resolver.resolve(7)).toBe(42);
    expect(professionalsService.buscarPorUsuario).toHaveBeenCalledWith(7);
  });
  it('returns null for an absent professional', async () => {
    professionalsService.buscarPorUsuario.mockRejectedValue(
      new NotFoundException(),
    );
    expect(await resolver.resolve(7)).toBeNull();
  });
  it('returns null for a professional with a termination date', async () => {
    professionalsService.buscarPorUsuario.mockResolvedValue({
      idProfesional: 42,
      fechaBaja: new Date('2026-10-01T00:00:00Z'),
    });
    expect(await resolver.resolve(7)).toBeNull();
  });
  it.each([0, -1, NaN, 1.5])(
    'rejects an invalid user id %s before reading persistence',
    async (id) => {
      expect(await resolver.resolve(id)).toBeNull();
      expect(professionalsService.buscarPorUsuario).not.toHaveBeenCalled();
    },
  );
  it.each([
    { idProfesional: 0, fechaBaja: null },
    { idProfesional: 42, fechaBaja: undefined },
  ])('fails closed for an invalid stored identity: %p', async (value) => {
    professionalsService.buscarPorUsuario.mockResolvedValue(value);
    expect(await resolver.resolve(7)).toBeNull();
  });
  it('does not confuse a database outage with a missing professional or expose SQL', async () => {
    professionalsService.buscarPorUsuario.mockRejectedValue(
      new Error('private SQL details'),
    );
    await expect(resolver.resolve(7)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(resolver.resolve(7)).rejects.toMatchObject({
      message: 'No se pudo verificar la identidad profesional',
    });
  });
});
