export type PriorityLevel = "Rendah" | "Sedang" | "Tinggi" | "Kritis";
export type TicketStatus =
  | "Selesai"
  | "Dalam Proses"
  | "Eskalasi Vendor"
  | "Menunggu Part";

export interface HelpdeskTicket {
  id: string;
  ticketNumber: string;
  date: string; // YYYY-MM-DD (Senin - Jumat)
  dayName: string; // Senin, Selasa, Rabu, Kamis, Jumat
  time: string; // e.g. 09:15 WIB
  reporterName: string;
  reporterDept: string;
  category: string;
  priority: PriorityLevel;
  problemTitle: string;
  problemDescription: string;
  technicianName: string;
  durationMinutes: number;
  durationFormatted: string;
  rootCause: string;
  actionTaken: string;
  preventiveAction: string;
  status: TicketStatus;
  resolutionDate?: string;
  institutionContext?: string;
}

export interface ReportConfig {
  institutionName: string;
  departmentName: string;
  reportTitle: string;
  city: string;
  headName: string;
  headTitle: string;
  headNip?: string;
  technicianLeadName: string;
  technicianLeadTitle: string;
  technicianLeadNip?: string;
}

export interface GenerationParams {
  year: number;
  month: number;
  count: number;
  categoryFilter: string;
  institutionContext: string;
  customTopic?: string;
  technician?: string;
}

export interface ExportOptions {
  showReporter?: boolean;
}

export interface AIAnalysisResult {
  akarMasalah: string;
  solusiTeknis: string;
  tindakanPencegahan: string;
  estimasiWaktu: string;
  tingkatKesulitan: string;
  rekomendasiEskalasi?: string;
}

export type UserRole = "admin" | "operator" | "viewer";

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: "admin" | "operator";
  password?: string;
  createdAt: string;
}

export interface AuthState {
  user: UserAccount | null;
  role: UserRole;
  isAuthenticated: boolean;
}

//tambahan dani
export interface KopSurat {
  nama_instansi: string;
  unit_kerja: string;
  kota: string;
  nama_pimpinan: string;
  jabatan_pimpinan: string;
  nip?: string;
  nama_koordinator: string;
  jabatan_koordinator: string;
}
