/**
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ── Existing screens ──────────────────────────────────────────────────────────
import LoginScreen            from '../screens/LoginScreen';
import DashboardScreen        from '../screens/DashboardScreen';
import ProfileScreen          from '../screens/ProfileScreen';
import FindVehicleScreen      from '../screens/FindVehicleScreen';
import NutanAlertScreen       from '../screens/NutanAlertScreen';
import NutanAlertAutoScreen   from '../screens/NutanAlertAutoScreen';
import NutanAlertManualScreen from '../screens/NutanAlertManualScreen';
import RouteReplayScreen      from '../screens/RouteReplayScreen';
import SettingsScreen         from '../screens/SettingsScreen';
import ContactUsScreen        from '../screens/ContactUsScreen';
import ShareAppScreen         from '../screens/ShareAppScreen';
import AboutUsScreen          from '../screens/AboutUsScreen';
import LearnScreen            from '../screens/LearnScreen';

// ── NutanAlert sub-screens ────────────────────────────────────────────────────
import AlertDaysScreen        from '../screens/AlertDaysScreen';
import TimePickerScreen       from '../screens/TimePickerScreen';

// ── Vehicle Alerts screen ─────────────────────────────────────────────────────
import AlertsScreen           from '../screens/AlertsScreen';
import HistoryAlertScreen   from '../screens/HistoryAlertScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        {/* ── Auth ── */}
        <Stack.Screen name="Login"              component={LoginScreen} />

        {/* ── Main ── */}
        <Stack.Screen name="Dashboard"          component={DashboardScreen} />
        <Stack.Screen name="Profile"            component={ProfileScreen} />
        <Stack.Screen name="FindVehicle"        component={FindVehicleScreen} />
        <Stack.Screen name="RouteReplay"        component={RouteReplayScreen} />
        <Stack.Screen name="Settings"           component={SettingsScreen} />
        <Stack.Screen name="ContactUs"          component={ContactUsScreen} />
        <Stack.Screen name="ShareApp"           component={ShareAppScreen} />
        <Stack.Screen name="AboutUs"            component={AboutUsScreen} />
        <Stack.Screen name="Learn"              component={LearnScreen} />

        {/* ── Vehicle Alerts ── */}
        <Stack.Screen name="Alerts"             component={AlertsScreen} />

        {/* ── Nutan Alert flow ── */}
        <Stack.Screen name="NutanAlert"         component={NutanAlertScreen} />
        <Stack.Screen name="NutanAlertAuto"     component={NutanAlertAutoScreen} />
        <Stack.Screen name="NutanAlertManual"   component={NutanAlertManualScreen} />
        <Stack.Screen name="AlertDaysScreen"    component={AlertDaysScreen} />
        <Stack.Screen name="TimePickerScreen"   component={TimePickerScreen} />
        <Stack.Screen name="HistoryAlertScreen" component={HistoryAlertScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}