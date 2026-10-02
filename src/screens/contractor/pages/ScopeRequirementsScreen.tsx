import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
      {/* HEADER */}
      <View style={styles.topHeader}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <ArrowLeftIcon size={16} color="#94A3B8" />
          <Text style={styles.backBtnText}>Workspace</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Requirements & Rates</Text>
          <Text style={styles.headerSub}>
            {project.clientCode} • {project.projectName}
          </Text>
        </View>

        <Pressable style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <PlusIcon size={14} color="#0B0E14" />
          <Text style={styles.addBtnText}>Add Item</Text>
        </Pressable>
      </View>

      {/* SUMMARY BANNER */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Contract Scope</Text>
          <Text style={styles.summaryVal}>₹{totalEstimated.toLocaleString('en-IN')}</Text>
          <Text style={styles.summarySub}>{project.scopeItems.length} Defined Line Items</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Work Executed to Date</Text>
          <Text style={[styles.summaryVal, { color: '#38BDF8' }]}>
            ₹{totalCompletedValue.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summarySub}>{overallExecutionPct}% Overall Execution</Text>
        </View>
      </View>

      {/* ITEM LIST */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {project.scopeItems.map((item, idx) => {
          const itemVal = item.completedQuantity * item.ratePerUnit;
          const pct =
            item.quantity > 0
              ? Math.min(100, Math.round((item.completedQuantity / item.quantity) * 100))
              : 0;

          return (
            <View key={item.id} style={styles.itemCard}>
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

              {/* MEASUREMENT DIMENSIONS */}
              <View style={styles.dimensionsRow}>
                <View style={styles.dimBox}>
                  <Text style={styles.dimLabel}>Contract Scope</Text>
                  <Text style={styles.dimVal}>
                    {item.quantity.toLocaleString('en-IN')} {item.unit}
                  </Text>
                </View>
                <View style={styles.dimBox}>
                  <Text style={styles.dimLabel}>Done to Date</Text>
                  <Text style={styles.dimVal}>
                    {item.completedQuantity.toLocaleString('en-IN')} {item.unit}
                  </Text>
                </View>
                <View style={styles.dimBox}>
                  <Text style={styles.dimLabel}>Progress Value</Text>
                  <Text style={[styles.dimVal, { color: '#38BDF8' }]}>
                    ₹{itemVal.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* PROGRESS BAR */}
              <View style={styles.progressRow}>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.pctText}>{pct}%</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ADD SCOPE ITEM MODAL */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalTopRow}>
              <View style={styles.modalIconBox}>
                <RulerSquareIcon size={18} color="#38BDF8" />
              </View>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={8}>
                <CloseIcon size={18} color="#94A3B8" />
              </Pressable>
            </View>

            <Text style={styles.modalTitle}>Add Requirement & Unit Rate</Text>
            <Text style={styles.modalDesc}>
              Define an itemized work scope line item with unit measurement and contractor rate.
            </Text>

            <Text style={styles.inputLabel}>Item Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Italian Marble Flooring & Polishing"
              placeholderTextColor="#64748B"
              value={itemName}
              onChangeText={setItemName}
            />

            <Text style={styles.inputLabel}>Unit of Measurement</Text>
            <View style={styles.unitSelectorRow}>
              {AVAILABLE_UNITS.map((u) => (
                <Pressable
                  key={u.value}
                  style={[styles.unitPill, unit === u.value && styles.unitPillActive]}
                  onPress={() => setUnit(u.value)}
                >
                  <Text style={[styles.unitPillText, unit === u.value && styles.unitPillTextActive]}>
                    {u.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Quantity ({unit})</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 1500"
                  placeholderTextColor="#64748B"
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
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={rateStr}
                  onChangeText={setRateStr}
                />
              </View>
            </View>

            {quantityStr && rateStr && !isNaN(parseFloat(quantityStr)) && !isNaN(parseFloat(rateStr)) && (
              <View style={styles.calcPreviewBox}>
                <Text style={styles.calcPreviewLabel}>Calculated Line Item Total:</Text>
                <Text style={styles.calcPreviewVal}>
                  ₹{(parseFloat(quantityStr) * parseFloat(rateStr)).toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleSaveItem}>
                <CheckIcon size={14} color="#0B0E14" />
                <Text style={styles.confirmBtnText}>Save Line Item</Text>
              </Pressable>
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
    backgroundColor: '#0B0E14',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2638',
    backgroundColor: '#0E121B',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backBtnText: {
    fontFamily: fonts.displayBold,
    color: '#94A3B8',
    fontSize: 12.5,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 14.5,
  },
  headerSub: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    gap: 4,
  },
  addBtnText: {
    fontFamily: fonts.displayBold,
    color: '#0B0E14',
    fontSize: 11.5,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#111622',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  summaryCol: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#1E2638',
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 10,
    marginBottom: 2,
  },
  summaryVal: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 16,
    marginBottom: 2,
  },
  summarySub: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 10,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#111622',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  itemIndexPill: {
    backgroundColor: '#1E2638',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemIndexText: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 10,
  },
  itemTitleGroup: {
    flex: 1,
  },
  itemNameText: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 13.5,
    marginBottom: 4,
  },
  ratePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#161D2C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#242F44',
  },
  itemRateTag: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 10,
  },
  itemTotalGroup: {
    alignItems: 'flex-end',
  },
  itemTotalVal: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 14,
  },
  itemTotalSub: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 9.5,
    marginTop: 1,
  },
  dimensionsRow: {
    flexDirection: 'row',
    backgroundColor: '#0E121B',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1A2130',
    marginBottom: 10,
  },
  dimBox: {
    flex: 1,
  },
  dimLabel: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 9,
    marginBottom: 2,
  },
  dimVal: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 11,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: '#1A2130',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  pctText: {
    fontFamily: fonts.displayBold,
    color: '#64748B',
    fontSize: 10,
    width: 32,
    textAlign: 'right',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#0E121B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242F44',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1E2638',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 16,
    marginBottom: 4,
  },
  modalDesc: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 5,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#151C2C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28354D',
    color: '#F8FAFC',
    fontFamily: fonts.body,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
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
    paddingVertical: 7,
    backgroundColor: '#151C2C',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#28354D',
  },
  unitPillActive: {
    backgroundColor: '#1E2638',
    borderColor: '#38BDF8',
  },
  unitPillText: {
    fontFamily: fonts.displayBold,
    color: '#64748B',
    fontSize: 10,
  },
  unitPillTextActive: {
    color: '#38BDF8',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  calcPreviewBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151C2C',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#28354D',
  },
  calcPreviewLabel: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 11.5,
  },
  calcPreviewVal: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 12.5,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 5,
  },
  confirmBtnText: {
    fontFamily: fonts.displayBold,
    color: '#0B0E14',
    fontSize: 12.5,
  },
});
