import { prisma, OrganizationType, OrgVerificationStatus } from '@civiq/shared-db';

export interface CreateOrganizationDto {
  name;
  type;
  jurisdictionId;
}

export class OrganizationService {
  async createOrganization(data) {
    return prisma.organization.create({
      data: {
        name: data.name,
        type: data.type,
        jurisdictionId: data.jurisdictionId,
      },
    });
  }

  async getOrganizationById(id) {
    return prisma.organization.findUnique({
      where: { id, deletedAt },
      include: {
        jurisdiction: true,
        departments: true,
      },
    });
  }

  async updateVerificationStatus(id, status) {
    return prisma.organization.update({
      where: { id },
      data: { verificationStatus: status },
    });
  }

  async listOrganizationsByJurisdiction(jurisdictionId) {
    return prisma.organization.findMany({
      where: {
        jurisdictionId,
        deletedAt,
      },
      include: {
        jurisdiction: true,
      },
    });
  }
}

export const organizationService = new OrganizationService();