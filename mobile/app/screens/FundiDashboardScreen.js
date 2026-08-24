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
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Path,
  Circle,
} from 'react-native-svg';
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildChartPoints(values, width, height, topPad = 6, bottomPad = 6) {
  const leftPad = 4;
  const rightPad = 4;
  const innerWidth = Math.max(1, width - leftPad - rightPad);
  const innerHeight = Math.max(1, height - topPad - bottomPad);
  const max = Math.max(...values, 0);
  const scaleTop = max > 0 ? max : 1;
  const baseY = topPad + innerHeight;

  return values.map((value, index) => {
    const x = leftPad + (index * innerWidth) / Math.max(1, values.length - 1);
    const normalized = clamp(value / scaleTop, 0, 1);
    const y = baseY - normalized * innerHeight;
    return { x, y };
  });
}

function buildSmoothPath(points, topPad, baseY) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const clampY = (y) => clamp(y, topPad - 2, baseY + 2);
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = clampY(p2.y - (p3.y - p1.y) / 6);
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
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
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(240, screenWidth - 76);
  const chartHeight = 96;
  const topPad = 12;
  const bottomPad = 14;
  const baseY = chartHeight - bottomPad;

  const hasData = useMemo(() => values.some((v) => v > 0), [values]);
  const points = useMemo(
    () => buildChartPoints(values, chartWidth, chartHeight, topPad, bottomPad),
    [values, chartWidth, topPad, bottomPad],
  );
  const linePath = useMemo(
    () => buildSmoothPath(points, topPad, baseY),
    [points, topPad, baseY],
  );
  const areaPath = useMemo(() => {
    if (!points.length) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
  }, [points, linePath, baseY]);

  const dayLabels = useMemo(() => {
    const now = new Date();
    return Array.from({ length: values.length || 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - ((values.length || 7) - 1 - i));
      return DAY_LETTERS[d.getDay()];
    });
  }, [values.length]);

  const endPoint = points.length ? points[points.length - 1] : null;

  return (
    <View style={[styles.sparklineWrap, { width: chartWidth }]}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <SvgLinearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(255,171,28,0.30)" />
            <Stop offset="100%" stopColor="rgba(255,171,28,0.01)" />
          </SvgLinearGradient>
          <SvgLinearGradient id="earningsLine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#ffc75e" />
            <Stop offset="100%" stopColor="#ff9f10" />
          </SvgLinearGradient>
        </Defs>

        {/* subtle grid */}
        <Path
          d={`M 2 ${topPad + (baseY - topPad) / 2} H ${chartWidth - 2}`}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
        <Path
          d={`M 2 ${baseY} H ${chartWidth - 2}`}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1"
        />

        {hasData ? (
          <>
            <Path d={areaPath} fill="url(#earningsFill)" />
            <Path
              d={linePath}
              fill="none"
              stroke="url(#earningsLine)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {endPoint ? (
              <>
                <Circle cx={endPoint.x} cy={endPoint.y} r="9" fill="rgba(255,171,28,0.22)" />
                <Circle
                  cx={endPoint.x}
                  cy={endPoint.y}
                  r="4"
                  fill="#ffb42f"
                  stroke="#241703"
                  strokeWidth="1.5"
                />
              </>
            ) : null}
          </>
        ) : (
          <Path
            d={`M 2 ${baseY} H ${chartWidth - 2}`}
            stroke="rgba(255,184,0,0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            strokeLinecap="round"
          />
        )}
      </Svg>

      {!hasData ? (
        <View style={styles.chartEmpty} pointerEvents="none">
          <Text style={styles.chartEmptyText}>{t('No earnings yet this week')}</Text>
        </View>
      ) : null}

      <View style={styles.dayRow}>
        {dayLabels.map((letter, i) => (
          <Text
            key={`day-${i}`}
            style={[styles.dayLabel, i === dayLabels.length - 1 && styles.dayLabelToday]}
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
  activeJob,
}) {
  const { t, language, setLanguage } = useLanguage();
  const {
    bookings,
    refreshBookings,
    loading: bookingsLoading,
    pendingRequest,
  } = useBooking();
  const [online, setOnline] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  const activeBookings = useMemo(
    () => bookings.filter((b) => ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(b.status)),
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

  const active = activeBookings[0] || activeJob || null;
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

  // Safety net: while waiting for the client's confirmation, poll so the
  // completed job (and released payment) shows up even without socket.
  useEffect(() => {
    if (!awaitingClientConfirm) return undefined;
    const id = setInterval(() => refreshBookings(), 8000);
    return () => clearInterval(id);
  }, [awaitingClientConfirm, refreshBookings]);

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
  const avgRating = 4.8;
  const pendingCount = activeBookings.length + (request ? 1 : 0);
  const escrow = Math.round(heroEarnings * 0.17);

  const handleToggleOnline = async (next) => {
    setOnline(next);
    setAvailabilityLoading(true);
    try {
      await updateFundiAvailability(next);
    } catch (e) {
      setOnline(!next);
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
      const booking = res?.data?.booking;
      await refreshBookings();
      if (nextJobAction.status === 'COMPLETED' && booking && booking.status !== 'COMPLETED') {
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

  const handleAcceptRequest = async () => {
    const id = requestCard?.id;
    if (!id) return;
    setAcceptLoading(true);
    try {
      await acceptBooking(id);
      emitSocket('accept_booking', { bookingId: id });
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

        <View style={styles.presenceRow}>
          <TouchableOpacity
            style={[styles.presencePill, online ? styles.presenceOn : styles.presenceOff]}
            activeOpacity={0.88}
            onPress={() => handleToggleOnline(true)}
          >
            <View style={styles.pillDot} />
            <Text style={styles.presenceText}>{online ? t('Available for jobs') : t('Offline')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.offlineButton, online ? styles.offlineButtonIdle : styles.offlineButtonActive]}
            activeOpacity={0.88}
            onPress={() => handleToggleOnline(!online)}
            disabled={availabilityLoading}
          >
            {availabilityLoading ? (
              <ActivityIndicator size="small" color={theme.colors.muted} />
            ) : (
              <Text style={[styles.offlineButtonText, !online && styles.offlineButtonTextActive]}>
                {online ? t('Go Offline') : t('Go Online')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['#39280f', '#1a1208']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.earningsCard}
        >
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.sectionKicker}>{t("THIS WEEK'S EARNINGS")}</Text>
              <View style={styles.earningsAmountRow}>
                <Text style={styles.currency}>UGX</Text>
                <Text style={styles.earningsAmount}>{formatUgx(heroEarnings).replace('UGX ', '')}</Text>
              </View>
            </View>

            {heroEarnings > 0 ? (
              <View style={styles.trendPill}>
                <Ionicons name="arrow-up" size={12} color="#30d060" />
                <Text style={styles.trendText}>+18% vs last week</Text>
              </View>
            ) : null}
          </View>

          <Sparkline values={chartValues} />

          <View style={styles.statsGrid}>
            <StatCard value={`${jobsDone}`} label={t('JOBS DONE')} />
            <StatCard value={`${avgRating.toFixed(1)}★`} label={t('AVG RATING')} />
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
                {awaitingClientConfirm ? (
                  <Text style={styles.awaitingText}>
                    ⏳ {t('Waiting for client to release payment')}
                  </Text>
                ) : !canAdvanceJob ? (
                  <Text style={styles.finishText}>{t('Waiting for price agreement')}</Text>
                ) : null}
              </View>

              <View style={styles.actionRow}>
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
                <TouchableOpacity style={styles.iconAction} activeOpacity={0.88} onPress={() => onNavigate?.('chat')}>
                  <Ionicons name="chatbubble-outline" size={18} color="#41c76b" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  activeOpacity={0.88}
                  onPress={() => onNavigate?.('fundiBookingDetail', { bookingId: activeCard.id })}
                >
                  <Ionicons name="navigate-outline" size={16} color="#3fa4ff" />
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
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  presencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  presenceOn: {
    backgroundColor: 'rgba(12, 50, 22, 0.95)',
    borderColor: 'rgba(42, 170, 72, 0.35)',
  },
  presenceOff: {
    backgroundColor: '#161616',
    borderColor: theme.colors.border,
  },
  pillDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2ddb68',
    shadowColor: '#2ddb68',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  presenceText: {
    color: '#42d56d',
    fontWeight: '700',
    fontSize: 13,
  },
  offlineButton: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  offlineButtonIdle: {
    backgroundColor: '#161616',
    borderColor: theme.colors.border,
  },
  offlineButtonActive: {
    backgroundColor: '#161616',
    borderColor: '#f2a61b',
  },
  offlineButtonText: {
    color: theme.colors.mutedDark,
    fontWeight: '700',
    fontSize: 13,
  },
  offlineButtonTextActive: {
    color: '#ffb42f',
  },
  earningsCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.12)',
    marginBottom: 14,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  sectionKicker: {
    color: '#7f7365',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 6,
  },
  earningsAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
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
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(27, 71, 31, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(65, 188, 81, 0.3)',
    marginTop: 2,
  },
  trendText: {
    color: '#3ad160',
    fontSize: 12,
    fontWeight: '700',
  },
  sparklineWrap: {
    marginTop: 10,
    alignSelf: 'center',
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
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 1,
  },
  dayLabel: {
    color: '#6e655a',
    fontSize: 10,
    fontWeight: '700',
    width: 14,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#10161a',
    borderWidth: 1,
    borderColor: 'rgba(63, 164, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionText: {
    color: '#3fa4ff',
    fontSize: 13,
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
