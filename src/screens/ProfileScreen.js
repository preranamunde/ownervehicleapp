import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, TextInput, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DUMMY_PROFILE = {
  name: 'John Doe',
  mobile: '9876543210',
  vehicleNo: 'MH12 AB 1234',
  email: 'john.doe@example.com',
};

export default function ProfileScreen({ navigation }) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(DUMMY_PROFILE);
  const [draft, setDraft] = useState(DUMMY_PROFILE);

  const handleEdit = () => {
    setDraft({ ...profile });
    setEditing(true);
  };

  const handleSave = () => {
    setProfile({ ...draft });
    setEditing(false);
    Alert.alert('Saved', 'Profile updated successfully.');
  };

  const handleCancel = () => {
    setDraft({ ...profile });
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Login') },
    ]);
  };

  const fields = [
    { icon: 'account-outline',  label: 'Full Name',       key: 'name',      keyboardType: 'default'      },
    { icon: 'phone-outline',    label: 'Mobile Number',   key: 'mobile',    keyboardType: 'phone-pad'    },
    { icon: 'car-outline',      label: 'Vehicle Number',  key: 'vehicleNo', keyboardType: 'default'      },
    { icon: 'email-outline',    label: 'Email Address',   key: 'email',     keyboardType: 'email-address'},
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Profile</Text>

        {/* pencil → opens edit mode  |  green check → saves */}
        {editing ? (
          <TouchableOpacity style={[styles.headerBtn, styles.headerBtnSave]} onPress={handleSave}>
            <Icon name="check" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerBtn} onPress={handleEdit}>
            <Icon name="pencil-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Avatar Banner ── */}
      <View style={styles.avatarBanner}>
        <View style={styles.avatarCircle}>
          <Icon name="account" size={48} color="#fff" />
        </View>
        <Text style={styles.avatarName}>{profile.name}</Text>
        <Text style={styles.avatarSub}>{profile.vehicleNo}</Text>

        {editing && (
          <View style={styles.editingBadge}>
            <Icon name="pencil" size={12} color="#fff" />
            <Text style={styles.editingBadgeText}>Edit Mode</Text>
          </View>
        )}
      </View>

      {/* ── Body ── */}
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {fields.map((f, index) => (
            <View key={f.key}>
              <View style={styles.fieldRow}>
                <View style={[styles.fieldIconBox, editing && styles.fieldIconBoxActive]}>
                  <Icon name={f.icon} size={19} color={editing ? '#2563EB' : '#6B7280'} />
                </View>

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  {editing ? (
                    <TextInput
                      style={styles.fieldInput}
                      value={draft[f.key]}
                      onChangeText={(v) => setDraft((p) => ({ ...p, [f.key]: v }))}
                      keyboardType={f.keyboardType}
                      autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                      returnKeyType="done"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{profile[f.key]}</Text>
                  )}
                </View>
              </View>
              {index < fields.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* ── Bottom buttons ── */}
        <View style={styles.actions}>
          {editing ? (
            <TouchableOpacity style={styles.btnSecondary} onPress={handleCancel}>
              <Icon name="close" size={18} color="#6B7280" />
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnDanger} onPress={handleLogout}>
              <Icon name="logout" size={18} color="#DC2626" />
              <Text style={styles.btnDangerText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  /* Header */
  header: {
    backgroundColor: '#1E3A5F',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBtnSave: { backgroundColor: '#059669' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  /* Avatar Banner */
  avatarBanner: {
    backgroundColor: '#1E3A5F',
    alignItems: 'center', paddingBottom: 28, paddingTop: 4,
  },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)', marginBottom: 12,
  },
  avatarName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  avatarSub:  { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 },
  editingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(37,99,235,0.8)',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, marginTop: 10,
  },
  editingBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  /* Body */
  body: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    marginTop: -14,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#6B7280',
    letterSpacing: 0.8, marginBottom: 16, textTransform: 'uppercase',
  },

  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  fieldIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  fieldIconBoxActive: { backgroundColor: '#EFF6FF' },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 3 },
  fieldValue: { fontSize: 15, color: '#111827', fontWeight: '500' },
  fieldInput: {
    fontSize: 15, color: '#111827', fontWeight: '500',
    borderBottomWidth: 1.5, borderBottomColor: '#2563EB', paddingVertical: 2,
  },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  /* Buttons */
  actions: { marginTop: 16, gap: 12 },
  btnSecondary: {
    borderRadius: 14, height: 52, borderWidth: 1.5, borderColor: '#D1D5DB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff',
  },
  btnSecondaryText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
  btnDanger: {
    borderRadius: 14, height: 52, borderWidth: 1.5, borderColor: '#FCA5A5',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEF2F2',
  },
  btnDangerText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
});