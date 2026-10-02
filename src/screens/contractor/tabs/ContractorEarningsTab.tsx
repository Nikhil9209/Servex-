import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { fonts } from '../../../theme/tokens';

export const ContractorEarningsTab: React.FC = () => {
  const [balance, setBalance] = useState(42850);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = () => {
    if (balance <= 0) {
      Alert.alert('Insufficient Balance', 'You have no pending balance to withdraw.');
      return;
    }

    Alert.alert(
      'Instant Bank Payout',
      `Transfer ₹${balance.toLocaleString('en-IN')} to linked HDFC Bank A/C ending in ••4092 via IMPS?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Transfer',
          onPress: () => {
            setIsWithdrawing(true);
            setTimeout(() => {
              setIsWithdrawing(false);
              setBalance(0);
              Alert.alert(
                'Payout Dispatched ✓',
                `₹${balance.toLocaleString(
                  'en-IN'
                )} has been transferred to your registered bank account. Reference ID: SRX${Date.now().toString().slice(-8)}`
              );
            }, 600);
          },
        },
      ]
    );
  };

  const weeklyData = [
    { day: 'Mon', amount: 3200, heightPct: 45 },
    { day: 'Tue', amount: 5400, heightPct: 75 },
    { day: 'Wed', amount: 2800, heightPct: 38 },
    { day: 'Thu', amount: 6800, heightPct: 92 },
    { day: 'Fri', amount: 4200, heightPct: 58 },
    { day: 'Sat', amount: 8450, heightPct: 100, isToday: true },
    { day: 'Sun', amount: 0, heightPct: 5 },
  ];

  const recentTransactions = [
    {
      id: 'tx-1',
      title: 'Residential Circuit Overhaul',
      client: 'Sunil Rao',
      date: 'Today, 2:15 PM',
      amount: 4500,
      method: 'Servex Direct Pay',
    },
    {
      id: 'tx-2',
      title: 'Commercial HVAC Telemetry',
      client: 'Omega Tech Park',
      date: 'Yesterday',
      amount: 6800,
      method: 'IMPS Bank Transfer',
    },
    {
      id: 'tx-3',
      title: 'Distribution Box Rewiring',
      client: 'Priya Sharma',
      date: '28 Sep 2026',
      amount: 3200,
      method: 'UPI Instant',
    },
    {
      id: 'tx-4',
      title: 'Emergency Generator Interlock',
      client: 'Apex Hospital',
      date: '26 Sep 2026',
      amount: 8200,
      method: 'Servex Corporate',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* TOTAL BALANCE CARD */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceTopRow}>
          <Text style={styles.balanceLabel}>AVAILABLE FOR PAYOUT</Text>
          <View style={styles.autoPayoutPill}>
            <View style={styles.greenPulse} />
            <Text style={styles.autoPayoutText}>Auto Daily 8 PM</Text>
          </View>
        </View>

        <Text style={styles.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>

        <View style={styles.balanceActions}>
          <Pressable
            style={[styles.withdrawBtn, balance === 0 && styles.withdrawBtnDisabled]}
            onPress={handleWithdraw}
            disabled={isWithdrawing || balance === 0}
          >
            <Text style={styles.withdrawBtnText}>
              {balance === 0 ? 'All Funds Settled' : 'Instant Withdraw to Bank ➔'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.accountFooter}>
          <Text style={styles.accountText}>Linked: HDFC Bank ••4092 (Verified ✓)</Text>
        </View>
      </View>

      {/* SUMMARY STATS GRID */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={styles.statValue}>₹28,400</Text>
          <Text style={styles.statSub}>+24% vs last week</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>₹1,14,200</Text>
          <Text style={styles.statSub}>Target ₹1,50,000</Text>
        </View>
      </View>

      {/* 7-DAY REVENUE BAR CHART */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>7-Day Revenue</Text>
          <Text style={styles.chartTotal}>₹30,850 total</Text>
        </View>

        <View style={styles.barChartWrapper}>
          {weeklyData.map((item) => (
            <View key={item.day} style={styles.barCol}>
              <Text style={styles.barAmount}>
                {item.amount > 0 ? `₹${(item.amount / 1000).toFixed(1)}k` : '—'}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${item.heightPct}%` },
                    item.isToday && styles.barFillToday,
                  ]}
                />
              </View>
              <Text style={[styles.barDay, item.isToday && styles.barDayToday]}>
                {item.day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* RECENT SETTLED TRANSACTIONS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Settlement Invoices</Text>
        <Text style={styles.sectionSub}>Past 30 Days</Text>
      </View>

      <View style={styles.txList}>
        {recentTransactions.map((tx) => (
          <View key={tx.id} style={styles.txCard}>
            <View style={styles.txLeft}>
              <View style={styles.txIconPill}>
                <Text style={styles.txIcon}>₹</Text>
              </View>
              <View>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txMeta}>
                  {tx.client} • {tx.date}
                </Text>
              </View>
            </View>

            <View style={styles.txRight}>
              <Text style={styles.txAmount}>+₹{tx.amount.toLocaleString('en-IN')}</Text>
              <View style={styles.paidPill}>
                <Text style={styles.paidText}>PAID</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  balanceCard: {
    backgroundColor: '#111317',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 16,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  balanceLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 10.5,
    letterSpacing: 1,
  },
  autoPayoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  autoPayoutText: {
    fontFamily: fonts.body,
    color: '#10B981',
    fontSize: 10,
  },
  balanceAmount: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 32,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  balanceActions: {
    marginBottom: 12,
  },
  withdrawBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  withdrawBtnDisabled: {
    backgroundColor: '#1F242D',
  },
  withdrawBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13.5,
    letterSpacing: 0.4,
  },
  accountFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1C2028',
    paddingTop: 10,
  },
  accountText: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#111317',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  statLabel: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11.5,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 20,
    marginBottom: 2,
  },
  statSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
  },
  chartCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 18,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  chartTotal: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 12,
  },
  barChartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 14,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barAmount: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 9,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 70,
    backgroundColor: '#181C24',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#52525B',
    borderRadius: 7,
  },
  barFillToday: {
    backgroundColor: '#FFFFFF',
  },
  barDay: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
    marginTop: 6,
  },
  barDayToday: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  sectionSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11.5,
  },
  txList: {
    gap: 10,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111317',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  txIconPill: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1A1E26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.displayBold,
  },
  txTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 2,
  },
  txMeta: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 2,
  },
  paidPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  paidText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
