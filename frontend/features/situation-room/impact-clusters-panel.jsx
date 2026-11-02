'use client';

import React from 'react';

export function ImpactClustersPanel({ clusters = [] }) {
  if (!clusters || clusters.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-500">
        <p className="text-sm">No active impact clusters reported in this operational period.</p>
      </div>
    );
  }

  const formatClusterTitle = (type) => {
    switch (type) {
      case 'STRANDED_PERSONS_RESCUE_NEEDED':
        return 'Stranded Residents & Rescue Inundation';
      case 'BLOCKED_ROAD_DEBRIS':
        return 'Submerged Causeways & Road Debris';
      case 'FLOODING_WATERLOGGING':
        return 'Severe Ground Flooding & Basements';
      case 'UTILITY_OUTAGE':
        return 'Power & Water Supply Disruption';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const getClusterIcon = (type) => {
    switch (type) {
      case 'STRANDED_PERSONS_RESCUE_NEEDED':
        return '🆘';
      case 'BLOCKED_ROAD_DEBRIS':
        return '🚧';
      case 'FLOODING_WATERLOGGING':
        return '🌊';
      case 'UTILITY_OUTAGE':
        return '⚡';
      default:
        return '📍';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Ground Impact Clusters ({clusters.length})
          </h2>
          <p className="text-xs text-slate-500">
            Synthesized from citizen reports and field verification officers
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
          Live Triage Feed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {clusters.map((cluster) => (
          <div
            key={cluster.impactType}
            className="rounded-xl p-4 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getClusterIcon(cluster.impactType)}</span>
                <h3 className="text-sm font-bold text-slate-800">
                  {formatClusterTitle(cluster.impactType)}
                </h3>
              </div>
              {cluster.criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200">
                  {cluster.criticalCount} Critical
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
              <span>
                <strong>{cluster.count}</strong> reports
              </span>
              {cluster.strandedPersonsCount > 0 && (
                <span className="text-red-600 font-semibold">
                  <strong>{cluster.strandedPersonsCount}</strong> stranded
                </span>
              )}
              {cluster.peopleAffectedEstimated > 0 && (
                <span>
                  ~<strong>{cluster.peopleAffectedEstimated.toLocaleString()}</strong> affected
                </span>
              )}
            </div>

            {/* Individual report headlines */}
            {cluster.reports && cluster.reports.length > 0 && (
              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-1">
                {cluster.reports.map((rep) => (
                  <div key={rep.reportId} className="truncate flex items-center gap-1.5">
                    <span className="font-mono text-slate-400 font-bold">{rep.reportId}:</span>
                    <span className="truncate">{rep.impactDetails?.title || rep.location?.address}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
