import crypto from "crypto";

export function computeContentHash(data: {
  namaBeasiswa: string;
  penyelenggara: string;
  linkPendaftaran: string;
  deadline?: Date | null;
  skemaPembiayaan?: string;
}): string {
  const normalized = {
    namaBeasiswa: data.namaBeasiswa.trim().toLowerCase(),
    penyelenggara: data.penyelenggara.trim().toLowerCase(),
    linkPendaftaran: data.linkPendaftaran.trim().toLowerCase(),
    deadline: data.deadline?.toISOString() ?? null,
    skemaPembiayaan: (data.skemaPembiayaan ?? "").trim().toLowerCase(),
  };
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}
