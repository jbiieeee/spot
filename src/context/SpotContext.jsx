import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, hasFirebaseConfig } from '../lib/firebase';
import { subscribeCollection, updateItem, addItem, removeItem, setItem, uploadDataUrl } from '../lib/dataSource';

const SpotContext = createContext();

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

  // Database Connection Indicator
  const [dbConnected, setDbConnected] = useState(Boolean(hasFirebaseConfig && db));

  // Drawer & Modal States
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [isGuardDrawerOpen, setIsGuardDrawerOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Track previous guards state to detect device updates
  const prevGuardsRef = useRef({});

  // Toasts Notification Stack
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = 'info') => {
    const newToast = {
      id: `toast-${Date.now()}`,
      title,
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
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
        .map((u) => ({
          id: u.id,
          name: u.name || u.displayName || u.email || 'Guard Personnel',
          photo: u.photo || u.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          client: u.client || 'Client',
          siteId: u.siteId || 'SITE-01',
          siteName: u.siteName || 'Assigned Site',
          shift: u.shift || 'Day Shift',
          status: u.status || 'Idle',
          battery: u.battery !== undefined ? u.battery : 100,
          gpsAccuracy: u.gpsAccuracy || '1.5m',
          gpsLat: u.gpsLat || u.lat || 14.5547,
          gpsLng: u.gpsLng || u.lng || 121.0244,
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
        }));

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
      guardPhoto: doc.guardPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
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
        osVersion: d.osVersion || 'Unknown OS',
        lastActive: d.lastActive?.toDate ? d.lastActive.toDate() : null,
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
    };
  }, []);

  // -------------------------------------------------------------
  // CRUD — Guards
  // -------------------------------------------------------------
  const addGuard = async (newGuard) => {
    const created = {
      id: `G-${Date.now().toString().slice(-4)}`,
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
      photo: newGuard.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
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
    setGuards((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    if (hasFirebaseConfig && db) {
      try {
        await updateItem('users', id, patch);
      } catch (e) {
        console.warn('Firestore update user:', e);
      }
    }
    addToast('Guard Updated', `Guard record has been updated.`, 'info');
  };

  const enrollGuardFace = async (guard, capture) => {
    if (!guard?.id) throw new Error('Select a guard before enrolling a face.');
    if (!capture?.dataUrl) throw new Error('Capture a face photo before enrolling.');

    const enrolledAt = new Date();
    const enrolledAtLabel = enrolledAt.toLocaleString();
    const storagePath = `faceProfiles/${guard.id}/enrollment-${enrolledAt.getTime()}.jpg`;
    let facePhotoUrl = '';

    if (hasFirebaseConfig && db) {
      try {
        facePhotoUrl = await uploadDataUrl(storagePath, capture.dataUrl);
      } catch (e) {
        console.warn('Firebase Storage face upload:', e);
      }
    }

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
      storagePath: facePhotoUrl ? storagePath : '',
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
  // Assign Device to Guard
  // -------------------------------------------------------------
  const assignDeviceToGuard = async (guardId, deviceId) => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) return;

    // Optimistic update
    setGuards((prev) =>
      prev.map((g) => (g.id === guardId ? { ...g, deviceId: deviceId || null } : g))
    );

    if (hasFirebaseConfig && db) {
      try {
        await updateItem('users', guardId, { deviceId: deviceId || null });
      } catch (e) {
        console.warn('Firestore assign device:', e);
      }
    }

    if (deviceId) {
      addToast(
        'Device Assigned',
        `Device bound to ${guard.name}. Chime alert active.`,
        'success'
      );
      playChime();
    } else {
      addToast('Device Unlinked', `${guard.name}'s device binding has been removed.`, 'info');
    }
  };

  // -------------------------------------------------------------
  // CRUD — Patrols
  // -------------------------------------------------------------
  const addPatrol = async (newPatrol) => {
    const created = {
      id: `PAT-${Date.now().toString().slice(-4)}`,
      guardId: newPatrol.guardId || 'G-100',
      guardName: newPatrol.guardName || 'Assigned Guard',
      guardPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
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
        enrollGuardFace,
        deleteGuard,
        // Sites CRUD
        addSite,
        updateSite,
        deleteSite,
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
      }}
    >
      {children}
    </SpotContext.Provider>
  );
}

export const useSpot = () => useContext(SpotContext);
