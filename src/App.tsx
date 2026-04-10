import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { locationData } from './constants';

declare const L: any;

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface Location {
    id: string;
    name: string;
    type: string;
    lat: number;
    lon: number;
}

const TYPE_COLORS: Record<string, string> = {
    hospital: '#ef4444',
    fuel: '#f59e0b',
    ev: '#10b981',
    center: '#3b82f6',
    pharmacy: '#8b5cf6',
    user: '#22c55e'
};

// \u2500\u2500 Utils \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// ────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────

// Theme Toggle Component
const ThemeToggle: React.FC<{ theme: string; toggle: () => void }> = ({ theme, toggle }) => (
    <button 
        onClick={toggle}
        className="btn-secondary"
        style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            padding: '0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '18px'
        }}
    >
        {theme === 'light' ? '🌙' : '☀️'}
    </button>
);

const Combobox: React.FC<{
    locations: Location[];
    placeholder: string;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}> = ({ locations, placeholder, selectedId, onSelect }) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selected = useMemo(() => locations.find(l => l.id === selectedId), [selectedId, locations]);
    const filtered = useMemo(() =>
        query === '' 
            ? locations.filter(l => !l.id.startsWith('j_') && !l.id.startsWith('r_')).slice(0, 40)
            : locations.filter(l => 
                !l.id.startsWith('j_') && 
                !l.id.startsWith('r_') && 
                l.name.toLowerCase().includes(query.toLowerCase())
              ).slice(0, 40),
        [query, locations]
    );

    useEffect(() => { setQuery(selected ? selected.name : ''); }, [selected]);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                if (!selected && query === '') setQuery('');
            }
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [selected, query]);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <input
                type="text"
                placeholder={placeholder}
                className="combo-input"
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
            />
            {open && filtered.length > 0 && (
                <div className="combo-dropdown">
                    {filtered.map(loc => (
                        <div key={loc.id} className="combo-item"
                            onMouseDown={() => { onSelect(loc.id); setQuery(loc.name); setOpen(false); }}>
                            <span className="combo-dot" style={{ background: TYPE_COLORS[loc.type] || '#60a5fa' }} />
                            {loc.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ────────────────────────────────────────────────
// Main App
// ────────────────────────────────────────────────
const App: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>(locationData.locations as Location[]);
    const [startId, setStartId] = useState<string | null>(null);
    const [endId, setEndId] = useState<string | null>(null);
    const [mode, setMode] = useState<'route' | 'facility'>('route');
    const [facilityType, setFacilityType] = useState('hospital');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('System ready.');
    const [clickStep, setClickStep] = useState<'start' | 'end'>('start');
    const [isLocating, setIsLocating] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [facilityResults, setFacilityResults] = useState<any[]>([]);
    const [selectedFacilityIdx, setSelectedFacilityIdx] = useState(0);

    // Theme logic
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const mapRef = useRef<any>(null);
    const routeLayerRef = useRef<any>(null);
    const markersLayerRef = useRef<any>(null);
    const connectionsLayerRef = useRef<any>(null);
    const scanLayerRef = useRef<any>(null);
    const gpsMarkerRef = useRef<any>(null);
    const tileLayerRef = useRef<any>(null);

    const locationMap = useMemo(() => {
        const m = new Map<string, Location>();
        locations.forEach(l => m.set(l.id, l));
        return m;
    }, [locations]);

    // ── Init Leaflet ────────────────────────────
    useEffect(() => {
        if (mapRef.current) return;

        const map = L.map('map', { zoomControl: false }).setView([30.3271, 78.0315], 14);
        mapRef.current = map;

        tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        routeLayerRef.current = L.layerGroup().addTo(map);
        markersLayerRef.current = L.layerGroup().addTo(map);
        connectionsLayerRef.current = L.layerGroup().addTo(map);
        scanLayerRef.current = L.layerGroup().addTo(map);

        // ── Road Network (Hidden for clean UI) ───────
        // Removed dashed lines to hide intermediate junctions.

        map.on('click', (e: any) => {
            const { lat, lng: lon } = e.latlng;
            // Find nearest node to click
            let best: any = null, bestD = Infinity;
            locations.forEach(l => {
                const d = Math.hypot(l.lat - lat, l.lon - lon);
                if (d < bestD) { bestD = d; best = l; }
            });

            if (best) {
                if (clickStep === 'start') { setStartId(best.id); setClickStep('end'); }
                else { setEndId(best.id); setClickStep('start'); }
            }
        });

        // ── Location Event Handlers ──────────────────
        map.on('locationfound', (e: any) => {
            const { lat, lng } = e.latlng;
            const accuracy = e.accuracy;
            const userNode: Location = { id: 'user_pos', name: 'My Current Location', type: 'user', lat, lon: lng };

            setLocations(prev => {
                const filtered = prev.filter(l => l.id !== 'user_pos');
                return [...filtered, userNode];
            });
            setStartId('user_pos');
            setIsLocating(false);

            // Pulse point
            if (gpsMarkerRef.current) map.removeLayer(gpsMarkerRef.current);
            const gpsDotHtml = `
                <div class="gps-dot-wrapper">
                    <div class="gps-dot-ring"></div>
                    <div class="gps-dot"></div>
                </div>
                <div class="gps-accuracy-ring" style="width:${Math.min(accuracy * 2, 200)}px;height:${Math.min(accuracy * 2, 200)}px;"></div>
            `;
            const icon = L.divIcon({ className: '', html: gpsDotHtml, iconSize: [20, 20], iconAnchor: [10, 10] });
            gpsMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 })
                .bindPopup(`<b>📍 You are here</b><br><small>Accuracy: ±${Math.round(accuracy)}m</small>`)
                .addTo(map);

            map.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
            setStatus(`📡 Location found (±${Math.round(accuracy)}m)`);
        });

        map.on('locationerror', (e: any) => {
            setIsLocating(false);
            if (e.message.includes('denied') || e.code === 1) {
                setStatus('⚠ Permission Denied. Click the lock/camera icon in URL bar to allow location.');
                alert('Geolocation blocked! Please click the lock icon in your browser address bar and set "Location" to "Allow" for localhost.');
            } else {
                setStatus(`⚠ Location error: ${e.message}`);
            }
        });
    }, [locations, locationMap, clickStep]);

    // Handle Map Theme Switching
    useEffect(() => {
        if (!tileLayerRef.current) return;
        const lightUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        tileLayerRef.current.setUrl(theme === 'dark' ? darkUrl : lightUrl);
    }, [theme]);

    // ── Markers ────────────────────────────────
    useEffect(() => {
        if (!markersLayerRef.current) return;
        markersLayerRef.current.clearLayers();
        locations.forEach(loc => {
            const isStart = loc.id === startId;
            const isEnd = loc.id === endId;
            
            // ONLY show markers for the selected start and end points
            // This hides all the intermediate 'invisible' road nodes
            if (isStart || isEnd) {
                const color = isStart ? '#22c55e' : '#ef4444';
                L.circleMarker([loc.lat, loc.lon], {
                    radius: 10,
                    fillColor: color,
                    color: '#fff',
                    weight: 3,
                    fillOpacity: 1,
                    zIndexOffset: 1000
                })
                .bindTooltip(`<b>${isStart ? 'START: ' : 'DEST: '}${loc.name}</b>`, { 
                    permanent: true, 
                    direction: 'top', 
                    className: 'endpoint-label' 
                })
                .addTo(markersLayerRef.current);
            }
        });
    }, [locations, startId, endId]);

    // ── Features ────────────────────────────────
    const useCurrentLocation = () => {
        if (!mapRef.current) return;
        setIsLocating(true);
        setStatus('Requesting browser location permission...');
        
        // Use Leaflet's built-in locate method
        mapRef.current.locate({
            setView: false, // We'll handle fly-to in locationfound
            maxZoom: 17,
            enableHighAccuracy: true,
            timeout: 10000
        });
    };

    const scanNearby = async () => {
        const bounds = mapRef.current.getBounds();
        const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
        setStatus('Scanning area for facilities (OSM)...');
        setLoading(true);

        try {
            const query = `[out:json];node["amenity"~"hospital|fuel|pharmacy|parking"](${bbox});out;`;
            const res = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            const elements = res.data.elements || [];

            elements.forEach((el: any) => {
                const type = el.tags.amenity === 'charging_station' ? 'ev' : el.tags.amenity;
                const newNode: Location = {
                    id: `osm_${el.id}`,
                    name: el.tags.name || el.tags.amenity || 'Nearby Facility',
                    type: type,
                    lat: el.lat,
                    lon: el.lon
                };
                setLocations(prev => {
                    if (prev.find(l => l.id === newNode.id)) return prev;
                    return [...prev, newNode];
                });
            });
            setStatus(`Scan complete: Found ${elements.length} facilities.`);
        } catch (err) {
            setStatus('Scan failed (API error).');
        } finally {
            setLoading(false);
        }
    };

    const getRouteGeometry = async (fullPath: string[]) => {
        if (fullPath.length < 2) return [];
        const pathCoordsIds = [fullPath[0], fullPath[fullPath.length - 1]];
        const coords = pathCoordsIds.map(id => {
            const l = locationMap.get(id) || locations.find(loc => loc.id === id);
            return l ? `${l.lon},${l.lat}` : null;
        }).filter(Boolean).join(';');

        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
            const res = await axios.get(url);
            if (res.data.routes && res.data.routes[0]) {
                return res.data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            }
        } catch (e) {
            console.warn('OSM Geometry fetch failed, falling back to straight lines.');
        }
        return fullPath.map(id => {
            const l = locationMap.get(id) || locations.find(loc => loc.id === id);
            return l ? [l.lat, l.lon] : null;
        }).filter(Boolean);
    };

    // \u2500\u2500 Overpass API: fetch REAL facilities near a point \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const fetchRealFacilities = async (lat: number, lon: number, type: string) => {
        const osmTagMap: Record<string, string> = {
            hospital:  'amenity=hospital',
            fuel:      'amenity=fuel',
            pharmacy:  'amenity=pharmacy',
            ev:        'amenity=charging_station',
            parking:   'amenity=parking',
        };
        const tag = osmTagMap[type] || `amenity=${type}`;
        const radius = 6000; // 6km radius
        const query = `[out:json][timeout:15];(node[${tag}](around:${radius},${lat},${lon});way[${tag}](around:${radius},${lat},${lon}););out center;`;
        const res = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        return (res.data.elements || [])
            .map((el: any) => ({
                id:   `osm_${el.id}`,
                name: el.tags?.name || el.tags?.brand || el.tags?.operator || `Nearby ${type}`,
                lat:  el.lat ?? el.center?.lat,
                lon:  el.lon ?? el.center?.lon,
                type,
            }))
            .filter((f: any) => f.lat && f.lon);
    };

    const handleSearch = async () => {
        if (!startId) { setStatus('⚠ Select a start location.'); return; }
        setLoading(true);
        setResult(null);

        try {
            const isDynamic = (id: string) => id === 'user_pos' || id.startsWith('osm_') || id === 'current_loc';
            const findNearestStatic = (id: string) => {
                if (!isDynamic(id)) return id;
                const loc = locationMap.get(id) || locations.find(l => l.id === id);
                if (!loc) return id;
                let best: any = null, bestD = Infinity;
                (locationData.locations as any[]).forEach(l => {
                    const d = getHaversineDistance(l.lat, l.lon, loc.lat, loc.lon);
                    if (d < bestD) { bestD = d; best = l; }
                });
                return best ? best.id : id;
            };

            const backendStartId = findNearestStatic(startId);

            // ── FACILITY MODE: use live OSM data ──────────────────────────────────
            if (mode === 'facility') {
                const rawStartLoc = locationMap.get(startId!) || locations.find(l => l.id === startId);
                if (!rawStartLoc) { setStatus('⚠ Could not determine start coordinates.'); setLoading(false); return; }

                const snappedStartId = findNearestStatic(startId!);
                const startLoc = locationMap.get(snappedStartId) || rawStartLoc;

                setStatus(`Searching for truly nearest ${facilityType}...`);

                let osmFacilities: any[] = [];
                try {
                    osmFacilities = await fetchRealFacilities(startLoc.lat, startLoc.lon, facilityType);
                } catch {
                    setStatus('⚠ OSM lookup failed, falling back to local data...');
                }

                let destLoc: any = null;

                if (osmFacilities.length > 0) {
                    // Sort by straight-line distance from start, pick nearest
                    osmFacilities.sort((a, b) =>
                        Math.hypot(a.lat - startLoc.lat, a.lon - startLoc.lon) -
                        Math.hypot(b.lat - startLoc.lat, b.lon - startLoc.lon)
                    );
                    destLoc = osmFacilities[0];
                    setStatus(`Found ${osmFacilities.length} real ${facilityType}s via OSM. Routing via Dijkstra...`);
                } else {
                    // Fall back to static graph facility
                    setStatus(`No OSM results. Routing via internal graph...`);
                }

                // Use Dijkstra for backbone route from the snapped static node
                const res = await axios.post('http://localhost:3001/api/find-facility',
                    { startId: snappedStartId, facilityType });

                const inputData = res.data;
                let candidates: any[] = Array.isArray(inputData) ? inputData : [inputData];
                candidates = candidates.filter(c => c && !c.error);

                // Add OSM Facilities to the potential candidates for "True Nearest" comparison
                osmFacilities.forEach(osm => {
                    const distToStart = getHaversineDistance(startLoc.lat, startLoc.lon, osm.lat, osm.lon);
                    candidates.push({
                        ...osm,
                        distance: distToStart * 1.25, // Estimation factor for road vs air distance
                        isOsm: true,
                        path: [startId, osm.id] // Logical path for UI
                    });
                });

                // Sort everything to find the actual best
                candidates.sort((a, b) => a.distance - b.distance);

                if (candidates.length > 0) {
                    const best = candidates[0];
                    setFacilityResults([best]);
                    
                    if (best.isOsm) {
                        // For OSM points, we trigger a direct 2-point routing
                        const distKm = best.distance;
                        const timeMins = Math.round((distKm / 30) * 60);
                        setResult({ ...best, path: [startId, best.id], timeMins, destName: best.name });
                        
                        // Execute routing on map
                        const startCoord = [startLoc.lat, startLoc.lon] as [number, number];
                        const destCoord = [best.lat, best.lon] as [number, number];
                        
                        try {
                            const coordStr = `${startCoord[1]},${startCoord[0]};${destCoord[1]},${destCoord[0]}`;
                            const osrmRes = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`);
                            if (osrmRes.data.routes?.[0]) {
                                const drawCoords = osrmRes.data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
                                if (routeLayerRef.current) {
                                    routeLayerRef.current.clearLayers();
                                    L.polyline.antPath(drawCoords, { color: '#2563eb', weight: 6, opacity: 0.85, delay: 600 }).addTo(routeLayerRef.current);
                                    
                                    const beaconHtml = `
                                        <div style="position:relative;width:28px;height:28px;">
                                            <div style="position:absolute;inset:0;background:rgba(239,68,68,0.25);border-radius:50%;animation:gps-pulse 1.4s infinite;"></div>
                                            <div style="position:absolute;inset:5px;background:#ef4444;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(239,68,68,0.6);"></div>
                                        </div>`;
                                    L.marker(destCoord, {
                                        icon: L.divIcon({ className: '', html: beaconHtml, iconSize: [28, 28], iconAnchor: [14, 14] }),
                                        zIndexOffset: 1000
                                    }).bindPopup(`<b>📍 ${best.name} (OSM)</b><br>${(osrmRes.data.routes[0].distance/1000).toFixed(2)} km · ~${Math.round(osrmRes.data.routes[0].duration/60)} min`).addTo(routeLayerRef.current).openPopup();
                                    
                                    mapRef.current.fitBounds(L.polyline(drawCoords).getBounds(), { padding: [80, 80] });
                                }
                                setResult(prev => ({ ...prev, distance: osrmRes.data.routes[0].distance / 1000, timeMins: Math.round(osrmRes.data.routes[0].duration / 60) }));
                            }
                        } catch { 
                            // Fallback to basic select if OSRM fails
                            selectFacility(best);
                        }
                    } else {
                        // Standard backend result
                        selectFacility(best);
                    }
                    setStatus(`Successfully found truly nearest ${facilityType}: ${best.name} ${best.isOsm ? '(Live OSM)' : '(Local Graph)'}`);
                } else {
                    setFacilityResults([]);
                    setResult(null);
                    setStatus(`No ${facilityType} found within search radius.`);
                }
                setLoading(false);
                return;
            }

            // \u2500\u2500 ROUTE MODE: standard Dijkstra \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
            if (!endId) { setStatus('⚠ Select a destination.'); setLoading(false); return; }
            const backendEndId = findNearestStatic(endId);
            setStatus('Calculating shortest path...');

            const res = await axios.post('http://localhost:3001/api/shortest-path',
                { startId: backendStartId, endId: backendEndId });
            if (res.data.error) { setStatus(res.data.error); setLoading(false); return; }

            const finalPath = [...res.data.path];
            if (startId !== backendStartId) finalPath.unshift(startId);
            if (endId !== backendEndId) finalPath.push(endId);

            const distKm = res.data.distance || 0;
            const timeMins = Math.round((distKm / 30) * 60);
            // FORCE 2-POINT UI PATH
            const uiPathRoute = [startId, endId];
            setResult({ ...res.data, path: uiPathRoute, timeMins, rawGraphPath: res.data.path });
            setStatus('Dijkstra done. Fetching road geometry...');

            const pathCoords2 = finalPath.map((id: string) => {
                const l = locationMap.get(id) || locations.find(loc => loc.id === id);
                return l ? [l.lat, l.lon] : null;
            }).filter(Boolean) as [number, number][];

            const geometry = pathCoords2.length >= 2 ? await getRouteGeometry(finalPath) : [];
            let drawCoords2 = (geometry.length >= 2 ? geometry : pathCoords2) as [number, number][];
            
            let finalDistKm2 = distKm;
            let finalTimeMins2 = timeMins;

            try {
                // Only send Start and End to OSRM to get a clean road path between endpoints
                const coordStr = `${pathCoords2[0][1]},${pathCoords2[0][0]};${pathCoords2[pathCoords2.length - 1][1]},${pathCoords2[pathCoords2.length - 1][0]}`;
                const osrmRes = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`);
                if (osrmRes.data.routes?.[0]) {
                    drawCoords2 = osrmRes.data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
                    finalDistKm2 = osrmRes.data.routes[0].distance / 1000;
                    finalTimeMins2 = Math.round(osrmRes.data.routes[0].duration / 60);
                }
            } catch { /* use fallback */ }

            if (routeLayerRef.current && drawCoords2.length >= 2) {
                routeLayerRef.current.clearLayers();
                L.polyline.antPath(drawCoords2, { color: '#2563eb', weight: 6, opacity: 0.85, delay: 600 })
                    .addTo(routeLayerRef.current);
                mapRef.current.fitBounds(L.polyline(drawCoords2).getBounds(), { padding: [80, 80] });
            }
            setResult(prev => ({ ...prev, distance: finalDistKm2, timeMins: finalTimeMins2 }));
            setStatus(`Route found — ${finalDistKm2.toFixed(1)} km (road distance).`);
        } catch (err) {
            setStatus('Connection error – check backend.');
        } finally {
            setLoading(false);
        }
    };




    const clearAll = () => {
        setStartId(null); setEndId(null); setResult(null); setFacilityResults([]); setClickStep('start');
        routeLayerRef.current?.clearLayers();
        setStatus('Map cleared.');
    };

    const selectFacility = async (fac: any) => {
        const startLoc = locationMap.get(startId!) || locations.find(l => l.id === startId);
        const graphPath = fac.path;
        const destLoc = locationMap.get(graphPath[graphPath.length - 1]);
        if (!startLoc || !destLoc) return;

        const distKm = fac.distance;
        const timeMins = Math.round((distKm / 30) * 60);
        
        // FORCE 2-POINT UI PATH
        setResult({ ...fac, path: [startId, graphPath[graphPath.length - 1]], timeMins, destName: fac.name });
        
        let pathCoords: [number, number][] = [[startLoc.lat, startLoc.lon], [destLoc.lat, destLoc.lon]];
        let drawCoords = pathCoords;
        let finalDistKm = distKm;
        let finalTimeMins = timeMins;

        try {
            const coordStr = `${pathCoords[0][1]},${pathCoords[0][0]};${pathCoords[1][1]},${pathCoords[1][0]}`;
            const osrmRes = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`);
            if (osrmRes.data.routes?.[0]) {
                drawCoords = osrmRes.data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
                finalDistKm = osrmRes.data.routes[0].distance / 1000;
                finalTimeMins = Math.round(osrmRes.data.routes[0].duration / 60);
            }
        } catch { }

        if (routeLayerRef.current && drawCoords.length >= 2) {
            routeLayerRef.current.clearLayers();
            L.polyline.antPath(drawCoords, { color: '#2563eb', weight: 6, opacity: 0.85, delay: 600 }).addTo(routeLayerRef.current);
            
            const beaconHtml = `
                <div style="position:relative;width:28px;height:28px;">
                    <div style="position:absolute;inset:0;background:rgba(239,68,68,0.25);border-radius:50%;animation:gps-pulse 1.4s infinite;"></div>
                    <div style="position:absolute;inset:5px;background:#ef4444;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(239,68,68,0.6);"></div>
                </div>`;
            L.marker([destLoc.lat, destLoc.lon], {
                icon: L.divIcon({ className: '', html: beaconHtml, iconSize: [28, 28], iconAnchor: [14, 14] }),
                zIndexOffset: 1000
            }).bindPopup(`<b>📍 ${fac.name}</b><br>${finalDistKm.toFixed(2)} km · ~${finalTimeMins} min`).addTo(routeLayerRef.current).openPopup();

            mapRef.current.fitBounds(L.polyline(drawCoords).getBounds(), { padding: [80, 80] });
        }
    };

    // ── Prepend 'Current Location' option ──
    const displayLocations = useMemo(() => {
        const base = locations.filter(l => l.id !== 'current_loc');
        return [{ id: 'current_loc', name: '📍 My Current Location', type: 'user', lat: 0, lon: 0 }, ...base];
    }, [locations]);

    return (
        <div id="app-container">
            <div className="main-layout">
                <div id="control-panel">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Pathfinder</h1>
                        <ThemeToggle theme={theme} toggle={toggleTheme} />
                    </div>
                    <div className="segmented-control">
                        <button className={mode === 'route' ? 'mode-btn active' : 'mode-btn'} onClick={() => setMode('route')}>Custom Route</button>
                        <button className={mode === 'facility' ? 'mode-btn active' : 'mode-btn'} onClick={() => setMode('facility')}>Nearest Facility</button>
                    </div>

                    <div className="field-group">
                        <label className="field-label">
                            START LOCATION
                            <span
                                className={`loc-link${isLocating ? ' searching' : ''}`}
                                onClick={useCurrentLocation}
                                title="Use current GPS location"
                            >
                                {isLocating ? '⏳ Locating...' : '📍 Use Current Location'}
                            </span>
                        </label>
                        <Combobox 
                            locations={displayLocations} 
                            placeholder="Select or click map..." 
                            selectedId={startId} 
                            onSelect={(id) => id === 'current_loc' ? useCurrentLocation() : setStartId(id)} 
                        />
                    </div>

                    {mode === 'route' ? (
                        <div className="field-group">
                            <label className="field-label">DESTINATION</label>
                            <Combobox 
                                locations={displayLocations} 
                                placeholder="Select destination..." 
                                selectedId={endId} 
                                onSelect={(id) => id === 'current_loc' ? useCurrentLocation().then(() => setEndId('user_pos')) : setEndId(id)} 
                            />
                        </div>
                    ) : (
                        <div className="field-group">
                            <label className="field-label">FACILITY TYPE</label>
                            <select className="combo-input" value={facilityType} onChange={e => setFacilityType(e.target.value)}>
                                <option value="hospital">🏥 Hospital</option>
                                <option value="fuel">⛽ Fuel Station</option>
                                <option value="pharmacy">💊 Pharmacy</option>
                                <option value="ev">⚡ EV Charging</option>
                                <option value="parking">🅿️ Parking</option>
                            </select>
                        </div>
                    )}


                    <button className="btn-primary" onClick={handleSearch} disabled={loading}>
                        {loading ? 'Processing...' : (mode === 'route' ? 'Find Route (C Backend)' : `Find Nearest ${facilityType.charAt(0).toUpperCase() + facilityType.slice(1)}`)}
                    </button>

                    <div className="btn-row">
                        <button className="btn-secondary" onClick={clearAll}>Clear</button>
                        <button className="btn-secondary" onClick={scanNearby}>Scan Nearby</button>
                    </div>

                    <div className="hint-bar">
                        Next click sets: <strong>{clickStep === 'start' ? '🟢 Start' : '🔴 Destination'}</strong>
                    </div>

                    {mode === 'facility' && facilityResults.length > 0 && (
                        <div className="result-card" style={{ borderLeft: '4px solid var(--primary)', background: 'var(--primary-light)' }}>
                            <div className="result-label" style={{ color: 'var(--primary)', marginBottom: '8px' }}>🏆 NEAREST {facilityType.toUpperCase()} FOUND</div>
                            <div style={{ padding: '4px 0' }}>
                                <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-main)', marginBottom: '4px' }}>{facilityResults[0].name}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    Estimated road path: <strong>{facilityResults[0].distance.toFixed(2)} km</strong>
                                </div>
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                <button className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '14px' }} onClick={() => selectFacility(facilityResults[0])}>
                                    Recalculate Path
                                </button>
                                <button className="btn-secondary" style={{ padding: '10px' }} onClick={() => setFacilityResults([])}>
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'facility' && facilityResults.length === 0 && !loading && status.includes('No') && (
                        <div className="hint-bar" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' }}>
                            {status}
                        </div>
                    )}

                    {result && result.path && (
                        <div className="result-card">
                            <div className="result-label">DIJKSTRA {mode === 'route' ? 'ROUTE' : `NEAREST ${facilityType.toUpperCase()}`}</div>
                            <div className="result-val">
                                {result.distance?.toFixed(2)} <span className="result-unit">km</span>
                                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>~{result.timeMins} min</span>
                            </div>
                            <div className="path-list">
                                {mode === 'facility' ? (
                                    // Facility mode: show only Start → Destination
                                    <>
                                        <div className="path-item">
                                            <div className="path-idx" style={{ background: '#22c55e', color: 'white' }}>A</div>
                                            {(() => { const l = locationMap.get(result.path[0]) || locations.find((loc: any) => loc.id === result.path[0]); return l?.name || result.path[0]; })()}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 6, color: '#94a3b8', fontSize: 12 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0' }} />
                                            via {result.path.length - 2} junction{result.path.length - 2 !== 1 ? 's' : ''}
                                        </div>
                                        <div className="path-item" style={{ color: '#ef4444', fontWeight: 700 }}>
                                            <div className="path-idx" style={{ background: '#ef4444', color: 'white' }}>B</div>
                                            {(() => { const l = locationMap.get(result.path[result.path.length - 1]) || locations.find((loc: any) => loc.id === result.path[result.path.length - 1]); return l?.name || result.path[result.path.length - 1]; })()} 📍
                                        </div>
                                    </>
                                ) : (
                                    // Route mode: Collapse to only show Start and End
                                    <>
                                        <div className="path-item">
                                            <div className="path-idx" style={{ background: '#22c55e', color: 'white' }}>A</div>
                                            {(() => { const l = locationMap.get(result.path[0]) || locations.find((loc: any) => loc.id === result.path[0]); return l?.name || result.path[0]; })()}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 6, color: '#94a3b8', fontSize: 12 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0' }} />
                                            via local road network junctions
                                        </div>
                                        <div className="path-item" style={{ color: '#2563eb', fontWeight: 700 }}>
                                            <div className="path-idx" style={{ background: '#2563eb', color: 'white' }}>B</div>
                                            {(() => { const l = locationMap.get(result.path[result.path.length - 1]) || locations.find((loc: any) => loc.id === result.path[result.path.length - 1]); return l?.name || result.path[result.path.length - 1]; })()}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    
                    <div style={{ marginTop: 'auto', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                        {status}
                    </div>
                </div>

                <div id="map" />
            </div>
        </div>
    );
};

export default App;


