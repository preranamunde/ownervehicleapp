import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/* ─── Inline constants ───────────────────────────────────────────────────── */

const NAVY    = '#1E3A5F';
const BLUE    = '#2563EB';
const GREY    = '#9CA3AF';
const SUBTEXT = '#6B7280';
const WHITE   = '#FFFFFF';
const TEXT    = '#111827';

const ALL_DAYS = [
  { short: 'Mon', full: 'Monday'    },
  { short: 'Tue', full: 'Tuesday'   },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday'  },
  { short: 'Fri', full: 'Friday'    },
  { short: 'Sat', full: 'Saturday'  },
  { short: 'Sun', full: 'Sunday'    },
];

/* ─── Main Screen ────────────────────────────────────────────────────────── */

export default function AlertDaysScreen({ navigation, route }) {
  const { selectedDays = [], onSave } = route?.params ?? {};

  const [checked, setChecked] = useState([...selectedDays]);

  const toggle = (short) =>
    setChecked(prev =>
      prev.includes(short) ? prev.filter(d => d !== short) : [...prev, short]
    );

  const handleSave = () => {
    onSave?.(checked);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alert Days</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Icon name="information-outline" size={15} color={GREY} />
        <Text style={styles.bannerTxt}>Select the days on which the alert will run</Text>
      </View>

      {/* Day list */}
      <ScrollView contentContainerStyle={styles.list}>
        {ALL_DAYS.map(({ short, full }) => {
          const isOn = checked.includes(short);
          return (
            <TouchableOpacity
              key={short}
              style={styles.row}
              onPress={() => toggle(short)}
              activeOpacity={0.7}
            >
              <Text style={styles.dayLabel}>{full}</Text>
              <View style={[styles.checkbox, isOn && styles.checkboxOn]}>
                {isOn && <Icon name="check" size={14} color={WHITE} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Save */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnTxt}>SAVE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WHITE },

  header:      { backgroundColor: NAVY, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '700' },

  banner:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  bannerTxt: { fontSize: 13, color: SUBTEXT, flex: 1 },

  list: { paddingBottom: 16 },

  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: WHITE },
  dayLabel: { flex: 1, fontSize: 16, color: TEXT, fontWeight: '500' },

  checkbox:   { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  checkboxOn: { backgroundColor: BLUE, borderColor: BLUE },

  footer:     { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: WHITE },
  saveBtn:    { backgroundColor: BLUE, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center' },
  saveBtnTxt: { color: WHITE, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});