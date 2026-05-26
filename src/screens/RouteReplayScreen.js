import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ROUTE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }

    .car-icon { font-size: 22px; transition: transform 0.1s linear; }

    #controls {
      position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 10px; z-index: 1000; background: rgba(255,255,255,0.95);
      border-radius: 50px; padding: 10px 18px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.18);
    }
    #controls button {
      background: #1E3A5F; color: #fff; border: none; border-radius: 50px;
      padding: 8px 22px; font-size: 13px; font-weight: 600; cursor: pointer;
      letter-spacing: 0.5px;
    }
    #controls button:active { opacity: 0.8; }
    #controls button.secondary { background: #F3F4F6; color: #1E3A5F; }

    #progress-wrap {
      position: absolute; bottom: 76px; left: 16px; right: 16px; z-index: 1000;
      background: rgba(255,255,255,0.92); border-radius: 12px; padding: 10px 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.10);
    }
    #progress-bar-bg {
      height: 6px; background: #E5E7EB; border-radius: 6px; overflow: hidden;
    }
    #progress-bar { height: 6px; background: #2563EB; border-radius: 6px; width: 0%; transition: width 0.1s; }
    #progress-label {
      display: flex; justify-content: space-between; margin-top: 6px;
      font-size: 11px; color: #6B7280; font-family: monospace;
    }

    .leaflet-routing-container { display: none !important; }
  </style>
</head>
<body>
<div id="map"></div>
<div id="progress-wrap">
  <div id="progress-bar-bg"><div id="progress-bar"></div></div>
  <div id="progress-label"><span id="dist-label">0.0 km</span><span id="time-label">00:00</span></div>
</div>
<div id="controls">
  <button class="secondary" id="resetBtn">↺ Reset</button>
  <button id="playBtn">▶ Play</button>
</div>

<script>
  const map = L.map('map', { zoomControl: true, attributionControl: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // Sample route: Mumbai area waypoints
  const routeCoords = [
    [19.0760, 72.8777],
    [19.0790, 72.8810],
    [19.0825, 72.8845],
    [19.0855, 72.8870],
    [19.0875, 72.8900],
    [19.0900, 72.8930],
    [19.0920, 72.8960],
    [19.0945, 72.8990],
    [19.0970, 72.9010],
    [19.0990, 72.9030],
    [19.1010, 72.9050],
    [19.1035, 72.9070],
    [19.1055, 72.9090],
    [19.1075, 72.9110],
    [19.1095, 72.9130],
  ];

  // Draw full route as dashed grey
  L.polyline(routeCoords, { color: '#D1D5DB', weight: 4, dashArray: '8,6' }).addTo(map);

  // Animated traveled path
  const traveledLine = L.polyline([], { color: '#2563EB', weight: 5 }).addTo(map);

  // Start / End markers
  L.circleMarker(routeCoords[0], { radius: 8, color: '#10B981', fillColor: '#10B981', fillOpacity: 1, weight: 2 })
    .bindTooltip('Start', { permanent: true, direction: 'right', className: '' })
    .addTo(map);
  L.circleMarker(routeCoords[routeCoords.length - 1], { radius: 8, color: '#EF4444', fillColor: '#EF4444', fillOpacity: 1, weight: 2 })
    .bindTooltip('End', { permanent: true, direction: 'right' })
    .addTo(map);

  // Car marker
  const carIcon = L.divIcon({ html: '<div class="car-icon">🚗</div>', iconAnchor: [12, 12], className: '' });
  const carMarker = L.marker(routeCoords[0], { icon: carIcon, zIndexOffset: 1000 }).addTo(map);

  map.fitBounds(L.latLngBounds(routeCoords).pad(0.2));

  let step = 0;
  let playing = false;
  let interval = null;
  let elapsed = 0;
  let clockInterval = null;

  const total = routeCoords.length - 1;
  const playBtn = document.getElementById('playBtn');
  const resetBtn = document.getElementById('resetBtn');
  const progressBar = document.getElementById('progress-bar');
  const distLabel = document.getElementById('dist-label');
  const timeLabel = document.getElementById('time-label');

  function getAngle(from, to) {
    const dy = to[0] - from[0];
    const dx = to[1] - from[1];
    return Math.atan2(dx, dy) * (180 / Math.PI);
  }

  function calcDist(coords) {
    let d = 0;
    for (let i = 1; i <= step; i++) {
      const R = 6371;
      const dLat = (coords[i][0] - coords[i-1][0]) * Math.PI / 180;
      const dLon = (coords[i][1] - coords[i-1][1]) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(coords[i-1][0]*Math.PI/180)*Math.cos(coords[i][0]*Math.PI/180)*Math.sin(dLon/2)**2;
      d += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    return d;
  }

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return m + ':' + sec;
  }

  function tick() {
    if (step >= total) {
      clearInterval(interval);
      clearInterval(clockInterval);
      playing = false;
      playBtn.textContent = '✓ Done';
      return;
    }
    step++;
    const pos = routeCoords[step];
    carMarker.setLatLng(pos);
    traveledLine.setLatLngs(routeCoords.slice(0, step + 1));
    progressBar.style.width = (step / total * 100) + '%';
    distLabel.textContent = calcDist(routeCoords).toFixed(1) + ' km';
    if (step < total) {
      const angle = getAngle(routeCoords[step - 1], routeCoords[step]);
      const el = carMarker.getElement();
      if (el) el.querySelector('.car-icon').style.transform = 'rotate(' + angle + 'deg)';
    }
  }

  function play() {
    if (step >= total) reset();
    playing = true;
    playBtn.textContent = '⏸ Pause';
    interval = setInterval(tick, 400);
    clockInterval = setInterval(() => {
      elapsed++;
      timeLabel.textContent = formatTime(elapsed);
    }, 400);
  }

  function pause() {
    playing = false;
    clearInterval(interval);
    clearInterval(clockInterval);
    playBtn.textContent = '▶ Play';
  }

  function reset() {
    pause();
    step = 0;
    elapsed = 0;
    carMarker.setLatLng(routeCoords[0]);
    traveledLine.setLatLngs([]);
    progressBar.style.width = '0%';
    distLabel.textContent = '0.0 km';
    timeLabel.textContent = '00:00';
    playBtn.textContent = '▶ Play';
  }

  playBtn.addEventListener('click', () => playing ? pause() : play());
  resetBtn.addEventListener('click', reset);
</script>
</body>
</html>
`;

export default function RouteReplayScreen({ navigation }) {
  const [speed, setSpeed] = useState(1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Replay</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Icon name="share-variant-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Info Strip */}
      <View style={styles.infoStrip}>
        <View style={styles.infoItem}>
          <Icon name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.infoText}>Today, 09:15 AM</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Icon name="map-marker-distance" size={14} color="#6B7280" />
          <Text style={styles.infoText}>~8.2 km</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Icon name="clock-outline" size={14} color="#6B7280" />
          <Text style={styles.infoText}>~22 min</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: ROUTE_HTML }}
          style={styles.map}
          javaScriptEnabled
          originWhitelist={['*']}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

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
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerIcon: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  infoStrip: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  infoDivider: { width: 1, height: 14, backgroundColor: '#E5E7EB' },

  mapContainer: { flex: 1 },
  map: { flex: 1, backgroundColor: '#F3F4F6' },
});