import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, FlatList, SafeAreaView, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, ENDPOINTS } from '../utils/Api';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const NAVY     = '#1E3A5F';
const GREY     = '#9CA3AF';
const SUBTEXT  = '#6B7280';
const WHITE    = '#FFFFFF';
const LIGHT_BG = '#EFF6FF';
const TEXT     = '#111827';
const BG       = '#F3F4F6';
const GREEN    = '#059669';
const RED      = '#DC2626';

/* ─── Alert type meta ────────────────────────────────────────────────────── */
const ALERT_META = {
  ignition: { label: 'Ignition ON', icon: 'car-key',              color: '#F59E0B', bg: '#FFFBEB' },
  movement: { label: 'Movement',    icon: 'car-traction-control', color: '#8B5CF6', bg: '#F5F3FF' },
  fuel:     { label: 'Fuel',        icon: 'gas-station',          color: '#10B981', bg: '#ECFDF5' },
  tamper:   { label: 'Tamper',      icon: 'shield-alert',         color: '#EF4444', bg: '#FEF2F2' },
  auto:     { label: 'Auto Alert',  icon: 'robot-outline',        color: NAVY,      bg: LIGHT_BG  },
  manual:   { label: 'Manual Alert',icon: 'hand-back-right-outline', color: GREEN,  bg: '#ECFDF5' },
};

function getAlertMeta(type) {
  return ALERT_META[type] ?? { label: type ?? 'Alert', icon: 'bell-outline', color: NAVY, bg: LIGHT_BG };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatDateTime(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  }
  return raw;
}

function getDateLabel(item) {
  if (item.day) return item.day;
  if (item.createdAt) {
    const d = new Date(item.createdAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    }
  }
  return 'No date';
}

function getTimePart(item) {
  if (item.start_time && item.end_time) return `${item.start_time} – ${item.end_time}`;
  if (item.start_time) return `From ${item.start_time}`;
  return null;
}

function buildActiveTypes(item) {
  const types = [];
  if (item.ignition_alert) types.push('ignition');
  if (item.movement_alert) types.push('movement');
  if (item.fuel_alert)     types.push('fuel');
  if (item.tamper_alert)   types.push('tamper');
  return types;
}

/* ─── History Card ───────────────────────────────────────────────────────── */
function HistoryCard({ item, index }) {
  const enabled      = !!item.status;
  const modeMeta     = getAlertMeta(item.alert_type);
  const activeTypes  = buildActiveTypes(item);
  const dateLabel    = getDateLabel(item);
  const timePart     = getTimePart(item);
  const location     = item.location?.[0];

  const iconColor   = enabled ? modeMeta.color : GREY;
  const iconBg      = enabled ? modeMeta.bg    : '#F3F4F6';
  const statusColor = enabled ? GREEN           : GREY;
  const statusText  = enabled ? '● Active'      : '● Inactive';

  return (
    <View style={cS.card}>
      {/* ── Card Header ── */}
      <View style={cS.cardHeader}>
        {/* Row 1: order badge + icon + mode badge */}
        <View style={cS.cardHeaderRow1}>
          <View style={cS.cardHeaderRow1Left}>
            <View style={[cS.orderBadge, !enabled && cS.orderBadgeDim]}>
              <Text style={[cS.orderBadgeTxt, !enabled && cS.orderBadgeTxtDim]}>
                {index + 1}
              </Text>
            </View>
            <View style={[cS.alertIconCircle, { backgroundColor: iconBg }]}>
              <Icon name={modeMeta.icon} size={14} color={iconColor} />
            </View>
          </View>
          <View style={[cS.modeBadge, { backgroundColor: modeMeta.bg }]}>
            <Text style={[cS.modeTxt, { color: modeMeta.color }]}>{modeMeta.label}</Text>
          </View>
        </View>

        {/* Row 2: date */}
        <Text style={cS.cardTitle}>{dateLabel}</Text>

        {/* Row 3: time range */}
        {timePart ? (
          <Text style={cS.cardTimeRange}>{timePart}</Text>
        ) : null}

        {/* Row 4: status */}
        <Text style={[cS.cardStatus, { color: statusColor }]}>{statusText}</Text>
      </View>

      {/* ── Card Body ── */}
      <View style={cS.cardBody}>
        {/* Location row */}
        <View style={cS.placeRow}>
          <Icon name="map-marker-outline" size={14} color={enabled ? NAVY : GREY} />
          <Text style={[cS.placeName, !enabled && cS.placeNameDim]} numberOfLines={1}>
            {location
              ? `${location.latitude?.toFixed(5)}, ${location.longitude?.toFixed(5)}`
              : 'Location not set'}
          </Text>
          {item.radius ? (
            <View style={[cS.radiusBadge, !enabled && cS.radiusBadgeDim]}>
              <Text style={[cS.radiusBadgeTxt, !enabled && cS.radiusBadgeTxtDim]}>
                {item.radius}m
              </Text>
            </View>
          ) : null}
        </View>

        {/* Alert type chips */}
        {activeTypes.length > 0 ? (
          <View style={cS.chipsRow}>
            {activeTypes.map(t => {
              const m = getAlertMeta(t);
              return (
                <View key={t} style={[cS.chip, !enabled && cS.chipOff]}>
                  <Icon name={m.icon} size={10} color={!enabled ? GREY : m.color} />
                  <Text style={[cS.chipTxt, { color: !enabled ? GREY : m.color }]}>
                    {m.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={cS.noAlertsTxt}>No alert types enabled</Text>
        )}

        {/* Created at */}
        {item.createdAt ? (
          <Text style={cS.createdAt}>Created {formatDateTime(item.createdAt)}</Text>
        ) : null}
      </View>
    </View>
  );
}

const cS = StyleSheet.create({
  /* Card shell */
  card: {
    backgroundColor: WHITE, borderRadius: 16, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },

  /* Header */
  cardHeader: {
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  cardHeaderRow1:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardHeaderRow1Left:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderBadge:          { width: 22, height: 22, borderRadius: 6, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  orderBadgeDim:       { backgroundColor: GREY },
  orderBadgeTxt:       { fontSize: 10, fontWeight: '800', color: WHITE },
  orderBadgeTxtDim:    { color: '#E5E7EB' },
  alertIconCircle:     { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardTitle:           { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 2 },
  cardTimeRange:       { fontSize: 13, fontWeight: '600', color: SUBTEXT, marginBottom: 2 },
  cardStatus:          { fontSize: 11, fontWeight: '600', marginTop: 2 },

  /* Mode badge (right side of header row 1) */
  modeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, flexShrink: 0 },
  modeTxt:   { fontSize: 11, fontWeight: '700' },

  /* Body */
  cardBody:    { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  placeRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  placeName:   { flex: 1, fontSize: 12, fontWeight: '600', color: NAVY },
  placeNameDim:{ color: GREY },
  radiusBadge: { backgroundColor: LIGHT_BG, borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 6, paddingVertical: 2 },
  radiusBadgeDim:   { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  radiusBadgeTxt:   { fontSize: 10, fontWeight: '700', color: NAVY },
  radiusBadgeTxtDim:{ color: GREY },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: LIGHT_BG, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  chipOff:    { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  chipTxt:    { fontSize: 10, fontWeight: '700' },
  noAlertsTxt:{ fontSize: 12, color: GREY, marginBottom: 8 },
  createdAt:  { fontSize: 11, color: GREY, marginTop: 2 },
});

/* ─── Empty State ────────────────────────────────────────────────────────── */
function EmptyState({ type }) {
  const meta = getAlertMeta(type);
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIconCircle, { backgroundColor: meta.bg }]}>
        <Icon name="bell-sleep-outline" size={44} color={meta.color} />
      </View>
      <Text style={styles.emptyTitle}>No {type === 'auto' ? 'Auto' : 'Manual'} History</Text>
      <Text style={styles.emptySubtitle}>
        No {type} alert history found for this vehicle.
      </Text>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HISTORY ALERT SCREEN
   ══════════════════════════════════════════════════════════════════════════ */
export default function HistoryAlertScreen({ navigation, route }) {
  const vehicleId = route?.params?.vehicleId ?? null;
  const gpsId     = route?.params?.gpsId     ?? null;

  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState('auto');

  /* ── Fetch: GET /api/alert/history/:vehicle_id ── */
  const fetchHistory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const endpoint = vehicleId
        ? ENDPOINTS.ALERT_HISTORY(vehicleId)
        : ENDPOINTS.ALERTS;

      const response = await apiGet(endpoint);

      const list =
        Array.isArray(response)         ? response         :
        Array.isArray(response?.alerts) ? response.alerts  :
        Array.isArray(response?.data)   ? response.data    :
        [];

      const sorted = [...list].sort((a, b) =>
        new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
      );

      setData(sorted);
    } catch (err) {
      console.error('❌ HistoryAlertScreen fetch error:', err);
      Alert.alert('Error', err?.message ?? 'Could not load alert history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vehicleId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  /* ── Derived ── */
  const autoAlerts   = data.filter(d => d.alert_type === 'auto');
  const manualAlerts = data.filter(d => d.alert_type === 'manual');
  const tabData      = activeTab === 'auto' ? autoAlerts : manualAlerts;
  const totalActive  = data.filter(d => d.status).length;

  const TABS = [
    { key: 'auto',   label: 'Auto',   color: NAVY,  count: autoAlerts.length   },
    { key: 'manual', label: 'Manual', color: GREEN, count: manualAlerts.length },
  ];

  /* ── Summary strip ── */
  const SummaryStrip = () => (
    <View style={styles.summaryBar}>
      {[
        { label: 'Total',  value: data.length,         color: NAVY         },
        { label: 'Auto',   value: autoAlerts.length,   color: NAVY         },
        { label: 'Manual', value: manualAlerts.length, color: GREEN        },
        { label: 'Active', value: totalActive,         color: '#10B981'    },
      ].map((s, i, arr) => (
        <React.Fragment key={s.label}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
          {i < arr.length - 1 && <View style={styles.summaryDivider} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Icon name="arrow-left" size={22} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alert History</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchHistory(true)} activeOpacity={0.8}>
          <Icon name="refresh" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={NAVY} />
          <Text style={styles.loadingTxt}>Loading history...</Text>
        </View>
      ) : (
        <>
          {/* Summary bar */}
          <View style={styles.summaryWrapper}>
            <SummaryStrip />
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tab}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.8}
                >
                  <View style={styles.tabInner}>
                    <Text style={[styles.tabTxt, isActive && { color: tab.color, fontWeight: '800' }]}>
                      {tab.label}
                    </Text>
                    {tab.count > 0 && (
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

          {/* List */}
          <FlatList
            data={tabData}
            keyExtractor={(item, i) => item._id ?? String(i)}
            renderItem={({ item, index }) => <HistoryCard item={item} index={index} />}
            ListEmptyComponent={<EmptyState type={activeTab} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchHistory(true)}
                colors={[NAVY]}
                tintColor={NAVY}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    backgroundColor: NAVY, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  refreshBtn:  { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '700' },

  /* Summary */
  summaryWrapper: { paddingHorizontal: 16, paddingTop: 14 },
  summaryBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderRadius: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryCount:   { fontSize: 20, fontWeight: '800' },
  summaryLabel:   { fontSize: 10, color: GREY, fontWeight: '600', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },

  /* Tab Bar */
  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 14, padding: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  tab:          { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', paddingBottom: 2 },
  tabInner:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabTxt:       { fontSize: 14, fontWeight: '600', color: SUBTEXT },
  tabUnderline: { position: 'absolute', bottom: 4, left: 16, right: 16, height: 3, borderRadius: 2 },
  tabBadge:     { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeTxt:  { fontSize: 10, fontWeight: '800', color: WHITE },

  /* List */
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 36 },

  /* Loading */
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:  { fontSize: 14, color: SUBTEXT, fontWeight: '500' },

  /* Empty */
  emptyWrap:       { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:      { fontSize: 17, fontWeight: '700', color: TEXT, marginBottom: 6 },
  emptySubtitle:   { fontSize: 13, color: SUBTEXT, textAlign: 'center', lineHeight: 20 },
});