'use client';

import React, { useState } from 'react';
import { CIVIC_ISSUE_TAXONOMY_V1, type IssueCategory } from '@civiq/contracts';

interface CategorySelectorProps {
  selectedCategoryId: string;
  onSelectCategory: (category: IssueCategory) => void;
  errorMessage?: string;
}

export function CategorySelector({
  selectedCategoryId,
  onSelectCategory,
  errorMessage,
}: CategorySelectorProps) {
  const [activeGroupId, setActiveGroupId] = useState<string>(
    CIVIC_ISSUE_TAXONOMY_V1.groups[0]?.id ?? 'roads'
  );

  const activeGroup = CIVIC_ISSUE_TAXONOMY_V1.groups.find(
    (g) => g.id === activeGroupId
  ) ?? CIVIC_ISSUE_TAXONOMY_V1.groups[0];

  return (
    <fieldset className="space-y-3" aria-describedby={errorMessage ? 'category-error' : undefined}>
      <legend className="block text-sm font-bold text-text-primary mb-1">
        Issue Category <span className="text-red-500" aria-hidden="true">*</span>
      </legend>
      <p className="text-xs text-text-secondary">
        Select the municipal department service category that best matches your report.
      </p>

      {/* Group Pills for Mobile & Desktop Tabs */}
      <div 
        className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none"
        role="tablist"
        aria-label="Civic service groups"
      >
        {CIVIC_ISSUE_TAXONOMY_V1.groups.map((group) => {
          const isActive = group.id === activeGroupId;
          return (
            <button
              type="button"
              key={group.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`group-panel-${group.id}`}
              id={`group-tab-${group.id}`}
              onClick={() => setActiveGroupId(group.id)}
              className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary hover:text-text-primary border border-border-primary'
              }`}
            >
              {group.name}
            </button>
          );
        })}
      </div>

      {/* Categories Grid for Active Group */}
      <div
        id={`group-panel-${activeGroupId}`}
        role="tabpanel"
        aria-labelledby={`group-tab-${activeGroupId}`}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1"
      >
        {activeGroup?.categories.map((category) => {
          const isSelected = category.id === selectedCategoryId;

          const severityClass = {
            LOW: 'bg-green-500/10 text-green-700 border-green-500/20',
            MEDIUM: 'bg-yellow-500/10 text-yellow-800 border-yellow-500/20',
            HIGH: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
            CRITICAL: 'bg-red-500/10 text-red-700 border-red-500/20',
          }[category.severity] || 'bg-gray-500/10 text-gray-700';

          return (
            <button
              type="button"
              key={category.id}
              onClick={() => onSelectCategory(category)}
              aria-pressed={isSelected}
              className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 min-h-[88px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                  : 'border-border-primary bg-surface-elevated hover:border-primary/50 hover:bg-surface-secondary/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-bold text-text-primary">
                    {category.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${severityClass}`}>
                    {category.severity}
                  </span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {category.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border-primary/50">
                <span className="truncate max-w-[150px] font-medium text-text-secondary">
                  {category.defaultDepartment}
                </span>
                <span className="font-semibold text-primary">
                  SLA: {category.slaDays} {category.slaDays === 1 ? 'day' : 'days'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {errorMessage && (
        <p id="category-error" className="text-xs font-semibold text-red-600 mt-1" role="alert">
          {errorMessage}
        </p>
      )}
    </fieldset>
  );
}
