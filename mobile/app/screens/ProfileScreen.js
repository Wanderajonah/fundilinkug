import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import BottomTabBar from '../components/BottomTabBar';
import EmptyState from '../components/EmptyState';
import { useTabBarHeight } from '../hooks/useTabBarHeight';
import { getProfile } from '../../services/usersApi';
import { resolveMediaUrl } from '../../utils/image';
import { initials } from '../utils/ratings';

export default function ProfileScreen({
  userRole = 'customer',
  userName = 'User',
  userFullName,
  userEmail,
  onNavigate,
  onLogout,
}) {
  const tabBarHeight = useTabBarHeight();
  const isFundi = userRole === 'fundi';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getProfile();
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const user = profile?.user || {};
  const fundiProfile = profile?.fundiProfile || {};
  const displayName =
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    userFullName ||
    userName;
  const email = user.email || userEmail || '';
  const skills = fundiProfile.skills || [];
  const rating = fundiProfile.rating || 0;
  const completedJobs = fundiProfile.completedJobs || 0;
  const yearsExperience = fundiProfile.experience || 0;
  const trade = skills[0] || 'Fundi';

  const profilePhotoUri = user?.profilePhoto
    ? resolveMediaUrl(user.profilePhoto)
    : user?.avatarUrl || user?.avatar || user?.imageUrl || '';

  const menuItems = isFundi
    ? [
        { key: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
        { key: 'edit', label: 'Edit Fundi Profile', icon: 'person-outline' },
        { key: 'skills', label: 'Skills & Portfolio', icon: 'construct-outline' },
        { key: 'earnings', label: 'Earnings History', icon: 'cash-outline' },
        { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
        { key: 'support', label: 'Help & Support', icon: 'help-circle-outline' },
        { key: 'settings', label: 'Settings', icon: 'settings-outline' },
      ]
    : [
        { key: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
        { key: 'edit', label: 'Edit Profile', icon: 'person-outline' },
        { key: 'history', label: 'Booking History', icon: 'calendar-outline' },
        { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
        { key: 'support', label: 'Help & Support', icon: 'help-circle-outline' },
        { key: 'settings', label: 'Settings', icon: 'settings-outline' },
      ];

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => onNavigate?.('settings')}>
            <Ionicons name="settings-outline" size={18} color={theme.colors.muted} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
          </View>
        ) : (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                {profilePhotoUri ? (
                  <Image
                    source={{ uri: profilePhotoUri }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>{initials(displayName)}</Text>
                )}
              </View>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.sub}>{email || 'No email added'}</Text>
              {isFundi ? (
                <Text style={styles.trade}>
                  {trade}
                  {completedJobs ? ` · ${completedJobs} jobs` : ''}
                  {yearsExperience ? ` · ${yearsExperience} yrs` : ''}
                </Text>
              ) : null}
              <View style={styles.ratingRow}>
                {isFundi && rating > 0 ? (
                  <>
                    <Text style={styles.rating}>{rating.toFixed(1)}</Text>
                    <Text style={styles.ratingLabel}>★</Text>
                  </>
                ) : null}
                <Text style={styles.roleBadge}>{isFundi ? 'Fundi' : 'Client'}</Text>
              </View>
            </View>

            {isFundi ? (
              skills.length > 0 ? (
                <View style={styles.skillsCard}>
                  <Text style={styles.skillsTitle}>Skills</Text>
                  <View style={styles.skillRow}>
                    {skills.map((s) => (
                      <View key={s} style={styles.skillChip}>
                        <Text style={styles.skillText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <EmptyState
                  icon="construct-outline"
                  title="No skills added yet"
                  message="Complete your fundi profile to showcase your skills."
                />
              )
            ) : null}
          </>
        )}

        <View style={styles.menuCard}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuRow}
              onPress={() => {
                if (item.key === 'wallet') return onNavigate?.('wallet');
                if (item.key === 'history') return onNavigate?.('bookingHistory');
                if (item.key === 'notifications') return onNavigate?.('notifications');
                if (item.key === 'edit') return onNavigate?.('editProfile');
                if (item.key === 'settings') return onNavigate?.('settings');
                if (item.key === 'support') return onNavigate?.('help');
                if (item.key === 'earnings') return onNavigate?.('bookings');
                return Alert.alert(item.label, 'Coming soon.');
              }}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={18} color={theme.colors.accent} />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutRow}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: () => onLogout?.() },
            ]);
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomTabBar active="profile" onTab={onNavigate} role={userRole} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  loadingWrap: { paddingVertical: 40, alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: theme.colors.white, fontSize: 20, fontWeight: '900' },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    ...theme.elevation.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,184,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,184,0,0.3)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: { color: theme.colors.white, fontWeight: '900', fontSize: 22 },
  name: { color: theme.colors.white, fontWeight: '900', fontSize: 18 },
  sub: { color: theme.colors.muted, marginTop: 4, fontSize: 13 },
  trade: { color: theme.colors.muted, fontSize: 12, marginTop: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  rating: { color: theme.colors.accent, fontWeight: '900', fontSize: 14 },
  ratingLabel: { color: theme.colors.accent, fontWeight: '900' },
  roleBadge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.input,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  skillsCard: {
    backgroundColor: theme.colors.input,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skillsTitle: { color: theme.colors.white, fontWeight: '800', marginBottom: 10 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: 'rgba(255,184,0,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  skillText: { color: theme.colors.accent, fontWeight: '700', fontSize: 12 },
  menuCard: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    overflow: 'hidden',
    ...theme.elevation.sm,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,184,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { color: theme.colors.white, fontWeight: '700', fontSize: 14 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chevron: { color: theme.colors.mutedDark, fontSize: 20, fontWeight: '600' },
  logoutRow: {
    marginTop: 16,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  logoutText: { color: theme.colors.red, fontWeight: '900', fontSize: 14 },
});
