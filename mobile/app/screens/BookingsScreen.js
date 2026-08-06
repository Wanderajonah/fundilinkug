import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import StarRating from '../components/StarRating';
import PrimaryButton from '../components/PrimaryButton';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { getJobsForUser, updateJobStatus, getErrorMessage } from '../../services/jobsApi';
import { useBookingOptional } from '../../context/BookingContext';
import { partitionJobs } from '../utils/jobs';
import { formatUgx, formatBookingDate, ratingLabel, initials } from '../utils/ratings';

function FundiBookingsView({ bookings, tab, setTab, onNavigate, loading, onRefresh, refreshing }) {
  const active = bookings.filter((b) =>
    ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(b.status)
  );
  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const cancelled = bookings.filter((b) => b.status === 'CANCELLED');

  const list =
    tab === 'active' ? active : tab === 'completed' ? completed : tab === 'cancelled' ? cancelled : [];

  return (
    <>
      <View style={styles.tabRow}>
        {[
          { key: 'active', label: `Active (${active.length})` },
          { key: 'completed', label: `Completed (${completed.length})` },
          { key: 'cancelled', label: `Cancelled (${cancelled.length})` },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.topTab, tab === t.key && styles.topTabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.topTabText, tab === t.key && styles.topTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title={
                tab === 'cancelled'
                  ? 'No cancelled bookings'
                  : tab === 'completed'
                    ? 'No completed bookings yet'
                    : 'No active bookings'
              }
              message={
                tab === 'active'
                  ? 'Accepted bookings will appear here.'
                  : tab === 'completed'
                    ? 'Complete your first booking to see it here.'
                    : 'Cancelled bookings will appear here.'
              }
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onNavigate?.('fundiBookingDetail', { bookingId: item.id })}
            >
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(item.clientName)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>{item.clientName}</Text>
                  <Text style={styles.service}>{item.service}</Text>
                  <Text style={styles.meta}>{item.address}</Text>
                </View>
                <View style={[styles.statusPill, styles.status_accepted]}>
                  <Text style={styles.statusText}>{item.statusLabel}</Text>
                </View>
              </View>
              {item.agreedPrice ? (
                <Text style={styles.amount}>{formatUgx(item.agreedPrice)}</Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </>
  );
}

function FundiJobsView({ jobs, completed, cancelled, tab, setTab, onNavigate, loading, onRefresh, refreshing }) {
  const list =
    tab === 'active' ? jobs : tab === 'completed' ? completed : tab === 'cancelled' ? cancelled : [];

  return (
    <>
      <View style={styles.tabRow}>
        {[
          { key: 'active', label: `Active (${jobs.length})` },
          { key: 'completed', label: `Completed (${completed.length})` },
          { key: 'cancelled', label: `Cancelled (${cancelled.length})` },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.topTab, tab === t.key && styles.topTabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.topTabText, tab === t.key && styles.topTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title={
                tab === 'cancelled'
                  ? 'No cancelled jobs'
                  : tab === 'completed'
                    ? 'No completed jobs yet'
                    : 'No jobs available yet'
              }
              message={
                tab === 'active'
                  ? 'Jobs posted by clients will appear here.'
                  : tab === 'completed'
                    ? 'Complete your first job to see it here.'
                    : 'Cancelled jobs will appear here.'
              }
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(item.customerName)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>{item.customerName}</Text>
                  <Text style={styles.service}>{item.service}</Text>
                  <Text style={styles.meta}>{item.address || item.time}</Text>
                </View>
                <View style={[styles.statusPill, styles[`status_${item.status}`]]}>
                  <Text style={styles.statusText}>{item.statusLabel}</Text>
                </View>
              </View>
              <Text style={styles.amount}>{formatUgx(item.amount)}</Text>
              <View style={styles.actionsRow}>
                <PrimaryButton
                  style={styles.fundiAction}
                  onPress={async () => {
                    try {
                      if (item.status === 'in_progress') {
                        await updateJobStatus(item.id, 'completed');
                        Alert.alert('Job complete', 'Customer will be asked to confirm.');
                        onRefresh?.();
                      } else if (item.status === 'accepted') {
                        await updateJobStatus(item.id, 'in_progress');
                        Alert.alert('Job started', 'Navigate to customer location.');
                        onRefresh?.();
                      } else {
                        onNavigate?.('chat');
                      }
                    } catch (e) {
                      Alert.alert('Error', getErrorMessage(e));
                    }
                  }}
                >
                  {item.action}
                </PrimaryButton>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => onNavigate?.('chat', { targetUserId: item.clientId })}>
                  <Text style={styles.secondaryText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </>
  );
}

export default function BookingsScreen({
  userRole = 'customer',
  userId,
  onNavigate,
  reviewHistory = [],
  onStartRatingFlow,
  onViewHistory,
}) {
  const [activeTab, setActiveTab] = useState('active');
  const [fundiTab, setFundiTab] = useState('active');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const bookingCtx = useBookingOptional();

  const loadJobs = useCallback(async () => {
    if (!userId) {
      setJobs([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await getJobsForUser(userId);
      setJobs(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setJobs([]);
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadJobs();
    bookingCtx?.refreshBookings?.();
  }, [loadJobs, bookingCtx?.refreshBookings]);

  const partitioned = useMemo(() => partitionJobs(jobs, userRole), [jobs, userRole]);
  const fundiBookings = bookingCtx?.bookings || [];

  const customerTabs = useMemo(
    () => [
      { key: 'active', label: `Active (${partitioned.active.length})` },
      { key: 'completed', label: `Completed (${reviewHistory.length})` },
      { key: 'cancelled', label: `Cancelled (${partitioned.cancelled.length})` },
    ],
    [partitioned.active.length, partitioned.cancelled.length, reviewHistory.length]
  );

  if (userRole === 'fundi') {
    return (
      <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <Text style={styles.title}>My Jobs</Text>
          <FundiBookingsView
            bookings={fundiBookings}
            tab={fundiTab}
            setTab={setFundiTab}
            onNavigate={onNavigate}
            loading={bookingCtx?.loading || loading}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              bookingCtx?.refreshBookings?.();
              loadJobs().finally(() => setRefreshing(false));
            }}
          />
          {error || bookingCtx?.error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Could not load bookings"
              message={error || bookingCtx?.error}
            />
          ) : null}
        </View>
    </ScreenWrapper>
    );
  }

  const listData =
    activeTab === 'completed'
      ? reviewHistory
      : activeTab === 'active'
        ? partitioned.active
        : activeTab === 'cancelled'
          ? partitioned.cancelled
          : [];

  return (
    <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>My Bookings</Text>

        <View style={styles.tabRow}>
          {customerTabs.map((t) => {
            const isActive = t.key === activeTab;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.topTab, isActive && styles.topTabActive]}
                onPress={() => setActiveTab(t.key)}
              >
                <Text style={[styles.topTabText, isActive && styles.topTabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'completed' ? (
          <TouchableOpacity style={styles.historyLink} onPress={onViewHistory}>
            <Text style={styles.historyLinkText}>View full booking history →</Text>
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item) => String(item.id || item.reviewId)}
          contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadJobs();
                }}
                tintColor={theme.colors.accent}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="calendar-outline"
                title={
                  activeTab === 'cancelled'
                    ? 'No cancelled bookings'
                    : activeTab === 'completed'
                      ? 'No reviews yet'
                      : 'No active bookings'
                }
                message={
                  activeTab === 'completed'
                    ? 'Complete your first job to start receiving reviews.'
                    : activeTab === 'active'
                      ? 'Book a fundi to see your bookings here.'
                      : 'Cancelled bookings will appear here.'
                }
              />
            }
            renderItem={({ item }) => {
              if (activeTab === 'completed') {
                return (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => onNavigate?.('rateExperience', { review: item, job: item.job })}
                  >
                    <Text style={styles.name}>
                      {item.service} · {item.fundiName}
                    </Text>
                    <Text style={styles.time}>
                      {formatBookingDate(item.date)} · {formatUgx(item.amount)}
                    </Text>
                    {item.rating ? (
                      <View style={styles.ratingRow}>
                        <StarRating value={item.rating} showLabel={false} size={16} disabled />
                        <Text style={styles.ratingLabel}>{ratingLabel(item.rating)}</Text>
                      </View>
                    ) : (
                      <Text style={styles.rateLink}>Leave a review →</Text>
                    )}
                  </TouchableOpacity>
                );
              }

              return (
                <View style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(item.name)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.service}>{item.service}</Text>
                    </View>
                    <View style={[styles.statusPill, styles[`status_${item.status}`]]}>
                      <Text style={styles.statusText}>{item.statusLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.time}>{item.time}</Text>
                    <Text style={styles.extra}>{formatUgx(item.amount)}</Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() =>
                        item.status === 'in_progress'
                          ? onStartRatingFlow?.()
                          : onNavigate?.('chat', { targetUserId: item.raw?.fundiId?._id || item.raw?.fundiId })
                      }
                    >
                      <Text style={styles.actionText}>
                        {item.status === 'in_progress' ? 'Open job' : 'Message'}
                      </Text>
                    </TouchableOpacity>
                    {item.status === 'in_progress' ? (
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => onNavigate?.('jobInProgress')}
                      >
                        <Text style={styles.secondaryText}>Track</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            }}
          />
        )}

        {error ? (
          <EmptyState icon="cloud-offline-outline" title="Could not load bookings" message={error} />
        ) : null}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  title: { color: theme.colors.white, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  topTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  topTabActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  topTabText: { color: theme.colors.mutedDark, fontWeight: '800', fontSize: 11 },
  topTabTextActive: { color: theme.colors.textDark, fontWeight: '900' },
  historyLink: { marginBottom: 10 },
  historyLinkText: { color: theme.colors.accent, fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: theme.colors.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 12,
    ...theme.elevation.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,184,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: theme.colors.white, fontWeight: '900' },
  name: { color: theme.colors.white, fontWeight: '900' },
  service: { color: theme.colors.muted, fontSize: 11, marginTop: 2 },
  meta: { color: theme.colors.muted, fontSize: 11, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  ratingLabel: { color: theme.colors.accent, fontWeight: '700', fontSize: 13 },
  rateLink: { color: theme.colors.accent, fontWeight: '700', marginTop: 10 },
  amount: { color: theme.colors.accent, fontWeight: '800', marginTop: 10, fontSize: 14 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '800', color: theme.colors.white },
  status_confirmed: { backgroundColor: 'rgba(34,197,94,0.15)' },
  status_accepted: { backgroundColor: 'rgba(34,197,94,0.15)' },
  status_in_progress: { backgroundColor: 'rgba(255,184,0,0.18)' },
  status_open: { backgroundColor: 'rgba(59,130,246,0.15)' },
  status_quoted: { backgroundColor: 'rgba(59,130,246,0.15)' },
  status_completed: { backgroundColor: 'rgba(34,197,94,0.15)' },
  status_cancelled: { backgroundColor: 'rgba(239,68,68,0.15)' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  time: { color: theme.colors.mutedDark, fontSize: 11 },
  extra: { color: theme.colors.accent, fontSize: 11, fontWeight: '800' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  actionBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    ...theme.elevation.sm,
  },
  actionText: { color: theme.colors.textDark, fontWeight: '900', fontSize: 11 },
  fundiAction: { flex: 1, height: 44, marginRight: 8 },
  secondaryBtn: {
    backgroundColor: theme.colors.glass,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  secondaryText: { color: theme.colors.white, fontWeight: '800', fontSize: 11 },
});
