import * as XLSX from 'xlsx';
import { HelpdeskTicket, ReportConfig, ExportOptions } from '../types';
import { INDO_MONTHS } from './dateUtils';

export function exportTicketsToExcel(
  tickets: HelpdeskTicket[],
  year: number,
  month: number,
  config: ReportConfig,
  options: ExportOptions = { showReporter: true }
) {
  const monthName = INDO_MONTHS[month - 1];
  const workbook = XLSX.utils.book_new();
  const showReporter = options.showReporter !== false;

  // 1. Build Header info
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter((t) => t.status === 'Selesai').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'Dalam Proses').length;
  const escalatedTickets = tickets.filter((t) => t.status === 'Eskalasi Vendor' || t.status === 'Menunggu Part').length;
  const totalMinutes = tickets.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  const avgMinutes = totalTickets > 0 ? Math.round(totalMinutes / totalTickets) : 0;
  const avgDurationStr = avgMinutes >= 60 ? `${Math.floor(avgMinutes / 60)} Jam ${avgMinutes % 60} Menit` : `${avgMinutes} Menit`;

  // Build Table Header dynamically based on showReporter
  const tableHeader = [
    'No',
    'No. Tiket',
    'Hari & Tanggal (Senin-Jumat)',
    'Jam Aduan',
    ...(showReporter ? ['Nama Pelapor', 'Divisi / Unit Kerja'] : []),
    'Kategori Gangguan',
    'Prioritas',
    'Judul Gangguan',
    'Deskripsi Keluhan',
    'Analisis Akar Masalah (Root Cause)',
    'Tindakan & Solusi Teknis',
    'Tindakan Pencegahan',
    'Teknisi Penanggung Jawab',
    'Durasi Penanganan',
    'Status Tiket',
    'Waktu Penyelesaian',
  ];

  const rows: any[][] = [
    [config.institutionName.toUpperCase()],
    [config.departmentName.toUpperCase()],
    ['LAPORAN REKAPITULASI TIKET ADUAN HELPDESK & PENANGANAN GANGGUAN IT'],
    [`Periode: ${monthName} ${year} (Hari Kerja: Senin s/d Jumat)`],
    [`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
    [],
    // KPI Summary
    ['RINGKASAN METRIK PELAYANAN HELPDESK:'],
    ['Total Tiket Aduan', totalTickets, '', 'Tiket Selesai', completedTickets],
    ['Tingkat Penyelesaian', totalTickets ? `${Math.round((completedTickets / totalTickets) * 100)}%` : '0%', '', 'Sedang Ditangani', inProgressTickets],
    ['Rata-rata Durasi Penanganan (MTTR)', avgDurationStr, '', 'Eskalasi / Tertunda', escalatedTickets],
    [],
    tableHeader,
  ];

  // 2. Data rows
  tickets.forEach((t, idx) => {
    const row = [
      idx + 1,
      t.ticketNumber,
      `${t.dayName}, ${t.date}`,
      t.time,
      ...(showReporter ? [t.reporterName, t.reporterDept] : []),
      t.category,
      t.priority,
      t.problemTitle,
      t.problemDescription,
      t.rootCause,
      t.actionTaken,
      t.preventiveAction,
      t.technicianName,
      t.durationFormatted || `${t.durationMinutes} Menit`,
      t.status,
      t.resolutionDate || '-',
    ];
    rows.push(row);
  });

  // 3. Signature block
  rows.push([]);
  rows.push([]);
  rows.push([
    '',
    '',
    '',
    'Mengetahui / Menyetujui:',
    '',
    '',
    '',
    '',
    '',
    '',
    `${config.city}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
  ]);
  rows.push([
    '',
    '',
    '',
    config.headTitle,
    '',
    '',
    '',
    '',
    '',
    '',
    config.technicianLeadTitle,
  ]);
  rows.push([]);
  rows.push([]);
  rows.push([]);
  rows.push([
    '',
    '',
    '',
    `(${config.headName})`,
    '',
    '',
    '',
    '',
    '',
    '',
    `(${config.technicianLeadName})`,
  ]);
  if (config.headNip || config.technicianLeadNip) {
    rows.push([
      '',
      '',
      '',
      config.headNip ? `NIP: ${config.headNip}` : '',
      '',
      '',
      '',
      '',
      '',
      '',
      config.technicianLeadNip ? `NIP: ${config.technicianLeadNip}` : '',
    ]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths dynamically
  const colWidths = [
    { wch: 5 },  // No
    { wch: 18 }, // No Tiket
    { wch: 22 }, // Hari & Tanggal
    { wch: 12 }, // Jam
    ...(showReporter ? [{ wch: 18 }, { wch: 22 }] : []), // Pelapor, Divisi
    { wch: 24 }, // Kategori
    { wch: 12 }, // Prioritas
    { wch: 30 }, // Judul
    { wch: 45 }, // Deskripsi
    { wch: 45 }, // Root cause
    { wch: 50 }, // Tindakan
    { wch: 40 }, // Pencegahan
    { wch: 25 }, // Teknisi
    { wch: 16 }, // Durasi
    { wch: 15 }, // Status
    { wch: 22 }, // Waktu Selesai
  ];
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap Helpdesk ${monthName}`);

  const fileName = `Rekap_Tiket_Helpdesk_${monthName}_${year}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
