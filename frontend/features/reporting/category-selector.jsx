'use client';
import React, { useState } from 'react';
import { CIVIC_ISSUE_TAXONOMY_V1 } from '@civiq/contracts';

export function CategorySelector({ selectedCategoryId, onSelectCategory, errorMessage }) {
  const [activeGroupId, setActiveGroupId] = useState(CIVIC_ISSUE_TAXONOMY_V1.groups[0]?.id ?? 'roads');
  const activeGroup = CIVIC_ISSUE_TAXONOMY_V1.groups.find((g) => g.id === activeGroupId) ?? CIVIC_ISSUE_TAXONOMY_V1.groups[0];

  return (
    <fieldset className="space-y-4" aria-describedby={errorMessage ? 'category-error' : undefined}>
      <div>
        <legend className="block text-sm font-bold text-text-primary mb-0.5">
          Issue Category <span className="text-red-500" aria-hidden="true">*</span>
        </legend>
        <p className="text-xs text-text-secondary">
          Select the municipal department service category that best matches your report.
        </p>
      </div>

      {/* Group Pills for Mobile & Desktop Tabs */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-surface-secondary border border-border-primary rounded-2xl scrollbar-none"
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
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 min-h-[38px] focus:outline-none focus:ring-2 focus:ring-primary ${
                isActive
                  ? 'bg-surface-primary text-primary shadow-sm font-bold border border-border-primary/60'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary/70'
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
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1"
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
              className={`text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 min-h-[96px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/40 shadow-glow-primary'
                  : 'border-border-primary bg-surface-elevated hover:border-primary/40 hover:bg-surface-secondary/40 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-bold text-text-primary">
                    {category.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border uppercase tracking-wider ${severityClass}`}>
                    {category.severity}
                  </span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {category.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-2.5 border-t border-border-primary/60">
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
