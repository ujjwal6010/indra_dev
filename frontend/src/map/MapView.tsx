import { useEffect, useRef, useState } from 'react';
const maplibregl = (window as any).maplibregl;

import type { ForecastState, ScenarioPersistence, TrackPoint } from '../types';
import { MEMBERS } from '../types';
import { api } from '../services/api';

interface MapViewProps {
  forecastState: ForecastState | null;
  scenarios: ScenarioPersistence[];
  selectedScenarioId: string | null;
  onScenarioClick?: (id: string) => void;
  showSpaghetti?: boolean;
}

const MEMBER_COLORS: Record<string, string> = {
  gep01: '#f97316', gep02: '#0071e3', gep03: '#34c759',
  gep04: '#af52de', gep05: '#ff2d55',
};

// Study region bounds: 5N–38N, 65E–100E

export default function MapView({ forecastState, scenarios, selectedScenarioId, showSpaghetti = false }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any | null>(null);
  const [allTracks, setAllTracks] = useState<TrackPoint[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new (maplibregl as any).Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.45, 'raster-saturation': -0.3 } }],
      },
      center: [82, 20],
      zoom: 4.5,
      maxBounds: [[50, -5], [115, 50]],
    });

    const map = mapRef.current;

    map.on('load', () => {
      // Study region boundary
      map.addSource('study-region', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[65, 5], [100, 5], [100, 38], [65, 38], [65, 5]]],
          },
          properties: {},
        },
      });
      map.addLayer({
        id: 'study-region-fill',
        type: 'fill',
        source: 'study-region',
        paint: { 'fill-color': '#0071e3', 'fill-opacity': 0.03 },
      });
      map.addLayer({
        id: 'study-region-border',
        type: 'line',
        source: 'study-region',
        paint: { 'line-color': '#0071e3', 'line-width': 1, 'line-dasharray': [4, 4], 'line-opacity': 0.35 },
      });

      // Track lines source (updated dynamically)
      map.addSource('tracks', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'track-lines',
        type: 'line',
        source: 'tracks',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.5,
          'line-opacity': ['get', 'opacity'],
        },
      });

      // Event footprints
      map.addSource('footprints', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'footprint-fill',
        type: 'fill',
        source: 'footprints',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['get', 'opacity'],
        },
      });
      map.addLayer({
        id: 'footprint-border',
        type: 'line',
        source: 'footprints',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1,
          'line-opacity': 0.6,
        },
      });

      // Centroids
      map.addSource('centroids', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'centroid-circles',
        type: 'circle',
        source: 'centroids',
        paint: {
          'circle-radius': 7,
          'circle-color': ['get', 'color'],
          'circle-opacity': ['get', 'opacity'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.9,
        },
      });

      // Scenario group halos
      map.addSource('scenario-halos', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'scenario-halo-fill',
        type: 'fill',
        source: 'scenario-halos',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.08 },
      });
      map.addLayer({
        id: 'scenario-halo-border',
        type: 'line',
        source: 'scenario-halos',
        paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-opacity': 0.5, 'line-dasharray': [3, 2] },
      });

      map.addControl(new (maplibregl as any).NavigationControl(), 'top-right');
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (showSpaghetti && allTracks.length === 0) {
      api.getTracks().then(setAllTracks).catch(console.error);
    }
  }, [showSpaghetti, allTracks.length]);

  // Update map data when forecast state changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const selectedMembers = selectedScenarioId
      ? scenarios.find(s => s.scenario_id === selectedScenarioId)?.members ?? []
      : [];

    const getOpacity = (member: string) =>
      selectedMembers.length === 0 || selectedMembers.includes(member) ? 1 : 0.15;

    if (forecastState) {
      // Footprints
      const footprintFeatures = forecastState.events.map(evt => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [evt.longitude_centroid - 0.4, evt.latitude_centroid - 0.4],
            [evt.longitude_centroid + 0.4, evt.latitude_centroid - 0.4],
            [evt.longitude_centroid + 0.4, evt.latitude_centroid + 0.4],
            [evt.longitude_centroid - 0.4, evt.latitude_centroid + 0.4],
            [evt.longitude_centroid - 0.4, evt.latitude_centroid - 0.4],
          ]],
        },
        properties: {
          color: MEMBER_COLORS[evt.member] ?? '#6e6e73',
          opacity: getOpacity(evt.member) * 0.2,
          member: evt.member,
        },
      }));
      (map.getSource('footprints') as any)?.setData({
        type: 'FeatureCollection',
        features: footprintFeatures,
      });

      // Centroids
      const centroidFeatures = forecastState.events.map(evt => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [evt.longitude_centroid, evt.latitude_centroid] },
        properties: {
          color: MEMBER_COLORS[evt.member] ?? '#6e6e73',
          opacity: getOpacity(evt.member),
          member: evt.member,
        },
      }));
      (map.getSource('centroids') as any)?.setData({
        type: 'FeatureCollection',
        features: centroidFeatures,
      });
    }

    // Scenario group halos
    const haloFeatures = forecastState?.scenarios.map((sg, i) => {
      const lats = sg.members.map(m =>
        forecastState.tracks.find(t => t.member === m)?.latitude ?? 20
      );
      const lons = sg.members.map(m =>
        forecastState.tracks.find(t => t.member === m)?.longitude ?? 80
      );
      const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;
      const radius = 1.5; // ~150km in degrees
      const points = Array.from({ length: 32 }, (_, k) => {
        const angle = (k / 32) * 2 * Math.PI;
        return [centerLon + radius * Math.cos(angle), centerLat + radius * 0.6 * Math.sin(angle)];
      });
      points.push(points[0]);

      const color = i === 0 ? '#34c759' : '#ff9f0a';
      return {
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [points] },
        properties: { color, scenario_id: sg.scenario_id },
      };
    }) ?? [];

    (map.getSource('scenario-halos') as any)?.setData({
      type: 'FeatureCollection',
      features: haloFeatures,
    });

    // Spaghetti Tracks
    if (showSpaghetti && allTracks.length > 0) {
      const trackFeatures = MEMBERS.map(m => {
        const memberTracks = allTracks.filter(t => t.member === m.id).sort((a, b) => a.forecast_hour - b.forecast_hour);
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: memberTracks.map(t => [t.longitude, t.latitude]),
          },
          properties: {
            color: m.color,
            opacity: 0.8,
          },
        };
      });
      (map.getSource('tracks') as any)?.setData({
        type: 'FeatureCollection',
        features: trackFeatures,
      });
    } else {
      (map.getSource('tracks') as any)?.setData({
        type: 'FeatureCollection',
        features: [],
      });
    }

  }, [forecastState, scenarios, selectedScenarioId, showSpaghetti, allTracks]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="map-container" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass rounded-2xl p-3.5 text-xs space-y-1.5">
        <div className="text-[#1d1d1f] font-semibold uppercase tracking-widest text-[10px] mb-2">Members</div>
        {MEMBERS.map(m => (
          <div key={m.id} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
            <span className="text-[#6e6e73]">{m.label}</span>
          </div>
        ))}
        <div className="border-t border-[#e5e5ea] pt-2 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full border border-[#34c759]" style={{ background: 'rgba(52,199,89,0.15)' }} />
            <span className="text-[#6e6e73]">Scenario group</span>
          </div>
        </div>
      </div>

      {/* Study region label */}
      <div className="absolute top-4 left-4 glass rounded-xl px-3 py-1.5 text-[10px] text-[#6e6e73] uppercase tracking-widest font-medium">
        Study Region · 5°N–38°N · 65°E–100°E
      </div>
    </div>
  );
}
