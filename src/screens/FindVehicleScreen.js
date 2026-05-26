import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const VEHICLE = {
  latitude: 18.5204,
  longitude: 73.8567,
  address: 'XYZ Road, Shivajinagar, Pune, Maharashtra 411005',
  speed: '0 km/h',
  status: 'Parked',
  lastUpdated: 'Just now',
};

function buildLeafletHTML(lat, lng) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; background:#e8edf2; }
    .car-marker {
      background:#2563EB; border-radius:50%; width:40px; height:40px;
      display:flex; align-items:center; justify-content:center;
      border:3px solid #fff; box-shadow:0 3px 10px rgba(37,99,235,0.45);
      font-size:20px; line-height:1;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl:true, attributionControl:false })
               .setView([${lat}, ${lng}], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map);

    var icon = L.divIcon({
      className: '',
      html: '<div class="car-marker">🚗</div>',
      iconSize: [40,40], iconAnchor:[20,20], popupAnchor:[0,-24],
    });

    L.marker([${lat}, ${lng}], { icon })
      .addTo(map)
      .bindPopup('<b>My Vehicle</b><br>${lat.toFixed(4)}, ${lng.toFixed(4)}')
      .openPopup();

    L.circle([${lat}, ${lng}], {
      radius:120, color:'#2563EB', fillColor:'#2563EB',
      fillOpacity:0.12, weight:1.5
    }).addTo(map);
  </script>
</body>
</html>`;
}

export default function FindVehicleScreen({ navigation }) {
  const [data] = useState(VEHICLE);
  const [refreshing, setRefreshing] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setMapKey((k) => k + 1); setRefreshing(false); }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find My Vehicle</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Leaflet Map in WebView */}
      <View style={styles.mapContainer}>
        <WebView
          key={mapKey}
          originWhitelist={['*']}
          source={{ html: buildLeafletHTML(data.latitude, data.longitude) }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
        />
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>{data.status}</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
          <View style={styles.vehicleIconBox}>
            <Icon name="car-side" size={28} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoCardTitle}>Vehicle Location</Text>
            <Text style={styles.infoCardSub}>Updated: {data.lastUpdated}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="map-marker-outline" size={18} color="#6B7280" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{data.address}</Text>
          </View>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoStatsRow}>
          <View style={styles.infoStat}>
            <Icon name="speedometer" size={18} color="#2563EB" />
            <Text style={styles.infoStatValue}>{data.speed}</Text>
            <Text style={styles.infoStatLabel}>Speed</Text>
          </View>
          <View style={styles.infoStatDivider} />
          <View style={styles.infoStat}>
            <Icon name="crosshairs-gps" size={18} color="#059669" />
            <Text style={styles.infoStatValue}>{data.latitude.toFixed(4)}</Text>
            <Text style={styles.infoStatLabel}>Latitude</Text>
          </View>
          <View style={styles.infoStatDivider} />
          <View style={styles.infoStat}>
            <Icon name="crosshairs-gps" size={18} color="#7C3AED" />
            <Text style={styles.infoStatValue}>{data.longitude.toFixed(4)}</Text>
            <Text style={styles.infoStatLabel}>Longitude</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={refreshing}>
          {refreshing
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Icon name="refresh" size={18} color="#fff" /><Text style={styles.refreshBtnText}>Refresh Location</Text></>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  header: {
    backgroundColor: '#1E3A5F',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  mapContainer: { height: 280, position: 'relative', backgroundColor: '#E5E7EB' },
  map: { flex: 1, backgroundColor: 'transparent' },

  statusPill: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#fff', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  statusPillText: { fontSize: 13, fontWeight: '600', color: '#111827' },

  infoCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16,
    padding: 20, shadowColor: '#000', shadowOpacity: 0.07,
    shadowRadius: 12, elevation: 4, flex: 1,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  vehicleIconBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  infoCardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  infoCardSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  infoLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#374151', fontWeight: '500', lineHeight: 20 },
  infoDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 },

  infoStatsRow: { flexDirection: 'row', marginBottom: 20 },
  infoStat: { flex: 1, alignItems: 'center', gap: 4 },
  infoStatValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  infoStatLabel: { fontSize: 11, color: '#9CA3AF' },
  infoStatDivider: { width: 1, backgroundColor: '#F3F4F6', marginHorizontal: 8 },

  refreshBtn: {
    backgroundColor: '#1E3A5F', borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  refreshBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});