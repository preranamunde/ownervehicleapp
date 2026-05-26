import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Alert, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const RUN_TIME_OPTIONS = ['15 min', '30 min', '45 min', '1 hour', '2 hours', '3 hours', '4 hours', '6 hours', '8 hours'];

// ── Time Picker bottom-sheet modal ────────────────────────────
const TimePickerModal = ({ visible, value, title, onConfirm, onClose }) => {
  const [h,  setH]  = useState(value.hour);
  const [m,  setM]  = useState(value.minute);
  const [ap, setAp] = useState(value.ampm);

  React.useEffect(() => {
    if (visible) { setH(value.hour); setM(value.minute); setAp(value.ampm); }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={tpModal.overlay}>
        <View style={tpModal.sheet}>
          <View style={tpModal.handle} />
          <Text style={tpModal.title}>{title}</Text>

          <View style={tpModal.pickerRow}>
            {/* Hour */}
            <View style={tpModal.col}>
              <TouchableOpacity onPress={() => setH(h % 12 + 1)} style={tpModal.arrow}>
                <Icon name="chevron-up" size={26} color="#1E3A5F" />
              </TouchableOpacity>
              <Text style={tpModal.digit}>{String(h).padStart(2, '0')}</Text>
              <TouchableOpacity onPress={() => setH(h === 1 ? 12 : h - 1)} style={tpModal.arrow}>
                <Icon name="chevron-down" size={26} color="#1E3A5F" />
              </TouchableOpacity>
            </View>

            <Text style={tpModal.colon}>:</Text>

            {/* Minute */}
            <View style={tpModal.col}>
              <TouchableOpacity onPress={() => setM((m + 1) % 60)} style={tpModal.arrow}>
                <Icon name="chevron-up" size={26} color="#1E3A5F" />
              </TouchableOpacity>
              <Text style={tpModal.digit}>{String(m).padStart(2, '0')}</Text>
              <TouchableOpacity onPress={() => setM(m === 0 ? 59 : m - 1)} style={tpModal.arrow}>
                <Icon name="chevron-down" size={26} color="#1E3A5F" />
              </TouchableOpacity>
            </View>

            {/* AM / PM */}
            <View style={tpModal.ampmCol}>
              {['AM', 'PM'].map(v => (
                <TouchableOpacity
                  key={v}
                  style={[tpModal.ampmOpt, ap === v && tpModal.ampmOptActive]}
                  onPress={() => setAp(v)}
                >
                  <Text style={[tpModal.ampmTxt, ap === v && tpModal.ampmTxtActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={tpModal.actions}>
            <TouchableOpacity style={tpModal.cancelBtn} onPress={onClose}>
              <Text style={tpModal.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tpModal.confirmBtn}
              onPress={() => { onConfirm({ hour: h, minute: m, ampm: ap }); onClose(); }}
            >
              <Text style={tpModal.confirmTxt}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Days picker bottom-sheet modal ───────────────────────────
const DaysPickerModal = ({ visible, selected, onConfirm, onClose }) => {
  const [sel, setSel] = useState([...selected]);

  React.useEffect(() => {
    if (visible) setSel([...selected]);
  }, [visible]);

  const toggle = (d) =>
    setSel(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={tpModal.overlay}>
        <View style={tpModal.sheet}>
          <View style={tpModal.handle} />
          <Text style={tpModal.title}>Select Week Days</Text>

          <View style={dpModal.quickRow}>
            {[
              { label: 'Weekdays', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
              { label: 'Weekend',  days: ['Sat', 'Sun'] },
              { label: 'All',      days: DAYS_SHORT },
              { label: 'Clear',    days: [] },
            ].map(p => (
              <TouchableOpacity key={p.label} style={dpModal.preset} onPress={() => setSel(p.days)}>
                <Text style={dpModal.presetTxt}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={dpModal.grid}>
            {DAYS_SHORT.map((day, i) => {
              const active = sel.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[dpModal.dayBtn, active && dpModal.dayBtnActive]}
                  onPress={() => toggle(day)}
                >
                  <Text style={[dpModal.dayFull, active && dpModal.dayFullActive]}>
                    {DAYS_FULL[i]}
                  </Text>
                  {active && <Icon name="check" size={16} color="#2563EB" />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={tpModal.actions}>
            <TouchableOpacity style={tpModal.cancelBtn} onPress={onClose}>
              <Text style={tpModal.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tpModal.confirmBtn}
              onPress={() => { onConfirm(sel); onClose(); }}
            >
              <Text style={tpModal.confirmTxt}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Generic list-option picker modal ─────────────────────────
const OptionPickerModal = ({ visible, options, selected, title, onConfirm, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={tpModal.overlay}>
      <View style={tpModal.sheet}>
        <View style={tpModal.handle} />
        <Text style={tpModal.title}>{title}</Text>
        <ScrollView style={{ maxHeight: 300 }}>
          {options.map(opt => {
            const active = opt === selected;
            return (
              <TouchableOpacity
                key={opt}
                style={optModal.row}
                onPress={() => { onConfirm(opt); onClose(); }}
              >
                <Text style={[optModal.rowTxt, active && optModal.rowTxtActive]}>{opt}</Text>
                {active && <Icon name="check-circle" size={18} color="#2563EB" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity style={[tpModal.cancelBtn, { margin: 16, marginTop: 6 }]} onPress={onClose}>
          <Text style={tpModal.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ── Single row ────────────────────────────────────────────────
const SettingRow = ({ icon, label, value, onPress, color = '#1E3A5F', last }) => (
  <TouchableOpacity
    style={[rowSt.row, last && rowSt.rowLast]}
    onPress={onPress}
    activeOpacity={0.65}
  >
    <View style={[rowSt.iconWrap, { backgroundColor: color + '18' }]}>
      <Icon name={icon} size={15} color={color} />
    </View>
    <Text style={rowSt.label}>{label}</Text>
    <Text style={[rowSt.value, { color }]}>{value}</Text>
    <Icon name="chevron-right" size={16} color="#CBD5E1" />
  </TouchableOpacity>
);

const formatTime = ({ hour, minute, ampm }) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;

const formatDays = (days, expanded = false) => {
  if (!days || days.length === 0) return 'None';
  if (days.length === 7) return 'Every Day';
  const wk = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const we = ['Sat', 'Sun'];
  if (days.length === 5 && wk.every(d => days.includes(d))) return 'Weekdays';
  if (days.length === 2 && we.every(d => days.includes(d))) return 'Weekend';
  if (!expanded && days.length > 4) return days.slice(0, 4).join(' · ') + '...';
  return days.join(' · ');
};

// ══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════
export default function NutanAlertAutoScreen({ navigation, route }) {
  // ── Read onSave callback + scheduleIndex passed from Dashboard ──
  const { savedConfig, scheduleIndex = null, onSave } = route?.params ?? {};
  const isEdit = scheduleIndex !== null && savedConfig != null;

  const [waterDays,  setWaterDays]  = useState(savedConfig?.waterDays  ?? ['Mon', 'Wed', 'Fri', 'Sun']);
  const [startTime1, setStartTime1] = useState(savedConfig?.startTime1 ?? { hour: 8,  minute: 0,  ampm: 'AM' });
  const [startTime2, setStartTime2] = useState(savedConfig?.startTime2 ?? { hour: 12, minute: 3,  ampm: 'AM' });
  const [runTime,    setRunTime]    = useState(savedConfig?.runTime     ?? '4 hours');

  const [daysExpanded, setDaysExpanded] = useState(false);
  const [showDays,  setShowDays]  = useState(false);
  const [showTime1, setShowTime1] = useState(false);
  const [showTime2, setShowTime2] = useState(false);
  const [showRun,   setShowRun]   = useState(false);

  // ── ONLY CHANGE: call onSave callback then goBack ────────────
  const handleSave = () => {
    if (waterDays.length === 0) {
      Alert.alert('Select Days', 'Please select at least one water day.');
      return;
    }

    const config = { waterDays, startTime1, startTime2, runTime };

    // Fire the callback → Dashboard appends/updates schedule in its state
    if (typeof onSave === 'function') {
      onSave(config);
    }

    // Return to Dashboard — no need to pass params, state already updated
    navigation.goBack();
  };

  return (
    <View style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      {/* ── Header ── */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={st.headerTitle}>
            {isEdit ? `Edit Schedule #${scheduleIndex + 1}` : 'Auto Schedule'}
          </Text>
          <Text style={st.headerSub}>Nutan Alert · Timer Mode</Text>
        </View>
        <View style={st.modeBadge}>
          <Icon name="calendar-clock" size={13} color="#fff" />
          <Text style={st.modeBadgeTxt}>Auto</Text>
        </View>
      </View>

      {/* ── AUTO / OFF / MANUAL sub-tabs ── */}
      <View style={st.subBar}>
        {[
          { key: 'auto',   icon: 'clock-check-outline',    label: 'AUTO'   },
          { key: 'off',    icon: 'close-circle-outline',    label: 'OFF'    },
          { key: 'manual', icon: 'hand-back-right-outline', label: 'MANUAL' },
        ].map(t => {
          const isActive = t.key === 'auto';
          return (
            <TouchableOpacity
              key={t.key}
              style={[st.subTab, isActive && st.subTabActive]}
              onPress={() => {
                if (t.key === 'off')    navigation.navigate('Dashboard');
                if (t.key === 'manual') navigation.navigate('NutanAlertManual');
              }}
              activeOpacity={0.75}
            >
              <Icon name={t.icon} size={18} color={isActive ? '#1E3A5F' : '#94a3b8'} />
              <Text style={[st.subTabTxt, isActive && st.subTabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Group 1 — Days */}
        <View style={st.group}>
          <TouchableOpacity
            style={[rowSt.row, rowSt.rowLast]}
            onPress={() => {
              if (waterDays.length > 4 &&
                !['Every Day','Weekdays','Weekend','None'].includes(formatDays(waterDays))) {
                setDaysExpanded(e => !e);
              } else {
                setShowDays(true);
              }
            }}
            onLongPress={() => setShowDays(true)}
            activeOpacity={0.65}
          >
            <View style={[rowSt.iconWrap, { backgroundColor: '#2563EB18' }]}>
              <Icon name="calendar-week" size={15} color="#2563EB" />
            </View>
            <Text style={rowSt.label}>Week Days</Text>
            <Text style={[rowSt.value, { color: '#2563EB', flex: 1, textAlign: 'right', marginRight: 4 }]} numberOfLines={daysExpanded ? undefined : 1}>
              {formatDays(waterDays, daysExpanded)}
            </Text>
            <Icon name={daysExpanded ? 'chevron-up' : 'chevron-right'} size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Group 2 — Times */}
        <View style={st.group}>
          <SettingRow
            icon="clock-start"
            label="Start Time"
            value={formatTime(startTime1)}
            onPress={() => setShowTime1(true)}
            color="#1E3A5F"
          />
          <SettingRow
            icon="clock-outline"
            label="Stop Time"
            value={formatTime(startTime2)}
            onPress={() => setShowTime2(true)}
            color="#1E3A5F"
            last
          />
        </View>

        {/* Group 3 — Alert Window */}
        <View style={st.group}>
          <SettingRow
            icon="timer-sand"
            label="Alert Window"
            value={runTime}
            onPress={() => setShowRun(true)}
            color="#059669"
            last
          />
        </View>
      </ScrollView>

      {/* ── Save ── */}
      <View style={st.footer}>
        <TouchableOpacity style={st.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Icon name="check-circle-outline" size={18} color="#fff" />
          <Text style={st.saveBtnTxt}>
            {isEdit ? 'Update Schedule' : 'Save Schedule'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Modals ── */}
      <DaysPickerModal
        visible={showDays}
        selected={waterDays}
        onConfirm={(days) => { setWaterDays(days); setDaysExpanded(false); }}
        onClose={() => setShowDays(false)}
      />
      <TimePickerModal
        visible={showTime1}
        value={startTime1}
        title="Set Start Time"
        onConfirm={setStartTime1}
        onClose={() => setShowTime1(false)}
      />
      <TimePickerModal
        visible={showTime2}
        value={startTime2}
        title="Set Stop Time"
        onConfirm={setStartTime2}
        onClose={() => setShowTime2(false)}
      />
      <OptionPickerModal
        visible={showRun}
        options={RUN_TIME_OPTIONS}
        selected={runTime}
        title="Alert Window"
        onConfirm={setRunTime}
        onClose={() => setShowRun(false)}
      />
    </View>
  );
}

// ═══════════════════════ STYLES ═══════════════════════════════

const rowSt = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    backgroundColor: '#fff',
  },
  rowLast:  { borderBottomWidth: 0 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  label:    { flex: 1, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  value:    { fontSize: 13, fontWeight: '700', marginRight: 4 },
});

const tpModal = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12, marginBottom: 18 },
  title:    { fontSize: 15, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 20 },

  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24, marginBottom: 24 },
  col:       { alignItems: 'center', gap: 2 },
  arrow:     { padding: 6 },
  digit:     { fontSize: 44, fontWeight: '800', color: '#1E3A5F', lineHeight: 54, width: 68, textAlign: 'center' },
  colon:     { fontSize: 40, fontWeight: '800', color: '#1E3A5F', marginBottom: 8 },

  ampmCol:       { gap: 8, marginLeft: 10 },
  ampmOpt:       { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  ampmOptActive: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' },
  ampmTxt:       { fontSize: 13, fontWeight: '700', color: '#64748B' },
  ampmTxtActive: { color: '#2563EB' },

  actions:    { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  cancelBtn:  { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelTxt:  { fontSize: 14, fontWeight: '700', color: '#64748B' },
  confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#1E3A5F', alignItems: 'center' },
  confirmTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

const dpModal = StyleSheet.create({
  quickRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12, flexWrap: 'wrap' },
  preset:       { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#F1F5F9', borderRadius: 20 },
  presetTxt:    { fontSize: 11, fontWeight: '700', color: '#64748B' },
  grid:         { paddingHorizontal: 16, marginBottom: 14 },
  dayBtn:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  dayBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' },
  dayFull:      { flex: 1, fontSize: 14, fontWeight: '600', color: '#64748B' },
  dayFullActive:{ color: '#2563EB', fontWeight: '700' },
});

const optModal = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  rowTxt:      { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155' },
  rowTxtActive:{ color: '#2563EB', fontWeight: '800' },
});

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  header:      { backgroundColor: '#1E3A5F', flexDirection: 'row', alignItems: 'center', paddingTop: 44, paddingBottom: 14, paddingHorizontal: 16, gap: 12 },
  backBtn:     { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerCenter:{ flex: 1 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  modeBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#2563EB' },
  modeBadgeTxt:{ color: '#fff', fontSize: 11, fontWeight: '800' },

  subBar:         { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  subTab:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  subTabActive:   { borderBottomColor: '#1E3A5F' },
  subTabTxt:      { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
  subTabTxtActive:{ color: '#1E3A5F' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 14, gap: 12, paddingBottom: 32 },

  group: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },

  footer:     { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  saveBtn:    { backgroundColor: '#1E3A5F', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});