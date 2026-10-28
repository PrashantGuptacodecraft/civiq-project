'use client';
import React, { useState, useMemo } from 'react';
import { MOCK_ASSET_INTELLIGENCE } from './mock-assets-data.js';
import { AssetTimelineDrawer } from './asset-timeline-drawer.jsx';
import {
  ASSET_INTELLIGENCE_DISCLAIMER,
  ASSET_TYPE_LABELS,
  REASON_CODE_LABELS,
  REASON_CODE_BADGES,
  RISK_LEVEL_BADGES,
  ACTION_RECOMMENDATIONS,
} from './types.js';

export function AssetIntelligenceDashboard() {
  const [jurisdiction, setJurisdiction] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' | 'trends' | 'registry'
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Filter assets based on jurisdiction, risk, type, and search
  const filteredAssets = useMemo(() => {
    return MOCK_ASSET_INTELLIGENCE.filter((asset) => {
      if (jurisdiction !== 'ALL' && asset.jurisdictionId !== jurisdiction) return false;
      if (selectedRisk !== 'ALL' && asset.riskLevel !== selectedRisk) return false;
      if (selectedType !== 'ALL' && asset.assetType !== selectedType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTag = asset.assetTag.toLowerCase().includes(query);
        const matchesName = asset.name.toLowerCase().includes(query);
        const matchesWard = asset.ward.toLowerCase().includes(query);
        const matchesDept = asset.department.toLowerCase().includes(query);
        if (!matchesTag && !matchesName && !matchesWard && !matchesDept) return false;
      }
      return true;
    });
  }, [jurisdiction, selectedRisk, selectedType, searchQuery]);

  // High-Recurrence Candidates (sorted by riskScore descending, then failureCount descending)
  const maintenanceCandidates = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
      return b.failureCount - a.failureCount;
    });
  }, [filteredAssets]);

  // Top-level KPI Aggregations
  const stats = useMemo(() => {
    const totalAssets = filteredAssets.length;
    const criticalOrHighCount = filteredAssets.filter(
      (a) => a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH'
    ).length;
    const cumulativeDowntime = filteredAssets.reduce(
      (sum, a) => sum + (a.totalDowntimeHours || 0),
      0
    );
    const avgCondition =
      totalAssets > 0
        ? Math.round(
            filteredAssets.reduce((sum, a) => sum + a.conditionScore, 0) / totalAssets
          )
        : 0;

    return {
      totalAssets,
      criticalOrHighCount,
      cumulativeDowntime: Math.round(cumulativeDowntime * 10) / 10,
      avgCondition,
    };
  }, [filteredAssets]);

  // Failure Trends aggregated by Category / Asset Type
  const categoryTrends = useMemo(() => {
    const map = {};
    filteredAssets.forEach((asset) => {
      const type = asset.assetType;
      if (!map[type]) {
        map[type] = {
          assetType: type,
          count: 0,
          totalFailures: 0,
          totalDowntime: 0,
          criticalCount: 0,
          conditionSum: 0,
        };
      }
      map[type].count += 1;
      map[type].totalFailures += asset.failureCount;
      map[type].totalDowntime += asset.totalDowntimeHours;
      if (asset.riskLevel === 'CRITICAL' || asset.riskLevel === 'HIGH') {
        map[type].criticalCount += 1;
      }
      map[type].conditionSum += asset.conditionScore;
    });

    return Object.values(map)
      .map((entry) => ({
        ...entry,
        avgCondition: Math.round(entry.conditionSum / entry.count),
      }))
      .sort((a, b) => b.totalFailures - a.totalFailures);
  }, [filteredAssets]);

  const resetFilters = () => {
    setJurisdiction('ALL');
    setSelectedRisk('ALL');
    setSelectedType('ALL');
    setSearchQuery('');
  };

  return (
    <div className="flex-1 bg-surface-primary">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Phase 53 Municipal Asset Ops
              </span>
              <span className="text-xs font-medium text-text-tertiary flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sensor & Civic Telemetry
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
              Asset Intelligence & Predictive Maintenance
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Identify high-recurrence failure clusters, evaluate downtime impact, and prioritize municipal interventions.
            </p>
          </div>

          {/* Jurisdiction Selector */}
          <div className="flex items-center gap-2 self-start md:self-center bg-surface-elevated p-1.5 rounded-xl border border-border-primary">
            <label htmlFor="jurisdiction-select" className="text-xs font-semibold text-text-secondary px-2">
              Jurisdiction:
            </label>
            <select
              id="jurisdiction-select"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="text-xs font-bold bg-surface-secondary text-text-primary border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            >
              <option value="ALL">All Municipalities (Pune Metropolitan)</option>
              <option value="mh-pune-pmc">PMC (Pune Municipal Corp)</option>
              <option value="mh-pune-pcmc">PCMC (Pimpri-Chinchwad)</option>
            </select>
          </div>
        </div>

        {/* AI Advisory Banner */}
        <div
          className="rounded-xl bg-status-info/10 border border-status-info/20 p-4"
          role="note"
        >
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-status-info shrink-0 mt-0.5">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-status-info uppercase tracking-wider">
                AI Predictive Maintenance Advisory • Decision Support System
              </h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {ASSET_INTELLIGENCE_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary shadow-sm">
            <span className="text-xs font-medium text-text-tertiary block">Monitored Assets</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-black text-text-primary" data-testid="kpi-total-assets">
                {stats.totalAssets}
              </span>
              <span className="text-xs text-text-secondary">active items</span>
            </div>
            <span className="text-[11px] text-text-tertiary block mt-2">
              Across {jurisdiction === 'ALL' ? 'both jurisdictions' : jurisdiction}
            </span>
          </div>

          <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary shadow-sm">
            <span className="text-xs font-medium text-text-tertiary block">At-Risk Candidates</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-black text-red-600" data-testid="kpi-critical-count">
                {stats.criticalOrHighCount}
              </span>
              <span className="text-xs text-red-500 font-semibold">Critical / High</span>
            </div>
            <span className="text-[11px] text-text-tertiary block mt-2">
              Requires scheduled field review
            </span>
          </div>

          <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary shadow-sm">
            <span className="text-xs font-medium text-text-tertiary block">Cumulative Downtime</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-black text-purple-600" data-testid="kpi-total-downtime">
                {stats.cumulativeDowntime}
              </span>
              <span className="text-xs text-text-secondary">hours</span>
            </div>
            <span className="text-[11px] text-text-tertiary block mt-2">
              Recorded outage & disruption hours
            </span>
          </div>

          <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary shadow-sm">
            <span className="text-xs font-medium text-text-tertiary block">Mean Condition Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl md:text-3xl font-black ${
                stats.avgCondition < 50 ? 'text-red-500' : stats.avgCondition < 70 ? 'text-amber-500' : 'text-emerald-500'
              }`} data-testid="kpi-avg-condition">
                {stats.avgCondition}
              </span>
              <span className="text-xs text-text-secondary">/ 100</span>
            </div>
            <div className="w-full bg-surface-secondary h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${
                  stats.avgCondition < 50 ? 'bg-red-500' : stats.avgCondition < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${stats.avgCondition}%` }}
              />
            </div>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border-primary pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all min-h-[44px] flex items-center gap-2 shrink-0 ${
              activeTab === 'candidates'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>High-Recurrence Candidates</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-black/20 text-white font-mono">
              {maintenanceCandidates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all min-h-[44px] flex items-center gap-2 shrink-0 ${
              activeTab === 'trends'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>Failure Trends & Breakdown</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-surface-primary text-text-secondary font-mono">
              {categoryTrends.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            className={`px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all min-h-[44px] flex items-center gap-2 shrink-0 ${
              activeTab === 'registry'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>Full Registry Inventory</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-surface-primary text-text-secondary font-mono">
              {filteredAssets.length}
            </span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by asset tag, name, ward, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search assets"
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-surface-secondary text-text-primary border border-border-primary rounded-lg outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="risk-filter" className="text-xs font-semibold text-text-tertiary shrink-0">
              Risk:
            </label>
            <select
              id="risk-filter"
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="text-xs font-medium bg-surface-secondary text-text-primary border border-border-primary rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          {/* Asset Type Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="type-filter" className="text-xs font-semibold text-text-tertiary shrink-0">
              Type:
            </label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs font-medium bg-surface-secondary text-text-primary border border-border-primary rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            >
              <option value="ALL">All Asset Types</option>
              <option value="ROAD_SEGMENT">Road Segment</option>
              <option value="ELECTRICAL_TRANSFORMER">Transformer</option>
              <option value="DRAINAGE_CULVERT">Drainage Culvert</option>
              <option value="WATER_PIPELINE">Water Pipeline</option>
              <option value="WATER_VALVE">Water Valve</option>
              <option value="STREETLIGHT">Streetlight</option>
            </select>
          </div>

          {(searchQuery || selectedRisk !== 'ALL' || selectedType !== 'ALL' || jurisdiction !== 'ALL') && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary bg-surface-secondary rounded-lg border border-border-primary transition-colors min-h-[44px] shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Tab 1: Maintenance Candidates View */}
        {activeTab === 'candidates' && (
          <div>
            {maintenanceCandidates.length === 0 ? (
              <div className="p-12 text-center bg-surface-elevated rounded-2xl border border-dashed border-border-primary">
                <svg className="w-12 h-12 text-text-tertiary mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-base font-bold text-text-primary">No assets match criteria</h3>
                <p className="text-xs text-text-secondary mt-1">
                  Adjust your search keyword, urgency filter, or jurisdiction selection.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {maintenanceCandidates.map((asset) => {
                  const typeLabel = ASSET_TYPE_LABELS[asset.assetType] || asset.assetType;
                  const riskBadgeClass = RISK_LEVEL_BADGES[asset.riskLevel] || 'bg-neutral-500/10 text-neutral-600 border-neutral-500/30';
                  const actionLabel = ACTION_RECOMMENDATIONS[asset.recommendedAction] || asset.recommendedAction;

                  return (
                    <div
                      key={asset.id}
                      data-testid={`asset-candidate-card-${asset.id}`}
                      className="bg-surface-elevated rounded-2xl border border-border-primary p-5 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Meta Line */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold bg-surface-secondary text-text-secondary px-2 py-0.5 rounded border border-border-primary">
                              {asset.assetTag}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {typeLabel}
                            </span>
                            <span className="text-xs text-text-tertiary">
                              {asset.ward}
                            </span>
                          </div>

                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${riskBadgeClass}`}>
                            {asset.riskLevel}
                          </span>
                        </div>

                        {/* Title & Department */}
                        <h3 className="text-base font-bold text-text-primary leading-tight">
                          {asset.name}
                        </h3>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {asset.department} • {asset.address}
                        </p>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-3 gap-2 my-4 bg-surface-secondary/50 p-3 rounded-xl border border-border-primary/60">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-text-tertiary block">
                              Condition Score
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className={`text-base font-black ${
                                asset.conditionScore < 50 ? 'text-red-500' : asset.conditionScore < 70 ? 'text-amber-500' : 'text-emerald-500'
                              }`}>
                                {asset.conditionScore}
                              </span>
                              <span className="text-[10px] text-text-tertiary">/100</span>
                            </div>
                            <div className="w-full bg-surface-primary h-1 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  asset.conditionScore < 50 ? 'bg-red-500' : asset.conditionScore < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${asset.conditionScore}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-text-tertiary block">
                              Recurrence
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-base font-black text-text-primary">
                                {asset.failureCount}
                              </span>
                              <span className="text-[10px] text-text-secondary">failures</span>
                            </div>
                            <span className="text-[10px] text-red-500 font-semibold block mt-1">
                              {asset.recentFailureCount} in 90 days
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-text-tertiary block">
                              Downtime
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-base font-black text-purple-600">
                                {asset.totalDowntimeHours}
                              </span>
                              <span className="text-[10px] text-text-secondary">hrs</span>
                            </div>
                            <span className="text-[10px] text-text-tertiary block mt-1">
                              Lag: {asset.daysSinceLastMaintenance}d
                            </span>
                          </div>
                        </div>

                        {/* Reason Code Chips */}
                        {asset.reasonCodes && asset.reasonCodes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {asset.reasonCodes.map((code) => {
                              const badgeClass = REASON_CODE_BADGES[code] || 'bg-surface-secondary text-text-secondary border-border-primary';
                              const label = REASON_CODE_LABELS[code] || code;
                              return (
                                <span
                                  key={code}
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badgeClass}`}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Linked Issues Summary */}
                        <div className="text-xs text-text-secondary mb-4 flex items-center justify-between bg-surface-secondary/30 px-3 py-2 rounded-lg border border-border-primary/40">
                          <span className="flex items-center gap-1.5 font-medium">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {asset.linkedIssues.length} linked citizen {asset.linkedIssues.length === 1 ? 'complaint' : 'complaints'}
                          </span>
                          <span className="text-[11px] text-text-tertiary">
                            Verified photo proof available
                          </span>
                        </div>
                      </div>

                      {/* Card Footer / Action */}
                      <div className="pt-3 border-t border-border-primary flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
                          {actionLabel}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedAsset(asset)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all min-h-[44px] flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={`View timeline and issues for ${asset.name}`}
                        >
                          <span>View Timeline & Issues</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Failure Trends & Breakdown View */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            <div className="bg-surface-elevated rounded-2xl border border-border-primary overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border-primary bg-surface-secondary/40">
                <h3 className="text-sm font-bold text-text-primary">
                  Infrastructure Failure Recurrence by Category
                </h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Aggregate failure counts, cumulative downtime, and at-risk asset concentration.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-surface-secondary/60 text-text-tertiary uppercase text-[11px] font-bold tracking-wider border-b border-border-primary">
                    <tr>
                      <th className="px-6 py-3">Asset Category</th>
                      <th className="px-6 py-3 text-center">Active Assets</th>
                      <th className="px-6 py-3 text-center">Total Failures</th>
                      <th className="px-6 py-3 text-center">Total Downtime</th>
                      <th className="px-6 py-3 text-center">Critical / High</th>
                      <th className="px-6 py-3 text-center">Avg Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {categoryTrends.map((trend) => (
                      <tr key={trend.assetType} className="hover:bg-surface-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-text-primary">
                          {ASSET_TYPE_LABELS[trend.assetType] || trend.assetType}
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-semibold text-text-secondary">
                          {trend.count}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-mono font-bold text-red-600 bg-red-500/10 px-2.5 py-1 rounded-full">
                            {trend.totalFailures}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-semibold text-purple-600">
                          {trend.totalDowntime} hrs
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-amber-600">
                          {trend.criticalCount}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-mono font-bold ${
                            trend.avgCondition < 50 ? 'text-red-500' : trend.avgCondition < 70 ? 'text-amber-500' : 'text-emerald-500'
                          }`}>
                            {trend.avgCondition} / 100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Full Registry Inventory View */}
        {activeTab === 'registry' && (
          <div className="bg-surface-elevated rounded-2xl border border-border-primary overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border-primary bg-surface-secondary/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Municipal Asset Registry</h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Complete catalog with operational statuses and lifecycle milestones.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface-secondary text-text-secondary border border-border-primary">
                {filteredAssets.length} Total Registered
              </span>
            </div>

            <div className="divide-y divide-border-primary">
              {filteredAssets.map((asset) => {
                const typeLabel = ASSET_TYPE_LABELS[asset.assetType] || asset.assetType;
                const riskBadgeClass = RISK_LEVEL_BADGES[asset.riskLevel] || 'bg-neutral-500/10 text-neutral-600 border-neutral-500/30';

                return (
                  <div
                    key={asset.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-secondary/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold bg-surface-secondary text-text-secondary px-2 py-0.5 rounded border border-border-primary">
                          {asset.assetTag}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {typeLabel}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {asset.ward}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskBadgeClass}`}>
                          {asset.riskLevel}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {asset.name}
                      </h4>
                      <p className="text-xs text-text-secondary">
                        {asset.department} • {asset.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-text-tertiary block">Condition</span>
                        <span className={`text-sm font-bold ${
                          asset.conditionScore < 50 ? 'text-red-500' : asset.conditionScore < 70 ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {asset.conditionScore}/100 ({asset.lifecycleStatus})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedAsset(asset)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-secondary hover:bg-primary hover:text-white transition-all min-h-[44px] flex items-center gap-1.5 border border-border-primary"
                        aria-label={`Inspect ${asset.name}`}
                      >
                        <span>Inspect</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Asset Drill-down Timeline Drawer */}
      {selectedAsset && (
        <AssetTimelineDrawer
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
