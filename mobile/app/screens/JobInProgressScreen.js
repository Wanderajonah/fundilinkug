import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScrollScreen from '../components/ScrollScreen';
import PrimaryButton from '../components/PrimaryButton';
import theme from '../theme';
import { formatUgx, initials } from '../utils/ratings';
import { useLanguage } from '../i18n/LanguageContext';
import { useBooking } from '../../context/BookingContext';
import { completeBooking, getErrorMessage } from '../../services/bookingsApi';

export default function JobInProgressScreen({ job = {}, onNavigate, onComplete }) {
  const { t } = useLanguage();
  const bookingCtx = useBooking();
  const [elapsedMins, setElapsedMins] = useState(job.elapsedMins || 0);
  // Server truth: has the fundi already confirmed their side?
  const fundiConfirmed = Boolean(job.fundiCompleted);
  const [waitingForFundi, setWaitingForFundi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Server truth for the job status — the local job object can claim
  // "in_progress" before the fundi actually started on their side.
  const [serverStatus, setServerStatus] = useState(null);
  const pollingRef = useRef(null);
  const firstName = (job.fundiName || 'John').split(' ')[0];
  const isDemo = !job.id || String(job.id).startsWith('demo');
  const jobStarted = isDemo || serverStatus === null
    ? String(job.status || '').toLowerCase() === 'in_progress'
    : serverStatus === 'IN_PROGRESS';

  useEffect(() => {
    const start = job.startedAt || Date.now() - (job.elapsedMins || 0) * 60000;
    const tick = () => setElapsedMins(Math.max(0, Math.floor((Date.now() - start) / 60000)));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [job.startedAt, job.elapsedMins]);

  // Fetch the real status once, then poll until the fundi starts the job.
  useEffect(() => {
    if (isDemo) return undefined;
    let cancelled = false;
    const check = async () => {
      try {
        const fresh = await bookingCtx?.refreshBookingById?.(job.id);
        if (!cancelled && fresh?.status) {
          setServerStatus(fresh.status);
          return fresh.status;
        }
      } catch {
        /* transient — retry on next tick */
      }
      return null;
    };
    check();
    const id = setInterval(async () => {
      const st = await check();
      if (!cancelled && st === 'IN_PROGRESS') clearInterval(id);
    }, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  useEffect(
    () => () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    },
    [],
  );

  const finishJob = (fresh) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    onComplete?.({ ...job, status: 'completed', releasedAt: Date.now(), ...(fresh || {}) });
  };

  const handleMarkComplete = async () => {
    if (isDemo) {
      onComplete?.(job);
      return;
    }
    if (!jobStarted) {
      Alert.alert(
        t('Job not started'),
        t('{{name}} has not started the job yet. You can confirm once it begins.', { name: firstName }),
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await completeBooking(job.id);
      const booking = res?.data?.booking;
      if (!booking || booking.status === 'COMPLETED') {
        finishJob(booking);
        return;
      }
      // Client confirmed; escrow releases once the fundi confirms too.
      setWaitingForFundi(true);
      pollingRef.current = setInterval(async () => {
        try {
          const fresh = await bookingCtx?.refreshBookingById?.(job.id);
          if (fresh?.status === 'COMPLETED') finishJob(fresh);
        } catch {
          /* transient — keep polling */
        }
      }, 8000);
    } catch (error) {
      Alert.alert(t('Could not confirm completion'), getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollScreen contentStyle={styles.scroll} bottomPad={32}>
      <View style={styles.iconWrap}>
        <Ionicons name="construct" size={40} color={theme.colors.accent} />
        <View style={styles.iconDot} />
      </View>

      <Text style={styles.title}>
        {jobStarted ? t('Job in progress') : t('Job starting soon')}
      </Text>
      <Text style={styles.sub}>
        {jobStarted
          ? t('{{name}} is working on your {{service}}.', {
              name: firstName,
              service: job.service?.toLowerCase() || t('repair'),
            })
          : t('Your escrow payment for the {{service}} job is safe. {{name}} will begin shortly.', {
              name: firstName,
              service: job.service?.toLowerCase() || t('repair'),
            })}
      </Text>

      <Text style={styles.section}>{t('BOOKING DETAILS')}</Text>
      <View style={styles.panel}>
        <Text style={styles.line}>
          {job.service} · {job.fundiName}
        </Text>
        <Text style={styles.lineMuted}>{job.address}</Text>
        <View style={styles.twoCol}>
          <View>
            <Text style={styles.colLabel}>{t('Escrow Amount')}</Text>
            <Text style={styles.colVal}>{formatUgx(job.amount)}</Text>
          </View>
          <View>
            <Text style={styles.colLabel}>{t('Time elapsed')}</Text>
            <Text style={styles.colVal}>{t('{{mins}} mins', { mins: elapsedMins })}</Text>
          </View>
        </View>
        <View style={styles.heldBadge}>
          <Ionicons name="lock-closed" size={12} color={theme.colors.green} />
          <Text style={styles.heldText}> {t('Held')}</Text>
        </View>
      </View>

      <View style={styles.statusBox}>
        <Ionicons name="navigate" size={20} color={theme.colors.accent} />
        <View style={{ flex: 1 }}>
          {jobStarted ? (
            <>
              <Text style={styles.statusTitle}>{t('{{name}} is on site working.', { name: firstName })}</Text>
              <Text style={styles.statusSub}>
                {t("You'll be notified the moment the job is marked done.")}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.statusTitle}>
                {t('Waiting for {{name}} to start the job…', { name: firstName })}
              </Text>
              <Text style={styles.statusSub}>
                {t('The job starts as soon as {{name}} marks it on their side.', { name: firstName })}
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.rateDisabled}>
        <Ionicons name="star-outline" size={18} color={theme.colors.mutedDark} />
        <Text style={styles.rateDisabledText}>{t('Rate this job (available after completion)')}</Text>
      </View>

      {waitingForFundi ? (
        <View style={[styles.statusBox, styles.waitingBox]}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              {t('Waiting for {{name}} to confirm…', { name: firstName })}
            </Text>
            <Text style={styles.statusSub}>
              {t(
                'You confirmed the job. Payment is released from escrow once {{name}} confirms too.',
                { name: firstName },
              )}
            </Text>
          </View>
        </View>
      ) : (
        <>
          <PrimaryButton
            style={styles.completeBtn}
            onPress={handleMarkComplete}
            disabled={submitting || !jobStarted}
          >
            {!jobStarted
              ? t('Waiting for {{name}} to start…', { name: firstName })
              : submitting
                ? t('Confirming…')
                : fundiConfirmed
                  ? t('{{name}} is done — release payment', { name: firstName })
                  : t('Mark job as complete')}
          </PrimaryButton>
          <Text style={styles.confirmNote}>
            {!jobStarted
              ? t("You can confirm completion once the job has started.")
              : fundiConfirmed
                ? t('{{name}} already confirmed. Your confirmation releases the payment.', { name: firstName })
                : t('Payment is released only after both you and {{name}} confirm.', { name: firstName })}
          </Text>
        </>
      )}

      <TouchableOpacity style={styles.chatFab} onPress={() => onNavigate?.('chat', { targetUserId: job?.fundiId })}>
        <Ionicons name="chatbubble-outline" size={24} color={theme.colors.white} />
      </TouchableOpacity>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 4, alignItems: 'center' },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,184,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  iconDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: theme.colors.black,
  },
  title: { color: theme.colors.white, fontSize: 24, fontWeight: '800' },
  sub: { color: theme.colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 20 },
  section: {
    alignSelf: 'flex-start',
    color: theme.colors.accent,
    fontSize: theme.typography.caps,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  panel: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  line: { color: theme.colors.white, fontWeight: '700', fontSize: 15 },
  lineMuted: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
  twoCol: { flexDirection: 'row', marginTop: 16, gap: 24 },
  colLabel: { color: theme.colors.muted, fontSize: 11 },
  colVal: { color: theme.colors.accent, fontWeight: '900', fontSize: 16, marginTop: 4 },
  heldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: 'rgba(34,197,94,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  heldText: { color: theme.colors.green, fontWeight: '700', fontSize: 12 },
  statusBox: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 20,
  },
  statusTitle: { color: theme.colors.white, fontWeight: '700', fontSize: 14 },
  statusSub: { color: theme.colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
  rateDisabled: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    opacity: 0.6,
  },
  rateDisabledText: { color: theme.colors.mutedDark, fontSize: 13 },
  completeBtn: {
    alignSelf: 'stretch',
    height: 54,
    marginHorizontal: 24,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  waitingBox: { alignItems: 'center', marginBottom: 20 },
  confirmNote: {
    color: theme.colors.mutedDark,
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 24,
    lineHeight: 17,
  },
  chatFab: {
    alignSelf: 'center',
    marginTop: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
