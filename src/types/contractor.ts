export type UnitType = 'sqft' | 'rft' | 'cft' | 'nos' | 'meter';

export interface ProjectScopeItem {
  id: string;
  name: string;
  unit: UnitType;
  quantity: number;
  ratePerUnit: number;
  totalAmount: number;
  completedQuantity: number;
}

export interface WorkerRecord {
  id: string;
  name: string;
  role: 'Mason' | 'Electrician' | 'Painter' | 'Helper' | 'Plumber' | 'Carpenter';
  dailyWage: number;
  phone: string;
}

export interface AttendanceEntry {
  workerId: string;
  workerName: string;
  role: string;
  dailyWage: number;
  date: string;
  status: 'present' | 'absent' | 'half_day';
  checkInTime: string;
  proofVerified: boolean;
  proofNote: string;
  wageCalculated: number;
}

export interface DailyWorkVerificationItem {
  scopeItemId: string;
  name: string;
  unit: UnitType;
  qtyDoneToday: number;
  ratePerUnit: number;
  totalValueToday: number;
}

export interface DailyWorkReport {
  id: string;
  date: string;
  verifiedBy: string;
  items: DailyWorkVerificationItem[];
  totalWorkValueToday: number;
  totalWorkerWageToday: number;
  contractorMarginToday: number;
  isVerified: boolean;
}

export interface ClientTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'received_from_client' | 'paid_to_worker';
  note: string;
  recipientOrPayer: string;
  referenceNo: string;
}

export interface ContractorProjectDetail {
  id: string;
  clientCode: string;
  projectName: string;
  clientName: string;
  clientPhone: string;
  siteAddress: string;
  startDate: string;
  status: 'active' | 'completed';
  scopeItems: ProjectScopeItem[];
  workers: WorkerRecord[];
  todayAttendance: AttendanceEntry[];
  dailyReports: DailyWorkReport[];
  transactions: ClientTransaction[];
}
