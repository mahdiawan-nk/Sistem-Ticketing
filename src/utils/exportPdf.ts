import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HelpdeskTicket, ReportConfig, ExportOptions } from '../types';
import { INDO_MONTHS } from './dateUtils';

export function exportTicketsToPdf(
  tickets: HelpdeskTicket[],
  year: number,
  month: number,
  config: ReportConfig,
  options: ExportOptions = { showReporter: true }
) {
  const monthName = month === 0 ? 'Semua Bulan (Tahunan)' : INDO_MONTHS[month - 1];
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const showReporter = options.showReporter !== false;

  // 1. Header (Kop Dokumen)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(config.institutionName.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(config.departmentName.toUpperCase(), pageWidth / 2, 19, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN REKAPITULASI TIKET ADUAN HELPDESK & PENANGANAN GANGGUAN', pageWidth / 2, 26, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const periodText =
    month === 0
      ? `Periode: Tahun ${year} (Rekapitulasi Semua Bulan)  |  Klasifikasi Waktu: Hari Kerja (Senin - Jumat)  |  Total: ${tickets.length} Tiket`
      : `Periode: ${monthName} ${year}  |  Klasifikasi Waktu: Hari Kerja (Senin - Jumat)  |  Total: ${tickets.length} Tiket`;
  doc.text(periodText, pageWidth / 2, 31, { align: 'center' });

  // Decorative divider line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.6);
  doc.line(14, 34, pageWidth - 14, 34);

  // 2. KPI Summary Boxes in PDF
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter((t) => t.status === 'Selesai').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'Dalam Proses').length;
  const totalMinutes = tickets.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  const avgMinutes = totalTickets > 0 ? Math.round(totalMinutes / totalTickets) : 0;
  const avgDurationStr = avgMinutes >= 60 ? `${Math.floor(avgMinutes / 60)} Jam ${avgMinutes % 60}m` : `${avgMinutes} Menit`;

  doc.setFontSize(8);
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, 37, pageWidth - 28, 10, 2, 2, 'F');

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Aduan: ${totalTickets}`, 20, 43.5);
  doc.text(`Terselesaikan: ${completedTickets} (${totalTickets ? Math.round((completedTickets / totalTickets) * 100) : 0}%)`, 75, 43.5);
  doc.text(`Sedang Ditangani: ${inProgressTickets}`, 145, 43.5);
  doc.text(`Rata-rata Waktu Penanganan (MTTR): ${avgDurationStr}`, 205, 43.5);

  // 3. Build Table Data dynamically
  const tableHead = [
    [
      'No',
      'No. Tiket',
      'Hari, Tanggal & Jam',
      ...(showReporter ? ['Pelapor & Unit'] : []),
      'Kategori & Prioritas',
      'Keluhan & Akar Masalah',
      'Solusi & Tindakan Teknis',
      'Teknisi & Durasi',
      'Status',
    ],
  ];

  const tableBody = tickets.map((t, idx) => {
    const row = [
      (idx + 1).toString(),
      t.ticketNumber,
      `${t.dayName}\n${t.date}\n${t.time}`,
      ...(showReporter ? [`${t.reporterName}\n(${t.reporterDept})`] : []),
      `${t.category}\n[${t.priority}]`,
      `Keluhan: ${t.problemTitle}\n\nAkar Masalah:\n${t.rootCause}`,
      `Tindakan:\n${t.actionTaken}\n\nPencegahan:\n${t.preventiveAction}`,
      `${t.technicianName}\n(${t.durationFormatted || `${t.durationMinutes}m`})`,
      t.status,
    ];
    return row;
  });

  // Dynamic column styles based on whether Reporter column is shown
  const columnStyles: Record<string, any> = showReporter
    ? {
        0: { cellWidth: 10, halign: 'center' as const }, // No
        1: { cellWidth: 24, fontStyle: 'bold' as const, halign: 'center' as const }, // No Tiket
        2: { cellWidth: 26, halign: 'center' as const }, // Hari, Tgl
        3: { cellWidth: 28 }, // Pelapor
        4: { cellWidth: 28 }, // Kategori
        5: { cellWidth: 55 }, // Gangguan & Root Cause
        6: { cellWidth: 58 }, // Solusi & Tindakan
        7: { cellWidth: 25 }, // Teknisi
        8: { cellWidth: 15, halign: 'center' as const, fontStyle: 'bold' as const }, // Status
      }
    : {
        0: { cellWidth: 10, halign: 'center' as const }, // No
        1: { cellWidth: 25, fontStyle: 'bold' as const, halign: 'center' as const }, // No Tiket
        2: { cellWidth: 28, halign: 'center' as const }, // Hari, Tgl
        3: { cellWidth: 30 }, // Kategori
        4: { cellWidth: 70 }, // Gangguan & Root Cause
        5: { cellWidth: 74 }, // Solusi & Tindakan
        6: { cellWidth: 26 }, // Teknisi
        7: { cellWidth: 16, halign: 'center' as const, fontStyle: 'bold' as const }, // Status
      };

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 50,
    margin: { left: 14, right: 14, bottom: 35 },
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 58, 138], // Indigo-900 / Navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    columnStyles,
    didDrawPage: (data) => {
      // Header on subsequent pages
      if (data.pageNumber > 1) {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Laporan Rekapitulasi Tiket Helpdesk IT - ${monthName} ${year}`,
          14,
          10
        );
      }
      // Footer page number
      const str = `Halaman ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 14, pageHeight - 8, { align: 'right' });
      doc.text(
        `Dokumen Resmi Sistem Helpdesk IT | Hanya Hari Kerja (Senin - Jumat)`,
        14,
        pageHeight - 8
      );
    },
  });

  // 4. Signatures on the last page
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  let signatureY = finalY + 12;

  // If near page bottom, add new page for signature block
  if (signatureY + 35 > pageHeight) {
    doc.addPage();
    signatureY = 25;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const leftSignX = 40;
  const rightSignX = pageWidth - 70;

  doc.text('Mengetahui / Menyetujui,', leftSignX, signatureY, { align: 'center' });
  doc.text(config.headTitle, leftSignX, signatureY + 4.5, { align: 'center' });

  doc.text(
    `${config.city}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    rightSignX,
    signatureY,
    { align: 'center' }
  );
  doc.text(config.technicianLeadTitle, rightSignX, signatureY + 4.5, { align: 'center' });

  // Signature line spacing
  const nameY = signatureY + 24;

  doc.setFont('helvetica', 'bold');
  doc.text(`(${config.headName})`, leftSignX, nameY, { align: 'center' });
  doc.text(`(${config.technicianLeadName})`, rightSignX, nameY, { align: 'center' });

  if (config.headNip || config.technicianLeadNip) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    if (config.headNip) {
      doc.text(`NIP. ${config.headNip}`, leftSignX, nameY + 4.5, { align: 'center' });
    }
    if (config.technicianLeadNip) {
      doc.text(`NIP. ${config.technicianLeadNip}`, rightSignX, nameY + 4.5, { align: 'center' });
    }
  }

  // Save the PDF
  const filename = `Laporan_Rekapitulasi_Helpdesk_${monthName}_${year}.pdf`;
  doc.save(filename);
}
