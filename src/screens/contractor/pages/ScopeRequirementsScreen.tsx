import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import { ContractorProjectDetail, ProjectScopeItem, UnitType } from '../../../types/contractor';
import {
  ArrowLeftIcon,
  PlusIcon,
  CloseIcon,
  RulerSquareIcon,
  CheckIcon,
} from '../../../components/ContractorIcons';
import {
  FadeInSlide,
  SpringPressable,
} from '../../../components/AnimatedComponents';

interface ScopeRequirementsScreenProps {
  project: ContractorProjectDetail;
  onBack: () => void;
  onAddScopeItem: (newItem: Omit<ProjectScopeItem, 'id' | 'completedQuantity'>) => void;
}

const AVAILABLE_UNITS: { label: string; value: UnitType }[] = [
  { label: 'SQ.FT', value: 'sqft' },
  { label: 'R.FT', value: 'rft' },
  { label: 'CU.FT', value: 'cft' },
  { label: 'NOS', value: 'nos' },
  { label: 'METER', value: 'meter' },
];

export const ScopeRequirementsScreen: React.FC<ScopeRequirementsScreenProps> = ({
  project,
  onBack,
  onAddScopeItem,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState<UnitType>('sqft');
  const [quantityStr, setQuantityStr] = useState('');
  const [rateStr, setRateStr] = useState('');

  const totalEstimated = project.scopeItems.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalCompletedValue = project.scopeItems.reduce(
    (sum, item) => sum + item.completedQuantity * item.ratePerUnit,
    0
  );
  const overallExecutionPct =
    totalEstimated > 0 ? Math.round((totalCompletedValue / totalEstimated) * 100) : 0;

  const handleSaveItem = () => {
    if (!itemName.trim()) {
      Alert.alert('Missing Name', 'Please enter a description for the requirement item.');
      return;
    }
    const qty = parseFloat(quantityStr);
    const rate = parseFloat(rateStr);
    if (isNaN(qty) || qty <= 0 || isNaN(rate) || rate <= 0) {
      Alert.alert('Invalid Numbers', 'Please enter valid quantity and unit rate.');
      return;
    }

    onAddScopeItem({
      name: itemName.trim(),
      unit,
      quantity: qty,
      ratePerUnit: rate,
      totalAmount: Math.round(qty * rate),
    });

    setItemName('');
    setQuantityStr('');
    setRateStr('');
    setShowAddModal(false);
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER WITH CIRCULAR CONTROLS */}
      <FadeInSlide delay={40} distance={14}>
        <View style={styles.topHeader}>
          <SpringPressable
            style={styles.circleHeaderBtn}
            onPress={onBack}
            scaleTo={0.92}
            hitSlop={8}
          >
            <ArrowLeftIcon size={18} color="#FFFFFF" />
          </SpringPressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Requirements & Rates</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {project.clientCode} • {project.projectName}
            </Text>
          </View>

          <SpringPressable
            style={styles.circleAddBtn}
            onPress={() => setShowAddModal(true)}
            scaleTo={0.92}
            hitSlop={8}
          >
            <PlusIcon size={18} color="#000000" />
          </SpringPressable>
        </View>
      </FadeInSlide>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. DUAL SUMMARY KPI CARDS */}
        <FadeInSlide delay={80} distance={14}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL CONTRACT</Text>
              <Text style={styles.kpiValue} numberOfLines={1}>
                ₹{totalEstimated.toLocaleString('en-IN')}
              </Text>
              <View style={styles.kpiSubRow}>
                <Text style={styles.kpiSubText}>
                  {project.scopeItems.length} Line Items
                </Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>WORK EXECUTED</Text>
              <Text style={[styles.kpiValue, { color: '#38BDF8' }]} numberOfLines={1}>
                ₹{totalCompletedValue.toLocaleString('en-IN')}
              </Text>
              <View style={styles.kpiSubRow}>
                <View style={styles.pctBadge}>
                  <Text style={styles.pctBadgeText}>{overallExecutionPct}% done</Text>
                </View>
              </View>
            </View>
          </View>
        </FadeInSlide>

        {/* 3. EXECUTION PROGRESS BAR CARD */}
        <FadeInSlide delay={120} distance={14}>
          <View style={styles.executionCard}>
            <View style={styles.executionHeader}>
              <View>
                <Text style={styles.executionTitle}>Scope Completion Velocity</Text>
                <Text style={styles.executionSub}>Aggregated from daily site audits</Text>
              </View>
              <Text style={styles.executionPctLarge}>{overallExecutionPct}%</Text>
            </View>

            <View style={styles.overallTrack}>
              <View style={[styles.overallTrackFill, { width: `${Math.min(100, overallExecutionPct)}%` }]} />
            </View>

            <View style={styles.executionFooter}>
              <Text style={styles.executionFooterNote}>
                ₹{(totalEstimated - totalCompletedValue).toLocaleString('en-IN')} pending execution
              </Text>
            </View>
          </View>
        </FadeInSlide>

        {/* 4. SECTION HEADER */}
        <FadeInSlide delay={160} distance={14}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ITEMIZED REQUIREMENTS</Text>
            <Text style={styles.sectionCount}>{project.scopeItems.length} items</Text>
          </View>
        </FadeInSlide>

        {/* 5. ITEM LIST */}
        {project.scopeItems.map((item, idx) => {
          const itemVal = item.completedQuantity * item.ratePerUnit;
          const pct =
            item.quantity > 0
              ? Math.min(100, Math.round((item.completedQuantity / item.quantity) * 100))
              : 0;

          return (
            <FadeInSlide key={item.id} delay={180 + idx * 40} distance={14}>
              <View style={styles.itemCard}>
                {/* Item Card Header */}
                <View style={styles.itemHeader}>
                  <View style={styles.itemIndexPill}>
                    <Text style={styles.itemIndexText}>#{idx + 1}</Text>
                  </View>

                  <View style={styles.itemTitleGroup}>
                    <Text style={styles.itemNameText}>{item.name}</Text>
                    <View style={styles.ratePill}>
                      <Text style={styles.itemRateTag}>
                        ₹{item.ratePerUnit} / {item.unit.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemTotalGroup}>
                    <Text style={styles.itemTotalVal}>
                      ₹{item.totalAmount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.itemTotalSub}>Contract Val</Text>
                  </View>
                </View>

                {/* Measurements Grid */}
                <View style={styles.dimensionsRow}>
                  <View style={styles.dimBox}>
                    <Text style={styles.dimLabel}>CONTRACT SCOPE</Text>
                    <Text style={styles.dimVal}>
                      {item.quantity.toLocaleString('en-IN')} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.dimDivider} />
                  <View style={styles.dimBox}>
                    <Text style={styles.dimLabel}>DONE TO DATE</Text>
                    <Text style={styles.dimVal}>
                      {item.completedQuantity.toLocaleString('en-IN')} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.dimDivider} />
                  <View style={styles.dimBox}>
                    <Text style={styles.dimLabel}>WORK DONE VALUE</Text>
                    <Text style={[styles.dimVal, { color: '#38BDF8' }]}>
                      ₹{itemVal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Progress Track */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.progressPctText}>{pct}%</Text>
                </View>
              </View>
            </FadeInSlide>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 6. FLOATING BOTTOM ACTION SPOTLIGHT */}
      <FadeInSlide delay={200} distance={20}>
        <View style={styles.floatingBottomBar}>
          <View style={styles.floatingLeft}>
            <Text style={styles.floatingTitle}>{project.scopeItems.length} Defined Line Items</Text>
            <Text style={styles.floatingSubtitle}>Contract unit rates & progress tracking</Text>
          </View>
          <SpringPressable
            style={styles.floatingAddBtn}
            onPress={() => setShowAddModal(true)}
            scaleTo={0.94}
          >
            <PlusIcon size={16} color="#000000" />
            <Text style={styles.floatingAddBtnText}>Add Item</Text>
          </SpringPressable>
        </View>
      </FadeInSlide>

      {/* 7. ADD SCOPE ITEM MODAL */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalTopRow}>
              <View style={styles.modalIconBox}>
                <RulerSquareIcon size={18} color="#FFFFFF" />
              </View>
              <SpringPressable
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseBtn}
                scaleTo={0.9}
                hitSlop={8}
              >
                <CloseIcon size={16} color="#8E8E93" />
              </SpringPressable>
            </View>

            <Text style={styles.modalTitle}>Add Requirement & Unit Rate</Text>
            <Text style={styles.modalDesc}>
              Define an itemized work scope line item with unit measurement and contractor rate.
            </Text>

            {/* Inputs */}
            <Text style={styles.inputLabel}>Item Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Italian Marble Flooring & Polishing"
              placeholderTextColor="#55555C"
              value={itemName}
              onChangeText={setItemName}
            />

            <Text style={styles.inputLabel}>Unit of Measurement</Text>
            <View style={styles.unitSelectorRow}>
              {AVAILABLE_UNITS.map((u) => {
                const isActive = unit === u.value;
                return (
                  <SpringPressable
                    key={u.value}
                    style={[styles.unitPill, isActive && styles.unitPillActive]}
                    onPress={() => setUnit(u.value)}
                    scaleTo={0.95}
                  >
                    <Text style={[styles.unitPillText, isActive && styles.unitPillTextActive]}>
                      {u.label}
                    </Text>
                  </SpringPressable>
                );
              })}
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Quantity ({unit})</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 1500"
                  placeholderTextColor="#55555C"
                  keyboardType="numeric"
                  value={quantityStr}
                  onChangeText={setQuantityStr}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Rate / {unit.toUpperCase()}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 140"
                  placeholderTextColor="#55555C"
                  keyboardType="numeric"
                  value={rateStr}
                  onChangeText={setRateStr}
                />
              </View>
            </View>

            {/* Calculation Preview */}
            {quantityStr && rateStr && !isNaN(parseFloat(quantityStr)) && !isNaN(parseFloat(rateStr)) && (
              <View style={styles.calcPreviewBox}>
                <Text style={styles.calcPreviewLabel}>Calculated Line Item Total:</Text>
                <Text style={styles.calcPreviewVal}>
                  ₹{(parseFloat(quantityStr) * parseFloat(rateStr)).toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <SpringPressable
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
                scaleTo={0.95}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </SpringPressable>

              <SpringPressable
                style={styles.confirmBtn}
                onPress={handleSaveItem}
                scaleTo={0.95}
              >
                <CheckIcon size={14} color="#000000" />
                <Text style={styles.confirmBtnText}>Save Line Item</Text>
              </SpringPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#000000',
  },
  circleHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  // KPI DUAL CARDS
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222228',
  },
  kpiLabel: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  kpiValue: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  kpiSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiSubText: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 11,
  },
  pctBadge: {
    backgroundColor: '#1C2530',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pctBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 10,
  },

  // EXECUTION VELOCITY CARD
  executionCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 20,
  },
  executionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  executionTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  executionSub: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },
  executionPctLarge: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  overallTrack: {
    height: 8,
    backgroundColor: '#222228',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  overallTrackFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  executionFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  executionFooterNote: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 11,
  },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 11,
  },

  // ITEM CARDS
  itemCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  itemIndexPill: {
    backgroundColor: '#222228',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 1,
  },
  itemIndexText: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10,
  },
  itemTitleGroup: {
    flex: 1,
  },
  itemNameText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 5,
  },
  ratePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F1F26',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2A34',
  },
  itemRateTag: {
    fontFamily: fonts.bodyMedium,
    color: '#8E8E93',
    fontSize: 10.5,
  },
  itemTotalGroup: {
    alignItems: 'flex-end',
  },
  itemTotalVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  itemTotalSub: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 10,
    marginTop: 2,
  },

  // DIMENSIONS ROW
  dimensionsRow: {
    flexDirection: 'row',
    backgroundColor: '#111114',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1D1D22',
    marginBottom: 12,
  },
  dimBox: {
    flex: 1,
    alignItems: 'center',
  },
  dimDivider: {
    width: 1,
    backgroundColor: '#1D1D22',
  },
  dimLabel: {
    fontFamily: fonts.displayBold,
    color: '#636366',
    fontSize: 9,
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  dimVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11.5,
  },

  // PROGRESS
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#222228',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  progressPctText: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10.5,
    width: 32,
    textAlign: 'right',
  },

  // FLOATING BOTTOM BAR
  floatingBottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 18,
    right: 18,
    backgroundColor: '#16161A',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#262630',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingLeft: {
    flex: 1,
    marginRight: 12,
  },
  floatingTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  floatingSubtitle: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 10.5,
    marginTop: 2,
  },
  floatingAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  floatingAddBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },

  // MODAL STYLING
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#16161A',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: '#262632',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  modalDesc: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10.5,
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#0C0C0E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262632',
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  unitSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  unitPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262630',
  },
  unitPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  unitPillText: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10,
  },
  unitPillTextActive: {
    color: '#000000',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  calcPreviewBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111114',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#222228',
  },
  calcPreviewLabel: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 12,
  },
  calcPreviewVal: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 14.5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#8E8E93',
    fontSize: 13,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 6,
  },
  confirmBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13,
  },
});
