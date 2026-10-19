import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to list all valid workdays (Senin s/d Jumat) for a given month and year
function getWorkdaysInMonth(year: number, month: number) {
  const workdays: { dateStr: string; dayName: string; dayNumber: number }[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const yyyy = year.toString();
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      workdays.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayName: dayNamesIndo[dayOfWeek],
        dayNumber: day,
      });
    }
  }
  return workdays;
}

// Fallback generator when Gemini API is unavailable or quota is exceeded
function generateFallbackTickets(
  year: number,
  month: number,
  count: number,
  categoryFilter?: string,
  institutionContext?: string,
  technician?: string,
  customTopic?: string
) {
  const workdays = getWorkdaysInMonth(year, month);
  if (workdays.length === 0) return [];

  const defaultTechnicians = [
    'Ahmad Fauzi (Senior IT Support)',
    'Rian Hidayat (Network Engineer)',
    'Dewi Lestari (Systems & Apps Analyst)',
    'Bambang S. (Hardware Specialist)',
    'Fajar Nugroho (Helpdesk Technician)',
    'Siti Rahmawati (Infrastructure Support)',
  ];

  const assignedTech = technician && technician !== 'Otomatis' && technician !== 'Semua' ? technician : null;

  const sampleDataPool = [
    {
      category: 'Jaringan & Internet',
      title: customTopic ? `[${customTopic}] Gangguan Konektivitas & Switch Jaringan` : 'Koneksi LAN terputus di Lantai 2',
      desc: customTopic ? `Gangguan terkait topik ${customTopic}. Beberapa perangkat tidak dapat mengakses gateway utama.` : 'Beberapa PC di Divisi Keuangan tidak mendapatkan IP Address dari DHCP server. Terdapat tanda seru kuning pada indikator koneksi jaringan.',
      rootCause: 'Kabel patch UTP di port 18 switch rack mengalami kerusakan crimping RJ-45 dan lease time DHCP pool overload.',
      actionTaken: 'Melakukan recrimping konektor RJ-45 Cat6, penggantian patch cord, dan me-restart switch port serta flush DNS client.',
      preventiveAction: 'Pemeriksaan rutin kabel patch pada patch panel dan penyesuaian lease time DHCP pada router gateway.',
      durationMinutes: 45,
      priority: 'Tinggi',
    },
    {
      category: 'Hardware & Komputer',
      title: customTopic ? `[${customTopic}] Kerusakan Hardware & Memori PC` : 'Komputer Kasir / Administrasi Blue Screen (BSOD)',
      desc: customTopic ? `Insiden pada hardware terkait fokus ${customTopic}. Workstation crash berulang.` : 'PC workstation admin mendadak restart sendiri dengan error Stop Code: MEMORY_MANAGEMENT saat membuka aplikasi e-Katalog.',
      rootCause: 'Keping modul RAM DDR4 slot 2 kotor oleh debu dan salah satu pin mengalami korosi ringan.',
      actionTaken: 'Membersihkan pin RAM dengan contact cleaner, memindahkan ke slot alternatif, dan melakukan stress test memtest86 1 pass.',
      preventiveAction: 'Jadwal preventive maintenance pembersihan fisik hardware workstation setiap 3 bulan sekali.',
      durationMinutes: 60,
      priority: 'Sedang',
    },
    {
      category: 'Sistem & Aplikasi',
      title: customTopic ? `[${customTopic}] Error Modul Aplikasi & Database Timeout` : 'Aplikasi SIM-Kepegawaian Gagal Generate Laporan Bulanan',
      desc: customTopic ? `Kendala akses sistem terkait topik ${customTopic}. Pengguna tidak dapat memproses data transaksi.` : 'Saat klik cetak rekap kehadiran dan tunjangan, muncul error 500 Internal Server Error: Database Connection Timeout.',
      rootCause: 'Tabel log audit transaksi mengalami bloating (melebihi 4GB) dan indexing query pada database PostgreSQL perlu di-vacuum.',
      actionTaken: 'Melakukan re-indexing tabel terkait, VACUUM ANALYZE pada database server, dan menaikkan timeout query limit menjadi 60 detik.',
      preventiveAction: 'Mengaktifkan cron job partisi tabel log audit dan backup berkala mingguan.',
      durationMinutes: 90,
      priority: 'Tinggi',
    },
    {
      category: 'Printer & Scanner',
      title: customTopic ? `[${customTopic}] Masalah Pencetakan & Spooler Dokumen` : 'Printer Jaringan HP LaserJet Paper Jam & Spooler Hang',
      desc: customTopic ? `Kendala perangkat cetak seputar ${customTopic}. Antrian cetak menumpuk.` : 'Antrian cetak dokumen SK menumpuk 15 dokumen. Printer berkedip error code 13.00.00 paper jam padahal baki kertas sudah bersih.',
      rootCause: 'Roller penarik kertas (pickup roller) sudah aus dan sensor optical paper feed terhalang serpihan kertas sobek kecil.',
      actionTaken: 'Membongkar cover belakang, membersihkan sensor optical menggunakan alkohol isopropil, membersihkan pickup roller karet, dan me-restart print spooler service.',
      preventiveAction: 'Penggantian roller kit printer pada masa servis berikutnya dan sosialisasi batas ketebalan kertas maksimal 80 gsm.',
      durationMinutes: 40,
      priority: 'Rendah',
    },
    {
      category: 'Akun & Akses Email',
      title: customTopic ? `[${customTopic}] Reset Kredensial & Sinkronisasi Akun` : 'Reset Password Akun Domain Active Directory & Email Terkunci',
      desc: customTopic ? `Permasalahan autentikasi terkait ${customTopic}. Akun tidak dapat digunakan untuk otorisasi.` : 'Pengguna salah memasukkan sandi lebih dari 5 kali sehingga akun terkunci secara otomatis oleh domain security policy.',
      rootCause: 'Account lockout threshold terpicu karena pengguna baru saja mengganti password di HP tetapi Outlook masih mencoba login dengan sandi lama.',
      actionTaken: 'Membuka kunci akun di Active Directory Users and Computers (ADUC), set temporary password, dan update kredensial di aplikasi email smartphone user.',
      preventiveAction: 'Edukasi pengguna untuk segera mengupdate password baru di semua perangkat mobile sesaat setelah update sandi domain.',
      durationMinutes: 20,
      priority: 'Rendah',
    },
    {
      category: 'Keamanan Siber & Antivirus',
      title: customTopic ? `[${customTopic}] Peringatan Keamanan & Isolasi Endpoint` : 'Notifikasi Deteksi Trojan Malware di Folder Downloads',
      desc: customTopic ? `Deteksi anomali keamanan siber seputar ${customTopic}.` : 'Antivirus EDR Endpoint memberi peringatan ada file terindikasi trojan downloader berekstensi .exe yang diunduh dari lampiran email mencurigakan.',
      rootCause: 'Pengguna menerima email spear-phishing menyamar sebagai tagihan vendor (invoice.pdf.exe) dan mengunduh filenya.',
      actionTaken: 'Segera mengisolasi perangkat dari subnet LAN via console EDR, menghapus file jahat, full scanning malware, dan blokir domain pengirim di firewall email gateway.',
      preventiveAction: 'Pemberian peringatan banner eksternal pada email server dan pengingat security awareness berkala.',
      durationMinutes: 75,
      priority: 'Kritis',
    },
  ];

  // Pick workdays evenly distributed
  const step = Math.max(1, Math.floor(workdays.length / count));
  const selectedDays = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.min((i * step) % workdays.length, workdays.length - 1);
    selectedDays.push(workdays[idx]);
  }
  selectedDays.sort((a, b) => a.dayNumber - b.dayNumber);

  const departments = ['Kepegawaian', 'Keuangan & Akuntansi', 'Sekretariat', 'Perencanaan & Program', 'Pelayanan Publik', 'Hukum & Organisasi', 'Logistik & Umum'];
  const reporters = ['Hendro Wibowo', 'Nur Halimah', 'Rizky Pratama', 'Sri Wahyuni', 'Agus Budiman', 'Mega Putri', 'Dodi Kurniawan', 'Dewi Anggraini'];

  const results = [];
  for (let i = 0; i < count; i++) {
    const day = selectedDays[i] || workdays[i % workdays.length];
    const sample = sampleDataPool[i % sampleDataPool.length];
    const hours = 8 + (i % 8);
    const mins = (i * 17) % 60;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} WIB`;
    const ticketNum = `TKT-${year}${String(month).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`;
    const dur = sample.durationMinutes;
    const durFormatted = dur >= 60 ? `${Math.floor(dur / 60)} Jam ${dur % 60 ? (dur % 60) + ' Menit' : ''}`.trim() : `${dur} Menit`;

    results.push({
      id: `ticket-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      ticketNumber: ticketNum,
      date: day.dateStr,
      dayName: day.dayName,
      time: timeStr,
      reporterName: reporters[i % reporters.length],
      reporterDept: departments[i % departments.length],
      category: categoryFilter && categoryFilter !== 'Semua' ? categoryFilter : sample.category,
      priority: sample.priority,
      problemTitle: sample.title,
      problemDescription: sample.desc,
      technicianName: assignedTech || defaultTechnicians[i % defaultTechnicians.length],
      durationMinutes: dur,
      durationFormatted: durFormatted,
      rootCause: sample.rootCause,
      actionTaken: sample.actionTaken,
      preventiveAction: sample.preventiveAction,
      status: i === count - 1 ? 'Dalam Proses' : 'Selesai',
      resolutionDate: `${day.dateStr} ${String(hours + Math.ceil(dur / 60)).padStart(2, '0')}:${String(mins).padStart(2, '0')} WIB`,
      institutionContext: institutionContext || 'Unit Kerja TI',
    });
  }

  return results;
}

// --- Persistent Ticket Storage in JSON File (data/tickets.json) ---
const TICKETS_FILE_PATH = path.resolve(__dirname, 'data', 'tickets.json');

function loadTickets(): any[] {
  try {
    if (!fs.existsSync(TICKETS_FILE_PATH)) {
      const dir = path.dirname(TICKETS_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(TICKETS_FILE_PATH, '[]', 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(TICKETS_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading tickets from json:', err);
    return [];
  }
}

function saveTickets(tickets: any[]): boolean {
  try {
    const dir = path.dirname(TICKETS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TICKETS_FILE_PATH, JSON.stringify(tickets, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving tickets to json:', err);
    return false;
  }
}

// API: Get tickets (optionally filtered by year & month)
app.get('/api/tickets', (req: Request, res: Response) => {
  const { year, month } = req.query;
  const allTickets = loadTickets();

  if (year) {
    if (month && month !== 'all' && month !== '0') {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      const filtered = allTickets.filter((t: any) => t.date && t.date.startsWith(prefix));
      return res.json({ tickets: filtered });
    } else {
      // Return all months for the selected year
      const prefix = `${year}-`;
      const filtered = allTickets.filter((t: any) => t.date && t.date.startsWith(prefix));
      return res.json({ tickets: filtered });
    }
  }

  res.json({ tickets: allTickets });
});

// API: Create new ticket manually (appends to data/tickets.json)
app.post('/api/tickets', (req: Request, res: Response) => {
  const newTicket = req.body;
  if (!newTicket || !newTicket.ticketNumber || !newTicket.problemTitle) {
    return res.status(400).json({ error: 'Data tiket tidak lengkap.' });
  }

  const allTickets = loadTickets();
  // Ensure unique ID
  const ticketToSave = {
    ...newTicket,
    id: newTicket.id || `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };

  const updatedTickets = [ticketToSave, ...allTickets];
  saveTickets(updatedTickets);

  return res.status(201).json({
    message: 'Tiket berhasil disimpan ke dalam data/tickets.json',
    ticket: ticketToSave,
  });
});

// API: Update existing ticket in data/tickets.json
app.put('/api/tickets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedData = req.body;

  const allTickets = loadTickets();
  const index = allTickets.findIndex((t: any) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Tiket tidak ditemukan.' });
  }

  allTickets[index] = {
    ...allTickets[index],
    ...updatedData,
  };
  saveTickets(allTickets);

  return res.json({
    message: 'Tiket berhasil diperbarui di data/tickets.json',
    ticket: allTickets[index],
  });
});

// API: Delete ticket from data/tickets.json
app.delete('/api/tickets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const allTickets = loadTickets();
  const exists = allTickets.some((t: any) => t.id === id);

  if (!exists) {
    return res.status(404).json({ error: 'Tiket tidak ditemukan.' });
  }

  const remaining = allTickets.filter((t: any) => t.id !== id);
  saveTickets(remaining);

  return res.json({ message: 'Tiket berhasil dihapus dari data/tickets.json' });
});

// API: Generate Tickets for a Month & Year with workdays only
app.post('/api/generate-tickets', async (req: Request, res: Response) => {
  try {
    const {
      year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
      count = 5,
      categoryFilter = 'Semua',
      institutionContext = 'Divisi Teknologi Informasi & Helpdesk',
      customTopic = '',
      technician = '',
    } = req.body;

    const numYear = Number(year);
    const numMonth = Number(month);
    const numCount = Math.min(Math.max(Number(count) || 5, 1), 50);

    const workdays = getWorkdaysInMonth(numYear, numMonth);
    if (workdays.length === 0) {
      return res.status(400).json({ error: 'Tidak ada hari kerja pada bulan yang dipilih.' });
    }

    // If Gemini AI is not initialized, use fallback
    if (!ai) {
      console.log('Gemini API key not found, generating high quality template tickets...');
      const fallbackTickets = generateFallbackTickets(numYear, numMonth, numCount, categoryFilter, institutionContext, technician, customTopic);
      return res.json({ tickets: fallbackTickets, source: 'fallback' });
    }

    const availableWorkdaysList = workdays.map((w) => `${w.dateStr} (${w.dayName})`).join(', ');

    const prompt = `Anda adalah seorang Senior Helpdesk Manager dan IT Incident Handling Specialist.
Tugas Anda adalah men-generate data rekapitulasi ${numCount} tiket aduan helpdesk dan penanganan gangguan IT resmi untuk:
- Bulan: ${numMonth}
- Tahun: ${numYear}
- Instansi / Lingkungan: ${institutionContext}
${categoryFilter !== 'Semua' ? `- Fokus Kategori: ${categoryFilter}` : '- Beragam kategori (Jaringan & Internet, Hardware & Komputer, Sistem & Aplikasi, Printer & Scanner, Akun & Akses Email, Keamanan Siber & Antivirus)'}
${customTopic ? `- Topik Utama / Fokus Skenario Masalah: Seluruh aduan atau tiket harus bertema / berfokus seputar "${customTopic}". Buatlah variasi kasus gangguan yang realistis seputar topik ini!` : ''}
${technician && technician !== 'Otomatis' && technician !== 'Semua' ? `- Teknisi Penanggung Jawab: Seluruh tiket ini harus ditugaskan kepada teknisi: "${technician}".` : '- Teknisi Penanggung Jawab: Berikan nama teknisi IT profesional yang bervariasi.'}

ATURAN WAJIB DAN KETAT:
1. HANYA GUNAKAN HARI KERJA (Senin sampai Jumat). DILARANG KERAS menggunakan hari Sabtu atau Minggu.
   Pilihlah tanggal dari daftar hari kerja resmi bulan ini berikut: [ ${availableWorkdaysList} ].
2. Distribusikan ${numCount} tiket secara merata dan kronologis dari awal bulan hingga akhir bulan pada hari-hari kerja tersebut.
3. Berikan analisis teknis yang tajam, realistis, dan berbobot teknis:
   - Root cause (akar masalah sesungguhnya)
   - Solusi teknis konkret (perintah command, konfigurasi, penggantian komponen, optimasi, SOP)
   - Tindakan pencegahan (preventive action) agar tidak terulang
4. Waktu kejadian dalam jam kerja kantor (antara 07:30 WIB s/d 16:30 WIB).
5. Format nomor tiket: TKT-${numYear}${String(numMonth).padStart(2, '0')}-XXX (misal: TKT-${numYear}${String(numMonth).padStart(2, '0')}-001).
6. Prioritas bisa 'Rendah', 'Sedang', 'Tinggi', atau 'Kritis'.
7. Status: sebagian besar 'Selesai', boleh ada 1 yang 'Dalam Proses' atau 'Eskalasi Vendor'.
8. Bahasa Indonesia yang baku, profesional, dan lazim digunakan di instansi/perusahaan IT di Indonesia.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Anda adalah sistem pencatatan insiden IT Helpdesk profesional. Hasilkan data JSON valid sesuai schema yang diminta.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'Daftar tiket gangguan IT Helpdesk',
          items: {
            type: Type.OBJECT,
            properties: {
              ticketNumber: { type: Type.STRING },
              date: { type: Type.STRING, description: 'Format YYYY-MM-DD (Hanya Senin-Jumat)' },
              dayName: { type: Type.STRING, description: 'Senin / Selasa / Rabu / Kamis / Jumat' },
              time: { type: Type.STRING, description: 'Format HH:mm WIB' },
              reporterName: { type: Type.STRING },
              reporterDept: { type: Type.STRING },
              category: { type: Type.STRING },
              priority: { type: Type.STRING, description: 'Rendah | Sedang | Tinggi | Kritis' },
              problemTitle: { type: Type.STRING },
              problemDescription: { type: Type.STRING },
              technicianName: { type: Type.STRING },
              durationMinutes: { type: Type.INTEGER },
              durationFormatted: { type: Type.STRING },
              rootCause: { type: Type.STRING },
              actionTaken: { type: Type.STRING },
              preventiveAction: { type: Type.STRING },
              status: { type: Type.STRING, description: 'Selesai | Dalam Proses | Eskalasi Vendor' },
              resolutionDate: { type: Type.STRING },
            },
            required: [
              'ticketNumber',
              'date',
              'dayName',
              'time',
              'reporterName',
              'reporterDept',
              'category',
              'priority',
              'problemTitle',
              'problemDescription',
              'technicianName',
              'durationMinutes',
              'durationFormatted',
              'rootCause',
              'actionTaken',
              'preventiveAction',
              'status',
            ],
          },
        },
      },
    });

    const text = response.text?.trim() || '[]';
    let rawTickets: any[] = [];
    try {
      rawTickets = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse AI response JSON:', text);
      const fallback = generateFallbackTickets(numYear, numMonth, numCount, categoryFilter, institutionContext);
      return res.json({ tickets: fallback, source: 'fallback_parse_error' });
    }

    // Post-process to ensure IDs and ensure workdays constraint is preserved
    const validDaySet = new Set(workdays.map((w) => w.dateStr));
    const processedTickets = rawTickets.map((t, idx) => {
      // Validate date is actually a workday
      let assignedDate = t.date;
      let assignedDayName = t.dayName;
      if (!validDaySet.has(assignedDate)) {
        const fallbackWorkday = workdays[idx % workdays.length];
        assignedDate = fallbackWorkday.dateStr;
        assignedDayName = fallbackWorkday.dayName;
      }

      return {
        id: `tkt-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        ticketNumber: t.ticketNumber || `TKT-${numYear}${String(numMonth).padStart(2, '0')}-${String(idx + 1).padStart(3, '0')}`,
        date: assignedDate,
        dayName: assignedDayName,
        time: t.time || '09:00 WIB',
        reporterName: t.reporterName || 'Staf Internal',
        reporterDept: t.reporterDept || 'Bagian Umum',
        category: t.category || 'Jaringan & Internet',
        priority: t.priority || 'Sedang',
        problemTitle: t.problemTitle || 'Gangguan Layanan IT',
        problemDescription: t.problemDescription || '',
        technicianName: (technician && technician !== 'Otomatis' && technician !== 'Semua') ? technician : (t.technicianName || 'Tim Support IT'),
        durationMinutes: t.durationMinutes || 45,
        durationFormatted: t.durationFormatted || `${t.durationMinutes || 45} Menit`,
        rootCause: t.rootCause || 'Sedang diinvestigasi',
        actionTaken: t.actionTaken || 'Penanganan teknis standar',
        preventiveAction: t.preventiveAction || 'Monitoring berkala',
        status: t.status || 'Selesai',
        resolutionDate: t.resolutionDate || `${assignedDate} 11:30 WIB`,
        institutionContext,
      };
    });

    // Ensure sorted chronologically by date
    processedTickets.sort((a, b) => a.date.localeCompare(b.date));

    // Persist generated tickets into data/tickets.json
    try {
      const monthPrefix = `${numYear}-${String(numMonth).padStart(2, '0')}`;
      const existingTickets = loadTickets();
      const otherMonthsTickets = existingTickets.filter((t: any) => !t.date?.startsWith(monthPrefix));
      const allUpdatedTickets = [...otherMonthsTickets, ...processedTickets];
      saveTickets(allUpdatedTickets);
    } catch (saveErr) {
      console.error('Failed to save generated tickets to json:', saveErr);
    }

    return res.json({ tickets: processedTickets, source: 'gemini-ai' });
  } catch (error: any) {
    console.error('Error generating tickets via Gemini:', error);
    // Graceful fallback so app always functions smoothly
    const { year = 2026, month = 10, count = 5, categoryFilter, institutionContext, technician, customTopic } = req.body;
    const fallback = generateFallbackTickets(Number(year), Number(month), Number(count) || 5, categoryFilter, institutionContext, technician, customTopic);
    try {
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      const existingTickets = loadTickets();
      const otherMonthsTickets = existingTickets.filter((t: any) => !t.date?.startsWith(monthPrefix));
      const allUpdatedTickets = [...otherMonthsTickets, ...fallback];
      saveTickets(allUpdatedTickets);
    } catch (saveErr) {
      console.error('Failed to save fallback tickets to json:', saveErr);
    }
    return res.json({ tickets: fallback, source: 'fallback_error', errorMsg: error?.message });
  }
});

// API: Analyze an individual ticket description with AI
app.post('/api/analyze-ticket', async (req: Request, res: Response) => {
  try {
    const { problemTitle, problemDescription, category, priority } = req.body;

    if (!problemTitle && !problemDescription) {
      return res.status(400).json({ error: 'Judul atau deskripsi masalah harus diisi.' });
    }

    if (!ai) {
      // Offline fallback analysis
      return res.json({
        solusiTeknis: `1. Lakukan diagnosa konektivitas dan log sistem terkait ${category || 'gangguan'}.\n2. Verifikasi status servis background dan hak akses pengguna.\n3. Uji coba perbaikan di lingkungan staging sebelum restart layanan produksi.`,
        akarMasalah: `Ketidaksesuaian konfigurasi atau timeout pada service pendukung ${category}.`,
        tindakanPencegahan: 'Terapkan monitoring otomatis dan review berkala SOP operasional.',
        estimasiWaktu: '45 Menit',
        tingkatKesulitan: 'Menengah',
        rekomendasiEskalasi: 'Eskalasi ke Network/System Administrator jika tidak terselesaikan dalam 60 menit.',
        source: 'fallback',
      });
    }

    const prompt = `Sebagai seorang IT Incident Response Specialist & Senior Technical Architect, analisislah deskripsi aduan gangguan IT berikut dan berikan solusi teknis terstruktur secara otomatis.

Data Tiket Aduan:
- Judul Gangguan: ${problemTitle || '-'}
- Kategori: ${category || 'Umum'}
- Tingkat Urgensi: ${priority || 'Sedang'}
- Deskripsi Gangguan Lengkap: ${problemDescription || '-'}

Instruksi Output:
Berikan output terstruktur dalam bahasa Indonesia yang sangat praktis, siap dieksekusi oleh teknisi helpdesk:
1. Akar Masalah (Root cause hypothesis yang paling masuk akal secara teknis)
2. Solusi Teknis & Langkah Penanganan (Step-by-step teknis lengkap, termasuk perintah CLI/tool jika relevan)
3. Tindakan Pencegahan (Preventive Maintenance & SOP agar tidak berulang)
4. Estimasi Waktu Penyelesaian
5. Tingkat Kesulitan ('Mudah' / 'Menengah' / 'Kompleks')
6. Rekomendasi Eskalasi`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            akarMasalah: { type: Type.STRING },
            solusiTeknis: { type: Type.STRING },
            tindakanPencegahan: { type: Type.STRING },
            estimasiWaktu: { type: Type.STRING },
            tingkatKesulitan: { type: Type.STRING },
            rekomendasiEskalasi: { type: Type.STRING },
          },
          required: ['akarMasalah', 'solusiTeknis', 'tindakanPencegahan', 'estimasiWaktu', 'tingkatKesulitan'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ ...parsed, source: 'gemini-ai' });
  } catch (err: any) {
    console.error('Error in /api/analyze-ticket:', err);
    return res.status(500).json({
      error: 'Gagal menganalisis tiket via AI.',
      message: err.message,
    });
  }
});

// --- Static RBAC User Management stored in JSON file ---
const USERS_FILE_PATH = path.resolve(__dirname, 'data', 'users.json');

interface UserRecord {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'operator';
  createdAt: string;
}

function loadUsers(): UserRecord[] {
  try {
    if (!fs.existsSync(USERS_FILE_PATH)) {
      const dir = path.dirname(USERS_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const defaultUsers: UserRecord[] = [
        {
          id: 'usr-admin-1',
          username: 'admin',
          password: 'admin123',
          name: 'Administrator Utama',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'usr-op-1',
          username: 'operator',
          password: 'operator123',
          name: 'Petugas Helpdesk IT',
          role: 'operator',
          createdAt: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(defaultUsers, null, 2), 'utf-8');
      return defaultUsers;
    }
    const raw = fs.readFileSync(USERS_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading users:', err);
    return [];
  }
}

function saveUsers(users: UserRecord[]): boolean {
  try {
    const dir = path.dirname(USERS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving users:', err);
    return false;
  }
}

// API: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  const users = loadUsers();
  const matched = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );

  if (!matched) {
    return res.status(401).json({ error: 'Username atau password tidak sesuai.' });
  }

  // Return user info without password
  const { password: _, ...userInfo } = matched;
  return res.json({
    message: 'Login berhasil.',
    user: userInfo,
  });
});

// API: Get all users (for Admin)
app.get('/api/users', (_req: Request, res: Response) => {
  const users = loadUsers();
  const sanitized = users.map(({ password: _, ...rest }) => rest);
  res.json({ users: sanitized });
});

// API: Create new user (Admin only)
app.post('/api/users', (req: Request, res: Response) => {
  const { username, name, password, role } = req.body;

  if (!username || !name || !password || !role) {
    return res.status(400).json({ error: 'Seluruh kolom (username, nama, password, role) wajib diisi.' });
  }

  if (role !== 'admin' && role !== 'operator') {
    return res.status(400).json({ error: 'Role harus berupa admin atau operator.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const users = loadUsers();

  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: `Username "${username}" sudah digunakan.` });
  }

  const newUser: UserRecord = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    name: name.trim(),
    password: password.trim(),
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const { password: _, ...safeInfo } = newUser;
  return res.status(201).json({
    message: `User ${newUser.username} berhasil dibuat.`,
    user: safeInfo,
  });
});

// API: Update user (Admin only)
app.put('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, password, role } = req.body;

  const users = loadUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }

  if (role && role !== 'admin' && role !== 'operator') {
    return res.status(400).json({ error: 'Role harus berupa admin atau operator.' });
  }

  // Prevent demoting the last admin
  if (role && role !== 'admin' && users[index].role === 'admin') {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Tidak dapat mengubah role admin terakhir di sistem.' });
    }
  }

  if (name) users[index].name = name.trim();
  if (password) users[index].password = password.trim();
  if (role) users[index].role = role;

  saveUsers(users);

  const { password: _, ...safeInfo } = users[index];
  return res.json({
    message: 'User berhasil diperbarui.',
    user: safeInfo,
  });
});

// API: Delete user (Admin only)
app.delete('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const users = loadUsers();
  const target = users.find((u) => u.id === id);

  if (!target) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }

  if (target.role === 'admin') {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Tidak dapat menghapus admin terakhir pada sistem.' });
    }
  }

  const remaining = users.filter((u) => u.id !== id);
  saveUsers(remaining);

  return res.json({ message: `User ${target.username} berhasil dihapus.` });
});

// API: Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiAvailable: !!ai,
    time: new Date().toISOString(),
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Helpdesk IT running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
