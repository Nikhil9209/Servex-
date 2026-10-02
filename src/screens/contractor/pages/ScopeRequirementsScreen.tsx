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

interface ScopeRequirementsScreenProps {
  project: ContractorProjectDetail;
  onBack: () => void;
  onAddScopeItem: (newItem: Omit<ProjectScopeItem, 'id' | 'completedQuantity'>) => void;
}

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

  const handleSaveItem = () => {
    if (!itemName.trim()) {
      Alert.alert('Missing Name', 'Please enter a description for the requirement item.');
      return;
    }
    const qty = parseFloat(quantityStr);
    const rate = parseFloat(rateStr);
    if (isNaN(qty) || qty <= 0 || isNaN(rate) || rate <= 0) {
      Alert.alert('Invalid Numbers', 'Please enter valid quantity and rate per unit.');
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
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Requirements & Rates</Text>
          <Text style={styles.headerSub}>{project.clientCode} • {project.projectName}</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      {/* SUMMARY BANNER */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Estimate</Text>
          <Text style={styles.summaryVal}>₹{totalEstimated.toLocaleString('en-IN')}</Text>
          <Text style={styles.summarySub}>{project.scopeItems.length} Requirements</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Work Done Till Date</Text>
          <Text style={styles.summaryVal}>₹{totalCompletedValue.toLocaleString('en-IN')}</Text>
          <Text style={styles.summarySub}>
            {totalEstimated > 0
              ? `${Math.round((totalCompletedValue / totalEstimated) * 100)}% Execution`
              : '0%'}
          </Text>
        </View>
      </View>

      {/* ITEM LIST */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {project.scopeItems.map((item, idx) => {
          const itemVal = item.completedQuantity * item.ratePerUnit;
          const pct = Math.round((item.completedQuantity / item.quantity) * 100);

          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemIndexPill}>
                  <Text style={styles.itemIndexText}>#{idx + 1}</Text>
                </View>
                <View style={styles.itemTitleGroup}>
                  <Text style={styles.itemNameText}>{item.name}</Text>
                  <Text style={styles.itemRateTag}>
                    Rate: ₹{item.ratePerUnit} / {item.unit.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.itemTotalGroup}>
                  <Text style={styles.itemTotalVal}>
                    ₹{item.totalAmount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.itemTotalSub}>Estimated</Text>
                </View>
              </View>

              {/* MEASUREMENT DIMENSIONS */}
              <View style={styles.dimensionsRow}>
                <View style={styles.dimBox}>
                  <Text style={styles.dimLabel}>Total Scope</Text>
                  <Text style={styles.dimVal}>
                    {item.quantity.toLocaleString('en-IN')} {item.unit}
                  </Text>
                </View>
                <View style={styles.dimBox}>
                  <Text style={styles.dimLabel}>Completed</Text>
                  <Text style={styles.dimVal}>
                    {item.completedQuantity.toLocaleString('en-IN')} {item.unit}
                  </Text>
                </View>
                <View style={styles.dimBox}>
                  <Text style={styles.dimLabel}>Progress Value</Text>
                  <Text style={styles.dimVal}>
                    ₹{itemVal.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* PROGRESS BAR */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{pct}% Completed</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* MODAL TO ADD ITEM WITH SQFT/RFT RATE */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Requirement & Rate</Text>
            <Text style={styles.modalDesc}>
              Define item description, measurement units, size/quantity, and agreed rate.
            </Text>

            <Text style={styles.inputLabel}>Item / Requirement Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Wall Tiling, False Ceiling, Conduiting"
              placeholderTextColor="#71717A"
              value={itemName}
              onChangeText={setItemName}
            />

            <Text style={styles.inputLabel}>Unit of Measurement</Text>
            <View style={styles.unitSelector}>
              {(['sqft', 'rft', 'cft', 'nos', 'meter'] as UnitType[]).map((u) => (
                <Pressable
                  key={u}
                  style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>
                    {u.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Total Size / Quantity</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={`e.g. 1200 ${unit}`}
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                  value={quantityStr}
                  onChangeText={setQuantityStr}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Rate (₹ / {unit})</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 85"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                  value={rateStr}
                  onChangeText={setRateStr}
                />
              </View>
            </View>

            {quantityStr && rateStr && !isNaN(parseFloat(quantityStr)) && !isNaN(parseFloat(rateStr)) ? (
              <View style={styles.previewCalcBox}>
                <Text style={styles.previewCalcLabel}>Total Calculated Amount:</Text>
                <Text style={styles.previewCalcVal}>
                  ₹{(parseFloat(quantityStr) * parseFloat(rateStr)).toLocaleString('en-IN')}
                </Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.saveBtn}
                onPress={handleSaveItem}
              >
                <Text style={styles.saveBtnText}>Save Requirement</Text>
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
    backgroundColor: '#000000',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#161920',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 14,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  headerSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  addBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#111317',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#20242D',
  },
  summaryLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
    marginBottom: 4,
  },
  summaryVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
    marginBottom: 2,
  },
  summarySub: {
    fontFamily: fonts.bodyMedium,
    color: '#10B981',
    fontSize: 11,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  itemIndexPill: {
    backgroundColor: '#1A1E26',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  itemIndexText: {
    fontFamily: fonts.displayBold,
    color: '#A1A1AA',
    fontSize: 10,
  },
  itemTitleGroup: {
    flex: 1,
  },
  itemNameText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 3,
  },
  itemRateTag: {
    fontFamily: fonts.bodyMedium,
    color: '#D4D4D8',
    fontSize: 11.5,
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
    color: '#71717A',
    fontSize: 10,
  },
  dimensionsRow: {
    flexDirection: 'row',
    backgroundColor: '#0C0D11',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  dimBox: {
    flex: 1,
    alignItems: 'center',
  },
  dimLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
    marginBottom: 2,
  },
  dimVal: {
    fontFamily: fonts.displayBold,
    color: '#D4D4D8',
    fontSize: 12,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#1C2028',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressPercent: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10,
    textAlign: 'right',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F1116',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242833',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
    marginBottom: 4,
  },
  modalDesc: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 11.5,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#161920',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232730',
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  unitBtn: {
    flex: 1,
    backgroundColor: '#161920',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#232730',
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  unitBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#71717A',
    fontSize: 11,
  },
  unitBtnTextActive: {
    color: '#000000',
    fontFamily: fonts.displayBold,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  previewCalcBox: {
    backgroundColor: '#151922',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#28303F',
  },
  previewCalcLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 12,
  },
  previewCalcVal: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  saveBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13,
  },
});
