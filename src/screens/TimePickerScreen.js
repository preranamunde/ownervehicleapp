import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/* ─── Inline constants ───────────────────────────────────────────────────── */

const NAVY    = '#1E3A5F';
const GREY    = '#9CA3AF';
const SUBTEXT = '#6B7280';
const WHITE   = '#FFFFFF';
const TEXT    = '#111827';
const LIGHT_BG = '#EFF6FF';
const BLUE    = '#2563EB';

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h    = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return { label: `${String(h).padStart(2, '0')} ${ampm}`, value: i };
});

const MINUTES = [
  { label: '00', value: 0  },
  { label: '30', value: 30 },
];

/* ─── Dropdown ───────────────────────────────────────────────────────────── */

function Dropdown({ label, items, selectedIndex, onSelect, open, onToggle }) {
  return (
    <View style={dd.wrap}>
      <Text style={dd.label}>{label}</Text>

      <TouchableOpacity style={dd.trigger} onPress={onToggle} activeOpacity={0.8}>
        <Text style={dd.triggerTxt}>{items[selectedIndex]?.label}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={NAVY} />
      </TouchableOpacity>

      {open && (
        <View style={dd.optionsBox}>
          <ScrollView style={dd.optionsScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {items.map((item, i) => {
              const active = selectedIndex === i;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[dd.option, active && dd.optionActive]}
                  onPress={() => { onSelect(i); onToggle(); }}
                  activeOpacity={0.7}
                >
                  <Text style={[dd.optionTxt, active && dd.optionTxtActive]}>{item.label}</Text>
                  {active && <Icon name="check" size={16} color={BLUE} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const dd = StyleSheet.create({
  wrap:          { marginBottom: 20 },
  label:         { fontSize: 12, fontWeight: '700', color: SUBTEXT, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  trigger:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: WHITE, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 16, height: 52 },
  triggerTxt:    { fontSize: 17, fontWeight: '700', color: NAVY },
  optionsBox:    { marginTop: 4, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: WHITE, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  optionsScroll: { maxHeight: 220 },
  option:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  optionActive:  { backgroundColor: LIGHT_BG },
  optionTxt:     { fontSize: 16, color: TEXT, fontWeight: '500' },
  optionTxtActive:{ color: BLUE, fontWeight: '700' },
});

/* ─── Main Screen ────────────────────────────────────────────────────────── */

export default function TimePickerScreen({ navigation, route }) {
  const {
    title       = 'Select Time',
    hourIndex   = 8,
    minuteIndex = 0,
    onSave,
  } = route?.params ?? {};

  const [selHour,  setSelHour]  = useState(hourIndex);
  const [selMin,   setSelMin]   = useState(minuteIndex);
  const [openHour, setOpenHour] = useState(false);
  const [openMin,  setOpenMin]  = useState(false);

  const toggleHour = () => { setOpenHour(p => !p); setOpenMin(false); };
  const toggleMin  = () => { setOpenMin(p => !p);  setOpenHour(false); };

  const handleSave = () => { onSave?.(selHour, selMin); navigation.goBack(); };

  const h     = HOURS[selHour].label.split(' ');
  const preview = `${h[0]}:${MINUTES[selMin].label} ${h[1]}`;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* Preview */}
        <View style={styles.previewCard}>
          <Icon name="clock-outline" size={28} color={NAVY} />
          <Text style={styles.previewTime}>{preview}</Text>
          <Text style={styles.previewLabel}>Selected Time</Text>
        </View>

        {/* Dropdowns */}
        <View style={styles.card}>
          <Dropdown label="Hour"    items={HOURS}   selectedIndex={selHour} onSelect={setSelHour} open={openHour} onToggle={toggleHour} />
          <Dropdown label="Minutes" items={MINUTES} selectedIndex={selMin}  onSelect={setSelMin}  open={openMin}  onToggle={toggleMin}  />
        </View>

      </ScrollView>

      {/* Save */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Icon name="content-save-outline" size={19} color={WHITE} />
          <Text style={styles.saveBtnTxt}>Set Time</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },

  header:        { backgroundColor: NAVY, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:       { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { color: WHITE, fontSize: 18, fontWeight: '700' },

  body:          { padding: 16, paddingBottom: 24 },

  previewCard:   { backgroundColor: WHITE, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  previewTime:   { fontSize: 36, fontWeight: '800', color: NAVY, marginTop: 8 },
  previewLabel:  { fontSize: 12, color: GREY, marginTop: 4, fontWeight: '600' },

  card:          { backgroundColor: WHITE, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },

  footer:        { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: WHITE },
  saveBtn:       { backgroundColor: NAVY, borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnTxt:    { color: WHITE, fontSize: 15, fontWeight: '700' },
});