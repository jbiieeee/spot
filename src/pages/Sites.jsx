import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import GuardAvatar from '../components/GuardAvatar';
import { useSpot } from '../context/SpotContext';
import {
  Building2, Users, MapPin, AlertTriangle, X, Plus, Pencil, Trash2, Check,
  Navigation, Loader2, Globe, ShieldCheck, RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
    <div style="
      position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
      width: 8px; height: 8px;
      background: rgba(37,99,235,0.4);
      border-radius: 50%;
      filter: blur(2px);
    "></div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -42],
});

// All-sites overview marker (smaller)
const multiSiteIcon = new L.DivIcon({
  className: '',
  html: `
    <div style="
      width: 20px; height: 20px;
      background: linear-gradient(135deg, #2563EB, #1d4ed8);
      border: 2px solid rgba(255,255,255,0.4);
      border-radius: 50%;
      box-shadow: 0 2px 10px rgba(37,99,235,0.7);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
});

// ─── Map recenter helper ──────────────────────────────────────────────────────
function MapRecenter({ lat, lng, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], zoom, { animate: true });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

// ─── Geocoding via OpenStreetMap Nominatim (free, no key required) ──────────
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
    // Fallback: try without country restriction
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

// ─── Live Site Map (single site view) ────────────────────────────────────────
function SiteMapView({ site }) {
  const lat = site.lat || 14.5547;
  const lng = site.lng || 121.0244;
  const hasCoords = site.lat && site.lng;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg" style={{ height: 260 }}>
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
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          maxZoom={19}
        />
        {hasCoords && (
          <Marker position={[lat, lng]} icon={spotIcon}>
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
                <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: 13, marginBottom: 4 }}>{site.name}</div>
                <div style={{ color: '#60A5FA', fontSize: 11, marginBottom: 2 }}>{site.type}</div>
                <div style={{ color: '#94A3B8', fontSize: 11 }}>{site.address}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <span style={{ color: '#34D399', fontSize: 10, fontWeight: 600 }}>● {site.activeGuardsCount} Guards</span>
                  <span style={{ color: '#60A5FA', fontSize: 10, fontWeight: 600 }}>● {site.checkpointsCount} CPs</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        <MapRecenter lat={lat} lng={lng} zoom={hasCoords ? 16 : 12} />
      </MapContainer>
    </div>
  );
}

// ─── All-sites overview map ───────────────────────────────────────────────────
function AllSitesMap({ sites, onSiteClick }) {
  const sitesWithCoords = sites.filter(s => s.lat && s.lng);
  const center = sitesWithCoords.length > 0
    ? [sitesWithCoords[0].lat, sitesWithCoords[0].lng]
    : [14.5547, 121.0244];

  return (
    <div className="card-spot p-0 overflow-hidden" style={{ height: 340 }}>
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Site Map Overview</span>
        </div>
        <span className="text-[10px] text-slate-500">{sitesWithCoords.length} of {sites.length} sites pinned</span>
      </div>
      <MapContainer
        center={center}
        zoom={sitesWithCoords.length === 1 ? 15 : 11}
        style={{ height: 'calc(100% - 45px)', width: '100%' }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        {sitesWithCoords.map(site => (
          <Marker
            key={site.id}
            position={[site.lat, site.lng]}
            icon={multiSiteIcon}
            eventHandlers={{ click: () => onSiteClick(site) }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 150, cursor: 'pointer' }} onClick={() => onSiteClick(site)}>
                <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: 12 }}>{site.name}</div>
                <div style={{ color: '#60A5FA', fontSize: 10, marginBottom: 4 }}>{site.type} • {site.client}</div>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>{site.address}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// ─── Click-to-place helper (listens for map clicks) ──────────────────────────
function MapClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e) => onMapClick(e.latlng.lat, e.latlng.lng);
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [map, onMapClick]);
  return null;
}

// ─── Geocode preview map in form (draggable + clickable pin) ─────────────────
function AddressPreviewMap({ address, coords, onCoordsFound }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const debounceRef = useRef(null);
  const markerRef = useRef(null);

  // Auto-geocode from address (only when not in manual mode)
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
        setError('Address not found. Click the map to place the pin manually.');
      }
    }, 1200);
    return () => clearTimeout(debounceRef.current);
  }, [address, manualMode]);

  // Drag end — update coords
  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker) {
      const { lat, lng } = marker.getLatLng();
      setManualMode(true);
      onCoordsFound({ lat, lng, displayName: address });
    }
  }, [address, onCoordsFound]);

  // Map click — move pin
  const handleMapClick = useCallback((lat, lng) => {
    setManualMode(true);
    onCoordsFound({ lat, lng, displayName: address });
  }, [address, onCoordsFound]);

  // Reset: clear manual mode and re-geocode
  const handleReset = () => {
    setManualMode(false);
    setError('');
    if (address && address.length >= 8) {
      setLoading(true);
      geocodeAddress(address).then(result => {
        setLoading(false);
        if (result) {
          onCoordsFound(result);
        } else {
          setError('Address not found. Place pin manually.');
        }
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Live Map Pin</label>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-1 text-[10px] text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Geocoding…
            </span>
          )}
          {error && !loading && (
            <span className="text-[10px] text-amber-400">{error}</span>
          )}
          {coords && !loading && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <Check className="h-3 w-3" /> {manualMode ? 'Manually adjusted' : 'Auto-pinned'}
            </span>
          )}
          {coords && manualMode && (
            <button
              type="button"
              onClick={handleReset}
              title="Re-geocode from address"
              className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition px-2 py-0.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700"
            >
              <RefreshCw className="h-2.5 w-2.5" /> Reset from address
            </button>
          )}
        </div>
      </div>

      {/* Hint text */}
      <p className="text-[10px] text-slate-500">
        {coords
          ? '\uD83D\uDDB1 Drag the pin or click anywhere on the map to fine-tune the location.'
          : '\uD83D\uDD0D Type an address to auto-pin, or click the map to place the pin manually.'}
      </p>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-blue-500/30 shadow-lg shadow-blue-950/30" style={{ height: 240 }}>
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
          {/* Click anywhere to place / move pin */}
          <MapClickHandler onMapClick={handleMapClick} />
          {coords && (
            <>
              <Marker
                position={[coords.lat, coords.lng]}
                icon={spotIcon}
                draggable={true}
                ref={markerRef}
                eventHandlers={{ dragend: handleDragEnd }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11 }}>
                    <div style={{ color: '#60A5FA', fontWeight: 700, marginBottom: 4 }}>Drag to fine-tune</div>
                    <div style={{ color: '#94A3B8' }}>{address || 'Custom location'}</div>
                    <div style={{ color: '#64748B', fontFamily: 'monospace', marginTop: 4, fontSize: 10 }}>
                      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
              <MapRecenter lat={coords.lat} lng={coords.lng} zoom={manualMode ? undefined : 16} />
            </>
          )}
          {/* Hint overlay when no pin */}
          {!coords && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none', zIndex: 800, textAlign: 'center'
            }}>
              <div style={{
                background: 'rgba(37,99,235,0.12)',
                border: '1px dashed rgba(37,99,235,0.5)',
                borderRadius: 10, padding: '7px 14px',
                color: '#60A5FA', fontSize: 11,
                fontFamily: 'Inter, sans-serif', fontWeight: 600
              }}>
                Click map to place pin
              </div>
            </div>
          )}
        </MapContainer>
      </div>

      {/* Coordinate readout */}
      {coords ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <Navigation className="h-3 w-3 text-blue-400 shrink-0" />
            <span className="text-emerald-400">{coords.lat.toFixed(6)}</span>
            <span className="text-slate-600">,</span>
            <span className="text-emerald-400">{coords.lng.toFixed(6)}</span>
          </div>
          {manualMode && (
            <span className="text-[10px] text-amber-400 flex items-center gap-1">
              <Pencil className="h-2.5 w-2.5" /> Manual pin active
            </span>
          )}
        </div>
      ) : (
        <div className="text-[10px] text-slate-600 font-mono flex items-center gap-2">
          <Navigation className="h-3 w-3 text-slate-700" /> No coordinates set
        </div>
      )}
    </div>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-xl'} overflow-hidden rounded-2xl border border-slate-700 bg-[#1E293B] shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function DeleteConfirm({ label, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl border border-rose-800/60 bg-[#1E293B] shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Confirm Deletion</div>
            <div className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</div>
          </div>
        </div>
        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          Delete site: <span className="font-bold text-white">{label}</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 text-xs">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center gap-2">
            <Trash2 className="h-3.5 w-3.5" /> Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

const SITE_TYPES = ['Commercial', 'Industrial', 'Residential', 'Government', 'Healthcare', 'Education', 'Financial', 'Warehouse', 'Port / Terminal'];
const SITE_STATUSES = ['Active', 'Inactive', 'Under Maintenance'];

const EMPTY_SITE = {
  name: '', type: 'Commercial', client: '', address: '', status: 'Active',
  checkpointsCount: '', image: '', lat: null, lng: null
};

// ─── Site Form with Live Map Preview ─────────────────────────────────────────
function SiteFormFields({ form, onChange }) {
  const handleCoordsFound = (coords) => {
    onChange('lat', coords.lat);
    onChange('lng', coords.lng);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Site Name *">
          <input className="input-spot" value={form.name} onChange={e => onChange('name', e.target.value)} placeholder="e.g. Eastwood Mall Facility" />
        </Field>
        <Field label="Facility Type">
          <select className="input-spot" value={form.type} onChange={e => onChange('type', e.target.value)}>
            {SITE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Client Organization">
          <input className="input-spot" value={form.client} onChange={e => onChange('client', e.target.value)} placeholder="e.g. ETON Properties" />
        </Field>
        <Field label="Security Status">
          <select className="input-spot" value={form.status} onChange={e => onChange('status', e.target.value)}>
            {SITE_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Full Address (used for map pinning) *">
        <input
          className="input-spot"
          value={form.address}
          onChange={e => onChange('address', e.target.value)}
          placeholder="e.g. E. Rodriguez Jr. Avenue, Quezon City, Philippines"
        />
      </Field>
      {/* Live geocoding map preview */}
      <AddressPreviewMap
        address={form.address}
        coords={form.lat && form.lng ? { lat: form.lat, lng: form.lng } : null}
        onCoordsFound={handleCoordsFound}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Total Checkpoints">
          <div className="input-spot flex items-center justify-between text-slate-300"><span>{form.checkpointsCount || 0} QR checkpoints</span><span className="text-[10px] uppercase tracking-wider text-emerald-400">Auto synced</span></div>
        </Field>
        <Field label="Cover Image">
          <input className="input-spot" type="file" accept="image/*" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onChange('image', reader.result);
            reader.readAsDataURL(file);
          }} />
        </Field>
      </div>
      {form.image && <img src={form.image} alt="Site cover preview" className="h-32 w-full rounded-xl object-cover border border-white/10" />}
    </>
  );
}

// ─── Main Sites Page ──────────────────────────────────────────────────────────
export default function Sites() {
  const { sites, guards, addSite, updateSite, deleteSite } = useSpot();

  const [selectedSite, setSelectedSite] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addForm, setAddForm] = useState(EMPTY_SITE);
  const [editForm, setEditForm] = useState(EMPTY_SITE);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    await addSite(addForm);
    setSaving(false);
    setAddForm(EMPTY_SITE);
    setShowAdd(false);
  };

  const openEdit = (site, e) => {
    if (e) e.stopPropagation();
    setSelectedSite(null);
    setEditForm({
      name: site.name || '',
      type: site.type || 'Commercial',
      client: site.client || '',
      address: site.address || '',
      status: site.status || 'Active',
      checkpointsCount: site.checkpointsCount || '',
      image: site.image || '',
      lat: site.lat || null,
      lng: site.lng || null
    });
    setEditTarget(site);
  };

  const handleEdit = async () => {
    if (!editForm.name.trim()) return;
    setSaving(true);
    await updateSite(editTarget.id, editForm);
    setSaving(false);
    setEditTarget(null);
  };

  const handleDelete = async () => {
    await deleteSite(deleteTarget.id);
    setSelectedSite(null);
    setDeleteTarget(null);
  };

  const assignedGuards = selectedSite
    ? guards.filter((g) => g.siteId === selectedSite.id || g.siteName === selectedSite.name)
    : [];

  return (
    <Layout
      title="Deployment Sites Management"
      subtitle="Categorized Facility Profiles, Live Map Pinning & Guard Allocation"
    >
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              <span className="text-white font-bold">{sites.length}</span> sites registered
              {sites.filter(s => s.lat && s.lng).length > 0 && (
                <span className="ml-2 text-emerald-400">• <span className="font-bold">{sites.filter(s => s.lat && s.lng).length}</span> pinned on map</span>
              )}
            </span>
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Map View
              </button>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-xs flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Site
          </button>
        </div>

        {/* ── Map Overview View ─────────────────────────────────── */}
        {viewMode === 'map' && (
          <AllSitesMap sites={sites} onSiteClick={setSelectedSite} />
        )}

        {/* ── Empty state ───────────────────────────────────────── */}
        {sites.length === 0 ? (
          <div className="card-spot py-20 flex flex-col items-center gap-4">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
              <Building2 className="h-8 w-8 text-slate-500" />
            </div>
            <div className="text-sm font-semibold text-slate-400">No deployment sites registered</div>
            <div className="text-xs text-slate-500">Click "Add Site" to register a new deployment facility.</div>
          </div>
        ) : (
          /* ── Sites Grid ─────────────────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <div
                key={site.id}
                onClick={() => setSelectedSite(site)}
                className="card-spot p-0 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/60 flex flex-col justify-between group"
              >
                <div>
                  {/* Image Header */}
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={site.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=80'}
                      alt={site.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-transparent" />
                    <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-slate-700 backdrop-blur-md">
                      {site.type}
                    </span>
                    {/* Map pin indicator */}
                    {site.lat && site.lng && (
                      <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-blue-600/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                        <Navigation className="h-2.5 w-2.5" /> Pinned
                      </span>
                    )}
                    {/* Hover action buttons */}
                    <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => openEdit(site, e)}
                        title="Edit Site"
                        className="p-1.5 rounded-lg bg-amber-500/90 hover:bg-amber-400 text-slate-900 shadow-lg transition"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(site); }}
                        title="Delete Site"
                        className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white shadow-lg transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white leading-tight">{site.name}</h3>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        site.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : site.status === 'Inactive' ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>{site.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" /> {site.address || 'No address set'}
                    </p>
                    <div className="mt-1 text-xs text-slate-500">{site.client}</div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Guards</div>
                        <div className="text-sm font-bold text-white mt-0.5">{site.activeGuardsCount}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Checkpoints</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">{site.checkpointsCount}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Incidents</div>
                        <div className="text-sm font-bold text-rose-400 mt-0.5">{site.incidentsCount}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-blue-400 font-semibold">
                  <span>Inspect Facility & Guards</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Site Detail Drawer (with embedded map) ───────────────── */}
      {selectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-[#1E293B] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <span className="text-xs font-mono text-blue-400">{selectedSite.id} • {selectedSite.type}</span>
                <h3 className="text-lg font-bold text-white">{selectedSite.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(selectedSite)}
                  className="rounded-xl border border-amber-700/50 bg-amber-500/10 p-2 text-amber-400 hover:text-white transition"
                  title="Edit Site"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setSelectedSite(null); setDeleteTarget(selectedSite); }}
                  className="rounded-xl border border-rose-700/50 bg-rose-500/10 p-2 text-rose-400 hover:text-white transition"
                  title="Delete Site"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedSite(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* ── Live Leaflet Map ────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Location Map</span>
                  {selectedSite.lat && selectedSite.lng ? (
                    <span className="text-[10px] text-emerald-400 font-semibold ml-auto">● GPS Coordinates Available</span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-semibold ml-auto">⚠ No GPS Coordinates — Edit to Add</span>
                  )}
                </div>
                <SiteMapView site={selectedSite} />
                {selectedSite.lat && selectedSite.lng && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <MapPin className="h-3 w-3 text-blue-400" />
                    {selectedSite.lat.toFixed(5)}, {selectedSite.lng.toFixed(5)}
                  </div>
                )}
              </div>

              {/* Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Guards', value: selectedSite.activeGuardsCount, color: 'text-white' },
                  { label: 'Checkpoints', value: selectedSite.checkpointsCount, color: 'text-emerald-400' },
                  { label: 'Incidents', value: selectedSite.incidentsCount, color: 'text-rose-400' },
                  { label: 'Routes', value: selectedSite.routesCount || 0, color: 'text-blue-400' },
                ].map(stat => (
                  <div key={stat.label} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400">{stat.label}</div>
                    <div className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Site Info */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Organization:</span>
                  <span className="font-bold text-white">{selectedSite.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Security Status:</span>
                  <span className={`font-bold ${selectedSite.status === 'Active' ? 'text-emerald-400' : 'text-slate-400'}`}>{selectedSite.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Address:</span>
                  <span className="font-bold text-white text-right max-w-[60%]">{selectedSite.address}</span>
                </div>
              </div>

              {/* Assigned Guards */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" /> Assigned Guards at Facility
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
                    <div className="col-span-2 text-xs text-slate-500 text-center py-4">No guards currently assigned to this site.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => openEdit(selectedSite)}
                className="btn-secondary text-xs flex items-center gap-2"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Site
              </button>
              <button onClick={() => setSelectedSite(null)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Site Modal ────────────────────────────────────────── */}
      {showAdd && (
        <Modal
          title="Register New Deployment Site"
          subtitle="Address will be automatically geocoded and pinned on the live map"
          wide
          onClose={() => { setShowAdd(false); setAddForm(EMPTY_SITE); }}
          footer={
            <>
              <button onClick={() => { setShowAdd(false); setAddForm(EMPTY_SITE); }} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleAdd} disabled={saving || !addForm.name.trim()} className="btn-primary text-xs flex items-center gap-2">
                {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-3.5 w-3.5" />}
                Save Site
              </button>
            </>
          }
        >
          <SiteFormFields form={addForm} onChange={(k, v) => setAddForm(f => ({ ...f, [k]: v }))} />
        </Modal>
      )}

      {/* ── Edit Site Modal ───────────────────────────────────────── */}
      {editTarget && (
        <Modal
          title="Edit Deployment Site"
          subtitle={`Editing: ${editTarget.name} — Update address to re-pin on map`}
          wide
          onClose={() => setEditTarget(null)}
          footer={
            <>
              <button onClick={() => setEditTarget(null)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleEdit} disabled={saving || !editForm.name.trim()} className="btn-primary text-xs flex items-center gap-2">
                {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-3.5 w-3.5" />}
                Save Changes
              </button>
            </>
          }
        >
          <SiteFormFields form={editForm} onChange={(k, v) => setEditForm(f => ({ ...f, [k]: v }))} />
        </Modal>
      )}

      {/* ── Delete Confirmation ───────────────────────────────────── */}
      {deleteTarget && (
        <DeleteConfirm
          label={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </Layout>
  );
}
