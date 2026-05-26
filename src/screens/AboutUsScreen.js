import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const features = [
  { icon: 'map-marker-radius',    color: '#2563EB', label: 'Real-Time GPS Tracking',      desc: 'Live location updates every 10 seconds for all your vehicles.' },
  { icon: 'bell-ring-outline',    color: '#D97706', label: 'Smart Alert System',           desc: 'Instant alerts for overspeed, geofence breaches and more.' },
  { icon: 'shield-check-outline', color: '#059669', label: 'Secure & Reliable',            desc: 'Enterprise-grade security keeping your data safe at all times.' },
  { icon: 'chart-line',           color: '#7C3AED', label: 'Detailed Reports',             desc: 'Comprehensive trip history, fuel logs and driver performance.' },
];

const team = [
  { name: 'Rajesh Patil',   role: 'Founder & CEO',       icon: 'account-tie' },
  { name: 'Priya Sharma',   role: 'Head of Technology',  icon: 'laptop' },
  { name: 'Amit Desai',     role: 'Operations Lead',     icon: 'truck-check' },
];

export default function AboutUsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Brand block */}
        <View style={styles.brandCard}>
          <View style={styles.brandIcon}>
            <Icon name="truck-fast" size={38} color="#2563EB" />
          </View>
          <Text style={styles.brandName}>Nutan Tracking</Text>
          <Text style={styles.brandTagline}>India's trusted vehicle intelligence platform</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionTxt}>Version 2.4.1</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.bodyText}>
            Founded in Bhiwandi in 2018, Nutan Tracking was built to give fleet owners and small businesses the same visibility that large enterprises enjoy — at a price that makes sense. We believe every vehicle owner deserves peace of mind.
          </Text>
        </View>

        {/* Features */}
        <Text style={styles.sectionTitle}>What We Offer</Text>
        {features.map((f) => (
          <View key={f.label} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: f.color + '18' }]}>
              <Icon name={f.icon} size={20} color={f.color} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}

        {/* Team */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Our Team</Text>
        <View style={styles.teamRow}>
          {team.map((member) => (
            <View key={member.name} style={styles.teamCard}>
              <View style={styles.teamAvatar}>
                <Icon name={member.icon} size={24} color="#1E3A5F" />
              </View>
              <Text style={styles.teamName}>{member.name}</Text>
              <Text style={styles.teamRole}>{member.role}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2025 Nutan Tracking Solutions Pvt. Ltd.{'\n'}All rights reserved.</Text>
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
  brandCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  brandIcon: {
    width: 76, height: 76, borderRadius: 22, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  brandName:    { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  brandTagline: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 12 },
  versionPill:  { backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  versionTxt:   { fontSize: 11, color: '#64748B', fontWeight: '600' },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  bodyText:     { fontSize: 13, color: '#475569', lineHeight: 22 },
  featureCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  featureIcon:  { width: 42, height: 42, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  featureText:  { flex: 1 },
  featureLabel: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  featureDesc:  { fontSize: 12, color: '#64748B', lineHeight: 18 },
  teamRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  teamCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  teamAvatar: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  teamName: { fontSize: 11, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 3 },
  teamRole: { fontSize: 9.5, color: '#94a3b8', fontWeight: '500', textAlign: 'center' },
  footer:   { fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 18 },
});