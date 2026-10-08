import { prisma } from '@civiq/db';

export interface CreateDepartmentDto {
  name: string;
  organizationId: string;
  issueCategories: string[];
}

export class DepartmentService {
  async createDepartment(data: CreateDepartmentDto) {
    return prisma.department.create({
      data: {
        name: data.name,
        organizationId: data.organizationId,
        issueCategories: data.issueCategories,
      },
    });
  }

  async getDepartmentById(id: string) {
    return prisma.department.findUnique({
      where: { id, deletedAt: null },
      include: {
        organization: {
          include: {
            jurisdiction: true,
          },
        },
      },
    });
  }

  async listDepartmentsByOrganization(organizationId: string) {
    return prisma.department.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
    });
  }
}

export const departmentService = new DepartmentService();
