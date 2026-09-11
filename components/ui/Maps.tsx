'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'

// Fix for default Leaflet icon paths in Next.js production builds
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

import { CaseItem } from '@/app/page'

const MAP_URL = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png'
const MAP_ATTR = 'Wikimedia, © OpenStreetMap contributors'

const toneColor = (n: number) => n >= 90 ? '#f04444' : n >= 70 ? '#ed9564' : n >= 50 ? '#d6a84f' : '#38b7a5'

// ============================================
// 1. OverviewMap
// ============================================

function HeatmapNodes({ cases, onSelectCase }: { cases: CaseItem[], onSelectCase: (id: string) => void }) {
  const map = useMap();

  useEffect(() => {
    if (cases.length > 0) {
      const bounds = L.latLngBounds(cases.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [map, cases]);

  return (
    <>
      <style>{`.core-glow { filter: drop-shadow(0 0 8px rgba(240, 68, 68, 0.8)); }`}</style>
      {cases.map(c => {
        const color = toneColor(c.risk);
        const zoneRadius = 25000 + (c.risk * 150); // scales from ~30km to ~40km
        
        return (
          <React.Fragment key={c.id}>
            {/* The geographic outer zone (scales with map zoom) */}
            <Circle
              center={[c.lat, c.lng]}
              radius={zoneRadius}
              pathOptions={{ fillColor: color, color: color, fillOpacity: 0.15, weight: 1.5 }}
              interactive={false}
            />
            {/* The core point (fixed pixel size, slight glow) */}
            <CircleMarker
              center={[c.lat, c.lng]}
              radius={6}
              pathOptions={{ fillColor: color, color: '#121c24', fillOpacity: 1, weight: 2, className: 'core-glow' }}
              eventHandlers={{ click: () => onSelectCase && onSelectCase(c.id) }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} className="dark-tooltip">
                <div style={{ fontFamily: 'monospace', fontSize: '11px', textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', color: '#e8eef4' }}>{c.city}</div>
                  <div style={{ color: color }}>Max Risk: {c.risk}</div>
                  <div style={{ color: '#94a3b3', marginTop: '4px' }}>Active cash-out cluster</div>
                </div>
              </Tooltip>
            </CircleMarker>
          </React.Fragment>
        )
      })}
    </>
  );
}

export function OverviewMap({ cases, onSelectCase }: { cases: CaseItem[], onSelectCase: (id: string) => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <MapContainer center={[22, 79]} zoom={5} style={{ height: '100%', width: '100%', background: '#121c24' }} zoomControl={false}>
        <TileLayer url={MAP_URL} className="map-tiles" attribution={MAP_ATTR} />
        <HeatmapNodes cases={cases} onSelectCase={onSelectCase} />
      </MapContainer>
      
      {/* Legend */}
      <div style={{ position: 'absolute', bottom: '15px', left: '15px', zIndex: 30, background: 'rgba(18, 28, 36, 0.8)', border: '1px solid #2d3b48', padding: '8px 12px', borderRadius: '4px', pointerEvents: 'none' }}>
         <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b3', marginBottom: '6px', fontFamily: 'monospace' }}>Risk Density</div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#e8eef4' }}>
            <span>Low</span>
            <div style={{ display: 'flex', width: '80px', height: '6px', borderRadius: '3px', background: 'linear-gradient(to right, #38b7a5, #d6a84f, #ed9564, #f04444)' }}></div>
            <span>Critical</span>
         </div>
      </div>
    </div>
  )
}

// ============================================
// 2. PredictionMap & Panel
// ============================================

const createCustomIcon = (rank: number, color: string) => {
  return L.divIcon({
    className: 'custom-prediction-marker',
    html: `<div style="background: ${color}22; border: 2px solid ${color}; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-family: monospace; font-weight: bold; font-size: 12px; box-shadow: 0 0 10px ${color}55;">${rank}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

function MapLinker({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

export function LocationPredictionPanel({ selected }: { selected: CaseItem }) {
  const preds = [
    { rank: 1, name: 'Sector 18 ATM', prob: 94, dist: '0.4 km', lat: selected.lat + 0.002, lng: selected.lng + 0.001, color: '#f04444' },
    { rank: 2, name: 'Botanical Garden', prob: 72, dist: '1.2 km', lat: selected.lat - 0.005, lng: selected.lng - 0.003, color: '#ed9564' },
    { rank: 3, name: 'Golf Course Road', prob: 41, dist: '3.8 km', lat: selected.lat + 0.008, lng: selected.lng + 0.006, color: '#38b7a5' },
  ]
  
  const [active, setActive] = useState(preds[0])

  return (
    <div className="mt-3">
      <div className="mb-2 text-[10px] font-mono text-amber border border-amber/30 bg-amber/5 px-2 py-1.5 flex justify-between">
        <span className="uppercase tracking-widest text-muted">Predicted Window</span>
        <span>11:20 AM – 11:45 AM</span>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <div style={{ height: '155px', border: '1px solid var(--steel)' }}>
          <MapContainer center={[active.lat, active.lng]} zoom={14} style={{ height: '100%', width: '100%', background: '#14212a' }} zoomControl={false}>
            <TileLayer url={MAP_URL} className="map-tiles" attribution={MAP_ATTR} />
            <MapLinker center={[active.lat, active.lng]} zoom={15} />
            {preds.map(p => (
              <React.Fragment key={p.rank}>
                {p.rank === 1 && (
                  <CircleMarker center={[p.lat, p.lng]} radius={40} color={p.color} fillColor={p.color} fillOpacity={0.1} weight={1} />
                )}
                <Marker 
                  position={[p.lat, p.lng]} 
                  icon={createCustomIcon(p.rank, p.color)}
                  eventHandlers={{ click: () => setActive(p) }}
                >
                  <Popup className="dark-popup">
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#e8eef4' }}>
                      <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                      <div style={{ color: '#94a3b3', marginTop: '4px' }}>Type: ATM</div>
                      <div style={{ color: p.color, marginTop: '2px', fontFamily: 'monospace' }}>Prob: {p.prob}% · {p.dist}</div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
        <div className="space-y-2 text-xs">
          {preds.map(p => (
            <div 
              key={p.rank} 
              className={`cursor-pointer p-2 border ${active.rank === p.rank ? 'border-steel bg-panel' : 'border-transparent'}`}
              onClick={() => setActive(p)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span style={{ color: p.color, fontFamily: 'monospace' }} className="mr-2">{p.prob}%</span> 
                  <span style={{ color: active.rank === p.rank ? '#fff' : 'var(--muted)' }}>{p.name}</span>
                </div>
              </div>
              <div className="mt-1 text-[10px] text-muted ml-[34px] font-mono">{p.dist}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// 3. FieldMap
// ============================================

const pulsingIcon = L.divIcon({
  className: 'custom-pulsing-marker',
  html: `<div style="width: 20px; height: 20px; background: #f04444; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 0 0 rgba(240, 68, 68, 0.7); animation: pulse-ring 1.5s infinite;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const officerIcon = L.divIcon({
  className: 'officer-marker',
  html: `<div style="width: 14px; height: 14px; background: #2b7fff; border-radius: 50%; border: 2px solid #14212a;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
})

export function FieldMap({ selected }: { selected: CaseItem }) {
  const officerLat = selected.lat - 0.012
  const officerLng = selected.lng - 0.008
  
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ height: '155px', border: '1px solid var(--steel)', background: '#14212a' }}>
        <MapContainer bounds={[[officerLat, officerLng], [selected.lat, selected.lng]]} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url={MAP_URL} className="map-tiles" attribution={MAP_ATTR} />
          <Marker position={[selected.lat, selected.lng]} icon={pulsingIcon} />
          <Marker position={[officerLat, officerLng]} icon={officerIcon} />
          <Polyline positions={[[officerLat, officerLng], [selected.lat, selected.lng]]} color="#2b7fff" weight={4} dashArray="5, 10" />
        </MapContainer>
      </div>
      <a 
        href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
        target="_blank" rel="noreferrer"
        className="primary-button mt-4 w-full justify-center"
        style={{ textDecoration: 'none' }}
      >
        Navigate with Google Maps
      </a>
    </div>
  )
}
