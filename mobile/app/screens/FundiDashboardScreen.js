import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { computeEarnings } from '../utils/jobs';
import { getTimeLeftSeconds } from '../utils/bookings';
import { formatUgx, initials } from '../utils/ratings';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

const GOLD_GRADIENT = ['#FFC94D', '#E5A600'];

const STATUS_TINT = {
  ACCEPTED: { bg: 'rgba(59,130,246,0.15)', fg: theme.colors.blue },
  ON_THE_WAY: { bg: 'rgba(255,184,0,0.15)', fg: theme.colors.accent },
  ARRIVED: { bg: 'rgba(167,139,250,0.15)', fg: '#A78BFA' },
  IN_PROGRESS: { bg: 'rgba(34,197,94,0.15)', fg: theme.colors.green },
};

function PulseDot({ active }) {
  const anim = useRef(new Animated.Value(0)).current;
  const color = active ? theme.colors.green : theme.colors.mutedDark;

  useEffect(() => {
    if (!active) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim]);

  return (
    <View style={styles.dotWrap}>
      {active ? (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              borderColor: color,
              opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) },
              ],
            },
          ]}
        />
      ) : null}
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

function SectionHeader({ title, count, onAction, actionLabel, style }) {
  const { t } = useLanguage();
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count > 0 ? (
          <View style={styles.sectionCount}>
            <Text style={styles.sectionCountText}>{count}</Text>
          </View>
        ) : null}
      </View>
      {onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel ?? t('View All')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function FundiDashboardScreen({ onNavigate }) {
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
  const { t } = useLanguage();

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

  const handleToggleOnline = async (value) => {
    setOnline(value);
    setAvailabilityLoading(true);
    try {
      await updateFundiAvailability(value);
    } catch (e) {
      setOnline(!value);
      Alert.alert(t('Could not update availability'), getErrorMessage(e));
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
      Alert.alert(t('Booking accepted'), t("{{name}}'s request has been accepted.", { name: pendingRequest.clientName }));
      setPendingRequest(null);
      await refreshBookings();
      onNavigate?.('fundiBookingDetail', { bookingId: id });
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      Alert.alert(t('Could not accept'), msg);
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
      Alert.alert(t('Declined'), t('Booking request declined.'));
      setPendingRequest(null);
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      Alert.alert(t('Could not decline'), msg);
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
        contentContainerStyle={[styles.scroll, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
        }
      >
        {/* Header — matches client home */}
        <View style={styles.header}>
          <View style={styles.brandWrap}>
            <View style={styles.logoIcon}>
              <Ionicons name="flash" size={20} color={theme.colors.textDark} />
            </View>
            <Text style={styles.brandName}>FundiLink</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onNavigate?.('notifications')}
            activeOpacity={0.85}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.colors.accent} />
          </TouchableOpacity>
        </View>

        {notification ? (
          <View style={styles.notifBanner}>
            <View style={styles.notifIcon}>
              <Ionicons name="notifications" size={16} color={theme.colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>{notification.title}</Text>
              <Text style={styles.notifMsg}>{notification.message}</Text>
            </View>
            <TouchableOpacity onPress={clearNotification} hitSlop={8}>
              <Text style={styles.notifDismiss}>{t('Dismiss')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Availability Card */}
        <LinearGradient
          colors={online ? ['#13281A', '#0E1A12'] : ['#262626', '#191919']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statusCard, online && styles.statusCardOn]}
        >
          <View style={styles.statusLeft}>
            <PulseDot active={online} />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>
                {online ? t("You're online") : t("You're offline")}
              </Text>
              <Text style={styles.statusSub} numberOfLines={2}>
                {online
                  ? t('Nearby clients can see you and send booking requests')
                  : t('You will not receive new booking requests')}
              </Text>
            </View>
          </View>
          <View style={styles.switchWrap}>
            {availabilityLoading ? (
              <ActivityIndicator color={theme.colors.accent} size="small" />
            ) : (
              <Switch
                value={online}
                onValueChange={handleToggleOnline}
                trackColor={{ false: '#3A3A3A', true: theme.colors.green }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#3A3A3A"
              />
            )}
            <Text style={[styles.switchLabel, online && styles.switchLabelOn]}>
              {online ? t('ONLINE') : t('OFFLINE')}
            </Text>
          </View>
        </LinearGradient>

        {/* Earnings Hero */}
        <LinearGradient
          colors={['#3A2A0F', '#161616']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.earnHero}
        >
          <View style={styles.earnHeroTop}>
            <View style={styles.earnHeroLabelWrap}>
              <Ionicons name="wallet" size={14} color={theme.colors.accent} />
              <Text style={styles.earnHeroLabel}>{t("TODAY'S EARNINGS")}</Text>
            </View>
            <View style={styles.earnHeroBadge}>
              <Text style={styles.earnHeroBadgeText}>UGX</Text>
            </View>
          </View>
          <Text style={styles.earnHeroValue}>{formatUgx(earnings.today)}</Text>
          <Text style={styles.earnHeroSub}>{t('Updated as jobs are completed')}</Text>
          <View style={styles.earnHeroStats}>
            <View style={styles.earnStat}>
              <Text style={styles.earnStatValue}>{formatUgx(earnings.month)}</Text>
              <Text style={styles.earnStatLabel}>{t('This Month')}</Text>
            </View>
            <View style={styles.earnDivider} />
            <View style={styles.earnStat}>
              <Text style={styles.earnStatValue}>{formatUgx(earnings.week)}</Text>
              <Text style={styles.earnStatLabel}>{t('This Week')}</Text>
            </View>
            <View style={styles.earnDivider} />
            <View style={styles.earnStat}>
              <Text style={styles.earnStatValue}>{completedBookings.length}</Text>
              <Text style={styles.earnStatLabel}>{t('Completed')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Incoming Booking Request */}
        {hasIncomingRequest ? (
          <View style={styles.incomingSection}>
            <View style={styles.requestCard}>
              <LinearGradient
                colors={['#3A2A0F', '#1C1710']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.requestHeader}
              >
                <View style={styles.requestHeaderLeft}>
                  <View style={styles.requestBadge}>
                    <Text style={styles.requestBadgeText}>{t('NEW')}</Text>
                  </View>
                  <Text style={styles.requestHeaderTitle}>{t('Booking Request')}</Text>
                </View>
                <Ionicons name="notifications" size={18} color={theme.colors.accent} />
              </LinearGradient>

              <View style={styles.requestBody}>
                <View style={styles.requestTop}>
                  <LinearGradient colors={GOLD_GRADIENT} style={styles.requestAvatar}>
                    <Text style={styles.requestAvatarText}>{initials(pendingRequest.clientName)}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle} numberOfLines={1}>
                      {pendingRequest.clientName}
                    </Text>
                    <Text style={styles.jobCategory}>
                      {pendingRequest.category || pendingRequest.service}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestDetails}>
                  <View style={styles.requestDetailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="construct-outline" size={15} color={theme.colors.muted} />
                    </View>
                    <Text style={styles.jobDesc} numberOfLines={2}>
                      {pendingRequest.description || t('No description provided')}
                    </Text>
                  </View>
                  <View style={styles.requestDetailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="location-outline" size={15} color={theme.colors.muted} />
                    </View>
                    <Text style={styles.jobMeta} numberOfLines={1}>
                      {pendingRequest.address || t('Client location')}
                    </Text>
                  </View>
                  {pendingRequest.distanceKm != null ? (
                    <View style={styles.requestDetailRow}>
                      <View style={styles.detailIcon}>
                        <Ionicons name="navigate-outline" size={15} color={theme.colors.muted} />
                      </View>
                      <Text style={styles.jobMeta}>{t('{{distance}} km away', { distance: pendingRequest.distanceKm })}</Text>
                    </View>
                  ) : null}
                  {pendingRequest.estimatedPrice ? (
                    <View style={styles.requestDetailRow}>
                      <View style={styles.detailIcon}>
                        <Ionicons name="cash-outline" size={15} color={theme.colors.muted} />
                      </View>
                      <Text style={styles.jobMeta}>{t('Est. {{amount}}', { amount: formatUgx(pendingRequest.estimatedPrice) })}</Text>
                    </View>
                  ) : null}
                </View>

                <CountdownTimer
                  expiresAt={pendingRequest.expiresAt}
                  initialSeconds={getTimeLeftSeconds(pendingRequest)}
                  label={t('Respond within')}
                  onExpire={() => setPendingRequest(null)}
                />

                <View style={styles.jobActions}>
                  <PrimaryButton style={{ flex: 1 }} onPress={handleAccept} disabled={acceptLoading} icon="checkmark-circle-outline">
                    {acceptLoading ? t('Accepting…') : t('Accept Booking')}
                  </PrimaryButton>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={handleDecline}
                    disabled={declineLoading}
                    activeOpacity={0.85}
                  >
                    {declineLoading ? (
                      <ActivityIndicator color={theme.colors.muted} size="small" />
                    ) : (
                      <Text style={styles.declineText}>{t('Cancel')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
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

        {/* Active Bookings */}
        <SectionHeader
          title={t('Active Bookings')}
          count={activeBookings.length}
          onAction={activeBookings.length ? () => onNavigate?.('bookings') : undefined}
        />
        {bookingsLoading ? (
          <LoadingSkeleton count={2} />
        ) : activeBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <EmptyState
              icon="calendar-outline"
              title={t('No active bookings')}
              message={t('Accepted jobs will appear here. Keep yourself online to receive requests.')}
            />
          </View>
        ) : (
          activeBookings.map((b) => {
            const tint = STATUS_TINT[b.status] || {
              bg: 'rgba(255,184,0,0.15)',
              fg: theme.colors.accent,
            };
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.scheduleRow}
                onPress={() => onNavigate?.('fundiBookingDetail', { bookingId: b.id })}
                activeOpacity={0.85}
              >
                <View style={styles.scheduleRowLeft}>
                  <View style={[styles.scheduleAvatar, { backgroundColor: tint.bg }]}>
                    <Text style={[styles.scheduleAvatarText, { color: tint.fg }]}>
                      {initials(b.clientName)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduleTitle} numberOfLines={1}>
                      {b.clientName}
                    </Text>
                    <Text style={styles.scheduleSub} numberOfLines={1}>
                      {b.service}
                    </Text>
                    <Text style={styles.scheduleSub} numberOfLines={1}>
                      {b.address}
                    </Text>
                  </View>
                </View>
                <View style={styles.scheduleRowRight}>
                  <View style={[styles.statusPill, { backgroundColor: tint.bg }]}>
                    <Text style={[styles.statusText, { color: tint.fg }]}>{t(b.statusLabel)}</Text>
                  </View>
                  {b.agreedPrice ? (
                    <Text style={styles.schedulePrice}>{formatUgx(b.agreedPrice)}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Completed Jobs */}
        {completedBookings.length > 0 ? (
          <>
            <SectionHeader
              title={t('Completed Jobs')}
              count={completedBookings.length}
              style={styles.sectionSpacing}
            />
            {completedBookings.slice(0, 5).map((b) => (
              <View key={b.id} style={styles.completedRow}>
                <View style={styles.completedLeft}>
                  <View style={styles.completedIcon}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedTitle} numberOfLines={1}>{b.clientName}</Text>
                    <Text style={styles.completedSub} numberOfLines={1}>{b.service}</Text>
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
        <SectionHeader title={t('My Location')} style={styles.sectionSpacing} />
        <FundiMap
          style={styles.map}
          region={region}
          currentLocation={coords}
          showRadiusCircle
          radiusKm={5}
        />
        <View style={styles.locRow}>
          <PulseDot active={online} />
          <Text style={styles.locText}>
            {address || t('Set your location')} · {online ? t('Sharing location') : t('Location hidden')}
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },

  /* Header — mirrors client home screen */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.elevation.md,
  },
  brandName: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  /* Notification banner */
  notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,184,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.22)',
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 16,
  },
  notifIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,184,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 13 },
  notifMsg: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  notifDismiss: { color: theme.colors.accent, fontWeight: '700', fontSize: 12 },

  /* Availability card */
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.md,
  },
  statusCardOn: {
    borderColor: 'rgba(34,197,94,0.3)',
  },
  statusLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dotWrap: { width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pulseRing: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  statusTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 15 },
  statusSub: { color: theme.colors.muted, fontSize: 12, marginTop: 3, lineHeight: 16 },
  switchWrap: { alignItems: 'center', marginLeft: 12 },
  switchLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: '800', marginTop: 5, letterSpacing: 0.5 },
  switchLabelOn: { color: theme.colors.green },

  /* Earnings hero */
  earnHero: {
    borderRadius: theme.radius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.18)',
    ...theme.elevation.lg,
  },
  earnHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  earnHeroLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  earnHeroLabel: { color: theme.colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  earnHeroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,184,0,0.12)',
  },
  earnHeroBadgeText: { color: theme.colors.accent, fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  earnHeroValue: { color: theme.colors.accent, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  earnHeroSub: { color: theme.colors.muted, fontSize: 12, marginTop: 4 },
  earnHeroStats: {
    flexDirection: 'row',
    marginTop: 18,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  earnStat: { flex: 1, alignItems: 'center' },
  earnStatValue: { color: theme.colors.white, fontWeight: '900', fontSize: 14 },
  earnStatLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  earnDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 16, letterSpacing: -0.2 },
  sectionCount: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: 'rgba(255,184,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCountText: { color: theme.colors.accent, fontWeight: '800', fontSize: 11 },
  sectionAction: { color: theme.colors.accent, fontWeight: '700', fontSize: 13 },
  sectionSpacing: { marginTop: 24 },

  /* Empty state */
  emptyCard: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  /* Active booking rows */
  scheduleRow: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scheduleRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  scheduleAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleAvatarText: { fontWeight: '900', fontSize: 13 },
  scheduleRowRight: { alignItems: 'flex-end', gap: 6, marginLeft: 10 },
  scheduleTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 14 },
  scheduleSub: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  schedulePrice: { color: theme.colors.accent, fontWeight: '800', fontSize: 12 },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: '800' },

  /* Incoming request */
  incomingSection: { marginBottom: 24 },
  requestCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.35)',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.panel,
    ...theme.elevation.lg,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  requestHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  requestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
  },
  requestBadgeText: { color: theme.colors.textDark, fontWeight: '900', fontSize: 9, letterSpacing: 0.8 },
  requestHeaderTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 13 },
  requestBody: { padding: 16, gap: 12 },
  requestTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.elevation.sm,
  },
  requestAvatarText: { color: theme.colors.textDark, fontWeight: '900', fontSize: 15 },
  requestDetails: { gap: 8 },
  requestDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobTitle: { color: theme.colors.white, fontWeight: '900', fontSize: 16 },
  jobCategory: { color: theme.colors.accent, fontWeight: '700', fontSize: 13, marginTop: 1 },
  jobDesc: { color: theme.colors.muted, fontSize: 13, lineHeight: 18, flex: 1 },
  jobMeta: { color: theme.colors.muted, fontSize: 13, flex: 1 },
  jobActions: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    width: 88,
    height: 54,
    borderRadius: theme.buttons.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineText: { color: theme.colors.white, fontWeight: '700' },

  /* Error */
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

  /* Completed rows */
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  completedLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  completedIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 13 },
  completedSub: { color: theme.colors.muted, fontSize: 11, marginTop: 2 },
  completedAmount: { color: theme.colors.accent, fontWeight: '800', fontSize: 13 },

  /* Map */
  map: { width: '100%', height: 140, borderRadius: theme.radius.lg, ...theme.elevation.sm },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 16 },
  locText: { color: theme.colors.muted, fontSize: 12, flex: 1 },
});
