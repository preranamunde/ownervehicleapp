import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Share, Linking, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const APP_LINK = 'https://play.google.com/store/apps/details?id=com.nutan.tracking';
const SHARE_MESSAGE = `📍 Track your vehicles in real-time with Nutan Tracking!\n\nStay updated on speed, location, alerts and more.\n\nDownload now: ${APP_LINK}`;

const shareOptions = [
  { label: 'WhatsApp',  icon: 'whatsapp',              color: '#16a34a', action: `whatsapp://send?text=${encodeURIComponent(SHARE_MESSAGE)}` },
  { label: 'Telegram',  icon: 'send-circle-outline',   color: '#0891B2', action: `tg://msg?text=${encodeURIComponent(SHARE_MESSAGE)}` },
  { label: 'SMS',       icon: 'message-text-outline',  color: '#7C3AED', action: `sms:?body=${encodeURIComponent(SHARE_MESSAGE)}` },
  { label: 'Email',     icon: 'email-outline',         color: '#D97706', action: `mailto:?subject=Try Nutan Tracking App&body=${encodeURIComponent(SHARE_MESSAGE)}` },
];

export default function ShareAppScreen({ navigation }) {
  const handleNativeShare = async () => {
    try {
      await Share.share({ message: SHARE_MESSAGE, title: 'Nutan Tracking App' });
    } catch (_) {}
  };

  const handleOption = (action) => {
    Linking.openURL(action).catch(() => Alert.alert('Error', 'App not installed.'));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share App</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="share-variant" size={36} color="#2563EB" />
          </View>
          <Text style={styles.heroTitle}>Share with Friends</Text>
          <Text style={styles.heroSub}>Help others track their vehicles smarter. Share the Nutan app with your network.</Text>
        </View>

        {/* Native share button */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNativeShare} activeOpacity={0.8}>
          <Icon name="export-variant" size={20} color="#fff" />
          <Text style={styles.primaryBtnTxt}>Share Now</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>— or share via —</Text>

        {/* Share options */}
        <View style={styles.optionsGrid}>
          {shareOptions.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={styles.optionCard}
              onPress={() => handleOption(opt.action)}
              activeOpacity={0.75}
            >
              <View style={[styles.optionIcon, { backgroundColor: opt.color + '18' }]}>
                <Icon name={opt.icon} size={26} color={opt.color} />
              </View>
              <Text style={[styles.optionLabel, { color: opt.color }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* App link card */}
        <View style={styles.linkCard}>
          <Icon name="link-variant" size={16} color="#2563EB" />
          <Text style={styles.linkTxt} numberOfLines={1}>{APP_LINK}</Text>
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
  primaryBtn: {
    backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginBottom: 20,
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  primaryBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  orText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 16 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  optionCard: {
    flex: 1, minWidth: '40%', backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  optionIcon:  { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  optionLabel: { fontSize: 12, fontWeight: '700' },
  linkCard: {
    backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE',
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  linkTxt: { flex: 1, fontSize: 12, color: '#2563EB', fontWeight: '600' },
});