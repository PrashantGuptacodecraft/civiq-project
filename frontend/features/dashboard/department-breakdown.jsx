'use client';
import React from 'react';

export function DepartmentBreakdown({
  departments = [],
  onSelectDepartment,
  selectedDepartment = 'ALL',
}) {
  if (departments.length === 0) {
    return (
      <div className="bg-surface-primary border border-border-primary rounded-2xl p-6 text-center text-sm text-text-secondary">
        No department metrics available for active filters.
      </div>
    );
  }

  return (
    <div className="bg-surface-primary border border-border-primary rounded-2xl overflow-hidden shadow-elevation-1">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border-primary flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text-primary">
            Department Performance &amp; Accountability
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Cross-department resolution KPIs, SLA adherence, and citizen satisfaction.
          </p>
        </div>
        <span className="text-xs text-text-tertiary">
          Tap row to filter
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse" aria-label="Department performance table">
          <thead className="bg-surface-secondary border-b border-border-primary text-xs uppercase text-text-tertiary">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Department</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">Total</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">Open</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">Verified %</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">SLA Compliance</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">Avg Resolution</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">Reopened</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">Duplicate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {departments.map((dept) => {
              const isSelected = selectedDepartment === dept.departmentName;

              return (
                <tr
                  key={dept.departmentName}
                  onClick={() => onSelectDepartment(dept.departmentName)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 hover:bg-primary/15'
                      : 'hover:bg-surface-secondary'
                  }`}
                >
                  <td className="px-4 py-3.5 font-semibold text-text-primary">
                    {dept.departmentName}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-text-primary">
                    {dept.totalIssues}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      {dept.openCount}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-medium text-text-secondary">
                    {dept.verificationRate}%
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        dept.slaComplianceRate >= 85
                          ? 'bg-status-success/10 text-status-success'
                          : dept.slaComplianceRate >= 60
                          ? 'bg-status-warning/15 text-status-warning'
                          : 'bg-priority-critical/10 text-priority-critical'
                      }`}
                    >
                      {dept.slaComplianceRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono text-xs text-text-secondary">
                    {dept.averageResolutionHours > 0 ? `${dept.averageResolutionHours} hrs` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`text-xs font-semibold ${
                        dept.reopenedCount > 0 ? 'text-priority-critical' : 'text-text-tertiary'
                      }`}
                    >
                      {dept.reopenedCount} ({dept.reopenRate}%)
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-text-tertiary">
                    {dept.duplicateCount} ({dept.duplicateRate}%)
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-border-primary">
        {departments.map((dept) => {
          const isSelected = selectedDepartment === dept.departmentName;

          return (
            <div
              key={dept.departmentName}
              onClick={() => onSelectDepartment(dept.departmentName)}
              role="button"
              tabIndex={0}
              className={`p-4 transition-colors cursor-pointer space-y-2.5 ${
                isSelected ? 'bg-primary/10' : 'hover:bg-surface-secondary'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sm text-text-primary">
                  {dept.departmentName}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-secondary border border-border-secondary">
                  {dept.totalIssues} Total
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-surface-secondary rounded-lg">
                  <span className="text-text-tertiary block">Open Issues:</span>
                  <span className="font-bold text-primary">{dept.openCount}</span>
                </div>
                <div className="p-2 bg-surface-secondary rounded-lg">
                  <span className="text-text-tertiary block">SLA Compliance:</span>
                  <span className={`font-bold ${dept.slaComplianceRate >= 80 ? 'text-status-success' : 'text-priority-critical'}`}>
                    {dept.slaComplianceRate}%
                  </span>
                </div>
                <div className="p-2 bg-surface-secondary rounded-lg">
                  <span className="text-text-tertiary block">Avg Resolution:</span>
                  <span className="font-bold text-text-primary">
                    {dept.averageResolutionHours > 0 ? `${dept.averageResolutionHours} hrs` : 'N/A'}
                  </span>
                </div>
                <div className="p-2 bg-surface-secondary rounded-lg">
                  <span className="text-text-tertiary block">Reopened:</span>
                  <span className="font-bold text-text-primary">{dept.reopenedCount} ({dept.reopenRate}%)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
