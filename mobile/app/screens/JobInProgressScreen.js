import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScrollScreen from '../components/ScrollScreen';
import PrimaryButton from '../components/PrimaryButton';
import theme from '../theme';
import { formatUgx, initials } from '../utils/ratings';

export default function JobInProgressScreen({ job = {}, onNavigate, onComplete }) {
  const [elapsedMins, setElapsedMins] = useState(job.elapsedMins || 0);
  const firstName = (job.fundiName || 'John').split(' ')[0];

  useEffect(() => {
    const start = job.startedAt || Date.now() - (job.elapsedMins || 0) * 60000;
    const tick = () => setElapsedMins(Math.max(0, Math.floor((Date.now() - start) / 60000)));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [job.startedAt, job.elapsedMins]);

  return (
    <ScrollScreen contentStyle={styles.scroll} bottomPad={32}>
      <View style={styles.iconWrap}>
        <Ionicons name="construct" size={40} color={theme.colors.accent} />
        <View style={styles.iconDot} />
      </View>

      <Text style={styles.title}>Job in progress</Text>
      <Text style={styles.sub}>
        {firstName} is working on your {job.service?.toLowerCase() || 'repair'}.
      </Text>

      <Text style={styles.section}>BOOKING DETAILS</Text>
      <View style={styles.panel}>
        <Text style={styles.line}>
          {job.service} · {job.fundiName}
        </Text>
        <Text style={styles.lineMuted}>{job.address}</Text>
        <View style={styles.twoCol}>
          <View>
            <Text style={styles.colLabel}>Escrow Amount</Text>
            <Text style={styles.colVal}>{formatUgx(job.amount)}</Text>
          </View>
          <View>
            <Text style={styles.colLabel}>Time elapsed</Text>
            <Text style={styles.colVal}>{elapsedMins} mins</Text>
          </View>
        </View>
        <View style={styles.heldBadge}>
          <Ionicons name="lock-closed" size={12} color={theme.colors.green} />
          <Text style={styles.heldText}> Held</Text>
        </View>
      </View>

      <View style={styles.statusBox}>
        <Ionicons name="navigate" size={20} color={theme.colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>{firstName} is on site working.</Text>
          <Text style={styles.statusSub}>
            You'll be notified the moment the job is marked done.
          </Text>
        </View>
      </View>

      <View style={styles.rateDisabled}>
        <Ionicons name="star-outline" size={18} color={theme.colors.mutedDark} />
        <Text style={styles.rateDisabledText}>Rate this job (available after completion)</Text>
      </View>

      <PrimaryButton onPress={() => onComplete?.(job)}>Mark job as complete</PrimaryButton>

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
  chatFab: {
    alignSelf: 'center',
    marginTop: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
