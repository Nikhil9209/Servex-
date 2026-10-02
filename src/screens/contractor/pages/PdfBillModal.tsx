import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import { ContractorProjectDetail } from '../../../types/contractor';

interface PdfBillModalProps {
  visible: boolean;
  project: ContractorProjectDetail;
  onClose: () => void;
}

export const PdfBillModal: React.FC<PdfBillModalProps> = ({
  visible,
  project,
  onClose,
}) => {
  const totalCompletedValue = project.scopeItems.reduce(
    (sum, item) => sum + item.completedQuantity * item.ratePerUnit,
    0
  );

  const totalReceivedFromClient = project.transactions
    .filter((t) => t.type === 'received_from_client')
    .reduce((sum, t) => sum + t.amount, 0);

  const balanceDue = totalCompletedValue - totalReceivedFromClient;

  const invoiceNo = useMemo(
    () => `SRX-${project.clientCode}-2026`,
    [project.clientCode]
  );
  const todayDate = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    []
  );

  const handleExportPdf = () => {
    Alert.alert(
      'PDF Export Generated ✓',
      `Official Measurement & RA Invoice Bill ${invoiceNo} generated.\n\nFile saved as:\n${project.projectName.replace(/\s+/g, '_')}_Bill_${todayDate}.pdf`
    );
  };

  const handleShareClient = () => {
    Alert.alert(
      'Share Bill with Client',
      `Direct dispatch to client ${project.clientName} (${project.clientPhone}) with itemized measurements and balance ₹${Math.max(0, balanceDue).toLocaleString('en-IN')}.`
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          {/* TOP ACTIONS BAR */}
          <View style={styles.topActionsBar}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕ Close</Text>
            </Pressable>

            <Text style={styles.sheetHeaderTitle}>Generated Bill PDF</Text>

            <Pressable onPress={handleExportPdf} style={styles.exportBtn}>
              <Text style={styles.exportBtnText}>📥 Export PDF</Text>
            </Pressable>
          </View>

          {/* OFFICIAL PDF DOCUMENT PREVIEW */}
          <ScrollView
            style={styles.pdfPaperScrollView}
            contentContainerStyle={styles.pdfPaperContent}
            showsVerticalScrollIndicator={false}
          >
            {/* DOCUMENT HEADER / LETTERHEAD */}
            <View style={styles.letterhead}>
              <View>
                <Text style={styles.brandTitle}>SERVEX</Text>
                <Text style={styles.brandTagline}>PRIME CONTRACTOR INFRASTRUCTURE</Text>
                <Text style={styles.licenseText}>License: Class-1 Prime Contractor</Text>
              </View>

              <View style={styles.invoiceMetaRight}>
                <View style={styles.docBadge}>
                  <Text style={styles.docBadgeText}>RUNNING ACCOUNT (RA) BILL</Text>
                </View>
                <Text style={styles.invNumber}>Bill No: {invoiceNo}</Text>
                <Text style={styles.invDate}>Date: {todayDate}</Text>
              </View>
            </View>

            <View style={styles.docDivider} />

            {/* CLIENT & PROJECT PARTICULARS */}
            <View style={styles.particularsGrid}>
              <View style={styles.partCol}>
                <Text style={styles.partHeader}>BILLED TO (CLIENT):</Text>
                <Text style={styles.partClientName}>{project.clientName}</Text>
                <Text style={styles.partText}>Client Project Code: {project.clientCode}</Text>
                <Text style={styles.partText}>Phone: {project.clientPhone}</Text>
              </View>

              <View style={styles.partCol}>
                <Text style={styles.partHeader}>JOB SITE & PROJECT:</Text>
                <Text style={styles.partProjectName}>{project.projectName}</Text>
                <Text style={styles.partText}>{project.siteAddress}</Text>
                <Text style={styles.partText}>Commenced: {project.startDate}</Text>
              </View>
            </View>

            {/* ITEMIZED MEASUREMENT SHEET TABLE */}
            <Text style={styles.tableTitle}>MEASUREMENT SHEET OF WORK DONE TILL DATE</Text>

            <View style={styles.table}>
              <View style={styles.thRow}>
                <Text style={[styles.thCell, { flex: 0.5 }]}>#</Text>
                <Text style={[styles.thCell, { flex: 3 }]}>Item & Description</Text>
                <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>Unit</Text>
                <Text style={[styles.thCell, { flex: 1.3, textAlign: 'right' }]}>Total Scope</Text>
                <Text style={[styles.thCell, { flex: 1.4, textAlign: 'right' }]}>Work Done</Text>
                <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Rate (₹)</Text>
                <Text style={[styles.thCell, { flex: 1.6, textAlign: 'right' }]}>Amount (₹)</Text>
              </View>

              {project.scopeItems.map((item, idx) => {
                const itemDoneVal = item.completedQuantity * item.ratePerUnit;
                return (
                  <View key={item.id} style={styles.tdRow}>
                    <Text style={[styles.tdCell, { flex: 0.5 }]}>{idx + 1}</Text>
                    <Text style={[styles.tdCellBold, { flex: 3 }]}>{item.name}</Text>
                    <Text style={[styles.tdCell, { flex: 1, textAlign: 'center' }]}>
                      {item.unit}
                    </Text>
                    <Text style={[styles.tdCell, { flex: 1.3, textAlign: 'right' }]}>
                      {item.quantity.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.tdCellDone, { flex: 1.4, textAlign: 'right' }]}>
                      {item.completedQuantity.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right' }]}>
                      ₹{item.ratePerUnit}
                    </Text>
                    <Text style={[styles.tdCellAmount, { flex: 1.6, textAlign: 'right' }]}>
                      ₹{itemDoneVal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* FINANCIAL SUMMARY RECONCILIATION */}
            <View style={styles.calculationSection}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Gross Value of Work Done Till Date:</Text>
                <Text style={styles.calcVal}>
                  ₹{totalCompletedValue.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>
                  Less: Cumulative Advances & Payments Received:
                </Text>
                <Text style={styles.calcValDeduct}>
                  -₹{totalReceivedFromClient.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.calcDivider} />

              <View style={styles.calcGrandRow}>
                <Text style={styles.grandLabel}>Net Balance Payable by Client:</Text>
                <Text style={styles.grandVal}>
                  ₹{Math.max(0, balanceDue).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* SIGNATURE BLOCKS */}
            <View style={styles.signatureRow}>
              <View style={styles.sigBox}>
                <View style={styles.sigLine} />
                <Text style={styles.sigTitle}>Authorized Contractor Signatory</Text>
                <Text style={styles.sigSub}>Servex Prime Verification</Text>
              </View>

              <View style={styles.sigBox}>
                <View style={styles.sigLine} />
                <Text style={styles.sigTitle}>Client / PMC Acceptance</Text>
                <Text style={styles.sigSub}>{project.clientName}</Text>
              </View>
            </View>
          </ScrollView>

          {/* BOTTOM SHARE BAR */}
          <View style={styles.bottomBar}>
            <Pressable style={styles.shareBtn} onPress={handleShareClient}>
              <Text style={styles.shareBtnText}>📱 Send PDF Bill to Client via WhatsApp</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '92%',
    backgroundColor: '#0A0C10',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  topActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1E26',
    backgroundColor: '#0F1116',
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  closeBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#A1A1AA',
    fontSize: 13,
  },
  sheetHeaderTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
  },
  exportBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  exportBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },
  pdfPaperScrollView: {
    flex: 1,
    backgroundColor: '#0A0C10',
  },
  pdfPaperContent: {
    padding: 18,
    paddingBottom: 36,
  },
  letterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  brandTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: 2,
    marginBottom: 2,
  },
  brandTagline: {
    fontFamily: fonts.displayBold,
    color: '#D4D4D8',
    fontSize: 9.5,
    letterSpacing: 1,
    marginBottom: 2,
  },
  licenseText: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 10.5,
  },
  invoiceMetaRight: {
    alignItems: 'flex-end',
  },
  docBadge: {
    backgroundColor: '#1C2028',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 4,
  },
  docBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.6,
  },
  invNumber: {
    fontFamily: fonts.displayBold,
    color: '#D4D4D8',
    fontSize: 12,
  },
  invDate: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  docDivider: {
    height: 1,
    backgroundColor: '#20242D',
    marginVertical: 12,
  },
  particularsGrid: {
    flexDirection: 'row',
    backgroundColor: '#111317',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E232E',
  },
  partCol: {
    flex: 1,
  },
  partHeader: {
    fontFamily: fonts.displayBold,
    color: '#71717A',
    fontSize: 9.5,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  partClientName: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 2,
  },
  partProjectName: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 2,
  },
  partText: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 11,
    lineHeight: 15,
  },
  tableTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11.5,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  table: {
    backgroundColor: '#111317',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E232E',
    overflow: 'hidden',
    marginBottom: 16,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: '#171B24',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#202530',
  },
  thCell: {
    fontFamily: fonts.displayBold,
    color: '#A1A1AA',
    fontSize: 9.5,
  },
  tdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#171B22',
  },
  tdCell: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 10.5,
  },
  tdCellBold: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 10.5,
  },
  tdCellDone: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 10.5,
  },
  tdCellAmount: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11,
  },
  calculationSection: {
    backgroundColor: '#111317',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E232E',
    marginBottom: 20,
    gap: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 12,
  },
  calcVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  calcValDeduct: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 13,
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#202530',
    marginVertical: 4,
  },
  calcGrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandLabel: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13.5,
  },
  grandVal: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 18,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  sigBox: {
    alignItems: 'center',
    width: 140,
  },
  sigLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#3F4450',
    marginBottom: 6,
  },
  sigTitle: {
    fontFamily: fonts.displayBold,
    color: '#D4D4D8',
    fontSize: 10.5,
    textAlign: 'center',
  },
  sigSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 9.5,
    textAlign: 'center',
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A1E26',
    backgroundColor: '#0F1116',
  },
  shareBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13,
  },
});
