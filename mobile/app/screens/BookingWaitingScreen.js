import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import CountdownTimer from '../components/CountdownTimer';
import BookingStatusSteps from '../components/BookingStatusSteps';
import PriceNegotiationSection from '../components/PriceNegotiationSection';
import {
  cancelClientBooking,
  negotiateClientPrice,
  getErrorMessage,
} from '../../services/bookingsApi';
import { useBooking } from '../../context/BookingContext';
import { canProceedToPayment, getTimeLeftSeconds } from '../utils/bookings';
import { formatUgx } from '../utils/ratings';
import { resolveMediaUrl } from '../../utils/image';
import { useLanguage } from '../i18n/LanguageContext';

export default function BookingWaitingScreen({ booking: initialBooking, onNavigate, onBack }) {
  const {
    activeBooking,
    refreshBookingById,
    notification,
    clearNotification,
    error: socketError,
    setError,
  } = useBooking();
  const { t } = useLanguage();

  const booking = activeBooking || initialBooking;
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (booking?.id) refreshBookingById(booking.id);
  }, [booking?.id, refreshBookingById]);

  // Safety net: re-fetch while the outcome is still open so a proposal made
  // by the fundi always shows up even if the socket event was missed. Also
  // keep polling through the whole ACCEPTED stage so a stale "unpaid" entry
  // (e.g. entered from an outdated list after a failed refresh) converges to
  // server truth and stops asking for payment.
  const stillOpen =
    booking?.status === 'PENDING' || booking?.status === 'ACCEPTED';
  useEffect(() => {
    if (!stillOpen || !booking?.id) return undefined;
    const id = setInterval(() => refreshBookingById(booking.id), 8000);
    return () => clearInterval(id);
  }, [stillOpen, booking?.id, refreshBookingById]);

  const handleCancel = async () => {
    if (!booking?.id) return;
    Alert.alert(t('Cancel booking'), t('Are you sure you want to cancel this request?'), [
      { text: t('Keep waiting'), style: 'cancel' },
      {
        text: t('Cancel booking'),
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await cancelClientBooking(booking.id, 'Cancelled by client');
            onNavigate?.('home');
          } catch (e) {
            setLocalError(getErrorMessage(e));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handlePropose = async (price) => {
    setPriceLoading(true);
    setLocalError('');
    try {
      await negotiateClientPrice(booking.id, { price, action: 'propose' });
      await refreshBookingById(booking.id);
    } catch (e) {
      setLocalError(getErrorMessage(e));
    } finally {
      setPriceLoading(false);
    }
  };

  const handleAgree = async () => {
    setPriceLoading(true);
    setLocalError('');
    try {
      await negotiateClientPrice(booking.id, { action: 'agree' });
      await refreshBookingById(booking.id);
    } catch (e) {
      setLocalError(getErrorMessage(e));
    } finally {
      setPriceLoading(false);
    }
  };

  const retryRefresh = useCallback(async () => {
    if (!booking?.id) return;
    setLoading(true);
    setLocalError('');
    try {
      await refreshBookingById(booking.id);
    } catch (e) {
      setLocalError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [booking?.id, refreshBookingById]);

  if (!booking) {
    return (
      <ScreenWrapper style={styles.safe}>
        <EmptyMessage
          title={t('No active booking')}
          message={t('Start a new booking from the home screen.')}
          onAction={() => onNavigate?.('browse')}
          actionLabel={t('Browse Fundis')}
        />
      </ScreenWrapper>
    );
  }

  const isPending = booking.status === 'PENDING';
  const isAccepted = booking.status === 'ACCEPTED';
  const isCancelled = booking.status === 'CANCELLED';
  const canPay = canProceedToPayment(booking);
  const displayError = localError || socketError;

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={onBack || (() => onNavigate?.('home'))} style={styles.backRow}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.white} />
          <Text style={styles.backText}>{t('Back')}</Text>
        </TouchableOpacity>

        {notification ? (
          <View
            style={[
              styles.banner,
              notification.type === 'error' && styles.bannerError,
              notification.type === 'success' && styles.bannerSuccess,
              notification.type === 'accepted' && styles.bannerSuccess,
            ]}
          >
            <Text style={styles.bannerTitle}>{notification.title}</Text>
            <Text style={styles.bannerMsg}>{notification.message}</Text>
            <TouchableOpacity onPress={clearNotification}>
              <Text style={styles.bannerDismiss}>{t('Dismiss')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isPending ? (
          <>
            <View style={styles.iconWrap}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
            <Text style={styles.title}>{t('Waiting for Fundi to respond…')}</Text>
            <Text style={styles.sub}>
              {t("We're finding an available fundi near you. You'll be notified when someone accepts.")}
            </Text>
            <CountdownTimer
              expiresAt={booking.expiresAt}
              initialSeconds={getTimeLeftSeconds(booking)}
              label={t('Response timer')}
            />
          </>
        ) : isCancelled ? (
          <>
            <View style={[styles.iconWrap, styles.iconError]}>
              <Ionicons name="close-circle" size={48} color={theme.colors.red} />
            </View>
            <Text style={styles.title}>{t('Booking cancelled')}</Text>
            <Text style={styles.sub}>{t('No fundi was available or the request was cancelled.')}</Text>
            <PrimaryButton onPress={() => onNavigate?.('browse')}>{t('Book another Fundi')}</PrimaryButton>
          </>
        ) : (
          <>
            <View style={[styles.iconWrap, styles.iconSuccess]}>
              <Ionicons name="checkmark-circle" size={48} color={theme.colors.green} />
            </View>
            <Text style={styles.title}>
              {isAccepted && !booking.priceAgreed
                ? t('{{name}} accepted!', { name: booking.fundiName })
                : t('Booking in progress')}
            </Text>
            <Text style={styles.sub}>
              {canPay
                ? t('Price agreed. Proceed to payment to confirm your booking.')
                : booking.paid
                  ? t('Payment secured in escrow.')
                  : t('Agree on a service price with your fundi to continue.')}
            </Text>
          </>
        )}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t('Booking details')}</Text>
          <Text style={styles.line}>{booking.service || booking.category}</Text>
          <Text style={styles.lineMuted}>{booking.address}</Text>
          {booking.description ? (
            <Text style={styles.lineMuted}>{booking.description}</Text>
          ) : null}
          {booking.fundiName && !isPending ? (
            <Text style={styles.lineFundi}>{t('Fundi: {{name}}', { name: booking.fundiName })}</Text>
          ) : null}
        </View>

        {booking.images?.length > 0 ? (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>{t('Photos')}</Text>
            <View style={styles.photoRow}>
              {booking.images.map((img, i) => (
                <Image key={i} source={{ uri: resolveMediaUrl(img) }} style={styles.photoThumb} />
              ))}
            </View>
          </View>
        ) : null}

        <BookingStatusSteps booking={booking} />

        {isAccepted ? (
          <PriceNegotiationSection
            booking={booking}
            role="customer"
            onPropose={handlePropose}
            onAgree={handleAgree}
            loading={priceLoading}
          />
        ) : null}

        {displayError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{displayError}</Text>
            <TouchableOpacity onPress={retryRefresh}>
              <Text style={styles.retryText}>{t('Tap to retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {canPay ? (
          <PrimaryButton
            style={{ marginTop: 20 }}
            onPress={() =>
              onNavigate?.('payment', {
                booking: {
                  ...booking,
                  artisanName: booking.fundiName,
                },
              })
            }
          >
            {t('Proceed to Payment')} · {formatUgx(booking.total)}
          </PrimaryButton>
        ) : booking.paid ? (
          <View style={styles.paidNote}>
            <Ionicons name="shield-checkmark" size={18} color={theme.colors.green} />
            <Text style={styles.paidText}>
              {t('Payment held in escrow. {{name}} can start whenever they arrive.', {
                name: booking.fundiName || t('Your fundi'),
              })}
            </Text>
          </View>
        ) : isAccepted ? (
          <PrimaryButton style={{ marginTop: 20 }} disabled>
            {t('Proceed to Payment')}
          </PrimaryButton>
        ) : null}

        {isPending ? (
          <TouchableOpacity style={styles.cancelLink} onPress={handleCancel} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={theme.colors.muted} />
            ) : (
              <Text style={styles.cancelText}>{t('Cancel request')}</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

function EmptyMessage({ title, message, onAction, actionLabel }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{message}</Text>
      {onAction ? <PrimaryButton onPress={onAction}>{actionLabel}</PrimaryButton> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 16, gap: 4 },
  backText: { color: theme.colors.muted, fontWeight: '800' },
  iconWrap: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.input,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconSuccess: { backgroundColor: 'rgba(34,197,94,0.12)' },
  iconError: { backgroundColor: 'rgba(239,68,68,0.12)' },
  title: {
    color: theme.colors.white,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: { color: theme.colors.muted, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  panel: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginTop: 20,
  },
  panelTitle: { color: theme.colors.accent, fontSize: 11, fontWeight: '800', marginBottom: 8 },
  line: { color: theme.colors.white, fontWeight: '800', fontSize: 15 },
  lineMuted: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
  lineFundi: { color: theme.colors.green, fontWeight: '700', marginTop: 8 },
  banner: {
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.25)',
  },
  bannerSuccess: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.25)',
  },
  bannerError: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  bannerTitle: { color: theme.colors.white, fontWeight: '800' },
  bannerMsg: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
  bannerDismiss: { color: theme.colors.accent, fontWeight: '700', marginTop: 8, fontSize: 12 },
  errorBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  errorText: { color: theme.colors.red, fontSize: 13 },
  retryText: { color: theme.colors.accent, fontWeight: '700', marginTop: 8 },
  cancelLink: {
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    borderRadius: theme.buttons.radius.md,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelText: { color: theme.colors.white, fontWeight: '700', fontSize: 13 },
  paidNote: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    borderRadius: theme.radius.md,
    padding: 14,
  },
  paidText: { flex: 1, color: theme.colors.green, fontWeight: '700', fontSize: 13, lineHeight: 18 },
  empty: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  photoSection: { marginTop: 16 },
  photoLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 8 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: { width: 72, height: 72, borderRadius: 8 },
});
