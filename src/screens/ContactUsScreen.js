import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Linking, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const contacts = [
  { label: 'Phone',    value: '+91 98765 43210', icon: 'phone-outline',   color: '#2563EB', action: 'tel:+919876543210' },
  { label: 'WhatsApp', value: '+91 98765 43210', icon: 'whatsapp',        color: '#16a34a', action: 'whatsapp://send?phone=919876543210' },
  { label: 'Email',    value: 'support@nutan.in',icon: 'email-outline',   color: '#0891B2', action: 'mailto:support@nutan.in' },
  { label: 'Website',  value: 'www.nutan.in',    icon: 'web',             color: '#7C3AED', action: 'https://www.nutan.in' },
];

export default function ContactUsScreen({ navigation }) {
  const handleContact = (action) => {
    Linking.openURL(action).catch(() => Alert.alert('Error', 'Unable to open.'));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="headset" size={36} color="#2563EB" />
          </View>
          <Text style={styles.heroTitle}>We're here to help</Text>
          <Text style={styles.heroSub}>Reach out through any channel below and our team will get back to you shortly.</Text>
        </View>

        {/* Contact cards */}
        {contacts.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.card}
            onPress={() => handleContact(item.action)}
            activeOpacity={0.75}
          >
            <View style={[styles.cardIcon, { backgroundColor: item.color + '18' }]}>
              <Icon name={item.icon} size={22} color={item.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={[styles.cardValue, { color: item.color }]}>{item.value}</Text>
            </View>
            <Icon name="chevron-right" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        ))}

        {/* Office */}
        <View style={styles.officeCard}>
          <View style={styles.officeHeader}>
            <Icon name="office-building-outline" size={16} color="#1E3A5F" />
            <Text style={styles.officeTitle}>Office Address</Text>
          </View>
          <Text style={styles.officeAddress}>
            Nutan Tracking Solutions Pvt. Ltd.{'\n'}
            Plot No. 42, MIDC Industrial Area,{'\n'}
            Bhiwandi, Thane – 421302{'\n'}
            Maharashtra, India
          </Text>
        </View>

        {/* Hours */}
        <View style={[styles.officeCard, { marginTop: 12 }]}>
          <View style={styles.officeHeader}>
            <Icon name="clock-outline" size={16} color="#059669" />
            <Text style={[styles.officeTitle, { color: '#059669' }]}>Support Hours</Text>
          </View>
          <Text style={styles.officeAddress}>
            Monday – Saturday: 9:00 AM – 6:00 PM{'\n'}
            Sunday: Closed
          </Text>
        </View>
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
  hero: { alignItems: 'center', paddingVertical: 24 },
  heroIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  heroSub:   { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardIcon:  { width: 46, height: 46, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  cardText:  { flex: 1 },
  cardLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 3 },
  cardValue: { fontSize: 14, fontWeight: '700' },
  officeCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  officeHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  officeTitle:  { fontSize: 13, fontWeight: '700', color: '#1E3A5F' },
  officeAddress:{ fontSize: 13, color: '#475569', lineHeight: 22 },
});