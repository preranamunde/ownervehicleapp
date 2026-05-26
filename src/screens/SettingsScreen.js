import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SECTIONS = [
  {
    title: 'Account',
    items: [
      { label: 'Change Password', icon: 'lock-reset', type: 'nav' },
      { label: 'Linked Vehicles', icon: 'car-multiple', type: 'nav', badge: '1' },
    ],
  },
  {
    title: 'Notifications',
    items: [
      { label: 'Push Notifications', icon: 'bell-outline', type: 'toggle', key: 'push' },
      { label: 'SMS Alerts', icon: 'message-outline', type: 'toggle', key: 'sms' },
      { label: 'Ignition Alerts', icon: 'key-variant', type: 'toggle', key: 'ignition' },
      { label: 'Geofence Alerts', icon: 'map-marker-radius-outline', type: 'toggle', key: 'geofence' },
    ],
  },
  {
    title: 'Map & Display',
    items: [
      { label: 'Dark Map Theme', icon: 'theme-light-dark', type: 'toggle', key: 'darkMap' },
      { label: 'Show Speed Overlay', icon: 'speedometer-medium', type: 'toggle', key: 'speedOverlay' },
      { label: 'Distance Unit', icon: 'ruler', type: 'value', value: 'km' },
    ],
  },
  {
    title: 'App',
    items: [
      { label: 'App Version', icon: 'information-outline', type: 'value', value: '1.0.0' },
      { label: 'Privacy Policy', icon: 'shield-check-outline', type: 'nav' },
      { label: 'Contact Support', icon: 'headset', type: 'nav' },
    ],
  },
];

export default function SettingsScreen({ navigation }) {
  const [toggles, setToggles] = useState({
    push: true,
    sms: false,
    ignition: true,
    geofence: true,
    darkMap: false,
    speedOverlay: true,
  });

  const toggle = (key) => {
    setToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settings</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.card}>
              {section.items.map((item, idx) => {
                const isLast = idx === section.items.length - 1;

                return (
                  <View key={item.label}>
                    <TouchableOpacity
                      style={styles.row}
                      activeOpacity={
                        item.type === 'toggle' || item.type === 'value' ? 1 : 0.6
                      }
                    >
                      <View style={styles.rowLeft}>
                        <View style={styles.iconBox}>
                          <Icon name={item.icon} size={19} color="#2563EB" />
                        </View>

                        <Text style={styles.rowLabel}>{item.label}</Text>

                        {item.badge && (
                          <View style={styles.badgePill}>
                            <Text style={styles.badgeText}>{item.badge}</Text>
                          </View>
                        )}
                      </View>

                      {item.type === 'toggle' && (
                        <Switch
                          value={toggles[item.key]}
                          onValueChange={() => toggle(item.key)}
                          trackColor={{
                            false: '#E5E7EB',
                            true: '#BFDBFE',
                          }}
                          thumbColor={
                            toggles[item.key] ? '#2563EB' : '#9CA3AF'
                          }
                        />
                      )}

                      {item.type === 'value' && (
                        <Text style={styles.valueText}>{item.value}</Text>
                      )}

                      {item.type === 'nav' && (
                        <Icon name="chevron-right" size={18} color="#D1D5DB" />
                      )}
                    </TouchableOpacity>

                    {!isLast && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn}>
          <Icon name="logout" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  header: {
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },

  valueText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: '#F9FAFB',
    marginLeft: 62,
  },

  badgePill: {
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 6,
  },

  badgeText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 4,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});