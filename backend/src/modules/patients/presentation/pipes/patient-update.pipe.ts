import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { UpdatePatientDto } from '../../application/dto/update-patient.dto';

const editableFields: readonly (keyof UpdatePatientDto)[] = [
  'nombre',
  'apellido',
  'telefono',
  'correoElectronico',
  'idTipoDocumento',
  'numeroDocumento',
  'fechaNacimiento',
  'direccion',
  'nombreContactoEmergencia',
  'telefonoContactoEmergencia',
  'pareja',
];

@Injectable()
export class PatientUpdatePipe implements PipeTransform<UpdatePatientDto> {
  transform(value: UpdatePatientDto): UpdatePatientDto {
    if (
      !value ||
      !editableFields.some(
        (field) =>
          Object.prototype.hasOwnProperty.call(value, field) &&
          value[field] !== undefined,
      )
    ) {
      throw new BadRequestException(
        'Debe enviar al menos un campo para actualizar.',
      );
    }
    return value;
  }
}
