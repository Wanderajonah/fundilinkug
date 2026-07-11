import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../components/ScreenWrapper';
import StarRating from '../components/StarRating';
import EmptyState from '../components/EmptyState';
import theme from '../theme';
import { formatUgx, formatBookingDate, ratingLabel } from '../utils/ratings';

export default function BookingHistoryScreen({
  bookings = [],
  successMessage = '',
  onBack,
  onEditReview,
  onRestartFlow,
}) {
  const insets = useSafeAreaInsets();

  return (
    <ScreenWrapper style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Booking History</Text>
        <View style={{ width: 40 }} />
      </View>

      {successMessage ? (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent} />
          <Text style={styles.toastText}>{successMessage}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>PAST BOOKINGS</Text>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {bookings.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No booking history yet"
            message="Completed bookings and reviews will appear here."
          />
        ) : (
          bookings.map((item) => (
          <View key={item.id || item.reviewId} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>
                {item.service} - {item.fundiName}
              </Text>
              <View style={styles.paidBadge}>
                <Text style={styles.paidText}>Paid</Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {formatBookingDate(item.date || item.completedAt || item.createdAt)} ·{' '}
              {formatUgx(item.amount)}
            </Text>

            {item.rating ? (
              <View style={styles.reviewBlock}>
                <View style={styles.ratingRow}>
                  <StarRating value={item.rating} showLabel={false} size={18} disabled />
                  <Text style={styles.ratingLabel}>{ratingLabel(item.rating)}</Text>
                </View>
                {item.comment ? (
                  <Text style={styles.comment}>"{item.comment}"</Text>
                ) : null}
                {item.reviewId ? (
                  <TouchableOpacity onPress={() => onEditReview?.(item)}>
                    <Text style={styles.editLink}>Edit review</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <Text style={styles.noReview}>No review yet</Text>
            )}
          </View>
        ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.restartBtn} onPress={onRestartFlow}>
        <Ionicons name="refresh" size={18} color={theme.colors.accent} />
        <Text style={styles.restartText}>Restart flow from the beginning</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: theme.colors.white, fontSize: 20, fontWeight: '800' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.25)',
  },
  toastText: { color: theme.colors.white, flex: 1, fontSize: 14, fontWeight: '600' },
  section: {
    color: theme.colors.accent,
    fontSize: theme.typography.caps,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 15, flex: 1, paddingRight: 8 },
  paidBadge: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paidText: { color: theme.colors.green, fontWeight: '700', fontSize: 11 },
  meta: { color: theme.colors.muted, fontSize: 13, marginTop: 6 },
  reviewBlock: { marginTop: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratingLabel: { color: theme.colors.accent, fontWeight: '700', fontSize: 14 },
  comment: { color: theme.colors.muted, fontSize: 14, marginTop: 8, lineHeight: 20, fontStyle: 'italic' },
  editLink: { color: theme.colors.accent, fontWeight: '700', marginTop: 10, fontSize: 14 },
  noReview: { color: theme.colors.mutedDark, marginTop: 12, fontSize: 13 },
  restartBtn: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.input,
  },
  restartText: { color: theme.colors.accent, fontWeight: '700' },
});
