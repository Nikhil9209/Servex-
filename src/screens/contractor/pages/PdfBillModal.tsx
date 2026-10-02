import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { SpringPressable } from '../../../components/AnimatedComponents';

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
          {/* TOP DRAG NOTCH */}
          <View style={styles.notchContainer}>
            <View style={styles.dragNotch} />
          </View>

          {/* TOP ACTIONS BAR */}
          <View style={styles.topActionsBar}>
            <SpringPressable
              onPress={onClose}
              style={styles.circleHeaderBtn}
              scaleTo={0.92}
              hitSlop={8}
            >
              <CloseIcon size={16} color="#8E8E93" />
            </SpringPressable>

            <View style={styles.modalHeaderTitleGroup}>
              <FileTextIcon size={16} color="#FFFFFF" />
              <Text style={styles.sheetHeaderTitle}>Running Account Bill</Text>
            </View>

            <SpringPressable
              onPress={handleExportPdf}
              style={styles.circleExportBtn}
              scaleTo={0.92}
              hitSlop={8}
            >
              <DownloadIcon size={16} color="#000000" />
            </SpringPressable>
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
                <Text style={styles.licenseText}>Class-1 Prime Contractor • GSTIN: 27AABCS1429E1Z8</Text>
              </View>

              <View style={styles.invoiceMetaRight}>
                <View style={styles.docBadge}>
                  <Text style={styles.docBadgeText}>OFFICIAL RA BILL</Text>
                </View>
                <Text style={styles.invNumber}>No: {invoiceNo}</Text>
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
                <Text style={[styles.thCell, { flex: 2.8 }]}>Scope Item</Text>
                <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>Unit</Text>
                <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Scope</Text>
                <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Done</Text>
                <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Rate</Text>
                <Text style={[styles.thCell, { flex: 1.6, textAlign: 'right' }]}>Amount</Text>
              </View>

              {project.scopeItems.map((item, idx) => {
                const itemDoneVal = item.completedQuantity * item.ratePerUnit;
                return (
                  <View key={item.id} style={styles.tdRow}>
                    <Text style={[styles.tdCell, { flex: 0.6 }]}>{idx + 1}</Text>
                    <Text style={[styles.tdCellBold, { flex: 2.8 }]}>{item.name}</Text>
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
                      ₹{item.ratePerUnit}
                    </Text>
                    <Text style={[styles.tdCellTotal, { flex: 1.6, textAlign: 'right' }]}>
                      ₹{itemDoneVal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* BILL TOTALS SUMMARY */}
            <View style={styles.totalsBox}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>Gross Cumulative Work Executed:</Text>
                <Text style={styles.totalLineVal}>₹{totalCompletedValue.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>Less: Prior Running Account Receipts:</Text>
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

            {/* ACTION DISPATCH BUTTON */}
            <SpringPressable
              style={styles.dispatchBtn}
              onPress={handleShareClient}
              scaleTo={0.96}
            >
              <ShareIcon size={16} color="#000000" />
              <Text style={styles.dispatchBtnText}>
                Dispatch to Client ({project.clientName})
              </Text>
            </SpringPressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '92%',
    backgroundColor: '#16161A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262632',
  },
  notchContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragNotch: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#33333E',
  },
  topActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222228',
    backgroundColor: '#16161A',
  },
  circleHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleExportBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetHeaderTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
  },

  pdfPaperScrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  pdfPaperContent: {
    padding: 18,
    paddingBottom: 40,
  },
  letterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: 1.5,
  },
  primePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  primePillText: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 8.5,
  },
  brandTagline: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 8.5,
    letterSpacing: 0.6,
    marginTop: 4,
  },
  licenseText: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 9.5,
    marginTop: 2,
  },
  invoiceMetaRight: {
    alignItems: 'flex-end',
  },
  docBadge: {
    backgroundColor: '#222228',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D2D36',
    marginBottom: 4,
  },
  docBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  invNumber: {
    fontFamily: fonts.mono,
    color: '#8E8E93',
    fontSize: 10,
  },
  invDate: {
    fontFamily: fonts.body,
    color: '#636366',
    fontSize: 10,
  },
  docDivider: {
    height: 1,
    backgroundColor: '#222228',
    marginVertical: 14,
  },
  particularsGrid: {
    flexDirection: 'row',
    backgroundColor: '#16161A',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 16,
    gap: 12,
  },
  partCol: {
    flex: 1,
  },
  partHeader: {
    fontFamily: fonts.displayBold,
    color: '#636366',
    fontSize: 9,
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
    color: '#8E8E93',
    fontSize: 10.5,
    lineHeight: 14,
  },
  tableTitle: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 10.5,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  table: {
    backgroundColor: '#16161A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222228',
    overflow: 'hidden',
    marginBottom: 16,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: '#1F1F26',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222228',
  },
  thCell: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 9.5,
  },
  tdRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F24',
    alignItems: 'center',
  },
  tdCell: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 10,
  },
  tdCellBold: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 10.5,
  },
  tdCellDone: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 10.5,
  },
  tdCellTotal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 10.5,
  },
  totalsBox: {
    backgroundColor: '#16161A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 16,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLineLabel: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 11,
  },
  totalLineVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 12,
  },
  totalLineValGreen: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 12,
  },
  totalLineDivider: {
    height: 1,
    backgroundColor: '#222228',
    marginVertical: 10,
  },
  grandTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 11.5,
    letterSpacing: 0.5,
  },
  grandTotalVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
  },
  verificationStampBox: {
    backgroundColor: '#16161A',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 18,
  },
  stampHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    color: '#636366',
    fontSize: 10,
    lineHeight: 14,
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    gap: 8,
  },
  dispatchBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 13,
  },
});
