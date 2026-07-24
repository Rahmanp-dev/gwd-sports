'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface EcosystemMapProps {
  academies: any[];
  selectedAcademy: any | null;
  onSelectAcademy: (academy: any) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function EcosystemMap({ academies, selectedAcademy, onSelectAcademy }: EcosystemMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [78.4867, 17.3850], // Hyderabad default
      zoom: 11,
      pitch: 45,
      bearing: -17.6,
      antialias: true
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add 3D buildings
      if (map.current) {
        const layers = map.current.getStyle()?.layers;
        if (layers) {
          const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
          )?.id;

          map.current.addLayer(
            {
              id: 'add-3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 15,
              paint: {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
              }
            },
            labelLayerId
          );
        }
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when academies change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    academies.forEach(academy => {
      if (academy.coordinates && academy.coordinates.lng && academy.coordinates.lat) {
        // Create custom DOM element for the marker
        const el = document.createElement('div');
        el.className = 'w-3 h-3 bg-[#e63946] rounded-full cursor-pointer shadow-[0_0_15px_rgba(230,57,70,0.8)] relative';
        
        // Add pulsing effect
        const pulse = document.createElement('div');
        pulse.className = 'absolute inset-0 rounded-full bg-[#e63946] animate-ping opacity-75';
        el.appendChild(pulse);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectAcademy(academy);
        });

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        // Add popup
        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false, className: 'dark-popup' })
          .setHTML(`<div class="bg-[#111118] text-white px-3 py-2 rounded shadow-xl border border-[#1a1a24] text-xs font-bold">${academy.name}</div>`);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([academy.coordinates.lng, academy.coordinates.lat])
          .setPopup(popup)
          .addTo(map.current!);

        // Show popup on hover
        el.addEventListener('mouseenter', () => marker.togglePopup());
        el.addEventListener('mouseleave', () => marker.togglePopup());

        markersRef.current.push(marker);
      }
    });
  }, [academies, mapLoaded, onSelectAcademy]);

  // Handle selected academy fly-to
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedAcademy) return;
    
    if (selectedAcademy.coordinates && selectedAcademy.coordinates.lng && selectedAcademy.coordinates.lat) {
      map.current.flyTo({
        center: [selectedAcademy.coordinates.lng, selectedAcademy.coordinates.lat],
        zoom: 14,
        duration: 1500,
        essential: true
      });
    }
  }, [selectedAcademy, mapLoaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 bg-[#0a0a0f] flex items-center justify-center z-0">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-[#e63946] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-mono text-sm">Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .dark-popup .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .dark-popup .mapboxgl-popup-tip {
          display: none;
        }
      `}} />
      <div ref={mapContainer} className="absolute inset-0 z-0 bg-[#0a0a0f]" />
    </>
  );
}
