import { z } from "zod";

export const RawScholarshipSchema = z.object({
  namaBeasiswa: z.string().min(3).max(500),
  penyelenggara: z.string().min(2).max(300),
  lokasi: z.enum(["DALAM_NEGERI", "LUAR_NEGERI"]),
  pilihanLokasi: z.array(z.string()).default([]),
  skemaPembiayaan: z.string().min(1).max(200).default("Tidak diketahui"),
  jenisPembiayaan: z.string().min(1).max(200).default("Tidak diketahui"),
  komponenPembiayaan: z.array(z.string()).default([]),
  keterangan: z.string().max(10000).default(""),
  linkPendaftaran: z.string().url("URL pendaftaran tidak valid"),
  sumberCrawling: z.string().url("URL sumber crawling tidak valid"),
  deadline: z.date().nullable().optional(),
});

export type RawScholarship = z.infer<typeof RawScholarshipSchema>;

export const ScholarshipFilterSchema = z.object({
  lokasi: z.enum(["DALAM_NEGERI", "LUAR_NEGERI"]).optional(),
  skema: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export const ScholarshipCreateSchema = z.object({
  namaBeasiswa: z.string().min(3),
  penyelenggara: z.string().min(2),
  lokasi: z.enum(["DALAM_NEGERI", "LUAR_NEGERI"]),
  pilihanLokasi: z.array(z.string()),
  skemaPembiayaan: z.string().min(1),
  jenisPembiayaan: z.string().min(1),
  komponenPembiayaan: z.array(z.string()),
  keterangan: z.string(),
  linkPendaftaran: z.string().url(),
  deadline: z.string().datetime().nullable().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED"]).optional(),
});
