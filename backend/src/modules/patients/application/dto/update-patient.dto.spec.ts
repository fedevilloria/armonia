import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreatePatientDto } from './create-patient.dto';
import { UpdatePatientDto } from './update-patient.dto';
import { PatientUpdatePipe } from '../../presentation/pipes/patient-update.pipe';

describe('Patient DTO validation', () => {
  const validation = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  const update = (body: unknown) =>
    validation.transform(body, { type: 'body', metatype: UpdatePatientDto });
  const nonEmpty = new PatientUpdatePipe();
  it.each([
    'nombre',
    'apellido',
    'telefono',
    'correoElectronico',
    'idTipoDocumento',
    'numeroDocumento',
    'fechaNacimiento',
    'direccion',
  ])('rejects explicit null in mandatory %s', async (field) => {
    await expect(update({ [field]: null })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
  it.each(['nombreContactoEmergencia', 'telefonoContactoEmergencia'])(
    'accepts clearing optional %s',
    async (field) => {
      const value = (await update({ [field]: null })) as UpdatePatientDto;
      expect(nonEmpty.transform(value)).toMatchObject({ [field]: null });
    },
  );
  it('keeps omitted fields optional and permits a partial update', async () => {
    const value = (await update({
      telefono: '1100000001',
    })) as UpdatePatientDto;
    expect(nonEmpty.transform(value)).toMatchObject({ telefono: '1100000001' });
    expect(value.nombre).toBeUndefined();
  });
  it('rejects an empty body or only undefined allowed fields', async () => {
    const value = (await update({})) as UpdatePatientDto;
    expect(() => nonEmpty.transform(value)).toThrow(
      'Debe enviar al menos un campo para actualizar.',
    );
    expect(() => nonEmpty.transform({ telefono: undefined })).toThrow(
      BadRequestException,
    );
  });
  it('does not count unknown properties as an update', () => {
    expect(() =>
      nonEmpty.transform({ unknown: 1 } as UpdatePatientDto),
    ).toThrow(BadRequestException);
  });
  it.each([
    { idProfesional: 42 },
    { telefono: 123 },
    { correoElectronico: 'invalid' },
    { fechaNacimiento: '2026-02-30' },
    { idTipoDocumento: 0 },
  ])('preserves input validation', async (body) => {
    await expect(update(body)).rejects.toBeInstanceOf(BadRequestException);
  });
  it('preserves required fields in creation', async () => {
    await expect(
      validation.transform({}, { type: 'body', metatype: CreatePatientDto }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
