import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';

export default function PaymentMethodsScreen({ onNavigate }) {
  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => onNavigate?.('profile')} style={styles.iconBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Payment Methods</Text>
          <TouchableOpacity style={styles.addBtn}><Text style={styles.addText}>+ Add</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Saved Cards</Text>
        <View style={styles.card}> 
          <View style={styles.cardRow}>
            <View style={styles.brandDot}><Text style={styles.brandText}>VISA</Text></View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cardTitle}>•••• 4242</Text>
              <Text style={styles.cardSub}>Expires 12/26</Text>
            </View>
            <View style={styles.defaultPill}><Text style={styles.defaultText}>Default</Text></View>
          </View>
        </View>

        <View style={styles.card}> 
          <View style={styles.cardRow}>
            <View style={[styles.brandDot, { backgroundColor: 'rgba(239,68,68,0.2)' }]}><Text style={[styles.brandText, { color: '#EF4444' }]}>MC</Text></View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cardTitle}>•••• 8888</Text>
              <Text style={styles.cardSub}>Expires 08/25</Text>
            </View>
            <View style={styles.radio} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Mobile Money</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.brandDot, { backgroundColor: 'rgba(234,179,8,0.2)' }]}><Text style={styles.brandText}>M</Text></View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cardTitle}>MTN Mobile Money</Text>
              <Text style={styles.cardSub}>+256 771 234 456</Text>
            </View>
            <View style={styles.radio} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.brandDot, { backgroundColor: 'rgba(248,113,113,0.2)' }]}><Text style={[styles.brandText, { color: '#F87171' }]}>A</Text></View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cardTitle}>Airtel Money</Text>
              <Text style={styles.cardSub}>+256 700 123 123</Text>
            </View>
            <View style={styles.radio} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Other Methods</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.brandDot, { backgroundColor: 'rgba(34,197,94,0.2)' }]}><Text style={[styles.brandText, { color: '#22C55E' }]}>$</Text></View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cardTitle}>Cash</Text>
              <Text style={styles.cardSub}>Pay in person</Text>
            </View>
            <View style={styles.radio} />
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>Your payment info is encrypted and stored securely.</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bgDark },
  container: { paddingHorizontal: 16, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 12 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#F3F3F3', fontSize: 22 },
  title: { color: '#F3F3F3', fontWeight: '900' },
  addBtn: { backgroundColor: theme.colors.accent, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  addText: { color: '#0B0B0B', fontWeight: '900', fontSize: 12 },

  sectionLabel: { color: 'rgba(255,255,255,0.5)', marginTop: 10, marginBottom: 8 },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  brandDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center' },
  brandText: { color: theme.colors.accent, fontWeight: '900' },
  cardTitle: { color: '#F3F3F3', fontWeight: '900' },
  cardSub: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 4 },
  defaultPill: { backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  defaultText: { color: theme.colors.accent, fontWeight: '900', fontSize: 10 },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },

  noteBox: { marginTop: 8, backgroundColor: 'rgba(245,158,11,0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  noteText: { color: theme.colors.accent, fontWeight: '700', fontSize: 11 },
});
