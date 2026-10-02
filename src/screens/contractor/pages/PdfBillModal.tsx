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
import {
  CloseIcon,
  DownloadIcon,
  ShareIcon,
  ShieldCheckIcon,
  FileTextIcon,
} from '../../../components/ContractorIcons';

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

  const balanceDue = Math.max(0, totalCompletedValue - totalReceivedFromClient);

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
      'PDF Document Exported',
      `Official Running Account (RA) Bill ${invoiceNo} compiled.\n\nFile saved to device:\n${project.projectName.replace(/\s+/g, '_')}_RA_Bill_${todayDate}.pdf`
    );
  };

  const handleShareClient = () => {
    Alert.alert(
      'Dispatch to Client',
      `Transmitting digital RA Bill to client ${project.clientName} (${project.clientPhone}). Outstanding Balance Due: ₹${balanceDue.toLocaleString('en-IN')}.`
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          {/* TOP ACTIONS BAR */}
          <View style={styles.topActionsBar}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <CloseIcon size={16} color="#94A3B8" />
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>

            <View style={styles.modalHeaderTitleGroup}>
              <FileTextIcon size={15} color="#F8FAFC" />
              <Text style={styles.sheetHeaderTitle}>Running Account Bill</Text>
            </View>

            <View style={styles.headerRightActions}>
              <Pressable onPress={handleExportPdf} style={styles.exportBtn}>
                <DownloadIcon size={14} color="#0B0E14" />
                <Text style={styles.exportBtnText}>PDF</Text>
              </Pressable>
            </View>
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
                <View style={styles.brandRow}>
                  <Text style={styles.brandTitle}>SERVEX</Text>
                  <View style={styles.primePill}>
                    <Text style={styles.primePillText}>PRIME CONTRACTOR</Text>
                  </View>
                </View>
                <Text style={styles.brandTagline}>ENTERPRISE INFRASTRUCTURE & CONSTRUCTION</Text>
                <Text style={styles.licenseText}>License: Class-1 Prime Contractor • GSTIN: 27AABCS1429E1Z8</Text>
              </View>

              <View style={styles.invoiceMetaRight}>
                <View style={styles.docBadge}>
                  <Text style={styles.docBadgeText}>OFFICIAL RA BILL</Text>
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
                <Text style={styles.partText}>Project Code: {project.clientCode}</Text>
                <Text style={styles.partText}>Phone: {project.clientPhone}</Text>
              </View>

              <View style={styles.partCol}>
                <Text style={styles.partHeader}>SITE & WORKSPACE:</Text>
                <Text style={styles.partProjectName}>{project.projectName}</Text>
                <Text style={styles.partText}>{project.siteAddress}</Text>
                <Text style={styles.partText}>Commenced: {project.startDate}</Text>
              </View>
            </View>

            {/* ITEMIZED MEASUREMENT SHEET TABLE */}
            <Text style={styles.tableTitle}>ITEMIZED MEASUREMENT & PROGRESS VALUATION</Text>

            <View style={styles.table}>
              <View style={styles.thRow}>
                <Text style={[styles.thCell, { flex: 0.6 }]}>#</Text>
                <Text style={[styles.thCell, { flex: 3 }]}>Scope Item Description</Text>
                <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>Unit</Text>
                <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Contract</Text>
                <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Executed</Text>
                <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Rate (₹)</Text>
                <Text style={[styles.thCell, { flex: 1.6, textAlign: 'right' }]}>Amount (₹)</Text>
              </View>

              {project.scopeItems.map((item, idx) => {
                const itemDoneVal = item.completedQuantity * item.ratePerUnit;
                return (
                  <View key={item.id} style={styles.tdRow}>
                    <Text style={[styles.tdCell, { flex: 0.6 }]}>{idx + 1}</Text>
                    <Text style={[styles.tdCellBold, { flex: 3 }]}>{item.name}</Text>
                    <Text style={[styles.tdCell, { flex: 1, textAlign: 'center' }]}>
                      {item.unit.toUpperCase()}
                    </Text>
                    <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right' }]}>
                      {item.quantity.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.tdCellDone, { flex: 1.2, textAlign: 'right' }]}>
                      {item.completedQuantity.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right' }]}>
                      {item.ratePerUnit}
                    </Text>
                    <Text style={[styles.tdCellTotal, { flex: 1.6, textAlign: 'right' }]}>
                      {itemDoneVal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* BILL TOTALS SUMMARY */}
            <View style={styles.totalsBox}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>Gross Cumulative Work Executed to Date:</Text>
                <Text style={styles.totalLineVal}>₹{totalCompletedValue.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>Less: Prior Running Account Collections Received:</Text>
                <Text style={styles.totalLineValGreen}>
                  -₹{totalReceivedFromClient.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.totalLineDivider} />

              <View style={styles.grandTotalLine}>
                <Text style={styles.grandTotalLabel}>NET CURRENT BALANCE PAYABLE:</Text>
                <Text style={styles.grandTotalVal}>
                  ₹{balanceDue.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* TAX COMPLIANCE & VERIFICATION STAMP */}
            <View style={styles.verificationStampBox}>
              <View style={styles.stampHeader}>
                <ShieldCheckIcon size={16} color="#10B981" />
                <Text style={styles.stampTitle}>DIGITALLY VERIFIED BILL • SERVEX PRIME</Text>
              </View>
              <Text style={styles.stampDesc}>
                This digital measurement valuation is generated from verified daily work inspection logs under
                Class-1 Prime Contractor credentials.
              </Text>
            </View>

            {/* ACTION DISPATCH BUTTONS */}
            <View style={styles.dispatchActionsRow}>
              <Pressable style={styles.dispatchBtn} onPress={handleShareClient}>
                <ShareIcon size={15} color="#0B0E14" />
                <Text style={styles.dispatchBtnText}>Dispatch to Client ({project.clientName})</Text>
              </Pressable>
            </View>
          </ScrollView>
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
    backgroundColor: '#0E121B',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  topActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2638',
    backgroundColor: '#0E121B',
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  closeBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 12.5,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetHeaderTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 14,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  exportBtnText: {
    fontFamily: fonts.displayBold,
    color: '#0B0E14',
    fontSize: 11.5,
  },
  pdfPaperScrollView: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  pdfPaperContent: {
    padding: 16,
    paddingBottom: 40,
  },
  letterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 18,
    letterSpacing: 1.5,
  },
  primePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  primePillText: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 8,
  },
  brandTagline: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 8.5,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  licenseText: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 9.5,
    marginTop: 2,
  },
  invoiceMetaRight: {
    alignItems: 'flex-end',
  },
  docBadge: {
    backgroundColor: '#1E2638',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2D384E',
    marginBottom: 4,
  },
  docBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  invNumber: {
    fontFamily: fonts.mono,
    color: '#94A3B8',
    fontSize: 10,
  },
  invDate: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 10,
  },
  docDivider: {
    height: 1,
    backgroundColor: '#1E2638',
    marginVertical: 12,
  },
  particularsGrid: {
    flexDirection: 'row',
    backgroundColor: '#111622',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2638',
    marginBottom: 14,
    gap: 12,
  },
  partCol: {
    flex: 1,
  },
  partHeader: {
    fontFamily: fonts.displayBold,
    color: '#64748B',
    fontSize: 9,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  partClientName: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 13,
    marginBottom: 2,
  },
  partProjectName: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 13,
    marginBottom: 2,
  },
  partText: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 10.5,
    lineHeight: 14,
  },
  tableTitle: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  table: {
    backgroundColor: '#111622',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E2638',
    overflow: 'hidden',
    marginBottom: 14,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: '#161D2C',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2638',
  },
  thCell: {
    fontFamily: fonts.displayBold,
    color: '#94A3B8',
    fontSize: 9.5,
  },
  tdRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#161D2C',
    alignItems: 'center',
  },
  tdCell: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 10,
  },
  tdCellBold: {
    fontFamily: fonts.bodyMedium,
    color: '#F8FAFC',
    fontSize: 10.5,
  },
  tdCellDone: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 10.5,
  },
  tdCellTotal: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 10.5,
  },
  totalsBox: {
    backgroundColor: '#111622',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2638',
    marginBottom: 14,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLineLabel: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 11,
  },
  totalLineVal: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 12,
  },
  totalLineValGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 12,
  },
  totalLineDivider: {
    height: 1,
    backgroundColor: '#1E2638',
    marginVertical: 8,
  },
  grandTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontFamily: fonts.displayBold,
    color: '#F8FAFC',
    fontSize: 11.5,
    letterSpacing: 0.5,
  },
  grandTotalVal: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 16,
  },
  verificationStampBox: {
    backgroundColor: '#0E121B',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2638',
    marginBottom: 16,
  },
  stampHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  stampTitle: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  stampDesc: {
    fontFamily: fonts.body,
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
  },
  dispatchActionsRow: {
    gap: 10,
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  dispatchBtnText: {
    fontFamily: fonts.displayBold,
    color: '#0B0E14',
    fontSize: 12.5,
  },
});
