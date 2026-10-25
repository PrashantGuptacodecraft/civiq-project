'use client';
import React, { useState, useMemo } from 'react';
import { MOCK_HOTSPOTS } from './mock-hotspot-data.js';
import { HotspotCard } from './hotspot-card.jsx';
import { HotspotDetailDrawer } from './hotspot-detail-drawer.jsx';
import { HotspotTrendView } from './hotspot-trend-view.jsx';
import { ANALYTICAL_DISCLAIMER, CATEGORY_LABELS } from './types.js';

export function HotspotAnalytics({ initialHotspots = MOCK_HOTSPOTS }) {
  const [hotspots] = useState(initialHotspots);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [activeTab, setActiveTab] = useState('CLUSTERS'); // 'CLUSTERS' | 'TRENDS'

  // Filter States
  const [filters, setFilters] = useState({
    timeRange: '30d',
    category: 'ALL',
    minIncidents: 3,
    windowSizeKm: 0.5,
  });

  // Filtered hotspots based on user selections
  const filteredHotspots = useMemo(() => {
    return hotspots.filter((h) => {
      if (filters.category !== 'ALL' && h.dominantCategory !== filters.category) {
        return false;
      }
      if (h.incidentCount < filters.minIncidents) {
        return false;
      }
      return true;
    });
  }, [hotspots, filters]);

  // Aggregate summary KPIs
  const summaryKpis = useMemo(() => {
    const total = filteredHotspots.length;
    const critical = filteredHotspots.filter((h) => h.intensityLevel === 'CRITICAL').length;
    const emerging = filteredHotspots.filter((h) => h.trend.direction === 'INCREASING').length;

    // Find overall dominant category
    const catMap = {};
    for (const h of filteredHotspots) {
      catMap[h.dominantCategory] = (catMap[h.dominantCategory] || 0) + h.incidentCount;
    }
    let topCat = 'None';
    let maxCount = 0;
    for (const [cat, count] of Object.entries(catMap)) {
      if (count > maxCount) {
        maxCount = count;
        topCat = cat;
      }
    }

    return {
      total,
      critical,
      emerging,
      dominantCategory: topCat,
    };
  }, [filteredHotspots]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
            Spatial Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            Civic Hotspot Analytics
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Geographic concentration detection and temporal trend analytics for municipal decision support.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-surface-secondary border border-border-primary self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('CLUSTERS')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'CLUSTERS'
                ? 'bg-surface-primary text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Hotspot Clusters ({filteredHotspots.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TRENDS')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'TRENDS'
                ? 'bg-surface-primary text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Trends & Dynamics
          </button>
        </div>
      </div>

      {/* Mandatory Non-Causal Analytical Callout */}
      <div
        className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 sm:p-5 text-text-primary"
        role="region"
        aria-label="Analytical Disclaimer"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-5 h-5 text-blue-600 shrink-0 mt-0.5">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-xs sm:text-sm font-bold text-blue-700 tracking-wide uppercase">
              Analytical Concentration • Not Causal Proof
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {ANALYTICAL_DISCLAIMER}
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-elevated p-5 rounded-xl border border-border-primary shadow-sm">
          <span className="text-xs font-medium text-text-tertiary block">Detected Hotspots</span>
          <span className="text-2xl sm:text-3xl font-black text-text-primary mt-1 block">
            {summaryKpis.total}
          </span>
          <span className="text-[11px] text-text-tertiary mt-1 block">Within active criteria</span>
        </div>

        <div className="bg-surface-elevated p-5 rounded-xl border border-border-primary shadow-sm">
          <span className="text-xs font-medium text-text-tertiary block">Critical Intensity</span>
          <span className="text-2xl sm:text-3xl font-black text-red-600 mt-1 block">
            {summaryKpis.critical}
          </span>
          <span className="text-[11px] text-text-tertiary mt-1 block">Score $\ge 80$</span>
        </div>

        <div className="bg-surface-elevated p-5 rounded-xl border border-border-primary shadow-sm">
          <span className="text-xs font-medium text-text-tertiary block">Emerging Hotspots</span>
          <span className="text-2xl sm:text-3xl font-black text-orange-600 mt-1 block">
            {summaryKpis.emerging}
          </span>
          <span className="text-[11px] text-text-tertiary mt-1 block">Velocity $\ge +15\%$</span>
        </div>

        <div className="bg-surface-elevated p-5 rounded-xl border border-border-primary shadow-sm">
          <span className="text-xs font-medium text-text-tertiary block">Dominant Domain</span>
          <span className="text-lg sm:text-xl font-bold text-text-primary mt-1 truncate block">
            {CATEGORY_LABELS[summaryKpis.dominantCategory] || summaryKpis.dominantCategory.replace(/_/g, ' ')}
          </span>
          <span className="text-[11px] text-text-tertiary mt-1 block">Highest concentration</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-cat" className="font-semibold text-text-secondary">
              Category:
            </label>
            <select
              id="filter-cat"
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="bg-surface-primary border border-border-primary rounded-lg px-2.5 py-1.5 font-medium text-text-primary outline-none focus:border-primary"
            >
              <option value="ALL">All Categories</option>
              <option value="roads_pothole">Roads & Potholes</option>
              <option value="sanitation_garbage_dump">Garbage & Sanitation</option>
              <option value="electricity_streetlight_out">Streetlights</option>
              <option value="drainage_overflow">Drainage & Flooding</option>
            </select>
          </div>

          {/* Time Window */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-time" className="font-semibold text-text-secondary">
              Window:
            </label>
            <select
              id="filter-time"
              value={filters.timeRange}
              onChange={(e) => setFilters((prev) => ({ ...prev, timeRange: e.target.value }))}
              className="bg-surface-primary border border-border-primary rounded-lg px-2.5 py-1.5 font-medium text-text-primary outline-none focus:border-primary"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* Min Incidents Threshold */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-min" className="font-semibold text-text-secondary">
              Min Reports:
            </label>
            <select
              id="filter-min"
              value={filters.minIncidents}
              onChange={(e) => setFilters((prev) => ({ ...prev, minIncidents: Number(e.target.value) }))}
              className="bg-surface-primary border border-border-primary rounded-lg px-2.5 py-1.5 font-medium text-text-primary outline-none focus:border-primary"
            >
              <option value={3}>3+ Reports</option>
              <option value={5}>5+ Reports</option>
              <option value={8}>8+ Reports</option>
            </select>
          </div>
        </div>

        <span className="text-text-tertiary">
          Spatial Window: 500m radius
        </span>
      </div>

      {/* Tab Content */}
      {activeTab === 'CLUSTERS' ? (
        filteredHotspots.length === 0 ? (
          <div className="text-center py-12 bg-surface-elevated rounded-xl border border-dashed border-border-primary">
            <p className="text-text-secondary font-medium">No hotspots match the selected filter criteria.</p>
            <p className="text-xs text-text-tertiary mt-1">Try lowering the minimum reports threshold or selecting All Categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHotspots.map((hotspot) => (
              <HotspotCard
                key={hotspot.id}
                hotspot={hotspot}
                isSelected={selectedHotspot?.id === hotspot.id}
                onSelect={(h) => setSelectedHotspot(h)}
              />
            ))}
          </div>
        )
      ) : (
        <HotspotTrendView
          hotspots={filteredHotspots}
          onSelectHotspot={(h) => setSelectedHotspot(h)}
        />
      )}

      {/* Drill-down Drawer */}
      {selectedHotspot && (
        <HotspotDetailDrawer
          hotspot={selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
        />
      )}
    </div>
  );
}
