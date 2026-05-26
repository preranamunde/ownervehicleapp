import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Switch, Alert,
  Modal, SafeAreaView, FlatList, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, apiPost, apiPut, ENDPOINTS } from '../utils/Api';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const NAVY     = '#1E3A5F';
const RED      = '#DC2626';
const GREY     = '#9CA3AF';
const SUBTEXT  = '#6B7280';
const WHITE    = '#FFFFFF';
const LIGHT_BG = '#EFF6FF';
const RED_BG   = '#FEF2F2';
const TEXT     = '#111827';

const STORAGE_KEY_AUTO   = '@nutan_auto_alerts';
const STORAGE_KEY_MANUAL = '@nutan_manual_alerts';

const ALERT_TYPES = [
  { key: 'ignition', label: 'Ignition Alert', icon: 'car-key',              apiKey: 'ignition_alert', defaultOn: false },
  { key: 'movement', label: 'Movement Alert', icon: 'car-traction-control', apiKey: 'movement_alert', defaultOn: false },
  { key: 'fuel',     label: 'Fuel Alert',     icon: 'gas-station',          apiKey: 'fuel_alert',     defaultOn: true  },
  { key: 'tamper',   label: 'Tamper Alert',   icon: 'shield-alert',         apiKey: 'tamper_alert',   defaultOn: true  },
];
const PROTECTED_ALERTS = ['fuel', 'tamper'];

/* ─── Day Mapping ────────────────────────────────────────────────────────── */
const SHORT_TO_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};

function toApiDay(shortDays = []) {
  if (!shortDays || shortDays.length === 0) return 'Monday';
  return SHORT_TO_FULL[shortDays[0]] || shortDays[0];
}

/* ─── Time helpers ───────────────────────────────────────────────────────── */
function getCurrentHourMin() {
  const now = new Date();
  return { hour: now.getHours(), min: now.getMinutes() };
}

function toApiDateTime(hour, min) {
  const now    = new Date();
  const dd     = String(now.getDate()).padStart(2, '0');
  const mm     = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy   = now.getFullYear();
  const h12    = hour % 12 === 0 ? 12 : hour % 12;
  const ampm   = hour < 12 ? 'AM' : 'PM';
  const minStr = String(min).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${String(h12).padStart(2, '0')}:${minStr} ${ampm}`;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => ({
  label: String(i + 1).padStart(2, '0'),
  value: i + 1,
}));
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => ({
  label: String(i).padStart(2, '0'),
  value: i,
}));

function formatTime(hourVal, minVal) {
  const h    = hourVal % 12 === 0 ? 12 : hourVal % 12;
  const ampm = hourVal < 12 ? 'AM' : 'PM';
  return `${String(h).padStart(2, '0')}:${String(minVal).padStart(2, '0')} ${ampm}`;
}

export function formatDaysLabel(days) {
  if (!days || days.length === 0) return 'Not set';
  if (days.length === 7) return 'Every Day';
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const weekend  = ['Sat', 'Sun'];
  if (days.length === 5 && weekdays.every(d => days.includes(d))) return 'Weekdays';
  if (days.length === 2 && weekend.every(d => days.includes(d)))  return 'Weekend';
  return days.join(', ');
}

function buildPickerHTML(lat = 18.5204, lng = 73.8567, radius = 200, showLabel = false) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%}
    .pin{background:#1E3A5F;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(30,58,95,0.5);font-size:15px}
    #place-label{position:absolute;bottom:0;left:0;right:0;z-index:1000;background:rgba(30,58,95,0.88);color:#fff;font-size:13px;font-weight:600;padding:7px 14px;text-align:center;display:${showLabel ? 'block' : 'none'};}
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="place-label">📍 Pune, Maharashtra</div>
  <script>
    var lat=${lat},lng=${lng},rad=${parseInt(radius,10)||200};
    var map=L.map('map',{attributionControl:false}).setView([lat,lng],15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    var icon=L.divIcon({className:'',html:'<div class="pin">📍</div>',iconSize:[32,32],iconAnchor:[16,16]});
    var marker=L.marker([lat,lng],{icon,draggable:true}).addTo(map);
    var circle=L.circle([lat,lng],{radius:rad,color:'#1E3A5F',fillColor:'#1E3A5F',fillOpacity:0.13,weight:2}).addTo(map);
    var placeLabel=document.getElementById('place-label');
    function reverseGeocode(la,ln){
      placeLabel.style.display='block';
      placeLabel.textContent='📍 Loading...';
      fetch('https://nominatim.openstreetmap.org/reverse?lat='+la+'&lon='+ln+'&format=json')
        .then(r=>r.json()).then(d=>{
          var name=d.display_name?d.display_name.split(',').slice(0,2).join(','):'Unknown';
          placeLabel.textContent='📍 '+name;
          window.ReactNativeWebView.postMessage(JSON.stringify({lat:la,lng:ln,place:name}));
        }).catch(()=>window.ReactNativeWebView.postMessage(JSON.stringify({lat:la,lng:ln,place:''})));
    }
    marker.on('dragend',function(e){var p=e.target.getLatLng();circle.setLatLng(p);reverseGeocode(p.lat,p.lng);});
    map.on('click',function(e){marker.setLatLng(e.latlng);circle.setLatLng(e.latlng);reverseGeocode(e.latlng.lat,e.latlng.lng);});
  </script>
</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════════════════════
   DRUM WHEEL
   ══════════════════════════════════════════════════════════════════════════ */
const ITEM_H  = 52;
const VISIBLE = 5;
const PAD     = Math.floor(VISIBLE / 2);

function DrumWheel({ data, selectedValue, onSelect }) {
  const listRef  = useRef(null);
  const mounted  = useRef(false);
  const padded   = [...Array(PAD).fill(null), ...data, ...Array(PAD).fill(null)];
  const realIdx  = data.findIndex(d => d.value === selectedValue);

  const scrollTo = useCallback((animated) => {
    if (!listRef.current || realIdx < 0) return;
    listRef.current.scrollToOffset({ offset: realIdx * ITEM_H, animated });
  }, [realIdx]);

  useEffect(() => {
    const delay = mounted.current ? 0 : 120;
    const t = setTimeout(() => scrollTo(mounted.current), delay);
    mounted.current = true;
    return () => clearTimeout(t);
  }, [scrollTo]);

  const onScrollEnd = useCallback((e) => {
    const idx     = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, data.length - 1));
    if (data[clamped] && data[clamped].value !== selectedValue) {
      onSelect(data[clamped].value);
    }
  }, [data, selectedValue, onSelect]);

  const renderItem = useCallback(({ item, index }) => {
    if (!item) return <View style={{ height: ITEM_H }} />;
    const dist = Math.abs(index - (realIdx + PAD));
    const isSelected = dist === 0;
    return (
      <TouchableOpacity style={drumS.item} activeOpacity={0.7} onPress={() => onSelect(item.value)}>
        <Text style={[
          drumS.label,
          isSelected && drumS.labelSel,
          dist === 1 && drumS.labelNear,
          dist >= 2  && drumS.labelFar,
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }, [realIdx, onSelect]);

  return (
    <View style={drumS.outer}>
      <View style={drumS.highlight} pointerEvents="none" />
      <FlatList
        ref={listRef}
        data={padded}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
        scrollEventThrottle={16}
        windowSize={VISIBLE + 2}
        maxToRenderPerBatch={VISIBLE + 4}
        style={drumS.list}
      />
    </View>
  );
}

const drumS = StyleSheet.create({
  outer:      { flex: 1, height: ITEM_H * VISIBLE, overflow: 'hidden' },
  highlight:  {
    position: 'absolute', top: PAD * ITEM_H, left: 4, right: 4, height: ITEM_H,
    borderRadius: 12, backgroundColor: LIGHT_BG, borderWidth: 1.5, borderColor: '#1E3A5F22',
  },
  list:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' },
  item:       { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  label:      { fontSize: 19, fontWeight: '400', color: GREY },
  labelSel:   { fontSize: 30, fontWeight: '800', color: NAVY },
  labelNear:  { fontSize: 20, fontWeight: '500', color: '#9CA3AF', opacity: 0.7 },
  labelFar:   { fontSize: 17, fontWeight: '400', color: '#9CA3AF', opacity: 0.35 },
});

/* ══════════════════════════════════════════════════════════════════════════
   TIME PICKER MODAL
   ══════════════════════════════════════════════════════════════════════════ */
function to12h(h24)     { return h24 % 12 === 0 ? 12 : h24 % 12; }
function toAmPm(h24)    { return h24 < 12 ? 'AM' : 'PM'; }
function to24h(h12, ap) {
  if (ap === 'AM') return h12 === 12 ? 0  : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

function TimePickerModal({ visible, hourVal, minVal, onSave, onClose }) {
  const [selH12, setSelH12] = useState(to12h(hourVal));
  const [selMin, setSelMin] = useState(minVal);
  const [ampm,   setAmPm]   = useState(toAmPm(hourVal));

  useEffect(() => {
    if (visible) { setSelH12(to12h(hourVal)); setSelMin(minVal); setAmPm(toAmPm(hourVal)); }
  }, [visible, hourVal, minVal]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={tpS.overlay}>
        <View style={tpS.card}>
          <Text style={tpS.title}>SELECT TIME</Text>
          <View style={tpS.drumsRow}>
            <DrumWheel data={HOURS_12}   selectedValue={selH12} onSelect={setSelH12} />
            <Text style={tpS.colon}>:</Text>
            <DrumWheel data={MINUTES_60} selectedValue={selMin} onSelect={setSelMin} />
          </View>
          <View style={tpS.ampmWrap}>
            {['AM', 'PM'].map(v => (
              <TouchableOpacity key={v} style={[tpS.ampmBtn, ampm === v && tpS.ampmActive]} onPress={() => setAmPm(v)} activeOpacity={0.8}>
                <Text style={[tpS.ampmTxt, ampm === v && tpS.ampmActiveTxt]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={tpS.btnRow}>
            <TouchableOpacity style={tpS.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={tpS.cancelTxt}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tpS.confirmBtn} activeOpacity={0.85}
              onPress={() => { onSave(to24h(selH12, ampm), selMin); onClose(); }}>
              <Text style={tpS.confirmTxt}>CONFIRM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const tpS = StyleSheet.create({
  overlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center' },
  card:       {
    backgroundColor: WHITE, borderRadius: 24, width: '85%',
    paddingTop: 22, paddingHorizontal: 16, paddingBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24,
    shadowOffset: { width:0, height:8 }, elevation: 14,
  },
  title:      { textAlign:'center', fontSize:11, fontWeight:'700', color:SUBTEXT, letterSpacing:1.6, textTransform:'uppercase', marginBottom:10 },
  drumsRow:   { flexDirection:'row', alignItems:'center', height: ITEM_H * VISIBLE, marginBottom: 16 },
  colon:      { fontSize:30, fontWeight:'700', color:NAVY, paddingHorizontal:4 },
  ampmWrap:   { flexDirection:'row', backgroundColor:'#F3F4F6', borderRadius:50, padding:4, alignSelf:'center', marginBottom:20 },
  ampmBtn:    { paddingVertical:9, paddingHorizontal:32, borderRadius:50 },
  ampmActive: { backgroundColor:NAVY },
  ampmTxt:    { fontSize:15, fontWeight:'600', color:SUBTEXT },
  ampmActiveTxt:{ color:WHITE },
  btnRow:     { flexDirection:'row', gap:12 },
  cancelBtn:  { flex:1, height:50, borderRadius:14, borderWidth:1.5, borderColor:'#E5E7EB', alignItems:'center', justifyContent:'center' },
  cancelTxt:  { fontSize:13, fontWeight:'700', color:SUBTEXT, letterSpacing:1 },
  confirmBtn: { flex:1, height:50, borderRadius:14, backgroundColor:NAVY, alignItems:'center', justifyContent:'center' },
  confirmTxt: { fontSize:13, fontWeight:'700', color:WHITE, letterSpacing:1 },
});

/* ══════════════════════════════════════════════════════════════════════════
   INFO ROW
   ══════════════════════════════════════════════════════════════════════════ */
function InfoRow({ icon, label, value, onPress, active }) {
  return (
    <TouchableOpacity style={[styles.infoRow, active && styles.infoRowActive]} onPress={onPress} activeOpacity={0.7}>
      <Icon name={icon} size={20} color={NAVY} style={styles.infoIcon} />
      <View style={styles.infoTexts}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, active && { color: NAVY }]}>{value || 'Not set'}</Text>
      </View>
      <Icon name={active ? 'chevron-up' : 'chevron-right'} size={20} color={active ? NAVY : GREY} />
    </TouchableOpacity>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN SCREEN
   ══════════════════════════════════════════════════════════════════════════ */
export default function NutanAlertScreen({ navigation, route }) {
  const alertMode   = route?.params?.alertMode   ?? 'auto';
  const savedConfig = route?.params?.savedConfig  ?? null;
  const vehicleId   = route?.params?.vehicleId;
  const gpsIdParam  = route?.params?.gpsId ?? null;
  const onSave      = route?.params?.onSave;
  // ── KEY FIX: read isEditMode from route params ──
  const isEditMode  = route?.params?.isEditMode   ?? false;

  const [gpsId, setGpsId] = useState(gpsIdParam);

  useEffect(() => {
    if (gpsId || !vehicleId) return;
    (async () => {
      try {
        const vehicles = await apiGet(ENDPOINTS.VEHICLES);
        const found = Array.isArray(vehicles)
          ? vehicles.find(v => v._id === vehicleId || v.id === vehicleId)
          : null;
        if (found?.gps_id?._id) {
          setGpsId(found.gps_id._id);
        } else if (found?.gps_id) {
          setGpsId(found.gps_id);
        }
      } catch (e) {
        console.warn('⚠️ Could not fetch vehicle gpsId:', e.message);
      }
    })();
  }, [vehicleId, gpsId]);

  const [activeTab, setActiveTab] = useState(
    alertMode === 'manual' ? 'manual' : 'auto'
  );

  const [isSavingAuto,   setIsSavingAuto]   = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const isSavingAutoRef   = useRef(false);
  const isSavingManualRef = useRef(false);

  const now = getCurrentHourMin();

  /* ── Auto tab state ── */
  const [latitude,      setLatitude]      = useState(savedConfig?.latitude      ?? 18.5204);
  const [longitude,     setLongitude]     = useState(savedConfig?.longitude     ?? 73.8567);
  const [autoPlaceName, setAutoPlaceName] = useState(savedConfig?.placeName     ?? 'Pune, Maharashtra');
  const [alertDays,     setAlertDays]     = useState(savedConfig?.alertDays     ?? []);
  const [startHour,     setStartHour]     = useState(savedConfig?.startHour     ?? now.hour);
  const [startMin,      setStartMin]      = useState(savedConfig?.startMin      ?? now.min);
  const [endHour,       setEndHour]       = useState(savedConfig?.endHour       ?? now.hour);
  const [endMin,        setEndMin]        = useState(savedConfig?.endMin        ?? now.min);
  const [alerts,        setAlerts]        = useState(
    savedConfig?.alerts ??
    ALERT_TYPES.reduce((acc, a) => ({ ...acc, [a.key]: a.defaultOn }), {})
  );

  /* ── Manual tab state ── */
  const [manualLatitude,  setManualLatitude]  = useState(savedConfig?.manualLatitude  ?? 18.5204);
  const [manualLongitude, setManualLongitude] = useState(savedConfig?.manualLongitude ?? 73.8567);
  const [manualPlaceName, setManualPlaceName] = useState(savedConfig?.manualPlaceName ?? 'Pune, Maharashtra');
  const [manualStartHour, setManualStartHour] = useState(savedConfig?.manualStartHour ?? now.hour);
  const [manualStartMin,  setManualStartMin]  = useState(savedConfig?.manualStartMin  ?? now.min);
  const [manualEndHour,   setManualEndHour]   = useState(savedConfig?.manualEndHour   ?? now.hour);
  const [manualEndMin,    setManualEndMin]    = useState(savedConfig?.manualEndMin    ?? now.min);
  const [manualAlerts,    setManualAlerts]    = useState(
    savedConfig?.manualAlerts ??
    ALERT_TYPES.reduce((acc, a) => ({ ...acc, [a.key]: a.defaultOn }), {})
  );

  /* ── Shared picker state ── */
  const [pickerTarget, setPickerTarget] = useState(null);
  const openPicker  = (t) => setPickerTarget(t);
  const closePicker = ()  => setPickerTarget(null);

  const pickerHour = () => {
    if (pickerTarget === 'autoStart')   return startHour;
    if (pickerTarget === 'autoEnd')     return endHour;
    if (pickerTarget === 'manualStart') return manualStartHour;
    if (pickerTarget === 'manualEnd')   return manualEndHour;
    return now.hour;
  };
  const pickerMin = () => {
    if (pickerTarget === 'autoStart')   return startMin;
    if (pickerTarget === 'autoEnd')     return endMin;
    if (pickerTarget === 'manualStart') return manualStartMin;
    if (pickerTarget === 'manualEnd')   return manualEndMin;
    return now.min;
  };
  const handlePickerSave = (h, m) => {
    if (pickerTarget === 'autoStart')   { setStartHour(h);       setStartMin(m); }
    if (pickerTarget === 'autoEnd')     { setEndHour(h);         setEndMin(m); }
    if (pickerTarget === 'manualStart') { setManualStartHour(h); setManualStartMin(m); }
    if (pickerTarget === 'manualEnd')   { setManualEndHour(h);   setManualEndMin(m); }
  };

  const [confirmAlert,    setConfirmAlert]    = useState(null);
  const [confirmAlertTab, setConfirmAlertTab] = useState('auto');

  const handleMapMessage = (e) => {
    try {
      const { lat, lng, place } = JSON.parse(e.nativeEvent.data);
      setLatitude(lat); setLongitude(lng);
      if (place) setAutoPlaceName(place);
    } catch {}
  };
  const handleManualMapMessage = (e) => {
    try {
      const { lat, lng, place } = JSON.parse(e.nativeEvent.data);
      setManualLatitude(lat); setManualLongitude(lng);
      if (place) setManualPlaceName(place);
    } catch {}
  };

  const handleAlertToggle = (key, value) => {
    if (!value && PROTECTED_ALERTS.includes(key)) { setConfirmAlert(key); setConfirmAlertTab('auto'); return; }
    setAlerts(p => ({ ...p, [key]: value }));
  };
  const handleManualAlertToggle = (key, value) => {
    if (!value && PROTECTED_ALERTS.includes(key)) { setConfirmAlert(key); setConfirmAlertTab('manual'); return; }
    setManualAlerts(p => ({ ...p, [key]: value }));
  };

  /* ─────────────────────────────────────────────────────────────────────────
     BUILD API PAYLOAD
     ───────────────────────────────────────────────────────────────────────── */
  const buildAutoPayload = () => {
    const payload = {
      alert_type:     'auto',
      status:         true,
      day:            toApiDay(alertDays),
      start_time:     toApiDateTime(startHour, startMin),
      end_time:       toApiDateTime(endHour, endMin),
      location: [
        { longitude, latitude },
      ],
      radius:         500,
      tamper_alert:   alerts.tamper,
      fuel_alert:     alerts.fuel,
      movement_alert: alerts.movement,
      ignition_alert: alerts.ignition,
    };
    if (gpsId) payload.gps_id = gpsId;
    return payload;
  };

  const buildManualPayload = () => {
    const payload = {
      alert_type:     'manual',
      status:         true,
      day:            'Monday',
      start_time:     toApiDateTime(manualStartHour, manualStartMin),
      end_time:       toApiDateTime(manualEndHour, manualEndMin),
      location: [
        { longitude: manualLongitude, latitude: manualLatitude },
      ],
      radius:         500,
      tamper_alert:   manualAlerts.tamper,
      fuel_alert:     manualAlerts.fuel,
      movement_alert: manualAlerts.movement,
      ignition_alert: manualAlerts.ignition,
    };
    if (gpsId) payload.gps_id = gpsId;
    return payload;
  };

  /* ─────────────────────────────────────────────────────────────────────────
     SAVE AUTO ALERT
     ─────────────────────────────────────────────────────────────────────────
     LOGIC:
       - isEditMode === true  → always PUT to /api/alert/:alertId
       - isEditMode === false → always POST to /api/alert/:vehicleId
     ───────────────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (isSavingAutoRef.current) return;

    if (!vehicleId) {
      Alert.alert('Error', 'Vehicle ID is missing. Please go back and try again.');
      return;
    }

    // In edit mode we MUST have an alertId to PUT
    const alertId = savedConfig?.apiId;
    if (isEditMode && !alertId) {
      Alert.alert('Error', 'Alert ID is missing. Cannot update this alert.');
      return;
    }

    isSavingAutoRef.current = true;
    setIsSavingAuto(true);

    try {
      const payload = buildAutoPayload();
      console.log('📤 Auto Alert payload:', JSON.stringify(payload, null, 2));
      console.log('🔧 isEditMode:', isEditMode, '| alertId:', alertId);

      let response;

      if (isEditMode) {
        // ── EDIT: always PUT /api/alert/:alertId ──
        const endpoint = ENDPOINTS.ALERT_UPDATE(alertId);
        console.log('📡 PUT (edit mode)', endpoint);
        response = await apiPut(endpoint, payload);
      } else {
        // ── CREATE: POST /api/alert/:vehicleId ──
        const endpoint = `${ENDPOINTS.ALERTS}/${vehicleId}`;
        console.log('📡 POST (create mode)', endpoint);
        response = await apiPost(endpoint, payload);
      }

      console.log('✅ API Response:', JSON.stringify(response, null, 2));

      const savedApiId =
        response?.alert?._id ??
        response?.data?._id  ??
        response?._id        ??
        alertId              ??
        null;

      const localConfig = {
        alertMode:    'auto',
        apiId:        savedApiId,
        latitude,
        longitude,
        placeName:    autoPlaceName,
        alertDays,
        startHour,
        startMin,
        endHour,
        endMin,
        alerts,
        radius:       500,
      };

      try {
        const raw      = await AsyncStorage.getItem(STORAGE_KEY_AUTO);
        const existing = raw ? JSON.parse(raw) : [];
        if (isEditMode && alertId) {
          const idx = existing.findIndex(c => c.apiId === alertId);
          if (idx !== -1) {
            existing[idx] = { ...localConfig, enabled: existing[idx].enabled };
          } else {
            existing.push({ ...localConfig, enabled: true });
          }
        } else {
          existing.push({ ...localConfig, enabled: true });
        }
        await AsyncStorage.setItem(STORAGE_KEY_AUTO, JSON.stringify(existing));
      } catch (storageErr) {
        console.warn('⚠️ Local storage update failed:', storageErr);
      }

      onSave?.(localConfig);
      Alert.alert(
        isEditMode ? 'Updated' : 'Saved',
        isEditMode ? 'Auto Alert updated successfully.' : 'Auto Alert configured successfully.',
        [{ text: 'OK', onPress: () => navigation?.goBack() }],
      );
    } catch (error) {
      console.error('❌ Save Auto Alert error:', error);
      Alert.alert('Save Failed', `${error?.message || 'Unknown error'}`, [{ text: 'OK' }]);
    } finally {
      isSavingAutoRef.current = false;
      setIsSavingAuto(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
     SAVE MANUAL ALERT
     ───────────────────────────────────────────────────────────────────────── */
  const handleManualSave = async () => {
    if (isSavingManualRef.current) return;

    if (!vehicleId) {
      Alert.alert('Error', 'Vehicle ID is missing. Please go back and try again.');
      return;
    }

    const alertId = savedConfig?.apiId;
    if (isEditMode && !alertId) {
      Alert.alert('Error', 'Alert ID is missing. Cannot update this alert.');
      return;
    }

    isSavingManualRef.current = true;
    setIsSavingManual(true);

    try {
      const payload = buildManualPayload();
      console.log('📤 Manual Alert payload:', JSON.stringify(payload, null, 2));
      console.log('🔧 isEditMode:', isEditMode, '| alertId:', alertId);

      let response;

      if (isEditMode) {
        // ── EDIT: always PUT /api/alert/:alertId ──
        const endpoint = ENDPOINTS.ALERT_UPDATE(alertId);
        console.log('📡 PUT (edit mode)', endpoint);
        response = await apiPut(endpoint, payload);
      } else {
        // ── CREATE: POST /api/alert/:vehicleId ──
        const endpoint = `${ENDPOINTS.ALERTS}/${vehicleId}`;
        console.log('📡 POST (create mode)', endpoint);
        response = await apiPost(endpoint, payload);
      }

      console.log('✅ API Response:', JSON.stringify(response, null, 2));

      const savedApiId =
        response?.alert?._id ??
        response?.data?._id  ??
        response?._id        ??
        alertId              ??
        null;

      const localConfig = {
        alertMode:        'manual',
        apiId:            savedApiId,
        latitude:         manualLatitude,
        longitude:        manualLongitude,
        placeName:        manualPlaceName,
        manualLatitude,
        manualLongitude,
        manualPlaceName,
        manualStartHour,
        manualStartMin,
        manualEndHour,
        manualEndMin,
        alerts:           manualAlerts,
        manualAlerts,
        radius:           500,
      };

      try {
        const raw      = await AsyncStorage.getItem(STORAGE_KEY_MANUAL);
        const existing = raw ? JSON.parse(raw) : [];
        if (isEditMode && alertId) {
          const idx = existing.findIndex(c => c.apiId === alertId);
          if (idx !== -1) {
            existing[idx] = { ...localConfig, enabled: existing[idx].enabled };
          } else {
            existing.push({ ...localConfig, enabled: true });
          }
        } else {
          existing.push({ ...localConfig, enabled: true });
        }
        await AsyncStorage.setItem(STORAGE_KEY_MANUAL, JSON.stringify(existing));
      } catch (storageErr) {
        console.warn('⚠️ Local storage update failed:', storageErr);
      }

      onSave?.(localConfig);
      Alert.alert(
        isEditMode ? 'Updated' : 'Saved',
        isEditMode ? 'Manual Alert updated successfully.' : 'Manual Alert configured successfully.',
        [{ text: 'OK', onPress: () => navigation?.goBack() }],
      );
    } catch (error) {
      console.error('❌ Save Manual Alert error:', error);
      Alert.alert('Save Failed', `${error?.message || 'Unknown error'}`, [{ text: 'OK' }]);
    } finally {
      isSavingManualRef.current = false;
      setIsSavingManual(false);
    }
  };

  const openAlertDays = () =>
    navigation.navigate('AlertDaysScreen', { selectedDays: alertDays, onSave: (d) => setAlertDays(d) });

  /* ── Two-tab bar ── */
  const TABS = [
    { key: 'auto',   label: 'Auto',   color: NAVY      },
    { key: 'manual', label: 'Manual', color: '#059669' },
  ];

  const TabBar = () => (
    <View style={styles.tabBar}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => { setActiveTab(tab.key); closePicker(); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabTxt, isActive && { color: tab.color, fontWeight: '800' }]}>
              {tab.label}
            </Text>
            <View style={[styles.tabUnderline, { backgroundColor: isActive ? tab.color : 'transparent' }]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  /* ── AUTO TAB ── */
  const AutoContent = () => (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.cardHeader}><Icon name="map-marker-radius" size={16} color={NAVY} /><Text style={styles.cardTitle}>Select Location</Text></View>
        <Text style={styles.cardHint}>Tap map or drag pin to set alert zone</Text>
        <View style={styles.mapBox}>
          <WebView
            originWhitelist={['*']}
            source={{ html: buildPickerHTML(latitude, longitude, 200, false) }}
            style={{ flex: 1 }}
            javaScriptEnabled domStorageEnabled
            onMessage={handleMapMessage}
            scrollEnabled={false}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}><Icon name="calendar-week" size={16} color={NAVY} /><Text style={styles.cardTitle}>Schedule</Text></View>
        <InfoRow icon="calendar-check-outline" label="Alert Days" value={formatDaysLabel(alertDays)} onPress={openAlertDays} />
        <View style={styles.divider} />
        <InfoRow icon="clock-start" label="Start Time" value={formatTime(startHour, startMin)} onPress={() => openPicker('autoStart')} active={pickerTarget === 'autoStart'} />
        <View style={styles.divider} />
        <InfoRow icon="clock-end" label="End Time" value={formatTime(endHour, endMin)} onPress={() => openPicker('autoEnd')} active={pickerTarget === 'autoEnd'} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}><Icon name="bell-outline" size={16} color={NAVY} /><Text style={styles.cardTitle}>Alert Types</Text></View>
        {ALERT_TYPES.map((a, i) => (
          <View key={a.key} style={[styles.toggleRow, i < ALERT_TYPES.length - 1 && styles.toggleBorder]}>
            <View style={[styles.alertIconBox, alerts[a.key] && styles.alertIconBoxOn]}>
              <Icon name={a.icon} size={20} color={alerts[a.key] ? NAVY : GREY} />
            </View>
            <Text style={styles.toggleLabel}>{a.label}</Text>
            <Switch value={alerts[a.key]} onValueChange={v => handleAlertToggle(a.key, v)}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }} thumbColor={alerts[a.key] ? NAVY : GREY} />
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, isSavingAuto && styles.saveBtnDisabled]}
        onPress={handleSave}
        activeOpacity={0.85}
        disabled={isSavingAuto}
      >
        {isSavingAuto ? (
          <ActivityIndicator color={WHITE} size="small" />
        ) : (
          <>
            <Icon name={isEditMode ? 'content-save-edit-outline' : 'content-save-outline'} size={19} color={WHITE} />
            <Text style={styles.saveBtnTxt}>{isEditMode ? 'Update Auto Alert' : 'Save Auto Alert'}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  /* ── MANUAL TAB ── */
  const ManualContent = () => (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.cardHeader}><Icon name="map-marker-radius" size={16} color={NAVY} /><Text style={styles.cardTitle}>Select Location</Text></View>
        <Text style={styles.cardHint}>Tap map or drag pin to set alert zone</Text>
        <View style={styles.placeChip}>
          <Icon name="map-marker" size={15} color={NAVY} />
          <Text style={styles.placeChipText} numberOfLines={1}>{manualPlaceName || 'Detecting location...'}</Text>
        </View>
        <View style={styles.mapBox}>
          <WebView
            originWhitelist={['*']}
            source={{ html: buildPickerHTML(manualLatitude, manualLongitude, 200, true) }}
            style={{ flex: 1 }}
            javaScriptEnabled domStorageEnabled
            onMessage={handleManualMapMessage}
            scrollEnabled={false}
          />
        </View>
        <View style={styles.coordRow}>
          <Icon name="crosshairs-gps" size={13} color={GREY} />
          <Text style={styles.coordText}>{manualLatitude.toFixed(5)}, {manualLongitude.toFixed(5)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}><Icon name="clock-outline" size={16} color={NAVY} /><Text style={styles.cardTitle}>Time Selection</Text></View>
        <InfoRow icon="clock-start" label="Start Time" value={formatTime(manualStartHour, manualStartMin)} onPress={() => openPicker('manualStart')} active={pickerTarget === 'manualStart'} />
        <View style={styles.divider} />
        <InfoRow icon="clock-end" label="End Time" value={formatTime(manualEndHour, manualEndMin)} onPress={() => openPicker('manualEnd')} active={pickerTarget === 'manualEnd'} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}><Icon name="bell-outline" size={16} color={NAVY} /><Text style={styles.cardTitle}>Alert Types</Text></View>
        {ALERT_TYPES.map((a, i) => (
          <View key={a.key} style={[styles.toggleRow, i < ALERT_TYPES.length - 1 && styles.toggleBorder]}>
            <View style={[styles.alertIconBox, manualAlerts[a.key] && styles.alertIconBoxOn]}>
              <Icon name={a.icon} size={20} color={manualAlerts[a.key] ? NAVY : GREY} />
            </View>
            <Text style={styles.toggleLabel}>{a.label}</Text>
            <Switch value={manualAlerts[a.key]} onValueChange={v => handleManualAlertToggle(a.key, v)}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }} thumbColor={manualAlerts[a.key] ? NAVY : GREY} />
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: '#059669' }, isSavingManual && styles.saveBtnDisabled]}
        onPress={handleManualSave}
        activeOpacity={0.85}
        disabled={isSavingManual}
      >
        {isSavingManual ? (
          <ActivityIndicator color={WHITE} size="small" />
        ) : (
          <>
            <Icon name={isEditMode ? 'content-save-edit-outline' : 'content-save-outline'} size={19} color={WHITE} />
            <Text style={styles.saveBtnTxt}>{isEditMode ? 'Update Manual Alert' : 'Save Manual Alert'}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const ConfirmModal = () => (
    <Modal transparent visible={!!confirmAlert} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconCircle}><Icon name="alert-circle-outline" size={36} color={RED} /></View>
          <Text style={styles.modalTitle}>Turn Off Alert?</Text>
          <Text style={styles.modalBody}>
            Are you sure you want to turn off{' '}
            <Text style={{ fontWeight: '700', color: NAVY }}>{ALERT_TYPES.find(a => a.key === confirmAlert)?.label}</Text>
            ?{'\n'}This alert is recommended to keep enabled.
          </Text>
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setConfirmAlert(null)}>
              <Text style={styles.modalCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirm} onPress={() => {
              if (confirmAlertTab === 'manual') setManualAlerts(p => ({ ...p, [confirmAlert]: false }));
              else setAlerts(p => ({ ...p, [confirmAlert]: false }));
              setConfirmAlert(null);
            }}>
              <Text style={styles.modalConfirmTxt}>Turn Off</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Icon name="arrow-left" size={22} color={WHITE} />
        </TouchableOpacity>
        {/* ── Show "Edit Alert" vs "Nutan Alert" in header ── */}
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Alert' : 'Nutan Alert'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <TabBar />
      {activeTab === 'auto'   && <AutoContent />}
      {activeTab === 'manual' && <ManualContent />}

      <TimePickerModal
        visible={!!pickerTarget}
        hourVal={pickerHour()}
        minVal={pickerMin()}
        onSave={handlePickerSave}
        onClose={closePicker}
      />
      <ConfirmModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: NAVY, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '700' },

  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    marginHorizontal: 16, marginTop: 14, marginBottom: 8,
    borderRadius: 14, padding: 4,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  tab:         { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', paddingBottom: 2 },
  tabTxt:      { fontSize: 14, fontWeight: '600', color: SUBTEXT },
  tabUnderline:{ position: 'absolute', bottom: 4, left: 16, right: 16, height: 3, borderRadius: 2 },

  body:       { padding: 12, paddingBottom: 36 },
  card:       { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  cardTitle:  { fontSize: 13, fontWeight: '700', color: NAVY },
  cardHint:   { fontSize: 12, color: GREY, marginBottom: 10 },
  mapBox:     { height: 180, borderRadius: 12, overflow: 'hidden' },

  placeChip:     { flexDirection: 'row', alignItems: 'center', backgroundColor: LIGHT_BG, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 10, alignSelf: 'flex-start', maxWidth: '100%', gap: 6 },
  placeChipText: { fontSize: 13, fontWeight: '600', color: NAVY, flexShrink: 1 },
  coordRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  coordText:     { fontSize: 11, color: GREY, fontFamily: 'monospace' },

  infoRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  infoRowActive: { backgroundColor: LIGHT_BG, borderRadius: 10, paddingHorizontal: 8, marginHorizontal: -8 },
  infoIcon:      { marginRight: 14 },
  infoTexts:     { flex: 1 },
  infoLabel:     { fontSize: 11, color: GREY, fontWeight: '600', marginBottom: 2 },
  infoValue:     { fontSize: 15, fontWeight: '600', color: TEXT },
  divider:       { height: 1, backgroundColor: '#F3F4F6' },

  toggleRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  toggleBorder:   { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  alertIconBox:   { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  alertIconBoxOn: { backgroundColor: LIGHT_BG },
  toggleLabel:    { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT },

  saveBtn:         { backgroundColor: NAVY, borderRadius: 14, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnTxt:      { color: WHITE, fontSize: 15, fontWeight: '700' },

  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  modalCard:       { backgroundColor: WHITE, borderRadius: 20, padding: 24, width: '82%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: RED_BG, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  modalTitle:      { fontSize: 18, fontWeight: '800', color: NAVY, marginBottom: 8 },
  modalBody:       { fontSize: 13, color: SUBTEXT, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalBtns:       { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel:     { flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  modalCancelTxt:  { fontWeight: '700', color: SUBTEXT, fontSize: 14 },
  modalConfirm:    { flex: 1, height: 44, borderRadius: 10, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  modalConfirmTxt: { fontWeight: '700', color: WHITE, fontSize: 14 },
});