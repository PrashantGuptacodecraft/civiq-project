import { prisma } from '@civiq/shared-db';

export interface CreateDepartmentDto {
  name;
  organizationId;
  issueCategories[];
}

export class DepartmentService {
  async createDepartment(data) {
    return prisma.department.create({
      data: {
        name: data.name,
        organizationId: data.organizationId,
        issueCategories: data.issueCategories,
      },
    });
  }

  async getDepartmentById(id) {
    return prisma.department.findUnique({
      where: { id, deletedAt },
      include: {
        organization: {
          include: {
            jurisdiction: true,
          },
        },
      },
    });
  }

  async listDepartmentsByOrganization(organizationId) {
    return prisma.department.findMany({
      where: {
        organizationId,
        deletedAt,
      },
    });
  }
}

export const departmentService = new DepartmentService();