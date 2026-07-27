import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import BottomTabBar from '../components/BottomTabBar';
import FundiMap from '../components/FundiMap';
import PrimaryButton from '../components/PrimaryButton';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useTabBarHeight } from '../hooks/useTabBarHeight';
import { useLocation } from '../../context/LocationContext';
import { useBooking } from '../../context/BookingContext';
import {
  acceptBooking,
  declineBooking,
  getErrorMessage,
} from '../../services/bookingsApi';
import { emitSocket } from '../../services/socketService';
import { computeEarnings } from '../utils/jobs';
import { getTimeLeftSeconds, formatCountdown } from '../utils/bookings';
import { formatUgx, initials } from '../utils/ratings';
import theme from '../theme';

export default function FundiDashboardScreen({
  userName = 'User',
  userRole = 'fundi',
  userId,
  onNavigate,
}) {
  const tabBarHeight = useTabBarHeight();
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

  const [acceptLoading, setAcceptLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!hasIncomingRequest) return;
    const initial = getTimeLeftSeconds(pendingRequest);
    setTimeLeft(Math.max(0, initial));
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = getTimeLeftSeconds(pendingRequest);
        if (next <= 0) {
          clearInterval(interval);
          setPendingRequest(null);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasIncomingRequest]);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

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

  const hasIncomingRequest = Boolean(pendingRequest?.bookingId);

  return (
    <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View style={styles.brandWrap}>
            <Text style={styles.brandName}>FundiLink</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => onNavigate?.('notifications')}
              activeOpacity={0.85}
            >
              <Ionicons name="notifications-outline" size={20} color={theme.colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.locBalanceRow}>
          <TouchableOpacity
            style={styles.locationPill}
            activeOpacity={0.85}
            onPress={() => onNavigate?.('setLocation')}
          >
            <Ionicons name="location-outline" size={14} color={theme.colors.green} />
            <Text style={styles.locationText} numberOfLines={1}>
              {address || 'Set your location'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Notification Banner ── */}
        {notification ? (
          <View style={styles.notifBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>{notification.title}</Text>
              <Text style={styles.notifMsg}>{notification.message}</Text>
            </View>
            <TouchableOpacity onPress={clearNotification} style={styles.notifDismissBtn}>
              <Ionicons name="close" size={18} color={theme.colors.muted} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Stats Grid ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
              <Ionicons name="trending-up" size={18} color={theme.colors.green} />
            </View>
            <Text style={styles.statLabel}>Today</Text>
            <Text style={styles.statValue}>{formatUgx(earnings.today)}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(255,184,0,0.12)' }]}>
              <Ionicons name="calendar" size={18} color={theme.colors.accent} />
            </View>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>{formatUgx(earnings.week)}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <Ionicons name="checkmark-done" size={18} color={theme.colors.blue} />
            </View>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>{completedBookings.length}</Text>
          </View>
        </View>

        {/* ── Incoming Booking Request ── */}
        {hasIncomingRequest ? (
          <View style={styles.incomingSection}>
            <View style={styles.incomingHeaderRow}>
              <View style={styles.incomingPulse} />
              <Text style={styles.incomingTitle}>New Booking Request</Text>
            </View>
            <View style={styles.jobRequest}>
              <View style={styles.requestTop}>
                <View style={styles.requestAvatar}>
                  <Text style={styles.requestAvatarText}>{initials(pendingRequest.clientName)}</Text>
                  <View style={styles.requestOnlineDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{pendingRequest.clientName}</Text>
                  <Text style={styles.jobCategory}>{pendingRequest.category || pendingRequest.service}</Text>
                </View>
                {timeLeft > 0 && (
                  <View style={styles.compactTimer}>
                    <Text style={[styles.compactTimerText, timeLeft <= 60 && { color: theme.colors.red }]}>
                      {formatCountdown(timeLeft)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.requestDetails}>
                {pendingRequest.description ? (
                  <View style={styles.requestDetailRow}>
                    <Ionicons name="chatbox-ellipses-outline" size={15} color={theme.colors.mutedDark} />
                    <Text style={styles.jobDesc} numberOfLines={2}>{pendingRequest.description}</Text>
                  </View>
                ) : null}
                <View style={styles.requestDetailRow}>
                  <Ionicons name="location-outline" size={15} color={theme.colors.mutedDark} />
                  <Text style={styles.jobMeta}>{pendingRequest.address || 'Client location'}</Text>
                </View>
                <View style={styles.requestDetailRow}>
                  <Ionicons name="cash-outline" size={15} color={theme.colors.mutedDark} />
                  <Text style={styles.jobMeta}>Est. {formatUgx(pendingRequest.estimatedPrice || 0)}</Text>
                </View>
                <View style={styles.requestDetailRow}>
                  <Ionicons name="navigate-outline" size={15} color={theme.colors.mutedDark} />
                  <Text style={styles.jobMeta}>{pendingRequest.distanceKm || 0} km away</Text>
                </View>
              </View>

              <View style={styles.jobActions}>
                <PrimaryButton
                  style={{ flex: 1 }}
                  onPress={handleAccept}
                  disabled={acceptLoading}
                >
                  {acceptLoading ? 'Accepting…' : 'Accept'}
                </PrimaryButton>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={handleDecline}
                  disabled={declineLoading}
                >
                  {declineLoading ? (
                    <ActivityIndicator color={theme.colors.muted} size="small" />
                  ) : (
                    <Text style={styles.declineText}>Decline</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* ── Active Bookings ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Active Jobs</Text>
          {activeBookings.length > 0 && (
            <TouchableOpacity onPress={() => onNavigate?.('bookings')}>
              <Text style={styles.sectionAction}>See all</Text>
            </TouchableOpacity>
          )}
        </View>
        {bookingsLoading ? (
          <LoadingSkeleton count={2} />
        ) : activeBookings.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No active jobs"
            message="Accepted bookings will appear here. Make sure you're online to receive requests."
          />
        ) : (
          activeBookings.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.bookingCard}
              onPress={() => onNavigate?.('fundiBookingDetail', { bookingId: b.id })}
              activeOpacity={0.85}
            >
              <View style={styles.bookingCardTop}>
                <View style={styles.bookingAvatar}>
                  <Text style={styles.bookingAvatarText}>{initials(b.clientName)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingName}>{b.clientName}</Text>
                  <Text style={styles.bookingService}>{b.service}</Text>
                </View>
                <View style={styles.bookingStatusPill}>
                  <Text style={styles.bookingStatusText}>{b.statusLabel}</Text>
                </View>
              </View>
              {b.address && (
                <View style={styles.bookingMetaRow}>
                  <Ionicons name="location-outline" size={12} color={theme.colors.mutedDark} />
                  <Text style={styles.bookingMetaText} numberOfLines={1}>{b.address}</Text>
                </View>
              )}
              {b.agreedPrice ? (
                <View style={styles.bookingMetaRow}>
                  <Ionicons name="cash-outline" size={12} color={theme.colors.mutedDark} />
                  <Text style={styles.bookingMetaText}>{formatUgx(b.agreedPrice)}</Text>
                </View>
              ) : null}
              {b.agreedPrice ? (
                <View style={styles.bookingMetaRow}>
                  <Ionicons name="wallet-outline" size={12} color={theme.colors.green} />
                  <Text style={[styles.bookingMetaText, { color: theme.colors.green }]}>Payout: {formatUgx(Math.round(b.agreedPrice * 0.875))}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}

        {/* ── Completed Jobs ── */}
        {completedBookings.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Completed Jobs</Text>
            </View>
            {completedBookings.slice(0, 5).map((b) => (
              <View key={b.id} style={styles.completedCard}>
                <View style={styles.completedLeft}>
                  <View style={styles.completedIconWrap}>
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedName}>{b.clientName}</Text>
                    <Text style={styles.completedService}>{b.service}</Text>
                  </View>
                </View>
                {b.amount ? (
                  <Text style={styles.completedAmount}>{formatUgx(b.amount)}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}

        {/* ── Error ── */}
        {error || bookingsError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={theme.colors.red} />
            <Text style={styles.errorText}>{error || bookingsError}</Text>
          </View>
        ) : null}

        {/* ── Location ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>My Location</Text>
        </View>
        <FundiMap
          style={styles.map}
          region={region}
          currentLocation={coords}
          showRadiusCircle
          radiusKm={5}
        />
        <View style={styles.locationFooter}>
          <Ionicons name="location" size={14} color={theme.colors.green} />
          <Text style={styles.locText}>{address || 'Set your location'}</Text>
        </View>
      </ScrollView>
      <BottomTabBar active="fundiDashboard" onTab={onNavigate} role={userRole} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },

  /* ── Header ── */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  /* ── Location ── */
  locBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 240,
  },

  /* ── Notification ── */
  notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accentDim,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
  },
  notifTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 14 },
  notifMsg: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  notifDismissBtn: { padding: 4, marginLeft: 8 },

  /* ── Stats ── */
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '600' },
  statValue: { color: theme.colors.white, fontWeight: '900', fontSize: 18, marginTop: 4 },

  /* ── Incoming Request ── */
  incomingSection: { marginBottom: 20 },
  incomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  incomingPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
  },
  incomingTitle: {
    color: theme.colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  jobRequest: {
    borderWidth: 1.5,
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
    backgroundColor: theme.colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  requestAvatarText: { color: theme.colors.accent, fontWeight: '900', fontSize: 14 },
  requestOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.green,
    borderWidth: 2,
    borderColor: theme.colors.panel,
  },
  requestDetails: { gap: 8 },
  requestDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobTitle: { color: theme.colors.white, fontWeight: '900', fontSize: 16 },
  jobCategory: { color: theme.colors.accent, fontWeight: '700', fontSize: 13 },
  jobDesc: { color: theme.colors.muted, fontSize: 13, lineHeight: 18, flex: 1 },
  jobMeta: { color: theme.colors.muted, fontSize: 13, flex: 1 },
  jobActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  declineBtn: {
    width: 90,
    height: 52,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineText: { color: theme.colors.muted, fontWeight: '700', fontSize: 15 },
  compactTimer: {
    backgroundColor: 'rgba(255,184,0,0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactTimerText: {
    color: theme.colors.accent,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },

  /* ── Sections ── */
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 16 },
  sectionAction: { color: theme.colors.accent, fontWeight: '700', fontSize: 13 },

  /* ── Booking Card ── */
  bookingCard: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bookingCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookingAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingAvatarText: { color: theme.colors.accent, fontWeight: '800', fontSize: 12 },
  bookingName: { color: theme.colors.white, fontWeight: '800', fontSize: 14 },
  bookingService: { color: theme.colors.muted, fontSize: 12, marginTop: 1 },
  bookingStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.accentDim,
  },
  bookingStatusText: { fontSize: 10, fontWeight: '800', color: theme.colors.accent },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  bookingMetaText: { color: theme.colors.mutedDark, fontSize: 12, flex: 1 },

  /* ── Completed Card ── */
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  completedLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  completedIconWrap: { width: 30, alignItems: 'center' },
  completedName: { color: theme.colors.white, fontWeight: '800', fontSize: 13 },
  completedService: { color: theme.colors.muted, fontSize: 11, marginTop: 1 },
  completedAmount: { color: theme.colors.green, fontWeight: '900', fontSize: 14 },

  /* ── Error ── */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(239,68,68,0.1)',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { color: theme.colors.red, fontSize: 13, flex: 1 },

  /* ── Location ── */
  map: { width: '100%', height: 130, borderRadius: theme.radius.lg },
  locationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  locText: { color: theme.colors.muted, fontSize: 12 },
});
