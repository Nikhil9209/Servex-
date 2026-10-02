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
  const [totalSettled] = useState(3840000);
  const [retentionHeld] = useState(291000);

  const handleGenerateInvoice = () => {
    Alert.alert(
      'Contractor Progressive RA Bill',
      'Generate GST-compliant Running Account (RA) tax invoice for client approval?\n\nIncludes HSN/SAC codes, milestone certification, and 5% contractor retention deduction.'
    );
  };

  const projectRevenues = [
    { name: 'BKC Commercial Tower', billed: '₹18.0L', contract: '₹24.0L', pct: 75 },
    { name: 'Lodha Bellissimo HVAC', billed: '₹12.5L', contract: '₹18.5L', pct: 67 },
    { name: 'Andheri Industrial Hub', billed: '₹7.9L', contract: '₹9.2L', pct: 85 },
  ];

  const raInvoices = [
    {
      id: 'RA-04',
      client: 'Lodha Developers Ltd.',
      project: 'Commercial HVAC Telemetry Phase-2',
      date: '01 Oct 2026',
      amount: 680000,
      status: 'SETTLED',
      method: 'RTGS Corporate',
    },
    {
      id: 'RA-03',
      client: 'Sunil Rao Commercial Towers',
      project: 'Main Incomer 3-Phase Busbar',
      date: '24 Sep 2026',
      amount: 850000,
      status: 'SETTLED',
      method: 'NEFT Corporate',
    },
    {
      id: 'RA-02',
      client: 'Karan Johar Logistics Hub',
      project: 'Industrial Cable Tray & Conduit',
      date: '15 Sep 2026',
      amount: 420000,
      status: 'SETTLED',
      method: 'Direct Bank Transfer',
    },
    {
      id: 'RA-01',
      client: 'Godrej Properties Ltd.',
      project: 'Transformer Substation Initial Grounding',
      date: '02 Sep 2026',
      amount: 950000,
      status: 'SETTLED',
      method: 'Corporate Wire',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* FINANCIAL PORTFOLIO OVERVIEW CARD */}
      <View style={styles.portfolioCard}>
        <View style={styles.portfolioHeader}>
          <Text style={styles.portfolioLabel}>CONTRACTOR BILLING & REVENUE</Text>
          <View style={styles.statusPill}>
            <View style={styles.greenDot} />
            <Text style={styles.statusPillText}>FY 2026-27 Active</Text>
          </View>
        </View>

        <Text style={styles.portfolioAmount}>
          ₹{(totalSettled / 100000).toFixed(2)} Lakhs
        </Text>
        <Text style={styles.portfolioSub}>Progressive RA Billings Realized to Date</Text>

        <View style={styles.portfolioActionRow}>
          <Pressable style={styles.generateBillBtn} onPress={handleGenerateInvoice}>
            <Text style={styles.generateBillBtnText}>+ Generate GST RA Bill ➔</Text>
          </Pressable>
        </View>

        <View style={styles.retentionRow}>
          <Text style={styles.retentionLabel}>Developer Retention Held (5%):</Text>
          <Text style={styles.retentionValue}>
            ₹{(retentionHeld / 100000).toFixed(2)} Lakhs (Release upon final PMC handover)
          </Text>
        </View>
      </View>

      {/* REVENUE VS OUTFLOW KPI CARDS */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Crew Wages Paid</Text>
          <Text style={styles.kpiValue}>₹14.2L</Text>
          <Text style={styles.kpiSub}>34 Workers Roster</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Material Procurement</Text>
          <Text style={styles.kpiValue}>₹11.8L</Text>
          <Text style={styles.kpiSub}>Steel, Switchgear, Cables</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Net Margin</Text>
          <Text style={styles.kpiValue}>28.5%</Text>
          <Text style={styles.kpiSub}>After Labor & Materials</Text>
        </View>
      </View>

      {/* CONTRACT-WISE REVENUE BREAKDOWN */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionHeaderTitle}>Contract-Wise Progressive Billing</Text>
        <View style={styles.contractList}>
          {projectRevenues.map((item) => (
            <View key={item.name} style={styles.contractProgressItem}>
              <View style={styles.contractProgressTop}>
                <Text style={styles.contractItemName}>{item.name}</Text>
                <Text style={styles.contractItemAmounts}>
                  {item.billed} / {item.contract}
                </Text>
              </View>
              <View style={styles.trackBg}>
                <View style={[styles.trackFill, { width: `${item.pct}%` }]} />
              </View>
              <Text style={styles.contractItemPct}>{item.pct}% Progressive Billed</Text>
            </View>
          ))}
        </View>
      </View>

      {/* OFFICIAL CLIENT RUNNING ACCOUNT (RA) BILLS */}
      <View style={styles.cardSection}>
        <View style={styles.raHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Running Account (RA) Invoices</Text>
          <Text style={styles.raCountText}>All Settled ✓</Text>
        </View>

        <View style={styles.invoicesList}>
          {raInvoices.map((inv) => (
            <View key={inv.id} style={styles.invoiceItem}>
              <View style={styles.invoiceLeft}>
                <View style={styles.raIdBadge}>
                  <Text style={styles.raIdText}>{inv.id}</Text>
                </View>
                <View style={styles.invInfo}>
                  <Text style={styles.invClient}>{inv.client}</Text>
                  <Text style={styles.invProject}>{inv.project}</Text>
                  <Text style={styles.invDate}>
                    {inv.date} • {inv.method}
                  </Text>
                </View>
              </View>

              <View style={styles.invoiceRight}>
                <Text style={styles.invAmount}>
                  ₹{(inv.amount / 100000).toFixed(2)}L
                </Text>
                <View style={styles.settledBadge}>
                  <Text style={styles.settledBadgeText}>PAID</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
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
  portfolioCard: {
    backgroundColor: '#111317',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 16,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  portfolioLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 10.5,
    letterSpacing: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontFamily: fonts.body,
    color: '#10B981',
    fontSize: 10,
  },
  portfolioAmount: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 32,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  portfolioSub: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 12,
    marginBottom: 16,
  },
  portfolioActionRow: {
    marginBottom: 14,
  },
  generateBillBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBillBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13.5,
    letterSpacing: 0.4,
  },
  retentionRow: {
    borderTopWidth: 1,
    borderTopColor: '#1C2028',
    paddingTop: 10,
  },
  retentionLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  retentionValue: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 11.5,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#111317',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  kpiLabel: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11,
    marginBottom: 4,
  },
  kpiValue: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
    marginBottom: 2,
  },
  kpiSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 9.5,
  },
  cardSection: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 18,
  },
  sectionHeaderTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
    marginBottom: 12,
  },
  contractList: {
    gap: 12,
  },
  contractProgressItem: {
    gap: 4,
  },
  contractProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractItemName: {
    fontFamily: fonts.displayBold,
    color: '#D4D4D8',
    fontSize: 12.5,
  },
  contractItemAmounts: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 11.5,
  },
  trackBg: {
    height: 6,
    backgroundColor: '#1C2028',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  contractItemPct: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
    textAlign: 'right',
  },
  raHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  raCountText: {
    fontFamily: fonts.bodyMedium,
    color: '#10B981',
    fontSize: 11.5,
  },
  invoicesList: {
    gap: 10,
  },
  invoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0C0D11',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1C2028',
  },
  invoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  raIdBadge: {
    backgroundColor: '#1E232E',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  raIdText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11,
  },
  invInfo: {
    flex: 1,
  },
  invClient: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  invProject: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11,
  },
  invDate: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invAmount: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 2,
  },
  settledBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  settledBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
