export abstract class ProfessionalIdentityResolver {
  abstract resolve(userId: number): Promise<number | null>;
}
