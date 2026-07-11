import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';
import { getBookingStepIndex } from '../utils/bookings';

const DEFAULT_STEPS = [
  'Requested',
  'Accepted',
  'Price',
  'Paid',
  'On Way',
  'Arrived',
  'Working',
  'Done',
];

export default function BookingStatusSteps({ booking, steps = DEFAULT_STEPS }) {
  const current = getBookingStepIndex(booking);

  return (
    <View style={styles.wrap}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={label} style={styles.item}>
            <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]} />
            <Text style={[styles.label, (done || active) && styles.labelOn]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16 },
  item: { flex: 1, alignItems: 'center', gap: 6 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.input,
    borderWidth: 2,
    borderColor: theme.colors.mutedDark,
  },
  dotDone: { backgroundColor: theme.colors.green, borderColor: theme.colors.green },
  dotActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  label: { color: theme.colors.mutedDark, fontSize: 9, fontWeight: '700', textAlign: 'center' },
  labelOn: { color: theme.colors.white },
});
