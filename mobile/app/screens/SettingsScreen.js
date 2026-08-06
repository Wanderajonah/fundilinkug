import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';

export default function SettingsScreen({ onNavigate }) {
  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => onNavigate?.('profile')} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}><Text style={styles.rowText}>Push Notifications</Text><Switch value trackColor={{ true: theme.colors.accent }} thumbColor={theme.colors.textDark} /></View>
          <View style={styles.row}><Text style={styles.rowText}>Email Notifications</Text><Switch value={false} trackColor={{ true: theme.colors.accent }} thumbColor={theme.colors.textDark} /></View>
          <View style={styles.row}><Text style={styles.rowText}>SMS Notifications</Text><Switch value trackColor={{ true: theme.colors.accent }} thumbColor={theme.colors.textDark} /></View>
        </View>

        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.card}>
          <View style={styles.row}><Text style={styles.rowText}>Share Location</Text><Switch value trackColor={{ true: theme.colors.accent }} thumbColor={theme.colors.textDark} /></View>
          <TouchableOpacity style={styles.row}><Text style={styles.rowText}>Profile Visibility</Text><Ionicons name="chevron-forward" size={16} color={theme.colors.mutedDark} /></TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>App Settings</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}><Text style={styles.rowText}>Language</Text><Text style={styles.valueText}>English</Text></TouchableOpacity>
          <TouchableOpacity style={styles.row}><Text style={styles.rowText}>Currency</Text><Text style={styles.valueText}>UGX</Text></TouchableOpacity>
          <View style={styles.row}><Text style={styles.rowText}>Dark Mode</Text><Switch value trackColor={{ true: theme.colors.accent }} thumbColor={theme.colors.textDark} /></View>
        </View>

        <Text style={styles.sectionLabel}>Legal</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}><Text style={styles.rowText}>Terms & Conditions</Text><Ionicons name="chevron-forward" size={16} color={theme.colors.mutedDark} /></TouchableOpacity>
          <TouchableOpacity style={styles.row}><Text style={styles.rowText}>Privacy Policy</Text><Ionicons name="chevron-forward" size={16} color={theme.colors.mutedDark} /></TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  container: { paddingHorizontal: 16, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 16 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.input, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.colors.white, fontWeight: '900', fontSize: 18 },

  sectionLabel: { color: theme.colors.mutedDark, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: 10, marginBottom: 8 },
  card: { backgroundColor: theme.colors.panel, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, ...theme.elevation.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  rowText: { color: theme.colors.white, fontWeight: '700', fontSize: 14 },
  valueText: { color: theme.colors.mutedDark, fontSize: 14 },
});
