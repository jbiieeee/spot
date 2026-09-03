import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import GuardAvatar from '../components/GuardAvatar';
import { useSpot } from '../context/SpotContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  Building2, Users, MapPin, AlertTriangle, X, Plus, Pencil, Trash2, Check,
  Navigation, Loader2, Globe, ShieldCheck, RefreshCw, QrCode, Printer,
  Eye, Download, Copy, CheckCircle2, Search, Sparkles, Radio, Layers
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom dark-themed blue marker for SPOT
const spotIcon = new L.DivIcon({
  className: '',
  html: `
    <div style="
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #2563EB, #1d4ed8);
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 15px rgba(37,99,235,0.6);
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="
        width: 10px; height: 10px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
        box-shadow: 0 0 8px rgba(255,255,255,0.8);
      "></div>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -42],
});

// All-sites overview marker
const multiSiteIcon = new L.DivIcon({
  className: '',
  html: `
    <div style="
      width: 22px; height: 22px;
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
      border: 2px solid rgba(255,255,255,0.6);
      border-radius: 50%;
      box-shadow: 0 2px 10px rgba(37,99,235,0.8);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

// Map recenter helper
function MapRecenter({ lat, lng, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], zoom, { animate: true });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

// Geocoding via OpenStreetMap Nominatim
async function geocodeAddress(address) {
  if (!address || address.length < 5) return null;
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&countrycodes=ph`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'SPOT-Command-Center/1.0' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
    }
    const res2 = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'SPOT-Command-Center/1.0' } }
    );
    const data2 = await res2.json();
    if (data2 && data2.length > 0) {
      return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon), displayName: data2[0].display_name };
    }
  } catch (e) {
    console.warn('Geocoding error:', e);
  }
  return null;
}

// Single Site Map
function SiteMapView({ site }) {
  const lat = site.lat || 14.5547;
  const lng = site.lng || 121.0244;
  const hasCoords = site.lat && site.lng;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl" style={{ height: 260 }}>
      <MapContainer
        center={[lat, lng]}
        zoom={hasCoords ? 16 : 12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        attributionControl={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        {hasCoords && (
          <Marker position={[lat, lng]} icon={spotIcon}>
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
                <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: 13, marginBottom: 4 }}>{site.name}</div>
                <div style={{ color: '#60A5FA', fontSize: 11, marginBottom: 2 }}>{site.type}</div>
                <div style={{ color: '#94A3B8', fontSize: 11 }}>{site.address}</div>
              </div>
            </Popup>
          </Marker>
        )}
        <MapRecenter lat={lat} lng={lng} zoom={hasCoords ? 16 : 12} />
      </MapContainer>
    </div>
  );
}

// All Sites Overview Map
function AllSitesMap({ sites, onSiteClick }) {
  const sitesWithCoords = sites.filter((s) => s.lat && s.lng);
  const center = sitesWithCoords.length > 0
    ? [sitesWithCoords[0].lat, sitesWithCoords[0].lng]
    : [14.5547, 121.0244];

  return (
    <div className="card-spot p-0 overflow-hidden" style={{ height: 380 }}>
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Live Facility Geo-Grid</span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-400">{sitesWithCoords.length} of {sites.length} Facilities Pinned</span>
      </div>
      <MapContainer
        center={center}
        zoom={sitesWithCoords.length === 1 ? 15 : 11}
        style={{ height: 'calc(100% - 48px)', width: '100%' }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        {sitesWithCoords.map((site) => (
          <Marker
            key={site.id}
            position={[site.lat, site.lng]}
            icon={multiSiteIcon}
            eventHandlers={{ click: () => onSiteClick(site) }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160, cursor: 'pointer' }} onClick={() => onSiteClick(site)}>
                <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: 12 }}>{site.name}</div>
                <div style={{ color: '#60A5FA', fontSize: 10, marginBottom: 4 }}>{site.type} • {site.client}</div>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>{site.address}</div>
                <div className="mt-2 text-xs font-bold text-blue-400">Click to inspect checkpoints →</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// Click-to-place pin handler
function MapClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e) => onMapClick(e.latlng.lat, e.latlng.lng);
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [map, onMapClick]);
  return null;
}

// Address preview map
function AddressPreviewMap({ address, coords, onCoordsFound }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const debounceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!address || address.length < 8 || manualMode) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      const result = await geocodeAddress(address);
      setLoading(false);
      if (result) {
        onCoordsFound(result);
      } else {
        setError('Address not found. Click map to place pin.');
      }
    }, 1200);
    return () => clearTimeout(debounceRef.current);
  }, [address, manualMode]);

  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker) {
      const { lat, lng } = marker.getLatLng();
      setManualMode(true);
      onCoordsFound({ lat, lng, displayName: address });
    }
  }, [address, onCoordsFound]);

  const handleMapClick = useCallback((lat, lng) => {
    setManualMode(true);
    onCoordsFound({ lat, lng, displayName: address });
  }, [address, onCoordsFound]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Live Map Coordinates</label>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-1 text-[10px] text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Geocoding...
            </span>
          )}
          {coords && !loading && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <Check className="h-3 w-3" /> Pin Ready ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-blue-500/30 shadow-lg" style={{ height: 220 }}>
        <MapContainer
          center={coords ? [coords.lat, coords.lng] : [14.5547, 121.0244]}
          zoom={coords ? 16 : 11}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {coords && (
            <>
              <Marker
                position={[coords.lat, coords.lng]}
                icon={spotIcon}
                draggable={true}
                ref={markerRef}
                eventHandlers={{ dragend: handleDragEnd }}
              />
              <MapRecenter lat={coords.lat} lng={coords.lng} zoom={16} />
            </>
          )}
        </MapContainer>
      </div>
      <p className="text-[10px] text-slate-400">Click or drag pin to adjust the physical geolocation of this deployment site.</p>
    </div>
  );
}

const SITE_TYPES = ['Commercial Facility', 'Corporate Office', 'Industrial Complex', 'Residential Estate', 'Government Facility', 'Healthcare Center', 'Warehouse & Logistics', 'Port / Terminal'];
const SITE_STATUSES = ['Active', 'Under Maintenance', 'Inactive'];

const EMPTY_SITE = {
  name: '', type: 'Commercial Facility', client: '', address: '', status: 'Active',
  initialCheckpointsCount: 5, image: '', lat: null, lng: null
};

// ─────────────────────────────────────────────────────────────
// MAIN DEPLOYMENT SITES PAGE
// ─────────────────────────────────────────────────────────────
export default function Sites() {
  const {
    sites,
    guards,
    checkpoints,
    checkpointLogs,
    addSite,
    updateSite,
    deleteSite,
    addCheckpoint,
    deleteCheckpoint,
    batchGenerateSiteCheckpoints,
    addToast
  } = useSpot();

  const [selectedSite, setSelectedSite] = useState(null);
  const [activeSiteTab, setActiveSiteTab] = useState('checkpoints'); // 'overview' | 'checkpoints' | 'logs'
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addForm, setAddForm] = useState(EMPTY_SITE);
  const [editForm, setEditForm] = useState(EMPTY_SITE);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [searchFilter, setSearchFilter] = useState('');

  // Modals for QR inspection & Batch Printing
  const [qrModalItem, setQrModalItem] = useState(null);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [newCheckpointForm, setNewCheckpointForm] = useState({ name: '', zone: 'Zone A', description: '' });
  const [showAddCheckpointModal, setShowAddCheckpointModal] = useState(false);

  // Filtered sites
  const filteredSites = sites.filter((s) =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.client.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.type.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Handle Add Site
  const handleAddSite = async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    const count = parseInt(addForm.initialCheckpointsCount) || 5;
    const createdSite = {
      name: addForm.name,
      type: addForm.type,
      client: addForm.client,
      address: addForm.address,
      status: addForm.status,
      checkpointsCount: count,
      image: addForm.image,
      lat: addForm.lat,
      lng: addForm.lng,
    };
    await addSite(createdSite);

    // Auto-generate matching initial QR checkpoints for this site
    // Find newly added site or synthesize object to batch generate
    setTimeout(async () => {
      const targetSite = sites.find((s) => s.name === addForm.name) || {
        id: `SITE-${Date.now().toString().slice(-4)}`,
        name: addForm.name,
        lat: addForm.lat,
        lng: addForm.lng
      };
      await batchGenerateSiteCheckpoints(targetSite, count);
    }, 400);

    setSaving(false);
    setAddForm(EMPTY_SITE);
    setShowAdd(false);
  };

  // Handle Edit Site
  const openEdit = (site, e) => {
    if (e) e.stopPropagation();
    setEditForm({
      name: site.name || '',
      type: site.type || 'Commercial Facility',
      client: site.client || '',
      address: site.address || '',
      status: site.status || 'Active',
      image: site.image || '',
      lat: site.lat || null,
      lng: site.lng || null
    });
    setEditTarget(site);
  };

  const handleEditSite = async () => {
    if (!editForm.name.trim()) return;
    setSaving(true);
    await updateSite(editTarget.id, editForm);
    setSaving(false);
    setEditTarget(null);
  };

  // Handle Add Checkpoint to Site
  const handleAddCheckpointToSite = async () => {
    if (!newCheckpointForm.name.trim() || !selectedSite) return;
    await addCheckpoint({
      name: newCheckpointForm.name,
      siteId: selectedSite.id,
      siteName: selectedSite.name,
      zone: newCheckpointForm.zone,
      description: newCheckpointForm.description,
      lat: selectedSite.lat,
      lng: selectedSite.lng
    });
    setNewCheckpointForm({ name: '', zone: 'Zone A', description: '' });
    setShowAddCheckpointModal(false);
  };

  // Checkpoints for currently selected site
  const siteCheckpoints = selectedSite
    ? checkpoints.filter((c) => c.siteId === selectedSite.id || c.siteName === selectedSite.name)
    : [];

  // Assigned guards for selected site
  const assignedGuards = selectedSite
    ? guards.filter((g) => g.siteId === selectedSite.id || g.siteName === selectedSite.name)
    : [];

  // Checkpoint scan logs for selected site
  const siteLogs = selectedSite
    ? checkpointLogs.filter((l) => l.siteId === selectedSite.id || siteCheckpoints.some((c) => c.id === l.checkpointId))
    : [];

  // QR Payload generator matching mobile app scanner
  const getQRPayload = (cp) => {
    return JSON.stringify({
      id: cp.id,
      siteId: cp.siteId || selectedSite?.id || '',
      name: cp.name,
      qrCode: cp.qrCode
    });
  };

  return (
    <Layout
      title="Deployment Sites & QR Checkpoint Patrol Management"
      subtitle="Configure physical patrol sites, auto-generate scannable QR posts & verify patrol telemetry"
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 card-spot p-4">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search deployment sites, clients, or facility types..."
                className="input-spot pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Grid Layout
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Geo Map
              </button>
            </div>

            <button
              onClick={() => setShowAdd(true)}
              className="btn-primary text-xs flex items-center gap-2 py-2.5 px-4"
            >
              <Plus className="h-4 w-4" /> Register New Site
            </button>
          </div>
        </div>

        {/* Geo-Map Overview if selected */}
        {viewMode === 'map' && (
          <AllSitesMap sites={filteredSites} onSiteClick={(site) => setSelectedSite(site)} />
        )}

        {/* Sites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => {
            const siteCps = checkpoints.filter((c) => c.siteId === site.id || c.siteName === site.name);
            const cpCount = siteCps.length || site.checkpointsCount || 0;
            const siteGuardsCount = guards.filter((g) => g.siteId === site.id || g.siteName === site.name).length;

            return (
              <div
                key={site.id}
                onClick={() => { setSelectedSite(site); setActiveSiteTab('checkpoints'); }}
                className="card-spot p-0 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/60 flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-blue-950/40"
              >
                <div>
                  {/* Site Header Image & Quick Badges */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                    <img
                      src={site.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=80'}
                      alt={site.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131D31] via-[#131D31]/40 to-transparent" />
                    
                    {/* Facility Type Badge */}
                    <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-400 border border-slate-700/80 backdrop-blur-md">
                      {site.type}
                    </span>

                    {/* QR Badges Header */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-xl bg-blue-600/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-lg">
                        <QrCode className="h-3.5 w-3.5" /> {cpCount} QR Checkpoints
                      </span>
                      {site.lat && site.lng && (
                        <span className="flex items-center gap-1 rounded-xl bg-emerald-600/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                          <MapPin className="h-3 w-3" /> Pinned
                        </span>
                      )}
                    </div>

                    {/* Hover Action Buttons */}
                    <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => openEdit(site, e)}
                        title="Edit Facility Details"
                        className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg transition"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(site); }}
                        title="Delete Site"
                        className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Site Content Body */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white leading-snug group-hover:text-blue-400 transition-colors">
                        {site.name}
                      </h3>
                      <span className={`shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        site.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {site.status}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" /> {site.address || 'Address unassigned'}
                    </p>
                    <div className="mt-1 text-xs text-slate-400 font-medium">Client: <span className="text-slate-200 font-semibold">{site.client || 'General Client'}</span></div>

                    {/* Operational Telemetry Metrics */}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-[10px] font-semibold text-slate-400">Guards</div>
                        <div className="text-sm font-bold text-white mt-0.5">{siteGuardsCount}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20">
                        <div className="text-[10px] font-semibold text-cyan-400">QR Posts</div>
                        <div className="text-sm font-extrabold text-cyan-300 mt-0.5">{cpCount}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-[10px] font-semibold text-slate-400">Status</div>
                        <div className="text-xs font-bold text-emerald-400 mt-1">Ready</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 py-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 font-bold group-hover:text-blue-300 transition">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5" /> Manage QR Checkpoints & Placards
                  </span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSites.length === 0 && (
          <div className="card-spot py-20 flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <div className="text-sm font-bold text-white">No deployment sites matched your search</div>
            <p className="text-xs text-slate-400 max-w-sm">Create a new deployment facility or adjust your search filter.</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-xs">
              <Plus className="h-4 w-4 mr-1" /> Add Deployment Site
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SITE DETAIL & QR INSPECTION DRAWER / MODAL
          ───────────────────────────────────────────────────────────── */}
      {selectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-[#131D31] shadow-2xl flex flex-col max-h-[90vh]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedSite.name}</h3>
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                      {selectedSite.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedSite.address} • Client: {selectedSite.client}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(selectedSite)}
                  className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Edit Site Details"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedSite(null)}
                  className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs inside Site Modal */}
            <div className="flex items-center gap-2 border-b border-slate-800 px-6 pt-3 bg-slate-900/30">
              <button
                onClick={() => setActiveSiteTab('checkpoints')}
                className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                  activeSiteTab === 'checkpoints'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="h-4 w-4" /> QR Checkpoint Posts ({siteCheckpoints.length})
              </button>
              <button
                onClick={() => setActiveSiteTab('overview')}
                className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                  activeSiteTab === 'overview'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="h-4 w-4" /> Map & Guards ({assignedGuards.length})
              </button>
              <button
                onClick={() => setActiveSiteTab('logs')}
                className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                  activeSiteTab === 'logs'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="h-4 w-4" /> Live Mobile Scan Logs ({siteLogs.length})
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* ── TAB 1: QR CHECKPOINTS & SCAN POSTS (CORE REQUIREMENT) ── */}
              {activeSiteTab === 'checkpoints' && (
                <div className="space-y-4">
                  {/* Top Checkpoint Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900/80 border border-blue-500/30">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-cyan-400" />
                        Physical Checkpoints & QR Guard Scanners
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Each checkpoint represents a physical post where guards scan the generated QR code using the mobile app to verify their patrol presence.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setShowBatchPrintModal(true)}
                        disabled={siteCheckpoints.length === 0}
                        className="btn-secondary text-xs flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2"
                        title="Print all QR codes for wall mounting"
                      >
                        <Printer className="h-3.5 w-3.5 text-blue-400" /> Batch Print QRs
                      </button>

                      <button
                        onClick={() => setShowAddCheckpointModal(true)}
                        className="btn-primary text-xs flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Checkpoint
                      </button>
                    </div>
                  </div>

                  {/* Empty state & Auto-Generate 5 Checkpoints Trigger */}
                  {siteCheckpoints.length === 0 && (
                    <div className="p-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 text-center space-y-3">
                      <QrCode className="h-10 w-10 text-cyan-400 mx-auto opacity-70" />
                      <div>
                        <h4 className="text-sm font-bold text-white">No QR Checkpoints Created Yet</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          Generate scannable QR posts (e.g. 5 checkpoints) for {selectedSite.name} so guards can log their patrol visits on the Android app.
                        </p>
                      </div>
                      <button
                        onClick={() => batchGenerateSiteCheckpoints(selectedSite, 5)}
                        className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2 shadow-lg shadow-blue-600/30"
                      >
                        <Sparkles className="h-4 w-4" /> Auto-Generate 5 QR Checkpoints
                      </button>
                    </div>
                  )}

                  {/* Checkpoint Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {siteCheckpoints.map((cp, idx) => (
                      <div
                        key={cp.id}
                        className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-blue-500/40 transition flex items-start gap-4"
                      >
                        {/* QR Code SVG Thumbnail */}
                        <div
                          onClick={() => setQrModalItem(cp)}
                          className="shrink-0 p-2.5 rounded-xl bg-white cursor-pointer hover:opacity-90 shadow-md transition"
                          title="Click to expand QR Code"
                        >
                          <QRCodeSVG value={getQRPayload(cp)} size={68} />
                        </div>

                        {/* Checkpoint Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white truncate">{cp.name}</span>
                            <span className="shrink-0 font-mono text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                              #{idx + 1}
                            </span>
                          </div>

                          <div className="mt-1 font-mono text-[11px] text-blue-400 select-all">
                            {cp.qrCode}
                          </div>

                          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-2">
                            <span>Zone: <strong className="text-slate-300">{cp.zone || 'Zone A'}</strong></span>
                            {cp.lat && cp.lng && (
                              <span className="text-emerald-400">• GPS Verified</span>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() => setQrModalItem(cp)}
                              className="btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" /> View & Print
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText?.(getQRPayload(cp));
                                addToast('QR Payload Copied', 'Mobile scanner JSON copied to clipboard.', 'info');
                              }}
                              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white text-xs"
                              title="Copy scanner JSON payload"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete checkpoint "${cp.name}"?`)) {
                                  deleteCheckpoint(cp.id, selectedSite.id);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-rose-900/50 bg-rose-950/40 text-rose-400 hover:text-white text-xs ml-auto"
                              title="Delete Checkpoint"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 2: OVERVIEW & MAP ── */}
              {activeSiteTab === 'overview' && (
                <div className="space-y-5">
                  <SiteMapView site={selectedSite} />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Guards', value: assignedGuards.length, color: 'text-white' },
                      { label: 'QR Checkpoints', value: siteCheckpoints.length, color: 'text-cyan-400' },
                      { label: 'Patrol Scans', value: siteLogs.length, color: 'text-emerald-400' },
                      { label: 'Security State', value: selectedSite.status, color: 'text-blue-400' }
                    ].map((stat, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                        <div className="text-[10px] font-semibold text-slate-400">{stat.label}</div>
                        <div className={`text-lg font-bold mt-0.5 ${stat.color}`}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Assigned Guards List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" /> Guards Allocated to Facility ({assignedGuards.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {assignedGuards.map((g) => (
                        <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40 text-xs">
                          <GuardAvatar photo={g.photo} name={g.name} size="h-9 w-9" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white truncate">{g.name}</div>
                            <div className="text-slate-400">{g.shift}</div>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0 ${
                            g.status === 'On Patrol' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>{g.status}</span>
                        </div>
                      ))}
                      {assignedGuards.length === 0 && (
                        <div className="col-span-2 text-xs text-slate-500 text-center py-4 bg-slate-900/30 rounded-xl border border-slate-800">
                          No guards currently allocated to this site.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: LIVE MOBILE SCAN LOGS ── */}
              {activeSiteTab === 'logs' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Recent physical QR scans logged from Android guard devices:</span>
                    <span className="font-bold text-emerald-400">{siteLogs.length} Verified Scans</span>
                  </div>

                  <div className="space-y-2">
                    {siteLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/50 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white">{log.checkpointName}</div>
                            <div className="text-slate-400 text-[11px]">Guard: <strong className="text-slate-300">{log.guardName}</strong></div>
                          </div>
                        </div>

                        <div className="text-right font-mono text-[11px]">
                          <span className="text-emerald-400 font-bold">Verified Scan</span>
                          <div className="text-slate-400 text-[10px]">{log.timestamp}</div>
                        </div>
                      </div>
                    ))}

                    {siteLogs.length === 0 && (
                      <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800">
                        No mobile scans recorded yet for this facility. When guards scan any of the {siteCheckpoints.length} QR checkpoints with the app, logs will stream here in real time.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/60">
              <span className="text-xs text-slate-400 font-medium">
                {selectedSite.name} • {siteCheckpoints.length} QR Patrol Points
              </span>
              <button
                onClick={() => setSelectedSite(null)}
                className="btn-secondary text-xs px-4"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SINGLE CHECKPOINT QR INSPECTION & PRINT MODAL
          ───────────────────────────────────────────────────────────── */}
      {qrModalItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-[#131D31] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Checkpoint QR Placard
                </span>
                <h3 className="text-base font-bold text-white">{qrModalItem.name}</h3>
              </div>
              <button
                onClick={() => setQrModalItem(null)}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* QR Card Body */}
            <div className="printable-qr-card rounded-2xl bg-white p-6 text-center text-slate-900 shadow-xl space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                S.P.O.T. Security Operations
              </div>
              <h2 className="text-lg font-black text-slate-950 leading-tight">{qrModalItem.name}</h2>
              <p className="text-xs text-slate-600 font-semibold">{qrModalItem.siteName || selectedSite?.name}</p>

              <div className="inline-block p-4 rounded-xl border-2 border-slate-900 bg-white my-2">
                <QRCodeSVG value={getQRPayload(qrModalItem)} size={190} level="H" />
              </div>

              <div className="font-mono text-sm font-black tracking-wider text-slate-900">
                {qrModalItem.qrCode}
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                Guards: Scan this QR code with the S.P.O.T. Android app to verify patrol post visit.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText?.(getQRPayload(qrModalItem));
                  addToast('Payload Copied', 'Mobile scanner JSON payload copied.', 'info');
                }}
                className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Code
              </button>

              <button
                onClick={() => window.print()}
                className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> Print Placard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          BATCH PRINT MODAL (ALL QR PLACARDS FOR SITE)
          ───────────────────────────────────────────────────────────── */}
      {showBatchPrintModal && selectedSite && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-[#131D31] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/60 no-print">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Print Batch Checkpoint Placards
                </span>
                <h3 className="text-base font-bold text-white">{selectedSite.name} ({siteCheckpoints.length} QR Cards)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-primary text-xs flex items-center gap-2 py-2 px-4"
                >
                  <Printer className="h-4 w-4" /> Print All Placards
                </button>
                <button
                  onClick={() => setShowBatchPrintModal(false)}
                  className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900/40">
              <div className="printable-qr-grid grid grid-cols-1 sm:grid-cols-2 gap-6">
                {siteCheckpoints.map((cp, idx) => (
                  <div
                    key={cp.id}
                    className="printable-qr-card rounded-2xl bg-white p-6 text-center text-slate-900 shadow-xl border-2 border-slate-900 space-y-2"
                  >
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                      S.P.O.T. Patrol Post #{idx + 1}
                    </div>
                    <h3 className="text-base font-black text-slate-950">{cp.name}</h3>
                    <p className="text-xs text-slate-600 font-semibold">{selectedSite.name}</p>

                    <div className="inline-block p-3 rounded-lg border-2 border-slate-900 bg-white my-2">
                      <QRCodeSVG value={getQRPayload(cp)} size={160} level="H" />
                    </div>

                    <div className="font-mono text-xs font-bold tracking-wider text-slate-900">
                      {cp.qrCode}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Mount securely at this post. Scan with S.P.O.T. Android Mobile App.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ADD CHECKPOINT MODAL
          ───────────────────────────────────────────────────────────── */}
      {showAddCheckpointModal && selectedSite && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#131D31] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Checkpoint to {selectedSite.name}</h3>
              <button
                onClick={() => setShowAddCheckpointModal(false)}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Checkpoint Post Name *</label>
                <input
                  type="text"
                  className="input-spot"
                  placeholder="e.g. East Gate / Loading Bay Entrance"
                  value={newCheckpointForm.name}
                  onChange={(e) => setNewCheckpointForm({ ...newCheckpointForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Zone Assignment</label>
                  <input
                    type="text"
                    className="input-spot"
                    placeholder="e.g. Zone B"
                    value={newCheckpointForm.zone}
                    onChange={(e) => setNewCheckpointForm({ ...newCheckpointForm, zone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    className="input-spot"
                    placeholder="Optional notes"
                    value={newCheckpointForm.description}
                    onChange={(e) => setNewCheckpointForm({ ...newCheckpointForm, description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setShowAddCheckpointModal(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={handleAddCheckpointToSite}
                disabled={!newCheckpointForm.name.trim()}
                className="btn-primary text-xs"
              >
                Generate QR Checkpoint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          REGISTER NEW SITE MODAL
          ───────────────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-[#131D31] shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-white">Register New Deployment Site</h3>
                <p className="text-xs text-slate-400 mt-0.5">Physical location will be pinned on map and initial QR checkpoints auto-provisioned</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Site Name *</label>
                  <input
                    className="input-spot"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. Eastwood Mall Facility"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Facility Type</label>
                  <select
                    className="input-spot"
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                  >
                    {SITE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Client Organization</label>
                  <input
                    className="input-spot"
                    value={addForm.client}
                    onChange={(e) => setAddForm({ ...addForm, client: e.target.value })}
                    placeholder="e.g. Megaworld Properties"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Number of Initial QR Checkpoints</label>
                  <input
                    className="input-spot"
                    type="number"
                    min="1"
                    max="20"
                    value={addForm.initialCheckpointsCount}
                    onChange={(e) => setAddForm({ ...addForm, initialCheckpointsCount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Facility Address *</label>
                <input
                  className="input-spot"
                  value={addForm.address}
                  onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                  placeholder="e.g. E. Rodriguez Jr. Ave, Bagumbayan, Quezon City, Philippines"
                />
              </div>

              <AddressPreviewMap
                address={addForm.address}
                coords={addForm.lat && addForm.lng ? { lat: addForm.lat, lng: addForm.lng } : null}
                onCoordsFound={(coords) => setAddForm({ ...addForm, lat: coords.lat, lng: coords.lng })}
              />

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Cover Image URL (Optional)</label>
                <input
                  className="input-spot"
                  value={addForm.image}
                  onChange={(e) => setAddForm({ ...addForm, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="border-t border-slate-800 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="btn-secondary text-xs">Cancel</button>
              <button
                onClick={handleAddSite}
                disabled={saving || !addForm.name.trim()}
                className="btn-primary text-xs flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Site & Generate {addForm.initialCheckpointsCount || 5} QR Checkpoints
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EDIT SITE MODAL
          ───────────────────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-[#131D31] shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-base font-bold text-white">Edit Deployment Site: {editTarget.name}</h3>
              <button onClick={() => setEditTarget(null)} className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Site Name *</label>
                  <input
                    className="input-spot"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Facility Type</label>
                  <select
                    className="input-spot"
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  >
                    {SITE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Client</label>
                  <input
                    className="input-spot"
                    value={editForm.client}
                    onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Status</label>
                  <select
                    className="input-spot"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    {SITE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Address</label>
                <input
                  className="input-spot"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>

              <AddressPreviewMap
                address={editForm.address}
                coords={editForm.lat && editForm.lng ? { lat: editForm.lat, lng: editForm.lng } : null}
                onCoordsFound={(coords) => setEditForm({ ...editForm, lat: coords.lat, lng: coords.lng })}
              />
            </div>

            <div className="border-t border-slate-800 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setEditTarget(null)} className="btn-secondary text-xs">Cancel</button>
              <button
                onClick={handleEditSite}
                disabled={saving || !editForm.name.trim()}
                className="btn-primary text-xs flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DELETE SITE CONFIRMATION
          ───────────────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-rose-800/60 bg-[#131D31] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Delete Facility</div>
                <div className="text-xs text-slate-400">This will remove the site profile.</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              Permanently delete site <strong className="text-white">{deleteTarget.name}</strong>?
            </p>

            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 text-xs">Cancel</button>
              <button
                onClick={async () => {
                  await deleteSite(deleteTarget.id);
                  setDeleteTarget(null);
                  setSelectedSite(null);
                }}
                className="btn-danger flex-1 text-xs"
              >
                Delete Site
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
