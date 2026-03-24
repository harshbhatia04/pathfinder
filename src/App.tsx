import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { locationData, typeColor } from './constants';

// leaflet type declaration
declare const L: any;

interface Location {
    id: string;
    name: string;
    type: string;
    lat: number;
    lon: number;
}

// dropdown component for location selection
const Combobox: React.FC<{
    locations: Location[];
    placeholder: string;
    selectedLocationId: string | null;
    onSelect: (id: string | null) => void;
}> = ({ locations, placeholder, selectedLocationId, onSelect }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() =>
        query === '' ? locations : locations.filter(s => s.name.toLowerCase().includes(query.toLowerCase())),
        [query, locations]
    );

    const selected = useMemo(() => locations.find(s => s.id === selectedLocationId), [selectedLocationId, locations]);

    useEffect(() => {
        setQuery(selected ? selected.name : '');
    }, [selected]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                if (!selected) setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selected]);

    return (
        <div ref={wrapperRef} className="combobox-wrapper w-full">
            <input
                type="text"
                placeholder={placeholder}
                className="combobox-input w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none"
                value={query}
                onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
            />
            {isOpen && (
                <div className="combobox-options">
                    {filtered.map(loc => (
                        <div key={loc.id} className="combobox-option" onMouseDown={() => { onSelect(loc.id); setQuery(loc.name); setIsOpen(false); }}>
                            {loc.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SmartFacilityFinder = () => {
    const [startId, setStartId] = useState<string | null>(null);
    const [endId, setEndId] = useState<string | null>(null);
    const [facilityType, setFacilityType] = useState<string>('any');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const mapRef = useRef<any>(null);
    const routeLayerRef = useRef<any>(null);
    const locationMap = useMemo(() => {
        const m = new Map<string, Location>();
        locationData.locations.forEach((l: any) => m.set(l.id, l as Location));
        return m;
    }, []);

    useEffect(() => {
        if (mapRef.current) return;
        const map = L.map('map').setView([30.3262, 78.0428], 14);
        mapRef.current = map;
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

        routeLayerRef.current = L.layerGroup().addTo(map);

        locationData.locations.forEach((loc: any) => {
            const color = (typeColor as any)[loc.type] || '#3b82f6';
            L.circleMarker([loc.lat, loc.lon], {
                radius: 7,
                fillColor: color,
                color: '#fff',
                weight: 2,
                fillOpacity: 0.8
            }).bindTooltip(loc.name).addTo(map).on('click', () => {
                setStartId(prev => !prev ? loc.id : prev);
            });
        });

        // show road network
        locationData.connections.forEach(([id1, id2]: any) => {
            const l1 = locationMap.get(id1);
            const l2 = locationMap.get(id2);
            if (l1 && l2) {
                L.polyline([[l1.lat, l1.lon], [l2.lat, l2.lon]], { color: '#94a3b8', weight: 2, opacity: 0.2, dashArray: '5, 5' }).addTo(map);
            }
        });
    }, []);

    const handleSearch = async () => {
        if (!startId) return alert("Please select a starting point");
        setLoading(true);
        try {
            const payload = facilityType === 'any' ? { startId, endId } : { startId, facilityType };
            const endpoint = facilityType === 'any' ? '/api/shortest-path' : '/api/find-facility';
            const res = await axios.post(`http://localhost:3001${endpoint}`, payload);
            
            if (res.data.error) {
                alert(res.data.error);
                setLoading(false);
                return;
            }

            setResult(res.data);
            
            // Draw path on map
            if (routeLayerRef.current && res.data.path) {
                routeLayerRef.current.clearLayers();
                const points = res.data.path.map((id: string) => {
                    const l = locationMap.get(id);
                    return l ? [l.lat, l.lon] : null;
                }).filter((p: any) => p !== null);

                if (points.length >= 2) {
                    L.polyline.antPath(points, { color: '#2563eb', weight: 5 }).addTo(routeLayerRef.current);
                    mapRef.current.fitBounds(L.polyline(points).getBounds(), { padding: [50, 50] });
                }
            }
        } catch (err) {
            alert("Connection error. Make sure the backend server is running!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="app-container">
            <div id="control-panel">
                <h1 className="text-2xl font-bold text-blue-800">Pathfinder</h1>
                <p className="text-xs text-gray-500 mb-6 border-b pb-2">Dehradun City - DAA Project</p>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Start Location</label>
                        <Combobox locations={locationData.locations} placeholder="Select start..." selectedLocationId={startId} onSelect={setStartId} />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Find Nearest:</label>
                        <select className="w-full border p-2 rounded-lg text-sm bg-gray-50" value={facilityType} onChange={e => setFacilityType(e.target.value)}>
                            <option value="any">To a specific destination...</option>
                            <option value="hospital">Hospital</option>
                            <option value="fuel">Fuel Station</option>
                            <option value="ev">EV Charger</option>
                            <option value="pharmacy">Pharmacy</option>
                        </select>
                    </div>

                    {facilityType === 'any' && (
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Destination</label>
                            <Combobox locations={locationData.locations} placeholder="Select end..." selectedLocationId={endId} onSelect={setEndId} />
                        </div>
                    )}

                    <button onClick={handleSearch} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        {loading ? "Calculating..." : "Find Route (C Backend)"}
                    </button>

                    <button onClick={() => window.location.reload()} className="w-full text-xs text-gray-400 hover:text-gray-600">Clear All</button>
                </div>

                {result && result.path && (
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="text-xs font-bold text-blue-800 uppercase">Result Found</div>
                        <div className="text-xl font-bold text-blue-600">{result.distance?.toFixed(2)} km away</div>
                        <div className="mt-4 space-y-1">
                            {result.path.map((id: string, i: number) => (
                                <div key={i} className="text-sm text-gray-600 flex items-center">
                                    <span className="w-4 h-4 text-[10px] bg-blue-200 text-blue-800 rounded-full flex items-center justify-center mr-2">{i+1}</span>
                                    {locationMap.get(id)?.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div id="map"></div>
        </div>
    );
};

export default SmartFacilityFinder;
