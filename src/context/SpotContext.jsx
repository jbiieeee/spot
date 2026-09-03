import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, hasFirebaseConfig } from '../lib/firebase';
import { subscribeCollection, updateItem, addItem, removeItem, setItem } from '../lib/dataSource';

const SpotContext = createContext();

export function normalizeBattery(val) {
  if (val === undefined || val === null || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return null;
  if (num > 0 && num <= 1.0) {
    return Math.round(num * 100);
  }
  return Math.min(100, Math.max(0, Math.round(num)));
}

function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playNote = (freq, time, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + duration);
    };
    const now = audioCtx.currentTime;
    playNote(659.25, now, 0.3); // E5
    playNote(880.00, now + 0.12, 0.4); // A5
  } catch (e) {
    console.error("Audio playback failed:", e);
  }
}

export function SpotProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Pure Database State (Starts completely empty for fresh sync)
  const [guards, setGuards] = useState([]);
  const [sites, setSites] = useState([]);
  const [clients, setClients] = useState([]);
  const [patrols, setPatrols] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [checkpointLogs, setCheckpointLogs] = useState([]);
  const [guardLocations, setGuardLocations] = useState({});
  const [checkpoints, setCheckpoints] = useState([]);

  // Database Connection Indicator
  const [dbConnected, setDbConnected] = useState(Boolean(hasFirebaseConfig && db));

  // Drawer & Modal States
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [isGuardDrawerOpen, setIsGuardDrawerOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Track previous guards & live locations to detect device / battery telemetry updates
  const prevGuardsRef = useRef({});
  const guardLocationsRef = useRef({});

  // Toasts Notification Stack
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast = {
      id,
      title,
      message,
      type,
      duration,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    // Automatically remove toast after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openGuardDrawer = (guard) => {
    setSelectedGuard(guard);
    setIsGuardDrawerOpen(true);
  };

  const closeGuardDrawer = () => {
    setIsGuardDrawerOpen(false);
    setSelectedGuard(null);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // -------------------------------------------------------------
  // Real-time Cloud Firestore Subscriptions
  // -------------------------------------------------------------
  useEffect(() => {
    if (!hasFirebaseConfig || !db) return;

    // 1. Incidents
    const unsubIncidents = subscribeCollection('incidents', (fsIncidents) => {
      const formatted = (fsIncidents || []).map((doc) => ({
        id: doc.id,
        title: doc.title || doc.type || 'Field Incident',
        priority: doc.priority || 'Medium',
        siteName: doc.siteName || doc.location || 'Site',
        location: doc.location || doc.checkpointName || 'Zone',
        reporterName: doc.reporterName || doc.guardName || 'Guard',
        reporterId: doc.reporterId || doc.guardId || 'G-100',
        timestamp: doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        status: doc.status || 'Investigating',
        evidencePhoto: doc.evidencePhoto || doc.photoUrl || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
        description: doc.description || 'Reported incident.',
        actionsTaken: doc.actionsTaken || 'Pending review.'
      }));
      setIncidents(formatted);
    });

    // 2. Sites — merge web 'sites' + Android 'client_sites'
    let webSites = [];
    let androidSites = [];
    const mergeSites = () => {
      const all = [...webSites];
      androidSites.forEach(as => {
        if (!all.find(s => s.id === as.id)) all.push(as);
      });
      setSites(all);
    };

    const unsubSites = subscribeCollection('sites', (fsSites) => {
      webSites = (fsSites || []).map((doc) => ({
        id: doc.id,
        name: doc.name || doc.siteName || 'Managed Site',
        type: doc.type || 'Commercial',
        client: doc.client || 'Client',
        address: doc.address || doc.location || 'Address',
        activeGuardsCount: doc.activeGuardsCount || 0,
        checkpointsCount: doc.checkpointsCount || 0,
        routesCount: doc.routesCount || 0,
        incidentsCount: doc.incidentsCount || 0,
        status: doc.status || 'Active',
        lat: doc.lat ?? null,
        lng: doc.lng ?? null,
        image: doc.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=80'
      }));
      mergeSites();
    });

    const unsubClientSites = subscribeCollection('client_sites', (fsSites) => {
      androidSites = (fsSites || []).map((doc) => ({
        id: doc.id,
        name: doc.siteName || doc.name || 'Managed Site',
        type: doc.type || 'Commercial',
        client: doc.client || 'Client',
        address: doc.address || doc.location || 'Address',
        activeGuardsCount: doc.activeGuardsCount || 0,
        checkpointsCount: doc.checkpointsCount || 0,
        routesCount: doc.routesCount || 0,
        incidentsCount: doc.incidentsCount || 0,
        status: doc.status || 'Active',
        lat: doc.lat ?? null,
        lng: doc.lng ?? null,
        image: doc.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=80'
      }));
      mergeSites();
    });

    // 3. Guards / Users
    const unsubUsers = subscribeCollection('users', (fsUsers) => {
      const formatted = (fsUsers || [])
        .filter((u) => u.role === 'guard' || u.role === 'Guard' || !u.role)
        .map((u) => {
          const loc = guardLocationsRef.current[u.id] || (u.deviceId ? guardLocationsRef.current[u.deviceId] : null);
          const rawBattery = normalizeBattery(
            loc?.battery ?? u.battery ?? u.batteryLevel ?? u.batteryPct ?? u.deviceBattery
          );

          return {
            id: u.id,
            name: u.name || u.displayName || u.email || 'Guard Personnel',
            photo: u.photo || u.photoUrl || '',
            client: u.client || 'Client',
            siteId: u.siteId || 'SITE-01',
            siteName: u.siteName || 'Assigned Site',
            shift: u.shift || 'Day Shift',
            status: u.status || 'Idle',
            battery: rawBattery !== null ? rawBattery : (u.battery !== undefined ? normalizeBattery(u.battery) : 100),
            isCharging: Boolean(loc?.isCharging || u.isCharging),
            gpsAccuracy: loc?.accuracy != null ? `${loc.accuracy.toFixed(1)}m` : (u.gpsAccuracy || '1.5m'),
            gpsLat: loc?.lat ?? (u.gpsLat || u.lat || 14.5547),
            gpsLng: loc?.lng ?? (u.gpsLng || u.lng || 121.0244),
            faceVerified: Boolean(u.faceVerified),
            faceVerifiedAt: u.faceVerifiedAt || 'Pending',
            faceEnrollmentStatus: u.faceEnrollmentStatus || (u.faceVerified ? 'enrolled' : 'pending'),
            faceProfileId: u.faceProfileId || null,
            facePhotoUrl: u.facePhotoUrl || u.facePhoto || '',
            currentPatrolName: u.currentPatrolName || '',
            progressPct: u.progressPct || 0,
            completedCheckpoints: u.completedCheckpoints || 0,
            totalCheckpoints: u.totalCheckpoints || 0,
            etaMinutes: u.etaMinutes || 0,
            phone: u.phone || 'N/A',
            deviceId: u.deviceId || null,
            performanceRating: u.performanceRating || 100,
            attendanceRate: u.attendanceRate || 100
          };
        });

      // Check if we already had guards loaded (to avoid triggering on first load)
      const hasPrev = Object.keys(prevGuardsRef.current).length > 0;
      
      formatted.forEach((guard) => {
        const prev = prevGuardsRef.current[guard.id];
        if (hasPrev && prev) {
          const deviceChanged = guard.deviceId !== prev.deviceId;
          const phoneChanged = guard.phone !== prev.phone && prev.phone !== 'N/A';
          
          if (deviceChanged || phoneChanged) {
            let message = '';
            if (deviceChanged) {
              message = `${guard.name}'s assigned device updated to: ${guard.deviceId || 'None'}`;
            } else {
              message = `${guard.name}'s phone number updated to: ${guard.phone}`;
            }
            
            // Trigger toast
            addToast('Guard Device/Contact Updated', message, 'info');
            
            // Play chime sound
            playChime();
          }
        }
        
        // Update ref value
        prevGuardsRef.current[guard.id] = {
          deviceId: guard.deviceId,
          phone: guard.phone
        };
      });

      // Initialize keys for new guards if it was empty
      if (!hasPrev) {
        formatted.forEach((g) => {
          prevGuardsRef.current[g.id] = {
            deviceId: g.deviceId,
            phone: g.phone
          };
        });
      }

      setGuards(formatted);
    });

    // 4. Patrols — merge patrolLogs + patrol_schedules
    let webPatrols = [];
    let androidPatrols = [];
    const mergePatrols = () => {
      const all = [...webPatrols];
      androidPatrols.forEach(ap => {
        if (!all.find(p => p.id === ap.id)) all.push(ap);
      });
      setPatrols(all);
    };

    const mapPatrolDoc = (doc) => ({
      id: doc.id,
      guardId: doc.guardId || 'N/A',
      guardName: doc.guardName || 'Guard',
      guardPhoto: doc.guardPhoto || '',
      siteName: doc.siteName || 'Site',
      routeName: doc.routeName || doc.routeId || 'Patrol Route',
      status: doc.status || 'In Progress',
      progressPct: doc.progressPct || 0,
      completedCount: doc.completedCount || 0,
      totalCount: doc.totalCount || 0,
      remainingCount: doc.remainingCount || 0,
      etaMinutes: doc.etaMinutes || 0,
      startTime: doc.startTime || (doc.startedAt?.toDate ? doc.startedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM'),
      checkpoints: doc.checkpoints || []
    });

    const unsubPatrols = subscribeCollection('patrolLogs', (fsLogs) => {
      webPatrols = (fsLogs || []).map(mapPatrolDoc);
      mergePatrols();
    });

    const unsubPatrolSchedules = subscribeCollection('patrol_schedules', (fsLogs) => {
      androidPatrols = (fsLogs || []).map(mapPatrolDoc);
      mergePatrols();
    });

    // 5. Audit Logs
    const unsubAudit = subscribeCollection('adminLogs', (fsAudit) => {
      const formatted = (fsAudit || []).map((doc) => ({
        id: doc.id,
        timestamp: doc.timestamp?.toDate ? doc.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        actor: doc.userId || doc.actor || 'Supervisor Admin',
        category: doc.collection || doc.category || 'System Action',
        action: doc.action || 'Data Change',
        details: typeof doc.details === 'object' ? JSON.stringify(doc.details) : String(doc.details || ''),
        ipAddress: 'Cloud Sync',
        severity: doc.severity || 'Info'
      }));
      setAuditLogs(formatted);
    });

    // 6. Clients
    const unsubClients = subscribeCollection('clients', (fsClients) => {
      const formatted = (fsClients || []).map((doc) => ({
        id: doc.id,
        company: doc.company || doc.name || 'Client Organization',
        contactPerson: doc.contactPerson || 'Contact Person',
        email: doc.email || 'contact@client.com',
        phone: doc.phone || 'N/A',
        supervisor: doc.supervisor || 'Assigned Supervisor',
        status: doc.status || 'Active',
        deploymentsCount: doc.deploymentsCount || 0,
        assignedGuards: doc.assignedGuards || 0,
        slaCompliance: doc.slaCompliance || 100,
        contractStart: doc.contractStart || '',
        contractEnd: doc.contractEnd || '',
        notes: doc.notes || ''
      }));
      setClients(formatted);
    });

    // 7. Devices
    const unsubDevices = subscribeCollection('devices', (fsDevices) => {
      const formatted = (fsDevices || []).map((d) => ({
        id: d.id,
        deviceId: d.deviceId || d.id,
        deviceModel: d.deviceModel || 'Unknown Device',
        osVersion: d.osVersion || 'Android OS',
        battery: normalizeBattery(d.battery ?? d.batteryLevel ?? d.batteryPct ?? d.level),
        lastActive: d.lastActive?.toDate ? d.lastActive.toDate() : (d.timestamp?.toDate ? d.timestamp.toDate() : null),
      }));
      setDevices(formatted);
    });

    // 8. Attendance (from Android app)
    const unsubAttendance = subscribeCollection('attendance', (fsDocs) => {
      const formatted = (fsDocs || []).map((doc) => ({
        id: doc.id,
        guardId: doc.guardId || doc.userId || '',
        guardName: doc.guardName || doc.name || 'Guard',
        siteId: doc.siteId || '',
        siteName: doc.siteName || 'Site',
        timeIn: doc.timeIn?.toDate ? doc.timeIn.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (doc.timeIn || ''),
        timeOut: doc.timeOut?.toDate ? doc.timeOut.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (doc.timeOut || ''),
        date: doc.date || (doc.timestamp?.toDate ? doc.timestamp.toDate().toLocaleDateString() : ''),
        status: doc.status || 'Present',
        faceVerified: Boolean(doc.faceVerified),
      }));
      setAttendance(formatted);
    });

    // 9. Checkpoint logs (from Android app)
    const unsubCheckpointLogs = subscribeCollection('checkpoint_logs', (fsDocs) => {
      const formatted = (fsDocs || []).map((doc) => ({
        id: doc.id,
        guardId: doc.guardId || '',
        guardName: doc.guardName || 'Guard',
        checkpointId: doc.checkpointId || doc.locationId || '',
        checkpointName: doc.checkpointName || doc.locationName || 'Checkpoint',
        siteId: doc.siteId || '',
        timestamp: doc.timestamp?.toDate ? doc.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        verified: Boolean(doc.verified),
      }));
      setCheckpointLogs(formatted);
    });

    // 10. Guard live locations (from Android app GPS & telemetry service)
    const unsubGuardLocations = subscribeCollection('guardLocations', (fsDocs) => {
      const locationMap = {};
      (fsDocs || []).forEach((doc) => {
        const liveBatt = normalizeBattery(
          doc.battery ?? doc.batteryLevel ?? doc.batteryPct ?? doc.batteryPercent ?? doc.level ?? doc.deviceBattery
        );

        locationMap[doc.id] = {
          id: doc.id,
          lat: doc.lat ?? doc.gpsLat ?? null,
          lng: doc.lng ?? doc.gpsLng ?? null,
          accuracy: doc.accuracy ?? null,
          speed: doc.speed ?? null,
          bearing: doc.bearing ?? null,
          altitude: doc.altitude ?? null,
          battery: liveBatt,
          isCharging: Boolean(doc.isCharging || doc.charging),
          activityType: doc.activityType || 'unknown',
          networkType: doc.networkType || 'unknown',
          patrolSessionId: doc.patrolSessionId || null,
          timestamp: doc.timestamp?.toDate ? doc.timestamp.toDate() : (doc.updatedAt?.toDate ? doc.updatedAt.toDate() : null),
        };
      });
      setGuardLocations(locationMap);
      guardLocationsRef.current = locationMap;

      // Realtime live battery and GPS synchronization directly into guards state
      setGuards((prevGuards) =>
        prevGuards.map((g) => {
          const loc = locationMap[g.id] || (g.deviceId ? locationMap[g.deviceId] : null);
          if (loc) {
            return {
              ...g,
              gpsLat: loc.lat ?? g.gpsLat,
              gpsLng: loc.lng ?? g.gpsLng,
              gpsAccuracy: loc.accuracy != null ? `${loc.accuracy.toFixed(1)}m` : g.gpsAccuracy,
              battery: loc.battery !== null ? loc.battery : g.battery,
              isCharging: loc.isCharging ?? g.isCharging,
              speed: loc.speed ?? g.speed,
              lastSeen: loc.timestamp
            };
          }
          return g;
        })
      );
    });

    // 11. Checkpoints
    const unsubCheckpoints = subscribeCollection('checkpoints', (fsCheckpoints) => {
      const formatted = (fsCheckpoints || []).map((doc) => ({
        id: doc.id,
        name: doc.name || doc.locationName || 'Checkpoint Post',
        siteId: doc.siteId || '',
        siteName: doc.siteName || '',
        qrCode: doc.qrCode || `SPOT-CP-${doc.id.slice(-6).toUpperCase()}`,
        lat: doc.lat ?? null,
        lng: doc.lng ?? null,
        zone: doc.zone || 'General Zone',
        description: doc.description || '',
        createdAt: doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleDateString() : 'Active',
      }));
      setCheckpoints(formatted);
    });

    setDbConnected(true);

    return () => {
      unsubIncidents();
      unsubSites();
      unsubClientSites();
      unsubUsers();
      unsubPatrols();
      unsubPatrolSchedules();
      unsubAudit();
      unsubClients();
      unsubDevices();
      unsubAttendance();
      unsubCheckpointLogs();
      unsubGuardLocations();
      unsubCheckpoints();
    };
  }, []);

  // -------------------------------------------------------------
  // CRUD — Guards
  // -------------------------------------------------------------
  const persistGuardPhoto = (photo) => photo || '';

  const addGuard = async (newGuard) => {
    const guardId = `G-${Date.now().toString().slice(-4)}`;
    const photo = persistGuardPhoto(newGuard.photo);
    const created = {
      id: guardId,
      name: newGuard.name,
      client: newGuard.client || 'Client Account',
      siteName: newGuard.siteName || 'Main Facility',
      shift: newGuard.shift || 'Day Shift (06:00 - 18:00)',
      status: 'Idle',
      battery: 100,
      gpsAccuracy: '1.2m (Excellent)',
      gpsLat: 14.5547 + (Math.random() - 0.5) * 0.01,
      gpsLng: 121.0244 + (Math.random() - 0.5) * 0.01,
      faceVerified: false,
      faceVerifiedAt: 'Pending',
      currentPatrolName: '',
      progressPct: 0,
      completedCheckpoints: 0,
      totalCheckpoints: 0,
      etaMinutes: 0,
      phone: newGuard.phone || '+63 917 000 0000',
      performanceRating: 100,
      attendanceRate: 100,
      photo,
      role: 'guard'
    };

    setGuards((prev) => [created, ...prev]);

    if (hasFirebaseConfig && db) {
      try {
        await addItem('users', created);
      } catch (e) {
        console.warn('Firestore add user:', e);
      }
    }
    addToast('Guard Registered', `${created.name} has been added to the roster.`, 'success');
  };

  const updateGuard = async (id, patch) => {
    const persistedPatch = patch.photo !== undefined
      ? { ...patch, photo: persistGuardPhoto(patch.photo) }
      : patch;
    setGuards((prev) => prev.map((g) => (g.id === id ? { ...g, ...persistedPatch } : g)));
    if (hasFirebaseConfig && db) {
      try {
        await updateItem('users', id, persistedPatch);
      } catch (e) {
        console.warn('Firestore update user:', e);
      }
    }
    addToast('Guard Updated', `Guard record has been updated.`, 'info');
  };

  const updateGuardPassword = async (guardId, newPassword) => {
    const targetGuard = guards.find((g) => g.id === guardId);
    if (!targetGuard) throw new Error('Guard record not found.');

    const patch = {
      tempPassword: newPassword,
      passwordUpdatedAt: new Date().toISOString(),
      requiresPasswordChange: false
    };

    setGuards((prev) =>
      prev.map((g) => (g.id === guardId ? { ...g, ...patch } : g))
    );

    if (hasFirebaseConfig && db) {
      try {
        await updateItem('users', guardId, patch);
        await addItem('adminLogs', {
          action: 'GUARD_PASSWORD_RESET',
          guardId,
          guardName: targetGuard.name,
          adminEmail: auth?.currentUser?.email || 'admin@spot.com',
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Firestore update guard password:', e);
      }
    }

    addToast(
      'Password Updated',
      `Credentials for ${targetGuard.name} have been updated successfully.`,
      'success'
    );
  };

  const enrollGuardFace = async (guard, capture) => {
    if (!guard?.id) throw new Error('Select a guard before enrolling a face.');
    if (!capture?.dataUrl) throw new Error('Capture a face photo before enrolling.');

    const enrolledAt = new Date();
    const enrolledAtLabel = enrolledAt.toLocaleString();
    const facePhotoUrl = '';

    const userPatch = {
      faceVerified: true,
      faceVerifiedAt: enrolledAtLabel,
      faceEnrollmentStatus: 'enrolled',
      faceProfileId: guard.id,
      facePhotoUrl: facePhotoUrl || guard.facePhotoUrl || '',
      faceDetectorSupported: Boolean(capture.faceDetectorSupported),
      faceDetected: capture.faceDetected !== false,
    };

    if (!facePhotoUrl) {
      userPatch.facePhoto = capture.dataUrl;
    }

    const faceProfile = {
      guardId: guard.id,
      guardName: guard.name || 'Guard',
      siteId: guard.siteId || '',
      siteName: guard.siteName || '',
      imageUrl: facePhotoUrl,
      imageDataUrl: facePhotoUrl ? '' : capture.dataUrl,
      storagePath: '',
      faceDetected: capture.faceDetected !== false,
      faceCount: capture.faceCount ?? null,
      detector: capture.faceDetectorSupported ? 'browser-face-detector' : 'manual-review',
      source: 'web-command-center',
      enrolledAt: enrolledAt.toISOString(),
      updatedAt: enrolledAt.toISOString(),
    };

    const attendanceRecord = {
      guardId: guard.id,
      guardName: guard.name || 'Guard',
      siteId: guard.siteId || '',
      siteName: guard.siteName || '',
      date: enrolledAt.toLocaleDateString(),
      timeIn: enrolledAt.toISOString(),
      timestamp: enrolledAt.toISOString(),
      status: 'Face Enrolled',
      faceVerified: true,
      source: 'web-command-center',
    };

    setGuards((prev) => prev.map((g) => (g.id === guard.id ? { ...g, ...userPatch } : g)));

    if (hasFirebaseConfig && db) {
      try {
        await setItem('faceProfiles', guard.id, faceProfile);
        await updateItem('users', guard.id, userPatch);
        await addItem('attendance', attendanceRecord);
      } catch (e) {
        console.warn('Firestore face enrollment:', e);
        throw e;
      }
    }

    addToast('Face Enrollment Saved', `${guard.name}'s face profile is ready for guard app login.`, 'success');
    return { ...userPatch, faceProfile };
  };

  const deleteGuardFace = async (guard) => {
    if (!guard?.id) throw new Error('Select a guard before deleting face recognition.');

    const userPatch = {
      faceVerified: false,
      faceVerifiedAt: 'Pending',
      faceEnrollmentStatus: 'pending',
      faceProfileId: null,
      facePhotoUrl: '',
      facePhoto: '',
      faceDetected: false,
      faceDetectorSupported: false,
    };

    setGuards((prev) => prev.map((g) => (g.id === guard.id ? { ...g, ...userPatch } : g)));

    if (hasFirebaseConfig && db) {
      try {
        await removeItem('faceProfiles', guard.id);
      } catch (e) {
        if (e.code !== 'not-found') throw e;
      }
      await updateItem('users', guard.id, userPatch);
    }

    addToast('Face Recognition Deleted', `${guard.name}'s profile can now be enrolled again.`, 'success');
  };

  const deleteGuard = async (id) => {
    const target = guards.find((g) => g.id === id);
    setGuards((prev) => prev.filter((g) => g.id !== id));
    if (hasFirebaseConfig && db) {
      try {
        await removeItem('users', id);
      } catch (e) {
        console.warn('Firestore delete user:', e);
      }
    }
    addToast('Guard Removed', `${target?.name || 'Guard'} has been removed from the roster.`, 'danger');
  };

  // -------------------------------------------------------------
  // CRUD — Sites
  // -------------------------------------------------------------
  const addSite = async (newSite) => {
    const created = {
      id: `SITE-${Date.now().toString().slice(-4)}`,
      name: newSite.name,
      type: newSite.type || 'Commercial',
      client: newSite.client || 'Client Organization',
      address: newSite.address || 'Deployment Address',
      activeGuardsCount: 0,
      checkpointsCount: parseInt(newSite.checkpointsCount) || 0,
      routesCount: 0,
      incidentsCount: 0,
      status: newSite.status || 'Active',
      // Preserve geocoded coordinates — null means no pin yet
      lat: newSite.lat || null,
      lng: newSite.lng || null,
      image: newSite.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=80'
    };

    setSites((prev) => [created, ...prev]);

    if (hasFirebaseConfig && db) {
      try {
        await addItem('sites', created);
      } catch (e) {
        console.warn('Firestore add site:', e);
      }
    }
    addToast('Site Added', `${created.name} added to deployment inventory.`, 'success');
  };

  const updateSite = async (id, patch) => {
    setSites((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    if (hasFirebaseConfig && db) {
      try {
        await updateItem('sites', id, patch);
      } catch (e) {
        console.warn('Firestore update site:', e);
      }
    }
    addToast('Site Updated', `Site record has been updated.`, 'info');
  };

  const deleteSite = async (id) => {
    const target = sites.find((s) => s.id === id);
    setSites((prev) => prev.filter((s) => s.id !== id));
    if (hasFirebaseConfig && db) {
      try {
        await removeItem('sites', id);
      } catch (e) {
        console.warn('Firestore delete site:', e);
      }
    }
    addToast('Site Removed', `${target?.name || 'Site'} has been removed.`, 'danger');
  };

  // -------------------------------------------------------------
  // CRUD — Checkpoints & QR Patrol Posts
  // -------------------------------------------------------------
  const addCheckpoint = async (newCp) => {
    const site = sites.find((s) => s.id === newCp.siteId);
    const cpCode = newCp.qrCode || `SPOT-CP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const docData = {
      name: newCp.name,
      siteId: newCp.siteId,
      siteName: site?.name || newCp.siteName || 'Assigned Facility',
      qrCode: cpCode,
      zone: newCp.zone || 'General Zone',
      description: newCp.description || '',
      lat: parseFloat(newCp.lat) || (site?.lat ? site.lat + (Math.random() - 0.5) * 0.002 : null),
      lng: parseFloat(newCp.lng) || (site?.lng ? site.lng + (Math.random() - 0.5) * 0.002 : null),
    };

    let docId = `CP-${Date.now().toString().slice(-6)}`;
    if (hasFirebaseConfig && db) {
      try {
        docId = await addItem('checkpoints', docData);
      } catch (e) {
        console.warn('Firestore add checkpoint:', e);
      }
    }

    const created = { id: docId, ...docData };
    setCheckpoints((prev) => [created, ...prev]);

    // Automatically synchronize site's checkpoint count
    if (newCp.siteId) {
      const updatedCount = checkpoints.filter((c) => c.siteId === newCp.siteId).length + 1;
      updateSite(newCp.siteId, { checkpointsCount: updatedCount });
    }

    addToast('QR Checkpoint Created', `${created.name} (${created.qrCode}) generated.`, 'success');
    return created;
  };

  const updateCheckpoint = async (id, patch) => {
    setCheckpoints((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    if (hasFirebaseConfig && db) {
      try {
        await updateItem('checkpoints', id, patch);
      } catch (e) {
        console.warn('Firestore update checkpoint:', e);
      }
    }
    addToast('Checkpoint Updated', 'Checkpoint details saved.', 'info');
  };

  const deleteCheckpoint = async (id, siteId) => {
    const target = checkpoints.find((c) => c.id === id);
    setCheckpoints((prev) => prev.filter((c) => c.id !== id));
    if (hasFirebaseConfig && db) {
      try {
        await removeItem('checkpoints', id);
      } catch (e) {
        console.warn('Firestore delete checkpoint:', e);
      }
    }

    const effectiveSiteId = siteId || target?.siteId;
    if (effectiveSiteId) {
      const updatedCount = Math.max(0, checkpoints.filter((c) => c.siteId === effectiveSiteId && c.id !== id).length);
      updateSite(effectiveSiteId, { checkpointsCount: updatedCount });
    }

    addToast('Checkpoint Deleted', `${target?.name || 'Checkpoint'} removed.`, 'danger');
  };

  const batchGenerateSiteCheckpoints = async (site, targetCount = 5) => {
    if (!site?.id) return;
    const defaultZoneNames = [
      'Main Gate & Guardhouse',
      'Lobby & Reception Scan Point',
      'East Perimeter & Loading Bay',
      'Server Room & Vault Entry',
      'Rooftop Access & Emergency Exit',
      'South Fire Exit Stairwell',
      'Basement Parking Area B1',
      'Utility & Power Generator Room',
      'Executive Floor Hallway',
      'West Boundary Fence Post'
    ];

    const existingForSite = checkpoints.filter((c) => c.siteId === site.id);
    const needed = Math.max(0, targetCount - existingForSite.length);

    if (needed === 0) {
      addToast('Checkpoints Ready', `${site.name} already has ${existingForSite.length} QR checkpoints.`, 'info');
      return existingForSite;
    }

    const createdList = [];
    for (let i = 0; i < needed; i++) {
      const index = existingForSite.length + i;
      const zoneName = defaultZoneNames[index % defaultZoneNames.length] || `Patrol Post #${index + 1}`;
      const cpCode = `SPOT-CP-${site.id.slice(-3).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      
      const docData = {
        name: `${zoneName}`,
        siteId: site.id,
        siteName: site.name,
        qrCode: cpCode,
        zone: `Zone ${String.fromCharCode(65 + (index % 6))}`,
        description: `Designated scan checkpoint for ${site.name}`,
        lat: site.lat ? site.lat + (Math.random() - 0.5) * 0.0015 : null,
        lng: site.lng ? site.lng + (Math.random() - 0.5) * 0.0015 : null,
      };

      let docId = `CP-${Date.now().toString().slice(-4)}${i}`;
      if (hasFirebaseConfig && db) {
        try {
          docId = await addItem('checkpoints', docData);
        } catch (e) {
          console.warn('Batch add CP err:', e);
        }
      }
      createdList.push({ id: docId, ...docData });
    }

    setCheckpoints((prev) => [...createdList, ...prev]);
    updateSite(site.id, { checkpointsCount: existingForSite.length + createdList.length });
    addToast('Batch QR Generated', `Generated ${createdList.length} new QR Checkpoints for ${site.name}.`, 'success');
    return [...existingForSite, ...createdList];
  };

  // -------------------------------------------------------------
  // CRUD — Clients
  // -------------------------------------------------------------
  const addClient = async (newClient) => {
    const created = {
      id: `CLT-${Date.now().toString().slice(-4)}`,
      company: newClient.company,
      contactPerson: newClient.contactPerson || 'Contact Person',
      email: newClient.email || 'contact@client.com',
      phone: newClient.phone || 'N/A',
      supervisor: newClient.supervisor || 'Unassigned',
      status: newClient.status || 'Active',
      deploymentsCount: 0,
      assignedGuards: 0,
      slaCompliance: 100,
      contractStart: newClient.contractStart || '',
      contractEnd: newClient.contractEnd || '',
      notes: newClient.notes || ''
    };

    setClients((prev) => [created, ...prev]);

    if (hasFirebaseConfig && db) {
      try {
        await addItem('clients', created);
      } catch (e) {
        console.warn('Firestore add client:', e);
      }
    }
    addToast('Client Added', `${created.company} has been onboarded.`, 'success');
  };

  const updateClient = async (id, patch) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    if (hasFirebaseConfig && db) {
      try {
        await updateItem('clients', id, patch);
      } catch (e) {
        console.warn('Firestore update client:', e);
      }
    }
    addToast('Client Updated', `Client record has been updated.`, 'info');
  };

  const deleteClient = async (id) => {
    const target = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (hasFirebaseConfig && db) {
      try {
        await removeItem('clients', id);
      } catch (e) {
        console.warn('Firestore delete client:', e);
      }
    }
    addToast('Client Removed', `${target?.company || 'Client'} has been removed.`, 'danger');
  };

  // -------------------------------------------------------------
  // CRUD — Incidents
  // -------------------------------------------------------------
  const addIncident = async (newInc) => {
    const created = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      title: newInc.title,
      priority: newInc.priority || 'High',
      siteName: newInc.siteName || 'Deployment Site',
      location: newInc.location || 'Perimeter Zone',
      reporterName: newInc.reporterName || 'Duty Guard',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Investigating',
      evidencePhoto: newInc.evidencePhoto || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
      description: newInc.description || 'Incident filed by supervisor.',
      actionsTaken: 'Dispatch notification logged.'
    };

    setIncidents((prev) => [created, ...prev]);

    if (hasFirebaseConfig && db) {
      try {
        await addItem('incidents', created);
      } catch (e) {
        console.warn('Firestore add incident:', e);
      }
    }
    addToast('Incident Logged', `Priority incident ${created.id} submitted.`, 'danger');
  };

  const updateIncidentStatus = async (incidentId, newStatus) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status: newStatus } : i))
    );

    if (hasFirebaseConfig && db) {
      try {
        await updateItem('incidents', incidentId, { status: newStatus });
      } catch (err) {
        console.warn('Firestore update:', err);
      }
    }
  };

  const deleteIncident = async (id) => {
    const target = incidents.find((i) => i.id === id);
    setIncidents((prev) => prev.filter((i) => i.id !== id));
    if (hasFirebaseConfig && db) {
      try {
        await removeItem('incidents', id);
      } catch (e) {
        console.warn('Firestore delete incident:', e);
      }
    }
    addToast('Incident Removed', `Incident ${target?.id || id} has been deleted.`, 'danger');
  };

  // -------------------------------------------------------------
  // Assign & Unassign Device to Guard
  // -------------------------------------------------------------
  const assignDeviceToGuard = async (guardId, deviceId) => {
    const targetGuard = guards.find((g) => g.id === guardId);
    if (!targetGuard) return;

    // Any other guard holding this deviceId gets unassigned
    const otherGuards = guards.filter((g) => g.deviceId === deviceId && g.id !== guardId);

    setGuards((prev) =>
      prev.map((g) => {
        if (g.id === guardId) return { ...g, deviceId: deviceId || null };
        if (deviceId && g.deviceId === deviceId) return { ...g, deviceId: null };
        return g;
      })
    );

    if (hasFirebaseConfig && db) {
      try {
        await updateItem('users', guardId, { deviceId: deviceId || null });
        for (const og of otherGuards) {
          await updateItem('users', og.id, { deviceId: null });
        }
      } catch (e) {
        console.warn('Firestore assign device error:', e);
      }
    }

    if (deviceId) {
      addToast('Device Bound', `Device ${deviceId} bound to ${targetGuard.name}.`, 'success');
      playChime();
    } else {
      addToast('Device Unbound', `${targetGuard.name}'s device binding was cleared.`, 'info');
    }
  };

  const unassignDevice = async (deviceId) => {
    if (!deviceId) return;
    const affected = guards.filter((g) => g.deviceId === deviceId);

    setGuards((prev) =>
      prev.map((g) => (g.deviceId === deviceId ? { ...g, deviceId: null } : g))
    );

    if (hasFirebaseConfig && db) {
      try {
        for (const ag of affected) {
          await updateItem('users', ag.id, { deviceId: null });
        }
      } catch (e) {
        console.warn('Firestore unassign device error:', e);
      }
    }

    addToast('Device Unbound', `Device ${deviceId} is now unassigned.`, 'info');
  };

  const deleteDevice = async (device) => {
    if (!device?.id) throw new Error('Select a registered device before deleting.');

    const affectedGuards = guards.filter((guard) => guard.deviceId === device.deviceId);
    setDevices((prev) => prev.filter((item) => item.id !== device.id));
    setGuards((prev) => prev.map((guard) => (
      guard.deviceId === device.deviceId ? { ...guard, deviceId: null } : guard
    )));

    if (hasFirebaseConfig && db) {
      await removeItem('devices', device.id);
      await Promise.all(affectedGuards.map((guard) => (
        updateItem('users', guard.id, { deviceId: null })
      )));
    }

    addToast('Device Deleted', `${device.deviceId} was removed from registered devices.`, 'success');
  };

  // -------------------------------------------------------------
  // CRUD — Patrols
  // -------------------------------------------------------------
  const addPatrol = async (newPatrol) => {
    const created = {
      id: `PAT-${Date.now().toString().slice(-4)}`,
      guardId: newPatrol.guardId || 'G-100',
      guardName: newPatrol.guardName || 'Assigned Guard',
      guardPhoto: '',
      siteName: newPatrol.siteName || 'Facility Site',
      routeName: newPatrol.routeName || 'Perimeter Sweep',
      status: 'In Progress',
      progressPct: 0,
      completedCount: 0,
      totalCount: 5,
      remainingCount: 5,
      etaMinutes: 30,
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkpoints: [
        { id: 'CP-1', name: 'Entrance Gate', status: 'Pending' },
        { id: 'CP-2', name: 'Main Lobby', status: 'Pending' },
        { id: 'CP-3', name: 'Vault Entrance', status: 'Pending' }
      ]
    };

    setPatrols((prev) => [created, ...prev]);

    if (hasFirebaseConfig && db) {
      try {
        await addItem('patrolLogs', created);
      } catch (e) {
        console.warn('Firestore add patrol:', e);
      }
    }
    addToast('Patrol Initiated', `Route ${created.routeName} assigned.`, 'success');
  };

  // Compute stats dynamically from active DB datasets
  const stats = {
    activeGuards: guards.length,
    currentlyOnPatrol: guards.filter((g) => g.status === 'On Patrol').length,
    todaysPatrols: patrols.length,
    completedPatrols: patrols.filter((p) => p.status === 'Completed').length,
    delayedPatrols: patrols.filter((p) => p.status === 'Delayed' || p.status === 'Late').length,
    missedPatrols: patrols.filter((p) => p.status === 'Missed').length,
    offlineGuards: guards.filter((g) => g.status === 'Offline' || g.status === 'Off Duty').length,
    incidentsToday: incidents.length,
    avgPatrolDurationMinutes: 35.0,
    avgDelayMinutes: 3.5,
    attendanceRate: 100.0,
    faceVerificationSuccessRate: 100.0,
    offlineSessionsCount: guards.filter((g) => g.status === 'Offline').length,
    synchronizationSuccessRate: 100.0,
    qrCompletionRate: 100.0,
    gpsAccuracyMeters: 1.2
  };

  // Keyboard shortcut listener for Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SpotContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar,
        dbConnected,
        guards,
        sites,
        clients,
        patrols,
        incidents,
        auditLogs,
        liveEvents,
        devices,
        attendance,
        checkpointLogs,
        guardLocations,
        checkpoints,
        stats,
        selectedGuard,
        isGuardDrawerOpen,
        openGuardDrawer,
        closeGuardDrawer,
        globalSearchOpen,
        setGlobalSearchOpen,
        toasts,
        addToast,
        removeToast,
        // Guards CRUD
        addGuard,
        updateGuard,
        updateGuardPassword,
        enrollGuardFace,
        deleteGuardFace,
        deleteGuard,
        // Sites CRUD
        addSite,
        updateSite,
        deleteSite,
        // Checkpoints CRUD
        addCheckpoint,
        updateCheckpoint,
        deleteCheckpoint,
        batchGenerateSiteCheckpoints,
        // Clients CRUD
        addClient,
        updateClient,
        deleteClient,
        // Incidents CRUD
        addIncident,
        updateIncidentStatus,
        deleteIncident,
        // Patrols
        addPatrol,
        // Devices
        assignDeviceToGuard,
        unassignDevice,
        deleteDevice,
      }}
    >
      {children}
    </SpotContext.Provider>
  );
}

export const useSpot = () => useContext(SpotContext);
