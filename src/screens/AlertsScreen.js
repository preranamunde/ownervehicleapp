import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, SafeAreaView, Switch,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, ENDPOINTS } from '../utils/Api';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const NAVY     = '#1E3A5F';
const RED      = '#DC2626';
const GREY     = '#9CA3AF';
const WHITE    = '#FFFFFF';
const LIGHT_BG = '#EFF6FF';
const SUBTEXT  = '#6B7280';
const TEXT     = '#111827';
const GREEN    = '#059669';

const ALERT_TYPES = [
  { key: 'ignition', label: 'Ignition ON', icon: 'car-key',              apiKey: 'ignition_alert' },
  { key: 'movement', label: 'Movement',    icon: 'car-traction-control', apiKey: 'movement_alert' },
  { key: 'fuel',     label: 'Fuel',        icon: 'gas-station',          apiKey: 'fuel_alert'     },
  { key: 'tamper',   label: 'Tamper',      icon: 'shield-alert',         apiKey: 'tamper_alert'   },
];

/* ─── Map API alert → local config shape ────────────────────────────────── */
function parseApiTime(timeStr) {
  if (!timeStr) return { hour: 0, min: 0 };
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    return { hour: d.getHours(), min: d.getMinutes() };
  }
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(':').map(Number);
    return { hour: h, min: m };
  }
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ap = match[3].toUpperCase();
    if (ap === 'AM' && h === 12) h = 0;
    if (ap === 'PM' && h !== 12) h += 12;
    return { hour: h, min: m };
  }
  return { hour: 0, min: 0 };
}

function apiAlertToConfig(apiAlert) {
  const startTime = parseApiTime(apiAlert.start_time);
  const endTime   = parseApiTime(apiAlert.end_time);
  const loc       = apiAlert.location?.[0] ?? {};

  const alerts = {
    ignition: !!apiAlert.ignition_alert,
    movement: !!apiAlert.movement_alert,
    fuel:     !!apiAlert.fuel_alert,
    tamper:   !!apiAlert.tamper_alert,
  };

  const isManual = apiAlert.alert_type === 'manual';

  return {
    apiId:      apiAlert._id,
    alertMode:  apiAlert.alert_type,
    enabled:    !!apiAlert.status,
    latitude:   loc.latitude  ?? 18.5204,
    longitude:  loc.longitude ?? 73.8567,
    placeName:  apiAlert.placeName ?? '',
    alertDays:  apiAlert.day ? [apiAlert.day.substring(0, 3)] : [],
    startHour:  startTime.hour,
    startMin:   startTime.min,
    endHour:    endTime.hour,
    endMin:     endTime.min,
    alerts,
    radius:     apiAlert.radius ?? 500,
    ...(isManual ? {
      manualLatitude:  loc.latitude  ?? 18.5204,
      manualLongitude: loc.longitude ?? 73.8567,
      manualPlaceName: apiAlert.placeName ?? '',
      manualStartHour: startTime.hour,
      manualStartMin:  startTime.min,
      manualEndHour:   endTime.hour,
      manualEndMin:    endTime.min,
      manualAlerts:    alerts,
    } : {}),
    _raw: apiAlert,
  };
}

/* ─── Time formatter ─────────────────────────────────────────────────────── */
function fmt(h, m) {
  if (h == null || m == null) return null;
  const hh   = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getTimeRange(config) {
  const s = fmt(config.startHour ?? config.manualStartHour, config.startMin ?? config.manualStartMin);
  const e = fmt(config.endHour   ?? config.manualEndHour,   config.endMin   ?? config.manualEndMin);
  if (s && e) return `${s} – ${e}`;
  if (s) return `From ${s}`;
  return 'Time not set';
}

/* ─── Alert Item Card ────────────────────────────────────────────────────── */
const AlertItemCard = ({ config, index, total, onToggle, onEdit, onDelete, globallyDisabled }) => {
  const enabled       = !!config.enabled;
  const enabledAlerts = ALERT_TYPES.filter(a => config.alerts?.[a.key]);
  const timeRange     = getTimeRange(config);

  // ── FIX: Display place name; fall back to coords only if no place name ──
  const displayLocation = config.placeName && config.placeName.trim()
    ? config.placeName
    : `${config.latitude?.toFixed(4)}, ${config.longitude?.toFixed(4)}`;

  const iconColor   = globallyDisabled ? GREY : (enabled ? NAVY  : GREY);
  const iconBg      = globallyDisabled ? '#F3F4F6' : (enabled ? LIGHT_BG : '#F3F4F6');
  const statusColor = globallyDisabled ? GREY : (enabled ? GREEN : GREY);
  const statusText  = globallyDisabled ? '● Paused (Off)' : (enabled ? '● Active' : '● Paused');

  return (
    <View style={[styles.card, globallyDisabled && styles.cardDisabled]}>
      {globallyDisabled && (
        <View style={styles.disabledStrip}>
          <Icon name="bell-off" size={11} color={WHITE} />
          <Text style={styles.disabledStripTxt}>Alerts Off — Edit still allowed</Text>
        </View>
      )}

      {/* ── CARD HEADER ── */}
      <View style={styles.cardHeader}>

        {/* Left: badge + icon + time/status */}
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.orderBadge, globallyDisabled && styles.orderBadgeDim]}>
            <Text style={[styles.orderBadgeTxt, globallyDisabled && styles.orderBadgeTxtDim]}>
              {index + 1}
            </Text>
          </View>
          <View style={[styles.alertIconCircle, { backgroundColor: iconBg }]}>
            <Icon name="bell-ring" size={14} color={iconColor} />
          </View>
          <View style={styles.cardTitleWrap}>
            {/* FIX: time range on one line — shrink font slightly and use nowrap */}
            <Text
              style={[styles.cardTitle, globallyDisabled && styles.cardTitleDim]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {timeRange}
            </Text>
            <Text style={[styles.cardStatus, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        {/* Right: toggle → delete → edit  (DELETE moved after toggle) */}
        <View style={styles.cardHeaderRight}>
          {/* Toggle ON/OFF */}
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleOnOff, { color: globallyDisabled ? GREY : (enabled ? GREEN : GREY) }]}>
              {globallyDisabled ? 'OFF' : (enabled ? 'ON' : 'OFF')}
            </Text>
            <Switch
              value={globallyDisabled ? false : enabled}
              onValueChange={globallyDisabled ? undefined : onToggle}
              disabled={globallyDisabled}
              trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
              thumbColor={(!globallyDisabled && enabled) ? NAVY : GREY}
            />
          </View>

          {/* DELETE — now placed AFTER the toggle */}
          {total > 1 && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Icon name="trash-can-outline" size={14} color={RED} />
            </TouchableOpacity>
          )}

          {/* Edit */}
          <TouchableOpacity
            style={styles.editIconBtn}
            onPress={onEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Icon name="pencil-outline" size={14} color={NAVY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CARD BODY ── */}
      <View style={styles.cardBody}>
        <View style={styles.placeRow}>
          <Icon name="map-marker-outline" size={14} color={globallyDisabled ? GREY : NAVY} />
          {/* FIX: show placeName, not raw lat/long */}
          <Text
            style={[styles.placeName, globallyDisabled && styles.placeNameDim]}
            numberOfLines={1}
          >
            {displayLocation}
          </Text>
          {config.radius ? (
            <View style={[styles.radiusBadge, globallyDisabled && styles.radiusBadgeDim]}>
              <Text style={[styles.radiusBadgeTxt, globallyDisabled && styles.radiusBadgeTxtDim]}>
                {config.radius}m
              </Text>
            </View>
          ) : null}
        </View>

        {enabledAlerts.length > 0 ? (
          <View style={styles.chipsRow}>
            {enabledAlerts.map(a => (
              <View key={a.key} style={[styles.chip, (globallyDisabled || !enabled) && styles.chipOff]}>
                <Icon name={a.icon} size={10} color={(globallyDisabled || !enabled) ? GREY : NAVY} />
                <Text style={[styles.chipTxt, (globallyDisabled || !enabled) && styles.chipTxtOff]}>
                  {a.label}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noAlertsTxt}>No alert types enabled</Text>
        )}
      </View>
    </View>
  );
};

/* ─── Empty State ────────────────────────────────────────────────────────── */
const EmptyState = ({ mode, onSetup }) => (
  <View style={styles.emptyWrap}>
    <View style={styles.emptyIconCircle}>
      <Icon name="bell-sleep-outline" size={44} color={GREY} />
    </View>
    <Text style={styles.emptyTitle}>No {mode === 'auto' ? 'Auto' : 'Manual'} Alerts</Text>
    <Text style={styles.emptySubtitle}>
      {mode === 'auto'
        ? 'Set up Auto Alerts to get notified\nbased on schedule & location.'
        : 'Set up Manual Alerts to trigger\nnotifications on demand.'}
    </Text>
    <TouchableOpacity style={styles.emptySetupBtn} onPress={onSetup} activeOpacity={0.85}>
      <View style={styles.emptyBtnIconWrap}>
        <Icon name="bell-plus-outline" size={18} color={NAVY} />
      </View>
      <Text style={styles.emptySetupBtnTxt}>
        Add {mode === 'auto' ? 'Auto' : 'Manual'} Alert
      </Text>
    </TouchableOpacity>
  </View>
);

/* ─── Off State ──────────────────────────────────────────────────────────── */
const OffState = () => (
  <View style={styles.offStateWrap}>
    <View style={styles.offIconCircle}>
      <Icon name="bell-off-outline" size={48} color={RED} />
    </View>
    <Text style={styles.offTitle}>All Alerts Disabled</Text>
    <Text style={styles.offSubtitle}>
      Your alerts are currently turned off.{'\n'}
      Switch to Auto or Manual tab to re-enable.
    </Text>
    <View style={styles.offInfoBox}>
      <Icon name="information-outline" size={15} color={SUBTEXT} />
      <Text style={styles.offInfoTxt}>
        Existing alerts are preserved and can still be edited.
      </Text>
    </View>
  </View>
);

/* ─── Tab Content ────────────────────────────────────────────────────────── */
const TabContent = ({ mode, alerts, vehicleId, gpsId, navigation, onToggle, onDelete }) => {

  const openAddNew = () => {
    navigation.navigate('NutanAlert', {
      alertMode: mode, vehicleId, gpsId, savedConfig: null, isEditMode: false,
    });
  };

  const openEdit = (config) => {
    navigation.navigate('NutanAlert', {
      alertMode: config.alertMode || mode, vehicleId, gpsId, savedConfig: config, isEditMode: true,
    });
  };

  if (alerts.length === 0) {
    return <EmptyState mode={mode} onSetup={openAddNew} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {alerts.map((cfg, idx) => (
          <AlertItemCard
            key={cfg.apiId || idx}
            config={cfg}
            index={idx}
            total={alerts.length}
            onToggle={() => onToggle(cfg)}
            onEdit={() => openEdit(cfg)}
            onDelete={() => onDelete(cfg, idx)}
            globallyDisabled={false}
          />
        ))}
        <View style={{ height: 90 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openAddNew} activeOpacity={0.85}>
        <View style={styles.fabInner}>
          <Icon name="bell-plus-outline" size={20} color={WHITE} />
          <Text style={styles.fabTxt}>Add Alert</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

/* ─── Main Screen ────────────────────────────────────────────────────────── */
export default function AlertsScreen({ navigation, route }) {
  const vehicle   = route?.params?.vehicle   ?? {};
  const vehicleId = route?.params?.vehicleId ?? vehicle?.id ?? vehicle?._id ?? null;
  const rawGps    = route?.params?.gpsId ?? vehicle?.gps_id ?? null;
  const gpsId     = rawGps?._id ?? rawGps ?? null;

  const [activeTab,    setActiveTab]    = useState('auto');
  const [autoAlerts,   setAutoAlerts]   = useState([]);
  const [manualAlerts, setManualAlerts] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);

  /* ── Fetch ── */
  const fetchAlerts = useCallback(async (silent = false) => {
    if (!vehicleId) { setError('Vehicle ID is missing.'); setLoading(false); return; }
    try {
      if (!silent) setLoading(true);
      setError(null);
      const response = await apiGet(ENDPOINTS.ALERTS_BY_VEHICLE(vehicleId));
      const rawList  = Array.isArray(response) ? response
        : (Array.isArray(response?.allAlerts) ? response.allAlerts : []);
      const configs  = rawList.map(apiAlertToConfig);
      setAutoAlerts(configs.filter(c => c.alertMode === 'auto'));
      setManualAlerts(configs.filter(c => c.alertMode === 'manual'));
    } catch (err) {
      setError(err.message || 'Failed to load alerts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vehicleId]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchAlerts(true));
    return unsub;
  }, [navigation, fetchAlerts]);

  /* ── Toggle (optimistic) ── */
  const handleToggle = (config) => {
    if (!config.apiId) return;
    const newStatus  = !config.enabled;
    const updateList = (list) => list.map(c => c.apiId === config.apiId ? { ...c, enabled: newStatus } : c);
    setAutoAlerts(prev => updateList(prev));
    setManualAlerts(prev => updateList(prev));
  };

  /* ── Delete ── */
  const handleDelete = (config, idx) => {
    Alert.alert(
      'Delete Alert',
      `Remove ${config.alertMode === 'auto' ? 'Auto' : 'Manual'} Alert #${idx + 1}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            if (config.alertMode === 'auto') setAutoAlerts(prev => prev.filter(c => c.apiId !== config.apiId));
            else setManualAlerts(prev => prev.filter(c => c.apiId !== config.apiId));
          },
        },
      ]
    );
  };

  const openAlertHistory = () => navigation.navigate('HistoryAlertScreen', { vehicleId, gpsId });

  const isOffMode   = activeTab === 'off';
  const totalActive = autoAlerts.filter(a => a.enabled).length + manualAlerts.filter(a => a.enabled).length;
  const totalAll    = autoAlerts.length + manualAlerts.length;

  const TABS = [
    { key: 'auto',   label: 'Auto',   color: NAVY,  count: autoAlerts.length },
    { key: 'off',    label: 'Off',    color: RED,   count: null },
    { key: 'manual', label: 'Manual', color: GREEN, count: manualAlerts.length },
  ];

  /* ── Loading ── */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.8}>
            <Icon name="arrow-left" size={22} color={WHITE} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Nutan Alerts</Text>
            {vehicle?.name ? <Text style={styles.headerSubtitle}>{vehicle.name}</Text> : null}
          </View>
          <View style={styles.historyIconBtn}>
            <Icon name="history" size={20} color="rgba(255,255,255,0.4)" />
          </View>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={NAVY} />
          <Text style={styles.loadingTxt}>Loading alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.8}>
          <Icon name="arrow-left" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nutan Alerts</Text>
          {vehicle?.name ? <Text style={styles.headerSubtitle}>{vehicle.name}</Text> : null}
        </View>
        <TouchableOpacity style={styles.historyIconBtn} onPress={openAlertHistory} activeOpacity={0.85}>
          <Icon name="history" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* Error banner */}
      {error ? (
        <TouchableOpacity style={styles.errorBanner} onPress={() => fetchAlerts()} activeOpacity={0.8}>
          <Icon name="alert-circle-outline" size={14} color={WHITE} />
          <Text style={styles.errorBannerTxt}>{error} — Tap to retry</Text>
        </TouchableOpacity>
      ) : null}

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{totalAll}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: isOffMode ? GREY : GREEN }]}>
            {isOffMode ? 0 : totalActive}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: NAVY }]}>{autoAlerts.length}</Text>
          <Text style={styles.summaryLabel}>Auto</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: GREEN }]}>{manualAlerts.length}</Text>
          <Text style={styles.summaryLabel}>Manual</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}>
              <View style={styles.tabInner}>
                <Text style={[styles.tabTxt, isActive && { color: tab.color, fontWeight: '800' }]}>
                  {tab.label}
                </Text>
                {tab.count != null && tab.count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: isActive ? tab.color : GREY }]}>
                    <Text style={styles.tabBadgeTxt}>{tab.count}</Text>
                  </View>
                )}
              </View>
              <View style={[styles.tabUnderline, { backgroundColor: isActive ? tab.color : 'transparent' }]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {activeTab === 'off' ? (
        <ScrollView
          contentContainerStyle={styles.offScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(true); }} colors={[NAVY]} />}
        >
          <OffState />

          {autoAlerts.length > 0 && (
            <View style={styles.offSection}>
              <View style={styles.offSectionHeader}>
                <Icon name="clock-time-four-outline" size={13} color={SUBTEXT} />
                <Text style={styles.offSectionLabel}>Auto Alerts</Text>
              </View>
              {autoAlerts.map((cfg, idx) => (
                <AlertItemCard
                  key={cfg.apiId || `auto-${idx}`}
                  config={cfg}
                  index={idx}
                  total={autoAlerts.length}
                  onToggle={() => handleToggle(cfg)}
                  onEdit={() => navigation.navigate('NutanAlert', { alertMode: 'auto', vehicleId, gpsId, savedConfig: cfg, isEditMode: true })}
                  onDelete={() => handleDelete(cfg, idx)}
                  globallyDisabled={true}
                />
              ))}
            </View>
          )}

          {manualAlerts.length > 0 && (
            <View style={styles.offSection}>
              <View style={styles.offSectionHeader}>
                <Icon name="hand-pointing-right" size={13} color={SUBTEXT} />
                <Text style={styles.offSectionLabel}>Manual Alerts</Text>
              </View>
              {manualAlerts.map((cfg, idx) => (
                <AlertItemCard
                  key={cfg.apiId || `manual-${idx}`}
                  config={cfg}
                  index={idx}
                  total={manualAlerts.length}
                  onToggle={() => handleToggle(cfg)}
                  onEdit={() => navigation.navigate('NutanAlert', { alertMode: 'manual', vehicleId, gpsId, savedConfig: cfg, isEditMode: true })}
                  onDelete={() => handleDelete(cfg, idx)}
                  globallyDisabled={true}
                />
              ))}
            </View>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      ) : activeTab === 'auto' ? (
        <TabContent
          mode="auto"
          alerts={autoAlerts}
          vehicleId={vehicleId}
          gpsId={gpsId}
          navigation={navigation}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ) : (
        <TabContent
          mode="manual"
          alerts={manualAlerts}
          vehicleId={vehicleId}
          gpsId={gpsId}
          navigation={navigation}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      )}
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: NAVY, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  headerCenter:   { flex: 1, alignItems: 'center' },
  headerTitle:    { color: WHITE, fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 1 },
  historyIconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:  { fontSize: 14, color: SUBTEXT, fontWeight: '600' },
  errorBanner: {
    backgroundColor: RED, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  errorBannerTxt: { color: WHITE, fontSize: 12, fontWeight: '600', flex: 1 },

  /* Summary */
  summaryBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderRadius: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryCount:   { fontSize: 20, fontWeight: '800', color: NAVY },
  summaryLabel:   { fontSize: 10, color: GREY, fontWeight: '600', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },

  /* Tab bar */
  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    marginHorizontal: 16, marginTop: 10, marginBottom: 8,
    borderRadius: 14, padding: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  tab:          { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', paddingBottom: 2 },
  tabInner:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabTxt:       { fontSize: 14, fontWeight: '600', color: SUBTEXT },
  tabUnderline: { position: 'absolute', bottom: 4, left: 16, right: 16, height: 3, borderRadius: 2 },
  tabBadge:     { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeTxt:  { fontSize: 10, fontWeight: '800', color: WHITE },

  /* Cards */
  scrollContent: { padding: 16, paddingBottom: 16 },
  card: {
    backgroundColor: WHITE, borderRadius: 16, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardDisabled: { opacity: 0.7, borderWidth: 1, borderColor: '#E5E7EB' },
  disabledStrip: {
    backgroundColor: '#9CA3AF', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 4,
  },
  disabledStripTxt: { fontSize: 10, fontWeight: '700', color: WHITE, letterSpacing: 0.3 },

  /* ── CARD HEADER: left side gets flex:1, right side is fixed ── */
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  cardHeaderLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    flex: 1, minWidth: 0, marginRight: 6,
  },
  /* RIGHT: toggle + delete + edit — fixed width so left side gets room */
  cardHeaderRight: {
    flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0,
  },

  orderBadge:       { width: 20, height: 20, borderRadius: 6, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  orderBadgeDim:    { backgroundColor: GREY },
  orderBadgeTxt:    { fontSize: 10, fontWeight: '800', color: WHITE },
  orderBadgeTxtDim: { color: '#E5E7EB' },
  alertIconCircle:  { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },

  cardTitleWrap: { flex: 1, minWidth: 0 },
  /* FIX: single-line time range with auto font scaling */
  cardTitle:     { fontSize: 12, fontWeight: '800', color: TEXT },
  cardTitleDim:  { color: GREY },
  cardStatus:    { fontSize: 10, fontWeight: '600', marginTop: 1 },

  /* Toggle group */
  toggleRow:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  toggleOnOff: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  /* Delete button — now AFTER the toggle */
  deleteBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA', justifyContent: 'center', alignItems: 'center',
  },

  /* Edit button */
  editIconBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: LIGHT_BG,
    borderWidth: 1, borderColor: '#BFDBFE', justifyContent: 'center', alignItems: 'center',
  },

  /* Card body */
  cardBody:     { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  placeRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  /* FIX: placeName is the primary display — shows place string, not coords */
  placeName:    { flex: 1, fontSize: 12, fontWeight: '600', color: NAVY },
  placeNameDim: { color: GREY },
  radiusBadge: {
    backgroundColor: LIGHT_BG, borderRadius: 6,
    borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 6, paddingVertical: 2,
  },
  radiusBadgeDim:    { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  radiusBadgeTxt:    { fontSize: 10, fontWeight: '700', color: NAVY },
  radiusBadgeTxtDim: { color: GREY },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: LIGHT_BG, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  chipOff:    { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  chipTxt:    { fontSize: 10, fontWeight: '700', color: NAVY },
  chipTxtOff: { color: GREY },
  noAlertsTxt: { fontSize: 12, color: GREY },

  /* FAB */
  fab: {
    position: 'absolute', bottom: 24, right: 20, height: 48,
    borderRadius: 24, backgroundColor: NAVY, paddingHorizontal: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: NAVY, shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  fabInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fabTxt:   { color: WHITE, fontSize: 14, fontWeight: '700' },

  /* Empty */
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 36, marginTop: 20 },
  emptyIconCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle:    { fontSize: 20, fontWeight: '800', color: NAVY, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: SUBTEXT, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  emptySetupBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: NAVY, borderRadius: 14, overflow: 'hidden', height: 50,
  },
  emptyBtnIconWrap: {
    width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)',
  },
  emptySetupBtnTxt: { color: WHITE, fontSize: 14, fontWeight: '700', paddingHorizontal: 20 },

  /* Off tab */
  offScrollContent: { padding: 16, paddingBottom: 30 },
  offStateWrap:     { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  offIconCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    borderWidth: 2, borderColor: '#FECACA',
  },
  offTitle:    { fontSize: 22, fontWeight: '800', color: NAVY, marginBottom: 10 },
  offSubtitle: { fontSize: 14, color: SUBTEXT, textAlign: 'center', lineHeight: 22, marginBottom: 18 },
  offInfoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  offInfoTxt:       { fontSize: 12, color: SUBTEXT, fontWeight: '600', flex: 1 },
  offSection:       { marginTop: 4 },
  offSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 8, marginTop: 4, paddingHorizontal: 4,
  },
  offSectionLabel: {
    fontSize: 11, fontWeight: '700', color: SUBTEXT,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
});