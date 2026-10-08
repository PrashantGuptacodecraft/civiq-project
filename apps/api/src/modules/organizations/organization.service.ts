import { prisma, OrganizationType, OrgVerificationStatus } from '@civiq/db';

export interface CreateOrganizationDto {
  name: string;
  type: OrganizationType;
  jurisdictionId: string;
}

export class OrganizationService {
  async createOrganization(data: CreateOrganizationDto) {
    return prisma.organization.create({
      data: {
        name: data.name,
        type: data.type,
        jurisdictionId: data.jurisdictionId,
      },
    });
  }

  async getOrganizationById(id: string) {
    return prisma.organization.findUnique({
      where: { id, deletedAt: null },
      include: {
        jurisdiction: true,
        departments: true,
      },
    });
  }

  async updateVerificationStatus(id: string, status: OrgVerificationStatus) {
    return prisma.organization.update({
      where: { id },
      data: { verificationStatus: status },
    });
  }

  async listOrganizationsByJurisdiction(jurisdictionId: string) {
    return prisma.organization.findMany({
      where: {
        jurisdictionId,
        deletedAt: null,
      },
      include: {
        jurisdiction: true,
      },
    });
  }
}

export const organizationService = new OrganizationService();
