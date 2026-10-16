import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { PatientAccess } from '../../application/ports/patient-access';
// Este contrato es de infraestructura: el adaptador real debe usar este manager.
export abstract class PatientAccessFactory {
  abstract create(manager: EntityManager): PatientAccess;
}
@Injectable()
export class UnconfiguredPatientAccessFactory implements PatientAccessFactory {
  create(manager: EntityManager): PatientAccess {
    void manager;
    return { canAssign: () => Promise.resolve(false) };
  }
}
