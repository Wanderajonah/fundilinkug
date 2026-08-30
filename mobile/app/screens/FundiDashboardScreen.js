import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useBooking } from '../../context/BookingContext';
import {
  updateFundiAvailability,
  updateBookingStatus,
  acceptBooking,
  declineBooking,
  getErrorMessage,
} from '../../services/bookingsApi';
import { getProfile } from '../../services/usersApi';
import { getWallet } from '../../services/walletApi';
import { emitSocket } from '../../services/socketService';
import { computeEarnings, getGreeting } from '../utils/jobs';
import { BOOKING_STATUS_LABELS } from '../utils/bookings';
import { formatUgx, initials } from '../utils/ratings';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

function toClockLabel(date, offsetMinutes = 0) {
  if (!date) return '';
  const d = new Date(date);
  if (offsetMinutes) d.setMinutes(d.getMinutes() + offsetMinutes);
  return d.toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' });
}

function compactK(amount) {
  const value = Math.max(0, Number(amount) || 0);
  if (value < 1000) return `${value}`;
  return `${Math.round(value / 1000)}k`;
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const ACTIVE_STATUS_TINT = {
  ACCEPTED: { bg: 'rgba(63,140,255,0.14)', fg: '#5b9bff' },
  ON_THE_WAY: { bg: 'rgba(255,184,0,0.14)', fg: '#ffb42f' },
  ARRIVED: { bg: 'rgba(167,139,250,0.16)', fg: '#b79bff' },
  IN_PROGRESS: { bg: 'rgba(46,213,99,0.14)', fg: '#42d56d' },
};

const JOB_FLOW = ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'];

const NEXT_JOB_ACTION = {
  ACCEPTED: { status: 'ON_THE_WAY', cta: 'Mark On the Way' },
  ON_THE_WAY: { status: 'ARRIVED', cta: 'Mark Arrived' },
  ARRIVED: { status: 'IN_PROGRESS', cta: 'Start Work' },
  IN_PROGRESS: { status: 'COMPLETED', cta: 'Mark Complete' },
};

function Sparkline({ values }) {
  const { t } = useLanguage();
  const chartHeight = 96;
  const hasData = useMemo(() => values.some((v) => v > 0), [values]);
  const max = Math.max(...values, 0);
  const todayIndex = values.length - 1;

  const dayLabels = useMemo(() => {
    const now = new Date();
    return Array.from({ length: values.length || 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - ((values.length || 7) - 1 - i));
      return DAY_LETTERS[d.getDay()];
    });
  }, [values.length]);

  return (
    <View style={styles.sparklineWrap}>
      <View style={[styles.barsRow, { height: chartHeight }]}>
        {(values.length ? values : Array.from({ length: 7 }, () => 0)).map((value, i) => {
          const isToday = i === todayIndex;
          const filled = value > 0;
          // Bars scale within the fixed-height row; flex sizing keeps every
          // column inside the card regardless of screen width.
          const barHeight = hasData && filled
            ? Math.max(8, Math.round((value / (max || 1)) * (chartHeight - 14)))
            : 4;
          return (
            <View key={`bar-${i}`} style={styles.barCol} pointerEvents="none">
              {isToday && filled ? (
                <View style={[styles.barValueTag, { bottom: barHeight + 6 }]}>
                  <Text style={styles.barValueText}>{compactK(value)}</Text>
                </View>
              ) : null}
              {filled ? (
                <LinearGradient
                  colors={
                    isToday
                      ? ['#ffd479', '#ff9f10']
                      : ['rgba(255,184,0,0.55)', 'rgba(255,184,0,0.18)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[
                    styles.bar,
                    styles.barFilled,
                    { height: barHeight },
                    isToday && styles.barToday,
                    isToday && { shadowRadius: 10, elevation: 5 },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.bar,
                    styles.barEmpty,
                    isToday && styles.barEmptyToday,
                    { height: 4 },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {!hasData ? (
        <View style={styles.chartEmpty} pointerEvents="none">
          <Text style={styles.chartEmptyText}>{t('No earnings yet this week')}</Text>
        </View>
      ) : null}

      <View style={styles.dayRow}>
        {(dayLabels.length ? dayLabels : DAY_LETTERS).map((letter, i) => (
          <Text
            key={`day-${i}`}
            style={[
              styles.dayLabel,
              i === todayIndex && styles.dayLabelToday,
            ]}
          >
            {letter}
          </Text>
        ))}
      </View>
    </View>
  );
}

function StatCard({ value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickIconWrap}>
        <Ionicons name={icon} size={24} color={theme.colors.accent} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionHeading({ title, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity style={styles.sectionActionBtn} onPress={onAction} activeOpacity={0.75}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={12} color="#ffb42f" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function FundiDashboardScreen({
  onNavigate,
  userName,
  userFullName,
  fundiEnabled,
  onSwitchToClientMode,
}) {
  const { t, language, setLanguage } = useLanguage();
  const {
    bookings,
    refreshBookings,
    loading: bookingsLoading,
    pendingRequest,
    setPendingRequest,
  } = useBooking();
  const [availabilityMode, setAvailabilityMode] = useState("online");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [heldBalance, setHeldBalance] = useState(0);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(b.status) &&
          // A job is done as soon as both parties have confirmed completion,
          // even if a stale snapshot still reads IN_PROGRESS.
          !(b.clientCompleted && b.fundiCompleted),
      ),
    [bookings],
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'COMPLETED'),
    [bookings],
  );

  const earnings = useMemo(
    () =>
      computeEarnings(
        completedBookings.map((b) => ({
          status: 'completed',
          quoteAmount: b.amount || b.agreedPrice || 0,
          updatedAt: b.createdAt,
          createdAt: b.createdAt,
        })),
      ),
    [completedBookings],
  );

  const heroEarnings = Number(earnings.week) || 0;

  // Real week-over-week comparison (hidden until last week has data).
  const trendPercent = useMemo(() => {
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setHours(0, 0, 0, 0);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const sumBetween = (from, to) =>
      completedBookings.reduce((sum, b) => {
        const raw = b.updatedAt || b.createdAt;
        if (!raw) return sum;
        const d = new Date(raw);
        return d >= from && d < to ? sum + Number(b.amount || b.agreedPrice || 0) : sum;
      }, 0);

    const lastWeek = sumBetween(startOfLastWeek, startOfThisWeek);
    if (lastWeek <= 0) return null;
    return Math.round(((heroEarnings - lastWeek) / lastWeek) * 100);
  }, [completedBookings, heroEarnings]);
  const chartValues = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const buckets = Array.from({ length: 7 }, () => 0);

    completedBookings.forEach((booking) => {
      const rawDate = booking.updatedAt || booking.createdAt;
      if (!rawDate) return;
      const date = new Date(rawDate);
      date.setHours(0, 0, 0, 0);
      const index = Math.floor((date - start) / 86400000);
      if (index < 0 || index > 6) return;
      buckets[index] += Number(booking.amount || booking.agreedPrice || 0);
    });

    return buckets;
  }, [completedBookings]);

  const active = activeBookings[0] || null;
  const request = pendingRequest || null;

  const activeCard = useMemo(() => {
    if (!active) return null;
    const agreed = active.agreedPrice || active.serviceFee || null;
    const status = JOB_FLOW.includes(active.status) ? active.status : 'ACCEPTED';
    return {
      id: active.id || active._id || active.bookingId || null,
      name: active.clientName || active.customerName || t('Client'),
      service: active.category || active.service || '',
      description: active.description || '',
      address: typeof active.address === 'string' ? active.address : '',
      startedAt: active.createdAt || null,
      status,
      priceAgreed: active.priceAgreed ?? Boolean(agreed),
      agreedPrice: agreed ? Number(agreed) : 0,
      clientCompleted: Boolean(active.clientCompleted),
      fundiCompleted: Boolean(active.fundiCompleted),
    };
  }, [active, t]);

  const jobStep = activeCard ? JOB_FLOW.indexOf(activeCard.status) : -1;
  const jobProgress = Math.round(((jobStep + 1) / JOB_FLOW.length) * 100);
  const nextJobAction = activeCard ? NEXT_JOB_ACTION[activeCard.status] : null;
  // Fundi confirmed but the client hasn't yet: escrow releases on their tap.
  const awaitingClientConfirm = Boolean(
    activeCard &&
      activeCard.status === 'IN_PROGRESS' &&
      activeCard.fundiCompleted &&
      !activeCard.clientCompleted,
  );
  const canAdvanceJob = Boolean(
    activeCard && !awaitingClientConfirm && (activeCard.priceAgreed || jobStep > 0),
  );

  // Safety net: while the job is still active (and especially while waiting
  // for the client's completion confirmation), poll so the completed job —
  // and its released payment — shows up even if a socket event was missed.
  useEffect(() => {
    if (activeBookings.length === 0) return undefined;
    const id = setInterval(() => refreshBookings(), 8000);
    return () => clearInterval(id);
  }, [activeBookings.length, refreshBookings]);

  const requestCard = useMemo(() => {
    if (!request) return null;
    return {
      id: request.bookingId || request.id || request._id || null,
      name: request.clientName || t('Client'),
      summary: request.description || request.service || request.category || '',
      address: request.address || '',
      price: Number(request.estimatedPrice || request.amount) || 0,
      distanceKm: request.distanceKm || null,
    };
  }, [request, t]);

  const jobsDone = completedBookings.length;
  // Real rating comes from the fundi profile (falls back to '—' until loaded).
  const [fundiRating, setFundiRating] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(({ data }) => {
        if (cancelled) return;
        setFundiRating(Number(data?.fundiProfile?.rating) || 0);
        // Hydrate the real availability from the fundi profile instead of
        // always defaulting to "online" on reload.
        const isAvailable = data?.fundiProfile?.isAvailable != null
          ? Boolean(data.fundiProfile.isAvailable)
          : true;
        const negotiable = Boolean(data?.fundiProfile?.availableForNegotiation);
        setAvailabilityMode(!isAvailable ? "offline" : negotiable ? "negotiable" : "online");
      })
      .catch(() => {});
    getWallet()
      .then(({ data }) => {
        if (!cancelled && data?.wallet?.heldBalance != null) {
          setHeldBalance(Number(data.wallet.heldBalance) || 0);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const avgRating = fundiRating;
  const pendingCount = activeBookings.length + (request ? 1 : 0);
  // Real escrow balance comes from the fundi wallet (see getWallet above).
  const escrow = heldBalance;

  const handleSetAvailability = async (mode) => {
    const prev = availabilityMode;
    setAvailabilityMode(mode);
    setAvailabilityLoading(true);
    try {
      const isOnline = mode === "online";
      const isNegotiable = mode === "negotiable";
      await updateFundiAvailability(isOnline || isNegotiable, isNegotiable);
    } catch (e) {
      setAvailabilityMode(prev);
      Alert.alert(t('Could not update availability'), getErrorMessage(e));
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleAdvanceJob = async () => {
    if (!activeCard || !nextJobAction || !canAdvanceJob) return;
    setStatusUpdating(true);
    try {
      const res = await updateBookingStatus(activeCard.id, nextJobAction.status);
      if (nextJobAction.status === 'ON_THE_WAY') {
        // Heading out: open turn-by-turn navigation to the client's side.
        onNavigate?.('fundiNavigation', { bookingId: activeCard.id });
      }
      await refreshBookings();
      if (nextJobAction.status === 'COMPLETED' && res?.data?.booking?.status !== 'COMPLETED') {
        Alert.alert(
          t('Waiting for client'),
          t(
            'You confirmed the job. Payment is released as soon as the client confirms too.'
          )
        );
      }
    } catch (e) {
      Alert.alert(t('Could not update job'), getErrorMessage(e));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleOpenNavigation = () => {
    if (!activeCard?.id) return;
    onNavigate?.('fundiNavigation', { bookingId: activeCard.id });
  };

  const handleAcceptRequest = async () => {
    const id = requestCard?.id;
    if (!id) return;
    setAcceptLoading(true);
    try {
      await acceptBooking(id);
      emitSocket('accept_booking', { bookingId: id });
      // Clear the request card immediately so it disappears from "New Requests"
      setPendingRequest(null);
      Alert.alert(t('Booking accepted'), t("{{name}}'s request has been accepted.", { name: requestCard.name }));
      await refreshBookings();
      onNavigate?.('fundiBookingDetail', { bookingId: id });
    } catch (e) {
      Alert.alert(t('Could not accept'), getErrorMessage(e));
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    const id = requestCard?.id;
    if (!id) return;
    setDeclineLoading(true);
    try {
      await declineBooking(id);
      emitSocket('decline_booking', { bookingId: id });
      setPendingRequest(null);
      await refreshBookings();
    } catch (e) {
      Alert.alert(t('Could not decline'), getErrorMessage(e));
    } finally {
      setDeclineLoading(false);
    }
  };

  const toggleLanguage = () => setLanguage(language === 'en' ? 'lg' : 'en');

  return (
    <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>{t(getGreeting())}</Text>
              <Ionicons name="sunny" size={14} color="#ffb42f" />
            </View>
            <Text style={styles.userName}>{userFullName || userName || 'Esther Namutebi'}</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.bellButton} activeOpacity={0.85} onPress={() => onNavigate?.('notifications')}>
              <Ionicons name="notifications-outline" size={18} color={theme.colors.muted} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.langButton} activeOpacity={0.85} onPress={toggleLanguage}>
              <Text style={styles.langText}>{language.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Client mode back-switch for dual-role (fundi-enabled) users */}
        {fundiEnabled && onSwitchToClientMode ? (
          <TouchableOpacity
            style={styles.clientModeBanner}
            onPress={onSwitchToClientMode}
            activeOpacity={0.85}
          >
            <Ionicons name="person-outline" size={20} color={theme.colors.accent} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.clientModeTitle}>{t('Client Mode')}</Text>
              <Text style={styles.clientModeSub}>{t('Switch back to browsing and booking jobs as a client')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedDark} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.availabilityRow}>
          {[
            { key: "online", label: t("Online"), color: "#30d060" },
            { key: "negotiable", label: t("Negotiable"), color: "#ffb800" },
            { key: "offline", label: t("Offline"), color: "#666" },
          ].map((opt) => {
            const active = availabilityMode === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.availChip, active && { borderColor: opt.color, backgroundColor: `${opt.color}18` }]}
                activeOpacity={0.85}
                onPress={() => handleSetAvailability(opt.key)}
                disabled={availabilityLoading}
              >
                <View style={[styles.availDot, { backgroundColor: active ? opt.color : "#444" }]} />
                <Text style={[styles.availLabel, active && { color: opt.color }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
          {availabilityLoading ? <ActivityIndicator size="small" color={theme.colors.muted} style={{ marginLeft: 8 }} /> : null}
        </View>

        <LinearGradient
          colors={['#39280f', '#1a1208']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.earningsCard}
        >
          <View style={styles.earningsTopRow}>
            <Text style={styles.sectionKicker}>{t("THIS WEEK'S EARNINGS")}</Text>
            {trendPercent != null ? (
              <View style={styles.trendPill}>
                <Ionicons
                  name={trendPercent >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={trendPercent >= 0 ? '#30d060' : '#ff6b6b'}
                />
                <Text style={[styles.trendText, trendPercent < 0 && styles.trendTextDown]}>
                  {trendPercent >= 0 ? '+' : ''}{trendPercent}% vs last week
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.earningsAmountRow}>
            <Text style={styles.currency}>UGX</Text>
            <Text style={styles.earningsAmount}>{formatUgx(heroEarnings).replace('UGX ', '')}</Text>
          </View>

          <Sparkline values={chartValues} />

          <View style={styles.statsGrid}>
            <StatCard value={`${jobsDone}`} label={t('JOBS DONE')} />
            <StatCard value={avgRating ? `${avgRating.toFixed(1)}★` : '—'} label={t('AVG RATING')} />
            <StatCard value={`${pendingCount}`} label={t('PENDING')} />
            <StatCard value={compactK(escrow)} label={t('ESCROW')} />
          </View>
        </LinearGradient>

        <View style={styles.sectionBlock}>
          <SectionHeading title={t('Quick Actions')} />
          <View style={styles.quickGrid}>
            <QuickAction icon="calendar-outline" label={t('My Jobs')} onPress={() => onNavigate?.('bookings')} />
            <QuickAction icon="chatbubble-outline" label={t('Messages')} onPress={() => onNavigate?.('chat')} />
            <QuickAction icon="cash-outline" label={t('Withdraw')} onPress={() => onNavigate?.('withdraw')} />
            <QuickAction icon="person-outline" label={t('Profile')} onPress={() => onNavigate?.('profile')} />
            <QuickAction icon="star-outline" label={t('Reviews')} onPress={() => onNavigate?.('bookingHistory')} />
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeading title={t('Active Job')} actionLabel={t('See all jobs')} onAction={() => onNavigate?.('bookings')} />
          {activeCard ? (
            <View style={styles.activeCard}>
              <View style={styles.activeTopRow}>
                <View
                  style={[
                    styles.activeStatusPill,
                    {
                      backgroundColor: ACTIVE_STATUS_TINT[activeCard.status]?.bg,
                      borderColor: ACTIVE_STATUS_TINT[activeCard.status]?.fg,
                    },
                  ]}
                >
                  <View
                    style={[styles.smallDot, { backgroundColor: ACTIVE_STATUS_TINT[activeCard.status]?.fg }]}
                  />
                  <Text style={[styles.activeStatusText, { color: ACTIVE_STATUS_TINT[activeCard.status]?.fg }]}>
                    {t(BOOKING_STATUS_LABELS[activeCard.status] || activeCard.status)}
                  </Text>
                </View>
                {activeCard.startedAt ? (
                  <Text style={styles.startedText}>
                    {t('Started {{time}}', { time: toClockLabel(activeCard.startedAt) })}
                  </Text>
                ) : null}
              </View>

              <View style={styles.activeProfileRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initials(activeCard.name) || '?'}</Text>
                </View>
                <View style={styles.activeMeta}>
                  <Text style={styles.activeName} numberOfLines={1}>{activeCard.name}</Text>
                  <Text style={styles.activeService} numberOfLines={1}>
                    {activeCard.service ? `⚡ ${t(activeCard.service)}` : ''}
                  </Text>
                  {activeCard.address ? (
                    <Text style={styles.activeAddress} numberOfLines={1}>📍 {activeCard.address}</Text>
                  ) : null}
                </View>
                <View style={styles.priceChip}>
                  <Text style={styles.priceChipLabel}>{t('Price')}</Text>
                  <Text style={[styles.priceChipValue, !activeCard.agreedPrice && styles.priceChipPending]}>
                    {activeCard.agreedPrice ? formatUgx(activeCard.agreedPrice) : t('Not set')}
                  </Text>
                </View>
              </View>

              {activeCard.description ? (
                <Text style={styles.activeDescription} numberOfLines={2}>
                  {activeCard.description}
                </Text>
              ) : null}

              <View style={styles.stepTrack}>
                {JOB_FLOW.map((step, i) => (
                  <View
                    key={step}
                    style={[styles.stepSeg, i <= jobStep && styles.stepSegDone, i === jobStep && styles.stepSegCurrent]}
                  />
                ))}
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>
                  {t('{{percent}}% · step {{step}} of {{total}}', {
                    percent: jobProgress,
                    step: jobStep + 1,
                    total: JOB_FLOW.length,
                  })}
                </Text>
              </View>
              {awaitingClientConfirm ? (
                <View style={styles.awaitingRow}>
                  <View style={styles.awaitingIconWrap}>
                    <Ionicons name="hourglass" size={11} color="#ffb42f" />
                  </View>
                  <Text style={styles.awaitingText}>
                    {t('Waiting for client to release payment')}
                  </Text>
                </View>
              ) : !canAdvanceJob ? (
                <View style={styles.awaitingRow}>
                  <Text style={styles.finishText}>{t('Waiting for price agreement')}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryAction, (!canAdvanceJob || statusUpdating) && styles.primaryActionDisabled]}
                disabled={!canAdvanceJob || statusUpdating}
                onPress={handleAdvanceJob}
              >
                {statusUpdating ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.primaryActionText}>✓ {t(awaitingClientConfirm ? 'Awaiting client confirmation' : nextJobAction?.cta || 'Manage Job')}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.secondaryRow}>
                <TouchableOpacity style={styles.secondaryAction} activeOpacity={0.88} onPress={() => onNavigate?.('chat')}>
                  <Ionicons name="chatbubble-outline" size={16} color="#41c76b" />
                  <Text style={styles.secondaryActionText}>{t('Chat')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  activeOpacity={0.88}
                  onPress={handleOpenNavigation}
                >
                  <Ionicons name="navigate" size={16} color="#ffb42f" />
                  <Text style={styles.secondaryActionText}>{t('Navigate')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  activeOpacity={0.88}
                  onPress={() => onNavigate?.('fundiBookingDetail', { bookingId: activeCard.id })}
                >
                  <Ionicons name="information-circle-outline" size={16} color="#3fa4ff" />
                  <Text style={styles.secondaryActionText}>{t('Details')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIconWrap}>
                <Ionicons name="briefcase-outline" size={26} color="#ffb42f" />
              </View>
              <Text style={styles.emptyStateTitle}>{t('No active job')}</Text>
              <Text style={styles.emptyStateMessage}>
                {t('When a client books you and you accept, the job and its progress will show up here.')}
              </Text>
              <TouchableOpacity style={styles.emptyStateBtn} activeOpacity={0.85} onPress={() => onNavigate?.('bookings')}>
                <Text style={styles.emptyStateBtnText}>{t('View my jobs')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeading title={t('New Requests')} />
          {requestCard ? (
            <View style={styles.requestCard}>
              <View style={styles.requestBadgeRow}>
                <View style={styles.requestUrgentBadge}>
                  <Text style={styles.requestUrgentText}>{t('NEW')}</Text>
                </View>
                <View style={styles.requestPriceRow}>
                  {requestCard.distanceKm ? (
                    <View style={styles.requestDistance}>
                      <Ionicons name="location-outline" size={11} color="#8a938c" />
                      <Text style={styles.requestDistanceText}>
                        {Number(requestCard.distanceKm).toFixed(1)} km
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.requestPrice}>
                    {requestCard.price ? compactK(requestCard.price) : t('Quote pending')}
                  </Text>
                </View>
              </View>

              <View style={styles.requestProfileRow}>
                <View style={styles.requestAvatar}>
                  <Text style={styles.requestAvatarText}>{initials(requestCard.name)}</Text>
                </View>
                <View style={styles.requestMeta}>
                  <Text style={styles.requestName} numberOfLines={1}>{requestCard.name}</Text>
                  <Text style={styles.requestSummary} numberOfLines={2}>{requestCard.summary}</Text>
                  {requestCard.address ? (
                    <Text style={styles.requestAddress} numberOfLines={1}>📍 {requestCard.address}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={[styles.declineButton, declineLoading && styles.primaryActionDisabled]}
                  activeOpacity={0.85}
                  onPress={handleDeclineRequest}
                  disabled={declineLoading || acceptLoading}
                >
                  {declineLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.muted} />
                  ) : (
                    <Text style={styles.declineButtonText}>{t('Decline')}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acceptButton, acceptLoading && styles.primaryActionDisabled]}
                  activeOpacity={0.85}
                  onPress={handleAcceptRequest}
                  disabled={acceptLoading || declineLoading}
                >
                  {acceptLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.black} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={17} color="#0f130f" />
                      <Text style={styles.acceptButtonText}>{t('Accept')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIconWrap}>
                <Ionicons name="notifications-off-outline" size={24} color="#ffb42f" />
              </View>
              <Text style={styles.emptyStateTitle}>{t('No new requests')}</Text>
              <Text style={styles.emptyStateMessage}>
                {t('Keep yourself online to receive booking requests from clients.')}
              </Text>
            </View>
          )}
        </View>

        {bookingsLoading ? <LoadingSkeleton count={1} /> : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTextBlock: { flex: 1, paddingTop: 4 },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  greeting: {
    color: theme.colors.mutedDark,
    fontSize: 14,
  },
  userName: {
    color: theme.colors.white,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  clientModeTitle: {
    color: theme.colors.accent,
    fontWeight: '800',
    fontSize: 13,
  },
  clientModeSub: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    right: 9,
    top: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59f0b',
  },
  langButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1a1308',
    borderWidth: 1,
    borderColor: '#f2a61b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: {
    color: '#ffb42f',
    fontWeight: '800',
    fontSize: 15,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  availChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#161616',
  },
  availDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availLabel: {
    color: theme.colors.mutedDark,
    fontWeight: '700',
    fontSize: 13,
  },
  earningsCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.12)',
    marginBottom: 14,
  },
  earningsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionKicker: {
    color: '#7f7365',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    flexShrink: 1,
  },
  earningsAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  currency: {
    color: '#ffb42f',
    fontSize: 15,
    fontWeight: '800',
    paddingBottom: 4,
  },
  earningsAmount: {
    color: theme.colors.white,
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -1,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(27, 71, 31, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(65, 188, 81, 0.3)',
    flexShrink: 0,
  },
  trendText: {
    color: '#3ad160',
    fontSize: 11,
    fontWeight: '700',
  },
  trendTextDown: {
    color: '#ff6b6b',
  },
  sparklineWrap: {
    marginTop: 12,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  barCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: 34,
    borderRadius: 6,
  },
  barFilled: {},
  barToday: {
    shadowColor: '#ffb42f',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
  },
  barEmpty: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3,
  },
  barEmptyToday: {
    backgroundColor: 'rgba(255,184,0,0.22)',
  },
  barValueTag: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,159,16,0.16)',
  },
  barValueText: {
    color: '#ffc75e',
    fontSize: 10,
    fontWeight: '800',
  },
  chartEmpty: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: {
    color: '#7c7368',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#2a2010',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dayRow: {
    flexDirection: 'row',
    marginTop: 7,
    gap: 7,
  },
  dayLabel: {
    color: '#6e655a',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  dayLabelToday: {
    color: '#ffb42f',
  },
  statsGrid: {
    marginTop: 10,
    marginHorizontal: -18,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.07)',
  },
  statValue: {
    color: '#ffb42f',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#7c7368',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 4,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionAction: {
    color: '#ffb42f',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: 'center',
  },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(57, 208, 93, 0.18)',
    backgroundColor: '#102112',
    padding: 16,
  },
  activeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(14, 65, 28, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(57, 208, 93, 0.28)',
  },
  smallDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#2ed563',
  },
  activeStatusText: {
    color: '#35d25f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  startedText: {
    color: '#67726a',
    fontSize: 12,
    fontWeight: '700',
  },
  activeProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  activeMeta: {
    flex: 1,
  },
  activeName: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  activeService: {
    color: '#39dd64',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  activeAddress: {
    color: '#728074',
    fontSize: 12,
    marginTop: 2,
  },
  priceChip: {
    alignItems: 'flex-end',
    marginLeft: 8,
    maxWidth: '42%',
  },
  priceChipLabel: {
    color: '#6e655a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  priceChipValue: {
    color: '#ffb42f',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  priceChipPending: {
    color: '#7c7368',
    fontWeight: '700',
  },
  activeDescription: {
    color: '#9aa39b',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 10,
  },
  stepTrack: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 14,
  },
  stepSeg: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stepSegDone: {
    backgroundColor: '#39dd64',
  },
  stepSegCurrent: {
    backgroundColor: '#ffb42f',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  awaitingRow: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  awaitingIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,184,0,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  progressText: {
    color: '#49d96d',
    fontSize: 13,
    fontWeight: '700',
  },
  finishText: {
    color: '#728074',
    fontSize: 12,
    fontWeight: '700',
  },
  awaitingText: {
    color: '#ffb42f',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  primaryActionDisabled: {
    backgroundColor: '#2c332e',
    shadowOpacity: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  primaryAction: {
    flex: 1,
    height: 50,
    borderRadius: 999,
    backgroundColor: '#32d25f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#32d25f',
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryActionText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  iconAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#121912',
    borderWidth: 1,
    borderColor: 'rgba(65, 199, 107, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryAction: {
    flex: 1,
    minWidth: 0,
    height: 42,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: '#10161a',
    borderWidth: 1,
    borderColor: 'rgba(63, 164, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  secondaryActionText: {
    color: '#3fa4ff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  requestCard: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: '#14110a',
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.14)',
  },
  requestBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  requestUrgentBadge: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#ffb42f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestUrgentText: {
    color: '#181000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  requestPrice: {
    color: '#ffb42f',
    fontSize: 18,
    fontWeight: '900',
  },
  requestPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requestDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  requestDistanceText: {
    color: '#8a938c',
    fontSize: 12,
    fontWeight: '700',
  },
  requestAddress: {
    color: '#728074',
    fontSize: 12,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  declineButton: {
    width: 96,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  acceptButton: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#32d25f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#32d25f',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  acceptButtonText: {
    color: '#0f130f',
    fontSize: 14,
    fontWeight: '900',
  },
  requestProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAvatarText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  requestMeta: {
    flex: 1,
  },
  requestName: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  requestSummary: {
    color: '#8a7f70',
    fontSize: 12,
    marginTop: 3,
  },
  emptyStateCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#101211',
    borderStyle: 'dashed',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyStateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,184,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyStateMessage: {
    color: '#8a938c',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
  emptyStateBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateBtnText: {
    color: '#ffb42f',
    fontSize: 13,
    fontWeight: '800',
  },
});
