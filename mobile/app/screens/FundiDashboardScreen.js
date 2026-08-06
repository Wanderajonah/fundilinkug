import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import FundiMap from '../components/FundiMap';
import PrimaryButton from '../components/PrimaryButton';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import CountdownTimer from '../components/CountdownTimer';
import { useLocation } from '../../context/LocationContext';
import { useBooking } from '../../context/BookingContext';
import {
  acceptBooking,
  declineBooking,
  updateFundiAvailability,
  getErrorMessage,
} from '../../services/bookingsApi';
import { emitSocket } from '../../services/socketService';
import { getGreeting, computeEarnings } from '../utils/jobs';
import { getTimeLeftSeconds } from '../utils/bookings';
import { formatUgx, initials } from '../utils/ratings';
import theme from '../theme';

export default function FundiDashboardScreen({
  userName = 'User',
  userFullName,
  userRole = 'fundi',
  userId,
  onNavigate,
}) {
  const { coords, address, region } = useLocation();
  const {
    pendingRequest,
    setPendingRequest,
    bookings,
    refreshBookings,
    loading: bookingsLoading,
    error: bookingsError,
    notification,
    clearNotification,
  } = useBooking();

  const [online, setOnline] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  const greeting = useMemo(() => getGreeting(), []);
  const displayName = userFullName || userName;

  const activeBookings = useMemo(
    () =>
      bookings.filter((b) =>
        ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(b.status)
      ),
    [bookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'COMPLETED'),
    [bookings]
  );

  const earnings = useMemo(
    () => computeEarnings(completedBookings.map((b) => ({
      status: 'completed',
      quoteAmount: b.amount || 0,
      updatedAt: b.createdAt,
      createdAt: b.createdAt,
    }))),
    [completedBookings]
  );

  const handleToggleOnline = async (value) => {
    setOnline(value);
    setAvailabilityLoading(true);
    try {
      await updateFundiAvailability(value);
    } catch (e) {
      setOnline(!value);
      Alert.alert('Could not update availability', getErrorMessage(e));
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleAccept = async () => {
    const id = pendingRequest?.bookingId;
    if (!id) return;
    setAcceptLoading(true);
    setError('');
    try {
      await acceptBooking(id);
      emitSocket('accept_booking', { bookingId: id });
      Alert.alert('Booking accepted', `${pendingRequest.clientName}'s request has been accepted.`);
      setPendingRequest(null);
      await refreshBookings();
      onNavigate?.('fundiBookingDetail', { bookingId: id });
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      Alert.alert('Could not accept', msg);
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleDecline = async () => {
    const id = pendingRequest?.bookingId;
    if (!id) return;
    setDeclineLoading(true);
    setError('');
    try {
      await declineBooking(id);
      emitSocket('decline_booking', { bookingId: id });
      Alert.alert('Declined', 'Booking request declined.');
      setPendingRequest(null);
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      Alert.alert('Could not decline', msg);
    } finally {
      setDeclineLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshBookings();
    setRefreshing(false);
  }, [refreshBookings]);

  const hasIncomingRequest = Boolean(pendingRequest?.bookingId && online);

  return (
    <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(displayName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>
              {greeting}, {userName}
            </Text>
            <Text style={styles.role}>Fundi · {online ? 'Available' : 'Offline'}</Text>
          </View>
          <View style={styles.onlineWrap}>
            {availabilityLoading ? (
              <ActivityIndicator color={theme.colors.accent} size="small" />
            ) : (
              <Switch value={online} onValueChange={handleToggleOnline} trackColor={{ true: theme.colors.green }} />
            )}
            <Text style={[styles.onlineText, online && styles.onlineOn]}>
              {online ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
        </View>

        {notification ? (
          <View style={styles.notifBanner}>
            <Text style={styles.notifTitle}>{notification.title}</Text>
            <Text style={styles.notifMsg}>{notification.message}</Text>
            <TouchableOpacity onPress={clearNotification}>
              <Text style={styles.notifDismiss}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Quick Stats */}
        <View style={styles.earningsRow}>
          <View style={styles.earnCard}>
            <Text style={styles.earnLabel}>Today's Earnings</Text>
            <Text style={styles.earnVal}>{formatUgx(earnings.today)}</Text>
          </View>
          <View style={styles.earnCard}>
            <Text style={styles.earnLabel}>This Week</Text>
            <Text style={styles.earnVal}>{formatUgx(earnings.week)}</Text>
          </View>
          <View style={styles.earnCard}>
            <Text style={styles.earnLabel}>Completed</Text>
            <Text style={styles.earnVal}>{completedBookings.length}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => onNavigate?.('bookings')}>
            <Ionicons name="briefcase-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.quickText}>My Jobs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => onNavigate?.('chat')}>
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.quickText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => onNavigate?.('profile')}>
            <Ionicons name="person-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.quickText}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Active Bookings */}
        <Text style={styles.section}>Active Bookings</Text>
        {bookingsLoading ? (
          <LoadingSkeleton count={2} />
        ) : activeBookings.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No active bookings"
            message="Accepted jobs will appear here."
          />
        ) : (
          activeBookings.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.scheduleRow}
              onPress={() => onNavigate?.('fundiBookingDetail', { bookingId: b.id })}
            >
              <View style={styles.scheduleRowLeft}>
                <View style={styles.scheduleAvatar}>
                  <Text style={styles.scheduleAvatarText}>{initials(b.clientName)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleTitle}>{b.clientName}</Text>
                  <Text style={styles.scheduleSub}>{b.service}</Text>
                  <Text style={styles.scheduleSub}>{b.address}</Text>
                </View>
              </View>
              <View style={styles.scheduleRowRight}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{b.statusLabel}</Text>
                </View>
                {b.agreedPrice ? (
                  <Text style={styles.schedulePrice}>{formatUgx(b.agreedPrice)}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Incoming Booking Requests (below Active Bookings) */}
        {hasIncomingRequest ? (
          <View style={styles.incomingSection}>
            <View style={styles.incomingHeader}>
              <Ionicons name="notifications" size={18} color={theme.colors.accent} />
              <Text style={styles.section}>Incoming Booking Request</Text>
            </View>
            <View style={styles.jobRequest}>
              <View style={styles.requestTop}>
                <View style={styles.requestAvatar}>
                  <Text style={styles.requestAvatarText}>{initials(pendingRequest.clientName)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{pendingRequest.clientName}</Text>
                  <Text style={styles.jobCategory}>{pendingRequest.category || pendingRequest.service}</Text>
                </View>
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.requestDetailRow}>
                  <Ionicons name="construct-outline" size={16} color={theme.colors.muted} />
                  <Text style={styles.jobDesc} numberOfLines={2}>
                    {pendingRequest.description || 'No description provided'}
                  </Text>
                </View>
                <View style={styles.requestDetailRow}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.muted} />
                  <Text style={styles.jobMeta}>{pendingRequest.address || 'Client location'}</Text>
                </View>
                {pendingRequest.distanceKm != null ? (
                  <View style={styles.requestDetailRow}>
                    <Ionicons name="navigate-outline" size={16} color={theme.colors.muted} />
                    <Text style={styles.jobMeta}>{pendingRequest.distanceKm} km away</Text>
                  </View>
                ) : null}
                {pendingRequest.estimatedPrice ? (
                  <View style={styles.requestDetailRow}>
                    <Ionicons name="cash-outline" size={16} color={theme.colors.muted} />
                    <Text style={styles.jobMeta}>Est. {formatUgx(pendingRequest.estimatedPrice)}</Text>
                  </View>
                ) : null}
              </View>

              <CountdownTimer
                expiresAt={pendingRequest.expiresAt}
                initialSeconds={getTimeLeftSeconds(pendingRequest)}
                label="Respond within"
                onExpire={() => setPendingRequest(null)}
              />

              <View style={styles.jobActions}>
                <PrimaryButton style={{ flex: 1 }} onPress={handleAccept} disabled={acceptLoading}>
                  {acceptLoading ? 'Accepting…' : 'Accept Booking'}
                </PrimaryButton>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={handleDecline}
                  disabled={declineLoading}
                >
                  {declineLoading ? (
                    <ActivityIndicator color={theme.colors.muted} size="small" />
                  ) : (
                    <Text style={styles.declineText}>Cancel</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Error display */}
        {error || bookingsError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.red} />
            <Text style={styles.errorText}>{error || bookingsError}</Text>
          </View>
        ) : null}

        {/* Completed / Recent Jobs */}
        {completedBookings.length > 0 ? (
          <>
            <Text style={styles.section}>Completed Jobs</Text>
            {completedBookings.slice(0, 5).map((b) => (
              <View key={b.id} style={styles.completedRow}>
                <View style={styles.completedLeft}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.green} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedTitle}>{b.clientName}</Text>
                    <Text style={styles.completedSub}>{b.service}</Text>
                  </View>
                </View>
                {b.amount ? (
                  <Text style={styles.completedAmount}>{formatUgx(b.amount)}</Text>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {/* My Location */}
        <Text style={styles.section}>My Location</Text>
        <FundiMap
          style={styles.map}
          region={region}
          currentLocation={coords}
          showRadiusCircle
          radiusKm={5}
        />
        <Text style={styles.locText}>
          {address || 'Set your location'} · {online ? 'Sharing location' : 'Location hidden'}
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,184,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: theme.colors.white, fontWeight: '800' },
  greet: { color: theme.colors.white, fontSize: 18, fontWeight: '800' },
  role: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
  onlineWrap: { alignItems: 'center' },
  onlineText: { color: theme.colors.muted, fontSize: 10, fontWeight: '800', marginTop: 4 },
  onlineOn: { color: theme.colors.green },
  notifBanner: {
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.25)',
  },
  notifTitle: { color: theme.colors.white, fontWeight: '800' },
  notifMsg: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
  notifDismiss: { color: theme.colors.accent, fontWeight: '700', marginTop: 8, fontSize: 12 },
  earningsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  earnCard: {
    flex: 1,
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    padding: 14,
    minHeight: 80,
  },
  earnLabel: { color: theme.colors.muted, fontSize: 11 },
  earnVal: { color: theme.colors.white, fontWeight: '900', fontSize: 16, marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickText: { color: theme.colors.white, fontSize: 11, fontWeight: '700' },
  section: { color: theme.colors.white, fontWeight: '800', fontSize: 16, marginBottom: 12 },
  scheduleRow: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  scheduleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,184,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleAvatarText: { color: theme.colors.white, fontWeight: '800', fontSize: 12 },
  scheduleRowRight: { alignItems: 'flex-end', gap: 4 },
  scheduleTitle: { color: theme.colors.white, fontWeight: '800' },
  scheduleSub: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  schedulePrice: { color: theme.colors.accent, fontWeight: '800', fontSize: 12 },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,184,0,0.15)',
  },
  statusText: { fontSize: 10, fontWeight: '800', color: theme.colors.accent },
  incomingSection: { marginBottom: 16 },
  incomingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  jobRequest: {
    borderWidth: 2,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    padding: 16,
    backgroundColor: theme.colors.panel,
    gap: 12,
  },
  requestTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,184,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestAvatarText: { color: theme.colors.white, fontWeight: '900', fontSize: 14 },
  requestDetails: { gap: 6 },
  requestDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobAlert: { color: theme.colors.accent, fontWeight: '800' },
  jobTitle: { color: theme.colors.white, fontWeight: '900', fontSize: 16 },
  jobCategory: { color: theme.colors.accent, fontWeight: '700', fontSize: 13 },
  jobDesc: { color: theme.colors.muted, fontSize: 13, lineHeight: 18, flex: 1 },
  jobMeta: { color: theme.colors.muted, fontSize: 13, flex: 1 },
  jobActions: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    width: 80,
    height: 52,
    borderRadius: theme.buttons.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineText: { color: theme.colors.white, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(239,68,68,0.1)',
    marginBottom: 16,
  },
  errorText: { color: theme.colors.red, fontSize: 13, flex: 1 },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.md,
    marginBottom: 8,
  },
  completedLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  completedTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 13 },
  completedSub: { color: theme.colors.muted, fontSize: 11, marginTop: 2 },
  completedAmount: { color: theme.colors.accent, fontWeight: '800', fontSize: 13 },
  map: { width: '100%', height: 120, borderRadius: theme.radius.lg },
  locText: { color: theme.colors.muted, fontSize: 12, marginTop: 8, marginBottom: 16 },
});
