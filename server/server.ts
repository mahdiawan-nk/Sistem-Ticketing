import express from "express";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import cors from "cors";

const app = express();
const PORT = 3001;
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

const filePath = path.resolve(process.cwd(), "data", "data-kop.json");

app.get("/api/kop-surat", async (_req, res) => {
  try {
    const content = await readFile(filePath, "utf-8");

    res.json(JSON.parse(content));
  } catch (error) {
    console.error("Gagal membaca users.json:", error);

    res.status(500).json({
      message: "Gagal membaca konfigurasi kop surat.",
    });
  }
});

app.put("/api/kop-surat", async (req, res) => {
  try {
    const data = req.body;

    const requiredFields = [
      "nama_instansi",
      "unit_kerja",
      "kota",
      "nama_pimpinan",
      "jabatan_pimpinan",
      "nama_koordinator",
      "jabatan_koordinator",
    ];

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      !requiredFields.every((field) => typeof data[field] === "string") ||
      (data.nip !== undefined && typeof data.nip !== "string")
    ) {
      return res.status(403).json({
        message: "Format data kop surat tidak valid.",
      });

      //   return;
    }

    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

    res.json({
      message: "Konfigurasi kop surat berhasil disimpan.",
    });
  } catch (error) {
    console.error("Gagal menyimpan users.json:", error);

    res.status(500).json({
      message: "Gagal menyimpan konfigurasi kop surat.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Express berjalan di http://localhost:${PORT}`);
});
