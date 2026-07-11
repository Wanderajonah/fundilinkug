import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import { getWallet, getTransactions } from '../../services/walletApi';

export default function WalletHomeScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const [wallet, setWallet] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        getWallet(),
        getTransactions({ limit: 5 }),
      ]);
      setWallet(walletRes.data.wallet);
      setRecentTx(txRes.data.transactions || []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const formatCurrency = (val) =>
    `${wallet?.currency || 'UGX'} ${(val || 0).toLocaleString()}`;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'short' });
  };

  const txIcon = (type) => {
    switch (type) {
      case 'deposit': return 'arrow-down-circle';
      case 'withdrawal': return 'arrow-up-circle';
      case 'payment': return 'cart-outline';
      case 'payment_received': return 'wallet-outline';
      case 'refund': return 'refresh-circle';
      case 'transfer_out': return 'arrow-forward-circle';
      case 'transfer_in': return 'arrow-back-circle';
      default: return 'ellipse-outline';
    }
  };

  const txColor = (type) => {
    if (['deposit', 'payment_received', 'refund', 'transfer_in'].includes(type)) return theme.colors.green;
    return type === 'payment' ? theme.colors.accent : theme.colors.red;
  };

  const quickActions = [
    { key: 'deposit', label: 'Deposit', icon: 'add-circle-outline', color: theme.colors.green },
    { key: 'withdraw', label: 'Withdraw', icon: 'cash-outline', color: theme.colors.red },
    { key: 'transfer', label: 'Transfer', icon: 'swap-horizontal-outline', color: theme.colors.blue },
    { key: 'history', label: 'History', icon: 'time-outline', color: theme.colors.accent },
  ];

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <TouchableOpacity style={styles.historyBtn} onPress={() => onNavigate?.('transactionHistory')}>
            <Ionicons name="receipt-outline" size={20} color={theme.colors.accent} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
          </View>
        ) : (
          <>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(wallet?.balance)}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: wallet?.status === 'active' ? theme.colors.green : theme.colors.red }]} />
                <Text style={styles.statusText}>{wallet?.status === 'active' ? 'Active' : 'Frozen'}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              {quickActions.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={styles.actionBtn}
                  onPress={() => {
                    if (a.key === 'history') return onNavigate?.('transactionHistory');
                    return onNavigate?.(a.key);
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: a.color + '20' }]}>
                    <Ionicons name={a.icon} size={22} color={a.color} />
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => onNavigate?.('transactionHistory')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentTx.length === 0 ? (
              <View style={styles.emptyTx}>
                <Ionicons name="receipt-outline" size={36} color={theme.colors.mutedDark} />
                <Text style={styles.emptyTxText}>No transactions yet</Text>
              </View>
            ) : (
              recentTx.map((tx) => (
                <View key={tx._id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: txColor(tx.type) + '20' }]}>
                    <Ionicons name={txIcon(tx.type)} size={18} color={txColor(tx.type)} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                  </View>
                  <View style={styles.txAmount}>
                    <Text style={[styles.txValue, { color: txColor(tx.type) }]}>
                      {['deposit', 'payment_received', 'refund', 'transfer_in'].includes(tx.type) ? '+' : '-'}
                      UGX {(tx.amount || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: theme.colors.white, fontSize: 20, fontWeight: '900' },
  historyBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },
  balanceCard: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: { color: theme.colors.muted, fontSize: 13, fontWeight: '600' },
  balanceAmount: { color: theme.colors.accent, fontSize: 36, fontWeight: '900', marginTop: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: theme.colors.muted, fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.panel, borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: theme.colors.border },
  actionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionLabel: { color: theme.colors.white, fontSize: 11, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: theme.colors.white, fontSize: 16, fontWeight: '800' },
  viewAll: { color: theme.colors.accent, fontSize: 13, fontWeight: '700' },
  emptyTx: { alignItems: 'center', paddingVertical: 30, backgroundColor: theme.colors.panel, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  emptyTxText: { color: theme.colors.mutedDark, fontSize: 14, marginTop: 8 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.panel,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  txIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txDesc: { color: theme.colors.white, fontWeight: '600', fontSize: 13 },
  txDate: { color: theme.colors.mutedDark, fontSize: 11, marginTop: 2 },
  txAmount: {},
  txValue: { fontWeight: '800', fontSize: 13 },
});
