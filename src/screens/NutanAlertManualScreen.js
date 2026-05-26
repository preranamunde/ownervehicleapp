import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Animated, Alert, ScrollView, Modal, FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ── Generate times at 15-min intervals ───────────────────────
const generateTimes = () => {
  const times = [];
  for (let h = 1; h <= 12; h++) {
    for (let m = 0; m < 60; m += 15) {
      ['AM', 'PM'].forEach(ap => {
        const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;
        times.push({ label, hour: h, minute: m, ampm: ap });
      });
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimes();

const pad = (n) => String(n).padStart(2, '0');
const fmtTime = (h, m, ap) => `${pad(h)}:${pad(m)} ${ap}`;

// ══════════════════════════════════════════════════════════════
// TIME DROPDOWN MODAL
// ══════════════════════════════════════════════════════════════
const TimeDropdownModal = ({ visible, selected, title, accentColor, onConfirm, onClose }) => {
  const selectedLabel = fmtTime(selected.hour, selected.minute, selected.ampm);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ddModal.overlay}>
        <View style={ddModal.sheet}>
          <View style={ddModal.handle} />

          {/* Modal header */}
          <View style={ddModal.header}>
            <View style={[ddModal.headerIcon, { backgroundColor: accentColor + '18' }]}>
              <Icon name="clock-outline" size={16} color={accentColor} />
            </View>
            <Text style={ddModal.title}>{title}</Text>
          </View>

          {/* Time list */}
          <FlatList
            data={TIME_OPTIONS}
            keyExtractor={(item) => item.label}
            style={ddModal.list}
            initialScrollIndex={Math.max(0, TIME_OPTIONS.findIndex(t => t.label === selectedLabel))}
            getItemLayout={(_, index) => ({ length: 52, offset: 52 * index, index })}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isActive = item.label === selectedLabel;
              return (
                <TouchableOpacity
                  style={[ddModal.row, isActive && { backgroundColor: accentColor + '12' }]}
                  onPress={() => { onConfirm(item); onClose(); }}
                  activeOpacity={0.7}
                >
                  <View style={[ddModal.timeIconWrap, { backgroundColor: isActive ? accentColor + '18' : '#F1F5F9' }]}>
                    <Icon name="clock-outline" size={14} color={isActive ? accentColor : '#94a3b8'} />
                  </View>
                  <Text style={[ddModal.rowTxt, isActive && { color: accentColor, fontWeight: '800' }]}>
                    {item.label}
                  </Text>
                  {isActive && <Icon name="check-circle" size={18} color={accentColor} />}
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity style={[ddModal.cancelBtn, { borderColor: accentColor + '40' }]} onPress={onClose}>
            <Text style={[ddModal.cancelTxt, { color: accentColor }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════
// ELAPSED TIMER
// ══════════════════════════════════════════════════════════════
const ElapsedTimer = ({ startedAt }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(iv);
  }, [startedAt]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <Text style={styles.elapsedTxt}>{pad(h)}:{pad(m)}:{pad(s)}</Text>
  );
};

// ══════════════════════════════════════════════════════════════
// SCREEN
// ══════════════════════════════════════════════════════════════
export default function NutanAlertManualScreen({ navigation }) {
  const [startTime, setStartTime] = useState({ hour: 9,  minute: 0,  ampm: 'AM' });
  const [stopTime,  setStopTime]  = useState({ hour: 10, minute: 0,  ampm: 'AM' });

  const [showStart, setShowStart] = useState(false);
  const [showStop,  setShowStop]  = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  const handleStart = () => {
    Alert.alert(
      'Start Alert',
      `Run from ${fmtTime(startTime.hour, startTime.minute, startTime.ampm)} → ${fmtTime(stopTime.hour, stopTime.minute, stopTime.ampm)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => { setIsRunning(true); setStartedAt(Date.now()); } },
      ],
    );
  };

  const handleStop = () => {
    Alert.alert('Stop Alert', 'Deactivate the Nutan alert?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: () => { setIsRunning(false); setStartedAt(null); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Manual Control</Text>
          <Text style={styles.headerSub}>Nutan Alert · Manual Mode</Text>
        </View>
        <View style={styles.modeBadge}>
          <Icon name="gesture-tap-button" size={13} color="#fff" />
          <Text style={styles.modeBadgeTxt}>Manual</Text>
        </View>
      </View>

      {/* ── AUTO / OFF / MANUAL sub-tabs ── */}
      <View style={styles.subBar}>
        {[
          { key: 'auto',   icon: 'clock-check-outline',    label: 'AUTO'   },
          { key: 'off',    icon: 'close-circle-outline',    label: 'OFF'    },
          { key: 'manual', icon: 'hand-back-right-outline', label: 'MANUAL' },
        ].map(t => {
          const isActive = t.key === 'manual';
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.subTab, isActive && styles.subTabActive]}
              onPress={() => {
                if (t.key === 'off')  navigation.navigate('Dashboard');
                if (t.key === 'auto') navigation.navigate('NutanAlertAuto');
              }}
              activeOpacity={0.75}
            >
              <Icon name={t.icon} size={18} color={isActive ? '#1E3A5F' : '#94a3b8'} />
              <Text style={[styles.subTabTxt, isActive && styles.subTabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Running strip ── */}
      {isRunning && (
        <View style={styles.runningStrip}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Icon name="bell-ring" size={15} color="#2563EB" />
          </Animated.View>
          <Text style={styles.runningTxt}>Alert active · </Text>
          <ElapsedTimer startedAt={startedAt} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── START TIME CARD ── */}
        <TouchableOpacity
          style={[styles.timeCard, isRunning && styles.timeCardDisabled]}
          onPress={() => !isRunning && setShowStart(true)}
          activeOpacity={0.75}
        >
          <View style={styles.timeCardLeft}>
            <View style={[styles.timeIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="clock-start" size={20} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.timeCardLabel}>Start Time</Text>
              <Text style={styles.timeCardHint}>Tap to change</Text>
            </View>
          </View>
          <View style={styles.timeCardRight}>
            <Text style={[styles.timeCardValue, { color: '#2563EB' }]}>
              {fmtTime(startTime.hour, startTime.minute, startTime.ampm)}
            </Text>
            <Icon name="chevron-down" size={18} color="#2563EB" />
          </View>
        </TouchableOpacity>

        {/* ── Connector ── */}
        <View style={styles.connector}>
          <View style={styles.connLine} />
          <View style={styles.connIcon}>
            <Icon name="arrow-down" size={13} color="#94a3b8" />
          </View>
          <View style={styles.connLine} />
        </View>

        {/* ── STOP TIME CARD ── */}
        <TouchableOpacity
          style={[styles.timeCard, isRunning && styles.timeCardDisabled]}
          onPress={() => !isRunning && setShowStop(true)}
          activeOpacity={0.75}
        >
          <View style={styles.timeCardLeft}>
            <View style={[styles.timeIconWrap, { backgroundColor: '#FFF5F5' }]}>
              <Icon name="clock-end" size={20} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.timeCardLabel}>Stop Time</Text>
              <Text style={styles.timeCardHint}>Tap to change</Text>
            </View>
          </View>
          <View style={styles.timeCardRight}>
            <Text style={[styles.timeCardValue, { color: '#DC2626' }]}>
              {fmtTime(stopTime.hour, stopTime.minute, stopTime.ampm)}
            </Text>
            <Icon name="chevron-down" size={18} color="#DC2626" />
          </View>
        </TouchableOpacity>

        {/* ── Summary pill ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryDot, { backgroundColor: '#2563EB' }]} />
            <Text style={styles.summaryLabel}>Start</Text>
            <Text style={[styles.summaryValue, { color: '#2563EB' }]}>
              {fmtTime(startTime.hour, startTime.minute, startTime.ampm)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View style={[styles.summaryDot, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.summaryLabel}>Stop</Text>
            <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
              {fmtTime(stopTime.hour, stopTime.minute, stopTime.ampm)}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.stopBtn, !isRunning && styles.btnDisabled]}
          onPress={handleStop}
          activeOpacity={isRunning ? 0.85 : 1}
          disabled={!isRunning}
        >
          <Icon name="stop-circle-outline" size={20} color={isRunning ? '#DC2626' : '#CBD5E1'} />
          <Text style={[styles.stopBtnTxt, !isRunning && { color: '#CBD5E1' }]}>Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.startBtn, isRunning && styles.btnDisabled]}
          onPress={handleStart}
          activeOpacity={!isRunning ? 0.85 : 1}
          disabled={isRunning}
        >
          <Icon name="play-circle-outline" size={20} color="#fff" />
          <Text style={styles.startBtnTxt}>Start</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modals ── */}
      <TimeDropdownModal
        visible={showStart}
        selected={startTime}
        title="Set Start Time"
        accentColor="#2563EB"
        onConfirm={(t) => setStartTime({ hour: t.hour, minute: t.minute, ampm: t.ampm })}
        onClose={() => setShowStart(false)}
      />
      <TimeDropdownModal
        visible={showStop}
        selected={stopTime}
        title="Set Stop Time"
        accentColor="#DC2626"
        onConfirm={(t) => setStopTime({ hour: t.hour, minute: t.minute, ampm: t.ampm })}
        onClose={() => setShowStop(false)}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// DROPDOWN MODAL STYLES
// ══════════════════════════════════════════════════════════════
const ddModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 34, maxHeight: '75%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0', alignSelf: 'center',
    marginTop: 12, marginBottom: 6,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerIcon: {
    width: 32, height: 32, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  list:  { maxHeight: 320 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
    height: 52,
  },
  timeIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  rowTxt: { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155' },
  cancelBtn: {
    marginHorizontal: 16, marginTop: 10,
    paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  cancelTxt: { fontSize: 14, fontWeight: '700' },
});

// ══════════════════════════════════════════════════════════════
// MAIN STYLES
// ══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  header: {
    backgroundColor: '#1E3A5F',
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 44, paddingBottom: 14,
    paddingHorizontal: 16, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter:  { flex: 1 },
  headerTitle:   { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub:     { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, backgroundColor: '#2563EB',
  },
  modeBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },

  subBar:         { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  subTab:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  subTabActive:   { borderBottomColor: '#1E3A5F' },
  subTabTxt:      { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
  subTabTxtActive:{ color: '#1E3A5F' },

  runningStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1, borderBottomColor: '#BFDBFE',
  },
  runningTxt:  { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  elapsedTxt:  { fontSize: 13, fontWeight: '800', color: '#2563EB', letterSpacing: 1 },

  body: { padding: 16, gap: 0, paddingBottom: 32 },

  timeCard: {
    backgroundColor: '#fff',
    borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  timeCardDisabled: { opacity: 0.5 },
  timeCardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeCardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  timeCardLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  timeCardHint:  { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  timeCardValue: { fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },

  connector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginVertical: 10, paddingHorizontal: 20,
  },
  connLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  connIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center',
  },

  summaryCard: {
    marginTop: 20,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#DBEAFE',
    paddingHorizontal: 16, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  summaryRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  summaryDot:    { width: 8, height: 8, borderRadius: 4 },
  summaryLabel:  { flex: 1, fontSize: 13, fontWeight: '600', color: '#64748B' },
  summaryValue:  { fontSize: 14, fontWeight: '800' },
  summaryDivider:{ height: 1, backgroundColor: '#F1F5F9' },

  footer: {
    flexDirection: 'row', gap: 12,
    padding: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  stopBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#DC2626', backgroundColor: '#FFF5F5',
  },
  stopBtnTxt:  { fontSize: 15, fontWeight: '800', color: '#DC2626' },
  startBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
    backgroundColor: '#1E3A5F',
  },
  startBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
  btnDisabled: { opacity: 0.38 },
});