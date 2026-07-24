'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface EcosystemMapProps {
  academies: any[];
  selectedAcademy: any | null;
  onSelectAcademy: (academy: any) => void;
}

/* ═══════════════════════════════════════════
   PROGRESSIVE-DETAIL MARKER SYSTEM
   ─ Zoom ≤13 : Clusters (auto)
   ─ Zoom 14-15: Static ring + core dot
   ─ Zoom ≥16 : Full animated node (pulse ring + hexagon core + glow)
   CSS controls visibility via [data-zoom] on map container
   ═══════════════════════════════════════════ */

function createMarkerIcon(name = '', sport = '', idx = 0) {
  const short = name.length > 22 ? name.slice(0, 20) + '…' : name;
  // Stagger animation delays so pulses aren't all in sync
  const delay = ((idx * 0.37) % 2.4).toFixed(2);
  const delay2 = (((idx * 0.37) + 1.2) % 2.4).toFixed(2);

  return L.divIcon({
    className: '',
    iconSize: [44, 44] as [number, number],
    iconAnchor: [22, 22] as [number, number],
    popupAnchor: [0, -24] as [number, number],
    html: `<div class="gwd-node">
      <div class="gwd-node-pulse" style="animation-delay:${delay}s"></div>
      <div class="gwd-node-pulse gwd-node-pulse-2" style="animation-delay:${delay2}s"></div>
      <div class="gwd-node-ring"></div>
      <div class="gwd-node-core"></div>
      <div class="gwd-node-label">
        <span class="gwd-node-name">${short}</span>
        <span class="gwd-node-sport">${sport}</span>
      </div>
    </div>`,
  });
}

function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  let sizeClass = 'cluster-sm';
  let size = 38;
  if (count >= 10) { sizeClass = 'cluster-lg'; size = 54; }
  else if (count >= 5) { sizeClass = 'cluster-md'; size = 46; }

  return L.divIcon({
    html: `<div class="gwd-cluster ${sizeClass}">
      <div class="gwd-cluster-pulse"></div>
      <div class="gwd-cluster-ring"></div>
      <span>${count}</span>
    </div>`,
    className: '',
    iconSize: [size, size] as [number, number],
    iconAnchor: [size / 2, size / 2] as [number, number],
  });
}

export default function EcosystemMap({ academies, selectedAcademy, onSelectAcademy }: EcosystemMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);

  // Initialize map once
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [17.46, 78.39],
      zoom: 12,
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }
    ).addTo(map);

    // Set initial data-zoom
    mapRef.current.setAttribute('data-zoom', String(map.getZoom()));

    // Update data-zoom on zoom change for CSS progressive detail
    map.on('zoomend', () => {
      const z = Math.round(map.getZoom());
      mapRef.current?.setAttribute('data-zoom', String(z));
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers when academies change
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    // Remove old cluster group
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }

    // Create MarkerClusterGroup
    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 14,
      iconCreateFunction: createClusterIcon,
      animate: true,
    });

    academies.forEach((academy, idx) => {
      if (!academy.coordinates?.lat || !academy.coordinates?.lng) return;

      const sport = Array.isArray(academy.sports) && academy.sports.length > 0 ? academy.sports[0] : '';
      const icon = createMarkerIcon(academy.name || '', sport, idx);

      const marker = L.marker([academy.coordinates.lat, academy.coordinates.lng], { icon });

      marker.on('click', () => {
        onSelectAcademy(academy);
      });

      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;
  }, [academies, onSelectAcademy]);

  // Handle selected academy fly-to
  useEffect(() => {
    if (!mapInstance.current || !selectedAcademy) return;
    if (!selectedAcademy.coordinates?.lat || !selectedAcademy.coordinates?.lng) return;

    mapInstance.current.flyTo(
      [selectedAcademy.coordinates.lat, selectedAcademy.coordinates.lng],
      15,
      { duration: 1.5, easeLinearity: 0.25 }
    );
  }, [selectedAcademy]);

  return (
    <>
      <div
        ref={mapRef}
        id="map"
        className="absolute inset-0 z-0"
        style={{ background: '#050508' }}
      />
      {/* Custom zoom controls */}
      <div className="custom-zoom">
        <button onClick={() => mapInstance.current?.zoomIn()} aria-label="Zoom in">+</button>
        <button onClick={() => mapInstance.current?.zoomOut()} aria-label="Zoom out">−</button>
      </div>
    </>
  );
}
