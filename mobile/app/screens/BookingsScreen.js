import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useBookingOptional } from '../../context/BookingContext';
import { formatUgx, formatBookingDate, initials } from '../utils/ratings';
import { useLanguage } from '../i18n/LanguageContext';

function FundiBookingsView({ bookings, tab, setTab, onNavigate, loading, onRefresh, refreshing }) {
  const { t } = useLanguage();
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
          { key: 'active', label: t('Active ({{count}})', { count: active.length }) },
          { key: 'completed', label: t('Completed ({{count}})', { count: completed.length }) },
          { key: 'cancelled', label: t('Cancelled ({{count}})', { count: cancelled.length }) },
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
                  ? t('No cancelled bookings')
                  : tab === 'completed'
                    ? t('No completed bookings yet')
                    : t('No active bookings')
              }
              message={
                tab === 'active'
                  ? t('Accepted bookings will appear here.')
                  : tab === 'completed'
                    ? t('Complete your first booking to see it here.')
                    : t('Cancelled bookings will appear here.')
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
                  <Text style={styles.statusText}>{t(item.statusLabel)}</Text>
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

export default function BookingsScreen({
  userRole = 'customer',
  onNavigate,
  onViewHistory,
}) {
  const [activeTab, setActiveTab] = useState('active');
  const [fundiTab, setFundiTab] = useState('active');
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLanguage();

  const bookingCtx = useBookingOptional();

  useEffect(() => {
    bookingCtx?.refreshBookings?.();
  }, [bookingCtx?.refreshBookings]);

  const fundiBookings = bookingCtx?.bookings || [];

  const clientBookings = bookingCtx?.bookings || [];
  const activeBookings = clientBookings.filter((b) =>
    ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(b.status)
  );
  const completedBookings = clientBookings.filter((b) => b.status === 'COMPLETED');
  const cancelledBookings = clientBookings.filter((b) => b.status === 'CANCELLED');

  const customerTabs = useMemo(
    () => [
      { key: 'active', label: t('Active ({{count}})', { count: activeBookings.length }) },
      { key: 'completed', label: t('Completed ({{count}})', { count: completedBookings.length }) },
      { key: 'cancelled', label: t('Cancelled ({{count}})', { count: cancelledBookings.length }) },
    ],
    [activeBookings.length, completedBookings.length, cancelledBookings.length, t]
  );

  if (userRole === 'fundi') {
    return (
      <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <Text style={styles.title}>{t('My Jobs')}</Text>
          <FundiBookingsView
            bookings={fundiBookings}
            tab={fundiTab}
            setTab={setFundiTab}
            onNavigate={onNavigate}
            loading={bookingCtx?.loading}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              bookingCtx?.refreshBookings?.().finally?.(() => setRefreshing(false));
            }}
          />
          {bookingCtx?.error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title={t('Could not load bookings')}
              message={bookingCtx.error}
            />
          ) : null}
        </View>
      </ScreenWrapper>
    );
  }

  const listData =
    activeTab === 'completed'
      ? completedBookings
      : activeTab === 'active'
        ? activeBookings
        : activeTab === 'cancelled'
          ? cancelledBookings
          : [];

  return (
    <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('My Bookings')}</Text>

        <View style={styles.tabRow}>
          {customerTabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.topTab, isActive && styles.topTabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.topTabText, isActive && styles.topTabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'completed' ? (
          <TouchableOpacity style={styles.historyLink} onPress={onViewHistory}>
            <Text style={styles.historyLinkText}>{t('View full booking history →')}</Text>
          </TouchableOpacity>
        ) : null}

        {bookingCtx?.loading ? (
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
                  bookingCtx?.refreshBookings?.().finally?.(() => setRefreshing(false));
                }}
                tintColor={theme.colors.accent}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="calendar-outline"
                title={
                  activeTab === 'cancelled'
                    ? t('No cancelled bookings')
                    : activeTab === 'completed'
                      ? t('No completed bookings yet')
                      : t('No active bookings')
                }
                message={
                  activeTab === 'completed'
                    ? t('Your completed bookings will appear here.')
                    : activeTab === 'active'
                      ? t('Book a fundi to see your bookings here.')
                      : t('Cancelled bookings will appear here.')
                }
              />
            }
            renderItem={({ item }) => {
              const statusKey = (item.status || '').toLowerCase();
              const isActive = ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(statusKey);

              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() =>
                    statusKey === 'in_progress'
                      ? onNavigate?.('jobInProgress')
                      : statusKey === 'completed'
                        ? onViewHistory?.()
                        : isActive
                          ? onNavigate?.('bookingWaiting', { booking: item })
                          : undefined
                  }
                >
                  <View style={styles.cardRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(item.fundiName || item.name)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.name}>{item.fundiName || item.name}</Text>
                      <Text style={styles.service}>{item.service || item.category}</Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {item.address || (item.createdAt ? formatBookingDate(item.createdAt) : '')}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, styles[`status_${statusKey}`]]}>
                      <Text style={styles.statusText}>{t(item.statusLabel)}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.time}>
                      {item.createdAt ? formatBookingDate(item.createdAt) : ''}
                    </Text>
                    {item.amount ? <Text style={styles.extra}>{formatUgx(item.amount)}</Text> : null}
                  </View>

                  {isActive ? (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() =>
                          statusKey === 'in_progress'
                            ? onNavigate?.('jobInProgress')
                            : onNavigate?.('bookingWaiting', { booking: item })
                        }
                      >
                        <Text style={styles.actionText}>
                          {statusKey === 'in_progress' ? t('Track') : t('View')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
        )}

        {bookingCtx?.error ? (
          <EmptyState icon="cloud-offline-outline" title={t('Could not load bookings')} message={bookingCtx.error} />
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
  amount: { color: theme.colors.accent, fontWeight: '800', marginTop: 10, fontSize: 14 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '800', color: theme.colors.white },
  status_accepted: { backgroundColor: 'rgba(34,197,94,0.15)' },
  status_pending: { backgroundColor: 'rgba(59,130,246,0.15)' },
  status_on_the_way: { backgroundColor: 'rgba(59,130,246,0.15)' },
  status_arrived: { backgroundColor: 'rgba(59,130,246,0.15)' },
  status_in_progress: { backgroundColor: 'rgba(255,184,0,0.18)' },
  status_completed: { backgroundColor: 'rgba(34,197,94,0.15)' },
  status_cancelled: { backgroundColor: 'rgba(239,68,68,0.15)' },
  status_disputed: { backgroundColor: 'rgba(239,68,68,0.15)' },
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
});
