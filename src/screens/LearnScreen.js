import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const lessons = [
  {
    id: '1',
    icon: 'map-marker-radius',
    color: '#2563EB',
    title: 'Getting Started with Live Tracking',
    duration: '3 min read',
    steps: [
      'Open the Dashboard and tap on your vehicle card.',
      'The map view shows your vehicle\'s real-time GPS position.',
      'The status pill (Moving / Parked / Idle) updates every 10 seconds.',
      'Tap "Play Route" to see today\'s driven path on the map.',
    ],
  },
  {
    id: '2',
    icon: 'bell-ring-outline',
    color: '#D97706',
    title: 'Setting Up Nutan Alerts',
    duration: '4 min read',
    steps: [
      'Scroll to the Quick Actions section on the Dashboard.',
      'Tap the "Auto" tab to set a scheduled alert — choose days, start times, and alert window.',
      'Tap the "Manual" tab to trigger an alert immediately or set a one-time schedule.',
      'Use the pencil icon on the schedule card to edit an existing configuration.',
      'Switch to "Off" to disable alerts without losing your saved schedule.',
    ],
  },
  {
    id: '3',
    icon: 'speedometer',
    color: '#059669',
    title: 'Understanding Speed Stats',
    duration: '2 min read',
    steps: [
      'Current Speed: live km/h reading from the GPS module.',
      'Max Speed: the highest speed recorded today — shown in red if over your limit.',
      'Avg Speed: total distance ÷ moving time for the day.',
      'Overspeed Count: how many times the vehicle exceeded your set limit.',
      'Adjust the overspeed limit from the vehicle settings (three-dot menu → Edit).',
    ],
  },
  {
    id: '4',
    icon: 'map-marker-path',
    color: '#7C3AED',
    title: 'Using Route Replay',
    duration: '3 min read',
    steps: [
      'Tap "Route Replay" in the side drawer.',
      'Select a vehicle and choose a date from the calendar.',
      'Press Play to watch the route animate on the map.',
      'Use the speed slider to replay faster or slower.',
      'Tap any point on the route to see timestamp and speed at that location.',
    ],
  },
  {
    id: '5',
    icon: 'shield-account-outline',
    color: '#0891B2',
    title: 'KYC & Vehicle Verification',
    duration: '2 min read',
    steps: [
      'Tap the three-dot menu on any vehicle card and select KYC.',
      'Upload RC Book, insurance, and driver licence photos.',
      'Verification is completed within 24 business hours.',
      'A verified badge appears on your vehicle card once approved.',
    ],
  },
];

const LessonCard = ({ lesson }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(v => !v);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={toggle} activeOpacity={0.75}>
        <View style={[styles.lessonIcon, { backgroundColor: lesson.color + '18' }]}>
          <Icon name={lesson.icon} size={20} color={lesson.color} />
        </View>
        <View style={styles.lessonMeta}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <View style={styles.lessonDurationRow}>
            <Icon name="clock-outline" size={11} color="#94a3b8" />
            <Text style={styles.lessonDuration}>{lesson.duration}</Text>
          </View>
        </View>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#94a3b8"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.steps}>
          {lesson.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: lesson.color }]}>
                <Text style={styles.stepNumTxt}>{i + 1}</Text>
              </View>
              <Text style={styles.stepTxt}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default function LearnScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learn</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="school" size={36} color="#2563EB" />
          </View>
          <Text style={styles.heroTitle}>How-To Guides</Text>
          <Text style={styles.heroSub}>Tap any topic to expand step-by-step instructions.</Text>
        </View>

        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: '#1E3A5F', paddingHorizontal: 16,
    paddingTop: 30, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle:  { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  headerSpacer: { width: 40 },
  scroll:       { flex: 1 },
  scrollContent:{ padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 20 },
  heroIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  heroSub:   { fontSize: 13, color: '#64748B', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
  },
  lessonIcon:      { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  lessonMeta:      { flex: 1 },
  lessonTitle:     { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  lessonDurationRow:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  lessonDuration:  { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  steps:           { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  stepRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 12 },
  stepNumber: {
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  stepNumTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },
  stepTxt:    { flex: 1, fontSize: 12.5, color: '#475569', lineHeight: 20 },
});