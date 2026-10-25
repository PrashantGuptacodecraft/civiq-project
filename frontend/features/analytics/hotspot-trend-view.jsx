'use client';
import React from 'react';
import { CATEGORY_LABELS } from './types.js';

export function HotspotTrendView({ hotspots, onSelectHotspot }) {
  // Aggregate category distribution across all hotspots
  const categoryTotals = {};
  let totalClustered = 0;

  for (const h of hotspots) {
    for (const cb of h.categoryBreakdown) {
      categoryTotals[cb.categoryId] = (categoryTotals[cb.categoryId] || 0) + cb.count;
      totalClustered += cb.count;
    }
  }

  const categoryRanking = Object.entries(categoryTotals)
    .map(([catId, count]) => ({
      categoryId: catId,
      count,
      percentage: totalClustered > 0 ? Number(((count / totalClustered) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Emerging hotspots (increasing trend)
  const emerging = hotspots
    .filter((h) => h.trend.direction === 'INCREASING')
    .sort((a, b) => b.trend.percentageChange - a.trend.percentageChange);

  // High intensity chronic hotspots
  const chronic = hotspots
    .filter((h) => h.intensityScore >= 60)
    .sort((a, b) => b.intensityScore - a.intensityScore);

  return (
    <div className="space-y-6">
      {/* Category Concentration Across All Hotspots */}
      <div className="bg-surface-elevated p-6 rounded-xl border border-border-primary shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary mb-1">
          Issue Category Distribution Across Hotspots
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Proportion of incidents concentrated in spatial clusters by municipal domain.
        </p>

        <div className="space-y-3.5">
          {categoryRanking.map((item) => (
            <div key={item.categoryId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-primary">
                  {CATEGORY_LABELS[item.categoryId] || item.categoryId.replace(/_/g, ' ')}
                </span>
                <span className="font-semibold text-text-secondary">
                  {item.count} reports ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emerging Hotspots (High Velocity Increase) */}
      <div className="bg-surface-elevated p-6 rounded-xl border border-border-primary shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
              Emerging Concentrations (Increasing Velocity)
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Clusters exhibiting $\ge 15\%$ incident growth over the preceding observation window.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-600 border border-red-500/20">
            {emerging.length} Emerging
          </span>
        </div>

        {emerging.length === 0 ? (
          <p className="text-xs text-text-tertiary py-4 text-center">
            No emerging hotspots detected in the selected observation window.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {emerging.map((h) => (
              <div
                key={h.id}
                onClick={() => onSelectHotspot(h)}
                className="p-4 rounded-xl border border-border-primary hover:border-primary/50 bg-surface-primary cursor-pointer transition-all text-xs space-y-2 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary truncate">{h.name}</span>
                  <span className="text-red-600 font-bold shrink-0">
                    +{h.trend.percentageChange}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-text-tertiary text-[11px]">
                  <span>{h.incidentCount} total reports</span>
                  <span>{h.trend.currentWindowCount} recent / {h.trend.priorWindowCount} prior</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chronic High-Intensity Hotspots */}
      <div className="bg-surface-elevated p-6 rounded-xl border border-border-primary shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary mb-1">
          High-Intensity Chronic Concentrations
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Locations exhibiting sustained incident volume and elevated hazard severity scores.
        </p>

        <div className="divide-y divide-border-primary">
          {chronic.map((h) => (
            <div
              key={h.id}
              onClick={() => onSelectHotspot(h)}
              className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-secondary/50 px-2 rounded-lg transition-colors text-xs"
            >
              <div>
                <span className="font-semibold text-text-primary block">{h.name}</span>
                <span className="text-text-tertiary text-[11px]">
                  {h.primaryWard} • ~{h.radiusMeters}m radius
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-text-primary block">
                  Score: {h.intensityScore}/100
                </span>
                <span className="text-[11px] text-text-tertiary">
                  {h.incidentCount} incidents
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
