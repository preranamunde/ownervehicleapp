// ============================================
// src/screens/LoginScreen.js
// ============================================
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  StatusBar, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiPost, saveTokens, ENDPOINTS, STORAGE_KEYS } from '../utils/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [emailFocused,    setEmailFocused]    = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading,         setLoading]         = useState(false);

  // ── Login handler ────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    // Basic validation
    if (!email.trim()) {
      Alert.alert('Validation', 'Please enter your email or phone.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Validation', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      /*
       * POST /api/client-auth/login
       * Body : { email, password }
       * useAuth = false  →  no Bearer header on login call
       *
       * Response: { accessToken: "...", refreshToken: "..." }
       */
      const response = await apiPost(
        ENDPOINTS.LOGIN,
        { email: email.trim(), password },
        false,   // ← no auth header for login
      );

      console.log('🔐 Login response:', JSON.stringify(response));

      const { accessToken, refreshToken } = response;

      if (!accessToken) {
        Alert.alert('Login Failed', 'No access token received. Please try again.');
        return;
      }

      // ── Save tokens + email to AsyncStorage ──────────────────────────────────
      await saveTokens({
        accessToken,
        refreshToken,
        email: email.trim(),
      });

      console.log('✅ accessToken  saved:', accessToken.substring(0, 40) + '...');
      console.log('✅ refreshToken saved:', refreshToken?.substring(0, 40) + '...');

      // ── Navigate to Dashboard ─────────────────────────────────────────────────
      navigation.replace('Dashboard');

    } catch (error) {
      console.error('❌ Login error:', error.message);
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid credentials. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      {/* Top curved header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Icon name="car-connected" size={48} color="#fff" />
        </View>
        <Text style={styles.appName}>VehicleTracker</Text>
        <Text style={styles.appTagline}>Self Owner Vehicle App</Text>
      </View>

      {/* Form card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome Back</Text>
        <Text style={styles.cardSubtitle}>Sign in to your account</Text>

        {/* Email input */}
        <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
          <Icon
            name="email-outline"
            size={20}
            color={emailFocused ? '#2563EB' : '#9CA3AF'}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email or Phone"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />
        </View>

        {/* Password input */}
        <View style={[styles.inputWrapper, passwordFocused && styles.inputFocused]}>
          <Icon
            name="lock-outline"
            size={20}
            color={passwordFocused ? '#2563EB' : '#9CA3AF'}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot password */}
        <TouchableOpacity style={styles.forgotRow} disabled={loading}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="login" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.loginButtonText}>Login</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social row */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn} disabled={loading}>
            <Icon name="google" size={22} color="#EA4335" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} disabled={loading}>
            <Icon name="phone-outline" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E3A5F' },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: 40,
  },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  appName:    { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  appTagline: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 32,
  },
  cardTitle:    { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 28 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, marginBottom: 14,
    backgroundColor: '#F9FAFB',
  },
  inputFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  inputIcon: { marginRight: 10 },
  input:     { flex: 1, fontSize: 15, color: '#111827' },

  forgotRow: { alignItems: 'flex-end', marginBottom: 22 },
  forgotText: { color: '#2563EB', fontSize: 13, fontWeight: '500' },

  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12, paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2563EB', shadowOpacity: 0.35,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    minHeight: 52,
  },
  loginButtonDisabled: {
    backgroundColor: '#93C5FD',
    elevation: 0,
    shadowOpacity: 0,
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 12, color: '#9CA3AF', fontSize: 12 },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  socialBtn: {
    width: 52, height: 52, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
});