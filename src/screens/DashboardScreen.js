import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Animated, TouchableWithoutFeedback,
  Switch, Share, Linking, Alert, Modal, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, ENDPOINTS, logout } from '../utils/Api';

const DRAWER_WIDTH = 260;

const drawerItems = [
  { label: 'My Profile',        icon: 'account-circle-outline', screen: 'Profile'     },
  { label: 'Route Replay',      icon: 'map-marker-path',        screen: 'RouteReplay' },
  { label: 'Setup Nutan Alert', icon: 'bell-cog-outline',       screen: 'NutanAlert'  },
  { label: 'Contact Us',        icon: 'phone-outline',          screen: 'ContactUs'   },
  { label: 'Share App',         icon: 'share-variant-outline',  screen: 'ShareApp'    },
  { label: 'About Us',          icon: 'information-outline',    screen: 'AboutUs'     },
  { label: 'Learn',             icon: 'school-outline',         screen: 'Learn'       },
  { label: 'Settings',          icon: 'cog-outline',            screen: 'Settings'    },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Map API vehicle object → card-compatible vehicle object
───────────────────────────────────────────────────────────────────────────── */
function mapApiVehicle(apiVehicle) {
  return {
    // ── FROM API ──────────────────────────────────────────────────────────────
    id:        apiVehicle.vehicleId,                          // used as vehicleId in alert API
    name:      apiVehicle.registration_number,
    make:      apiVehicle.make,
    model:     apiVehicle.model,
    company:   `${apiVehicle.make} ${apiVehicle.model}`,
    apiStatus: apiVehicle.status,

    // ── HARDCODED ─────────────────────────────────────────────────────────────
    driver:         'Ramesh Kumar',
    driverPhone:    '9876543210',
    status:         'Moving',
    location:       'NH-48, Bhiwandi-Nashik Road, near Kalyan Junction, Maharashtra 421302',
    cardColor:      '#1E3A5F',
    currentSpeed:   62,
    maxSpeed:       87,
    avgSpeed:       48,
    overspeedLimit: 80,
    overspeedCount: 3,
    geofenceCount:  1,
    geofenceAlert:  true,
    totalDistance:  '124.6 km',
    lastUpdate:     '10:42 AM',
    direction:      274,
    runTime:        '4h 32m',
    idleTime:       '1h 15m',
  };
}

// ══════════════════════════════════════════════════════════════
// SELF-OWNER TAGLINE BANNER
// ══════════════════════════════════════════════════════════════
const SelfOwnerTagline = () => (
  <View style={taglineStyles.container}>
    <View style={taglineStyles.iconWrap}>
      <Icon name="home-city-outline" size={20} color="rgba(255,255,255,0.9)" />
    </View>
    <View style={taglineStyles.textWrap}>
      <Text style={taglineStyles.heading}>Your Fleet, Your Control</Text>
      <Text style={taglineStyles.sub}>Track every move. Own every moment.</Text>
    </View>
    <View style={taglineStyles.activeDot} />
  </View>
);

// ══════════════════════════════════════════════════════════════
// THREE-DOT MENU
// ══════════════════════════════════════════════════════════════
const ThreeDotMenu = ({ vehicle, navigation }) => {
  const [visible, setVisible] = useState(false);

  const menuItems = [
    {
      icon: 'shield-account-outline', label: 'KYC', color: '#6366f1',
      onPress: () => { setVisible(false); navigation.navigate('VehicleKYC', { vehicle }); },
    },
    {
      icon: 'pencil-outline', label: 'Edit Vehicle', color: '#3477eb',
      onPress: () => { setVisible(false); Alert.alert('Edit Vehicle', 'Coming soon!'); },
    },
    {
      icon: 'bell-outline', label: 'Alerts', color: '#f59e0b',
      onPress: () => {
        setVisible(false);
        // Pass vehicleId so NutanAlertScreen can call POST /api/alert/:vehicle_id
        navigation.navigate('Alerts', { vehicleId: vehicle.id });
      },
    },
    {
      icon: 'trash-can-outline', label: 'Remove', color: '#ef4444',
      onPress: () => {
        setVisible(false);
        Alert.alert('Remove Vehicle', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => {} },
        ]);
      },
    },
  ];

  return (
    <>
      <TouchableOpacity
        style={cardStyles.threeDotBtn}
        onPress={() => setVisible(true)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        activeOpacity={0.7}
      >
        <Icon name="dots-vertical" size={18} color="rgba(255,255,255,0.9)" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={cardStyles.menuOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={cardStyles.menuCard}>
            <View style={cardStyles.menuHeader}>
              <Icon name="truck" size={19} color={vehicle.cardColor} />
              <Text style={[cardStyles.menuVehicleName, { color: vehicle.cardColor }]}>{vehicle.name}</Text>
            </View>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[cardStyles.menuItem, i === menuItems.length - 1 && cardStyles.menuItemLast]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[cardStyles.menuItemIcon, { backgroundColor: item.color + '18' }]}>
                  <Icon name={item.icon} size={16} color={item.color} />
                </View>
                <Text style={[cardStyles.menuItemLabel,
                  { color: item.color === '#ef4444' ? '#ef4444' : '#1e293b' }]}>
                  {item.label}
                </Text>
                <Icon name="chevron-right" size={14} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// ══════════════════════════════════════════════════════════════
// VEHICLE CARD
// ══════════════════════════════════════════════════════════════
const VehicleCard = ({ vehicle, ignitionOn, onToggleIgnition, navigation }) => {
  const isOverspeed = (vehicle.maxSpeed ?? 0) > vehicle.overspeedLimit;

  const statusPillBg =
    vehicle.status === 'Moving' ? 'rgba(22,163,74,0.85)'  :
    vehicle.status === 'Parked' ? 'rgba(217,119,6,0.85)'  :
                                  'rgba(99,102,241,0.85)';

  const apiStatusColor  = vehicle.apiStatus === 'ACTIVE' ? '#16a34a' : '#ef4444';
  const apiStatusBg     = vehicle.apiStatus === 'ACTIVE' ? '#F0FDF4' : '#FEF2F2';
  const apiStatusBorder = vehicle.apiStatus === 'ACTIVE' ? '#86EFAC' : '#FECACA';

  const handleWhatsApp = () => {
    const phone = (vehicle.driverPhone || '').replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=91${phone}`)
      .catch(() => Alert.alert('WhatsApp not installed'));
  };

  const handleCall = () => {
    Linking.openURL(`tel:${vehicle.driverPhone}`)
      .catch(() => Alert.alert('Error', 'Unable to make a call.'));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🚗 ${vehicle.name} · ${vehicle.status}\n📍 ${vehicle.location}\nDriver: ${vehicle.driver}`,
        title: vehicle.name,
      });
    } catch (_) {}
  };

  return (
    <View style={cardStyles.card}>
      {/* TOP BAND */}
      <View style={[cardStyles.cardBand, { backgroundColor: vehicle.cardColor }]}>
        <View style={cardStyles.bandHighlight} />
        <View style={cardStyles.bandLeft}>
          <View style={cardStyles.truckIconWrap}>
            <Icon name="truck" size={19} color={vehicle.cardColor} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={cardStyles.bandRegNo} numberOfLines={1}>{vehicle.name}</Text>
            <Text style={cardStyles.bandModel} numberOfLines={1}>{vehicle.company}</Text>
          </View>
        </View>
        <View style={cardStyles.bandRight}>
          <View style={cardStyles.statusAndMenu}>
            <View style={[cardStyles.statusPill, { backgroundColor: statusPillBg }]}>
              <View style={cardStyles.statusPillDot} />
              <Text style={cardStyles.statusPillTxt}>{vehicle.status}</Text>
            </View>
            <ThreeDotMenu vehicle={vehicle} navigation={navigation} />
          </View>
          <View style={cardStyles.ignitionWrap}>
            <Switch
              value={ignitionOn}
              onValueChange={() => onToggleIgnition(vehicle.id)}
              trackColor={{ false: 'rgba(255,255,255,0.25)', true: '#bbf7d0' }}
              thumbColor={ignitionOn ? '#16a34a' : 'rgba(255,255,255,0.7)'}
              ios_backgroundColor="rgba(255,255,255,0.25)"
              style={cardStyles.ignSwitch}
            />
            <Text style={cardStyles.ignLabel}>Ignition</Text>
          </View>
        </View>
      </View>

      {/* API STATUS ROW */}
      <View style={cardStyles.apiStatusRow}>
        <Icon name="database-check-outline" size={11} color="#64748b" />
        <Text style={cardStyles.apiStatusPrefix}>Subscription:</Text>
        <View style={[cardStyles.apiStatusBadge, { backgroundColor: apiStatusBg, borderColor: apiStatusBorder }]}>
          <View style={[cardStyles.apiStatusDot, { backgroundColor: apiStatusColor }]} />
          <Text style={[cardStyles.apiStatusTxt, { color: apiStatusColor }]}>
            {vehicle.apiStatus ?? '—'}
          </Text>
        </View>
      </View>

      {/* BODY */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('PlayRoute', { vehicle })}
        style={cardStyles.cardBody}
      >
        <View style={cardStyles.driverRow}>
          <View style={[cardStyles.driverIconWrap, { backgroundColor: '#EFF6FF' }]}>
            <Icon name="account-tie" size={16} color="#1E3A5F" />
          </View>
          <View style={cardStyles.driverInfo}>
            <Text style={cardStyles.driverName}>{vehicle.driver}</Text>
          </View>
          <TouchableOpacity
            style={[cardStyles.contactBtn, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}
            onPress={handleWhatsApp} activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Icon name="whatsapp" size={15} color="#16a34a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardStyles.contactBtn, { backgroundColor: '#EFF6FF', borderColor: '#93C5FD', marginLeft: 5 }]}
            onPress={handleCall} activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Icon name="phone" size={15} color="#1E3A5F" />
          </TouchableOpacity>
        </View>

        <View style={cardStyles.divider} />

        <View style={cardStyles.statsRow}>
          <View style={cardStyles.statItem}>
            <Icon name="speedometer" size={13} color={vehicle.cardColor} />
            <Text style={cardStyles.statVal}>{vehicle.currentSpeed ?? 0} km/h</Text>
            <Text style={cardStyles.statLbl}>Current</Text>
          </View>
          <View style={cardStyles.statDivider} />
          <View style={cardStyles.statItem}>
            <Icon name="speedometer-medium" size={13} color={isOverspeed ? '#ef4444' : vehicle.cardColor} />
            <View style={cardStyles.maxSpeedRow}>
              <Text style={[cardStyles.statVal, isOverspeed && { color: '#ef4444' }]}>
                {vehicle.maxSpeed ?? 0} km/h
              </Text>
              {isOverspeed && (
                <View style={cardStyles.overspeedBadge}>
                  <Icon name="alert" size={7} color="#fff" />
                </View>
              )}
            </View>
            <Text style={[cardStyles.statLbl, isOverspeed && { color: '#ef4444' }]}>Max Speed</Text>
          </View>
          <View style={cardStyles.statDivider} />
          <View style={cardStyles.statItem}>
            <Icon name="gauge" size={13} color={vehicle.cardColor} />
            <Text style={cardStyles.statVal}>{vehicle.avgSpeed ?? 0} km/h</Text>
            <Text style={cardStyles.statLbl}>Avg Speed</Text>
          </View>
          <View style={cardStyles.statDivider} />
          <View style={cardStyles.statItem}>
            <Icon name="car-speed-limiter" size={14}
              color={isOverspeed && vehicle.overspeedCount > 0 ? '#ef4444' : '#94a3b8'} />
            <View style={cardStyles.countBadgeRow}>
              <Text style={[cardStyles.statVal,
                { color: isOverspeed && vehicle.overspeedCount > 0 ? '#ef4444' : '#94a3b8' }]}>
                {vehicle.overspeedCount ?? 0}
              </Text>
              {isOverspeed && vehicle.overspeedCount > 0 && <View style={cardStyles.redDotBadge} />}
            </View>
            <Text style={[cardStyles.statLbl,
              { color: isOverspeed && vehicle.overspeedCount > 0 ? '#ef4444' : '#94a3b8' }]}>
              Overspeed
            </Text>
            {isOverspeed && vehicle.overspeedCount > 0 && (
              <View style={cardStyles.overLimitPill}>
                <Text style={cardStyles.overLimitTxt}>{'>'}{vehicle.overspeedLimit}</Text>
              </View>
            )}
          </View>
          <View style={cardStyles.statDivider} />
          <View style={cardStyles.statItem}>
            <Icon name="map-marker-radius-outline" size={14}
              color={vehicle.geofenceCount > 0 ? '#f59e0b' : '#94a3b8'} />
            <View style={cardStyles.countBadgeRow}>
              <Text style={[cardStyles.statVal,
                { color: vehicle.geofenceCount > 0 ? '#f59e0b' : '#94a3b8' }]}>
                {vehicle.geofenceCount ?? 0}
              </Text>
              {vehicle.geofenceCount > 0 && <View style={cardStyles.amberDotBadge} />}
            </View>
            <Text style={[cardStyles.statLbl,
              { color: vehicle.geofenceCount > 0 ? '#f59e0b' : '#94a3b8' }]}>Geofence</Text>
            {vehicle.geofenceCount > 0 && (
              <View style={cardStyles.geofencePill}>
                <Text style={cardStyles.geofencePillTxt}>Alert</Text>
              </View>
            )}
          </View>
        </View>

        <View style={cardStyles.divider} />

        <View style={cardStyles.statsRowSecondary}>
          <View style={cardStyles.secStatItem}>
            <Icon name="map-marker-distance" size={12} color={vehicle.cardColor} />
            <Text style={cardStyles.secStatVal}>{vehicle.totalDistance ?? '0 km'}</Text>
            <Text style={cardStyles.secStatLbl}>Distance</Text>
          </View>
          <View style={cardStyles.statDivider} />
          <View style={cardStyles.secStatItem}>
            <Icon name="compass-outline" size={12} color="#64748B" />
            <Text style={[cardStyles.secStatVal, { color: '#64748B' }]}>
              {vehicle.direction != null ? `${vehicle.direction}°` : (vehicle.lastUpdate ?? '—')}
            </Text>
            <Text style={cardStyles.secStatLbl}>
              {vehicle.direction != null ? 'Direction' : 'Last Update'}
            </Text>
          </View>
          <View style={cardStyles.statDivider} />
          <View style={cardStyles.secStatItem}>
            <Icon name="clock-check-outline" size={12} color="#16a34a" />
            <Text style={[cardStyles.secStatVal, { color: '#16a34a' }]}>
              {vehicle.runTime ?? '0h 0m'}
            </Text>
            <Text style={cardStyles.secStatLbl}>Run Time</Text>
          </View>
          <View style={cardStyles.statDivider} />
          <View style={cardStyles.secStatItem}>
            <Icon name="clock-alert-outline" size={12} color="#f59e0b" />
            <Text style={[cardStyles.secStatVal, { color: '#f59e0b' }]}>
              {vehicle.idleTime ?? '0h 0m'}
            </Text>
            <Text style={cardStyles.secStatLbl}>Idle Time</Text>
          </View>
        </View>

        <View style={cardStyles.divider} />

        <View style={cardStyles.locationRow}>
          <Icon name="map-marker-outline" size={12} color="#94a3b8" />
          <Text style={cardStyles.locationTxt} numberOfLines={3}>
            {vehicle.location}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ACTION BUTTONS */}
      <View style={cardStyles.actionsRow}>
        {[
          {
            icon: 'play-circle-outline',
            label: 'Play Route',
            onPress: () => navigation.navigate('PlayRoute', { vehicle }),
          },
          {
            icon: 'map-clock-outline',
            label: 'Route History',
            onPress: () => navigation.navigate('VehicleDetail', { vehicle }),
          },
          {
            icon: 'share-variant-outline',
            label: 'Share',
            onPress: handleShare,
          },
          {
            icon: 'bell-outline',
            label: 'Alerts',
            // Pass vehicleId so NutanAlertScreen can call POST /api/alert/:vehicle_id
            onPress: () => navigation.navigate('Alerts', { vehicleId: vehicle.id }),
          },
        ].map((btn, i, arr) => (
          <React.Fragment key={btn.label}>
            <TouchableOpacity style={cardStyles.actionBtn} onPress={btn.onPress} activeOpacity={0.7}>
              <Icon name={btn.icon} size={17} color={vehicle.cardColor} />
              <Text style={[cardStyles.actionLbl, { color: vehicle.cardColor }]}>{btn.label}</Text>
            </TouchableOpacity>
            {i < arr.length - 1 && <View style={cardStyles.actionSep} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

// ══════════════════════════════════════════════════════════════
// DASHBOARD SCREEN
// ══════════════════════════════════════════════════════════════
export default function DashboardScreen({ navigation, route }) {
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [ignitionMap, setIgnitionMap] = useState({});
  const [vehicles,    setVehicles]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const translateX     = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet(ENDPOINTS.VEHICLES);
      const mapped = Array.isArray(data) ? data.map(mapApiVehicle) : [];
      setVehicles(mapped);
    } catch (err) {
      console.error('❌ Fetch vehicles error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(translateX,     { toValue: 0,             duration: 280, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 1,             duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateX,     { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0,             duration: 250, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const handleDrawerNav = (screen) => {
    closeDrawer();
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    closeDrawer();
    await logout();
    navigation.replace('Login');
  };

  const toggleIgnition = (vehicleId) => {
    setIgnitionMap(prev => ({ ...prev, [vehicleId]: !prev[vehicleId] }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.hamburger} onPress={openDrawer}>
              <View style={styles.bar} />
              <View style={styles.bar} />
              <View style={styles.bar} />
            </TouchableOpacity>
            <Text style={styles.ownerName}>Vehicle Owner</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon} onPress={fetchVehicles}>
            <Icon name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SCROLLABLE BODY */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SelfOwnerTagline />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Vehicles</Text>
          {!loading && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeTxt}>{vehicles.length}</Text>
            </View>
          )}
        </View>

        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#1E3A5F" />
            <Text style={styles.loadingTxt}>Loading vehicles...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.errorBox}>
            <Icon name="alert-circle-outline" size={36} color="#ef4444" />
            <Text style={styles.errorTxt}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchVehicles} activeOpacity={0.8}>
              <Icon name="refresh" size={15} color="#fff" />
              <Text style={styles.retryTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && vehicles.length === 0 && (
          <View style={styles.centerBox}>
            <Icon name="truck-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTxt}>No vehicles found</Text>
          </View>
        )}

        {!loading && !error && vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            ignitionOn={!!ignitionMap[vehicle.id]}
            onToggleIgnition={toggleIgnition}
            navigation={navigation}
          />
        ))}
      </ScrollView>

      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>
      )}

      {/* DRAWER */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <View style={styles.drawerHeader}>
          <View style={styles.avatarCircle}>
            <Icon name="account" size={32} color="#fff" />
          </View>
          <Text style={styles.drawerName}>Vehicle Owner</Text>
          <Text style={styles.drawerEmail}>owner@example.com</Text>
        </View>
        <ScrollView>
          {drawerItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.drawerItem}
              onPress={() => handleDrawerNav(item.screen)}
            >
              <Icon name={item.icon} size={22} color="#4B5563" />
              <Text style={styles.drawerItemLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.drawerDivider} />
          <TouchableOpacity style={styles.drawerItem} onPress={handleLogout}>
            <Icon name="logout" size={22} color="#DC2626" />
            <Text style={[styles.drawerItemLabel, { color: '#DC2626' }]}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const taglineStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1E3A5F', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16, overflow: 'hidden',
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  textWrap:  { flex: 1 },
  heading:   { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  sub:       { fontSize: 10.5, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
});

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F3F4F6' },
  header:     { backgroundColor: '#1E3A5F', paddingHorizontal: 16, paddingTop: 30, paddingBottom: 16 },
  headerTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hamburger: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  bar:       { width: 18, height: 2, backgroundColor: '#fff', borderRadius: 2 },
  ownerName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  sectionRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: '#111827' },
  countBadge:    { backgroundColor: '#1E3A5F', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeTxt: { fontSize: 12, fontWeight: '800', color: '#fff' },
  centerBox:     { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingTxt:    { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  emptyTxt:      { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  errorBox: {
    alignItems: 'center', paddingVertical: 36, gap: 10,
    backgroundColor: '#FEF2F2', borderRadius: 14, padding: 20,
  },
  errorTxt: { fontSize: 13, color: '#ef4444', textAlign: 'center', fontWeight: '500' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1E3A5F', borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10, marginTop: 4,
  },
  retryTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10,
  },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: DRAWER_WIDTH, backgroundColor: '#fff', zIndex: 20,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  drawerHeader: {
    backgroundColor: '#1E3A5F', paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  drawerName:      { color: '#fff', fontSize: 16, fontWeight: '700' },
  drawerEmail:     { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 20,
  },
  drawerItemLabel: { fontSize: 15, color: '#111827' },
  drawerDivider:   { height: 1, backgroundColor: '#F3F4F6', marginVertical: 6 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
    marginBottom: 16,
  },
  cardBand: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  bandHighlight: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '50%', backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bandLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  bandRight: { alignItems: 'flex-end', gap: 4 },
  truckIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center', alignItems: 'center',
  },
  bandRegNo:     { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  bandModel:     { fontSize: 10, color: 'rgba(255,255,255,0.78)', fontWeight: '500', marginTop: 1 },
  statusAndMenu: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  statusPillDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.85)' },
  statusPillTxt: { fontSize: 10, color: '#fff', fontWeight: '700', letterSpacing: 0.3 },
  threeDotBtn: {
    width: 26, height: 26, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 13,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  apiStatusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  apiStatusPrefix: { fontSize: 10, color: '#64748b', fontWeight: '500' },
  apiStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1,
  },
  apiStatusDot: { width: 5, height: 5, borderRadius: 2.5 },
  apiStatusTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  menuOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center', padding: 30,
  },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 16, width: '80%', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  menuVehicleName: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  menuItemLast:  { borderBottomWidth: 0 },
  menuItemIcon:  { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  menuItemLabel: { flex: 1, fontSize: 13.5, fontWeight: '600' },
  ignitionWrap:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ignSwitch:     { transform: [{ scaleX: 0.6 }, { scaleY: 0.6 }] },
  ignLabel:      { fontSize: 9, fontWeight: '800', letterSpacing: 0.4, color: 'rgba(255,255,255,0.75)' },
  cardBody:      { paddingTop: 10, paddingHorizontal: 12 },
  driverRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  driverIconWrap:{ width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  driverInfo:    { flex: 1 },
  driverName:    { fontSize: 12, color: '#1e293b', fontWeight: '700' },
  contactBtn: {
    width: 29, height: 29, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5,
  },
  divider:     { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },
  statsRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  statItem:    { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 44, backgroundColor: '#F1F5F9', alignSelf: 'center' },
  statVal:     { fontSize: 10, fontWeight: '800', color: '#0f172a' },
  statLbl:     { fontSize: 7.5, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  maxSpeedRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  overspeedBadge: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444',
    justifyContent: 'center', alignItems: 'center',
  },
  countBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  redDotBadge:   { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#ef4444' },
  amberDotBadge: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#f59e0b' },
  overLimitPill: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 7, paddingHorizontal: 3, paddingVertical: 1, marginTop: 1,
  },
  overLimitTxt: { fontSize: 6.5, color: '#ef4444', fontWeight: '800' },
  geofencePill: {
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 7, paddingHorizontal: 3, paddingVertical: 1, marginTop: 1,
  },
  geofencePillTxt:   { fontSize: 6.5, color: '#f59e0b', fontWeight: '800' },
  statsRowSecondary: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  secStatItem: { flex: 1, alignItems: 'center', gap: 2 },
  secStatVal:  { fontSize: 11, fontWeight: '700', color: '#0f172a' },
  secStatLbl:  { fontSize: 9.5, color: '#64748B', fontWeight: '500' },
  locationRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 5,
    backgroundColor: '#F8FAFC', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 6, marginBottom: 10,
  },
  locationTxt: { flex: 1, fontSize: 10.5, color: '#64748B', fontWeight: '500', lineHeight: 15 },
  actionsRow:  { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionBtn:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 3 },
  actionSep:   { width: 1, backgroundColor: '#F1F5F9', marginVertical: 7 },
  actionLbl:   { fontSize: 8.5, fontWeight: '700', letterSpacing: 0.2, textAlign: 'center' },
});