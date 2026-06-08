"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";

interface FormData {
  namaBeasiswa: string;
  penyelenggara: string;
  lokasi: "DALAM_NEGERI" | "LUAR_NEGERI";
  pilihanLokasi: string[];
  skemaPembiayaan: string;
  jenisPembiayaan: string;
  komponenPembiayaan: string[];
  keterangan: string;
  linkPendaftaran: string;
  deadline: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED";
}

const DEFAULT: FormData = {
  namaBeasiswa: "", penyelenggara: "", lokasi: "LUAR_NEGERI",
  pilihanLokasi: [], skemaPembiayaan: "Fully Funded", jenisPembiayaan: "Beasiswa Penuh",
  komponenPembiayaan: [], keterangan: "", linkPendaftaran: "", deadline: "", status: "DRAFT",
};

export function ScholarshipForm({ initialData, id }: { initialData?: Partial<FormData>; id?: string }) {
  const router = useRouter();
  const [data, setData] = useState<FormData>({ ...DEFAULT, ...initialData });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newLokasi, setNewLokasi] = useState("");
  const [newKomponen, setNewKomponen] = useState("");

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const url = id ? `/api/admin/scholarships/${id}` : "/api/admin/scholarships";
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, deadline: data.deadline ? new Date(data.deadline).toISOString() : null }),
    });
    setLoading(false);
    if (res.ok) router.push("/admin/scholarships");
    else {
      const err = await res.json();
      setError(JSON.stringify(err.error ?? "Gagal menyimpan"));
    }
  }

  function addToArray(field: "pilihanLokasi" | "komponenPembiayaan", value: string, setter: (v: string) => void) {
    if (!value.trim()) return;
    setField(field, [...data[field], value.trim()]);
    setter("");
  }

  function removeFromArray(field: "pilihanLokasi" | "komponenPembiayaan", idx: number) {
    setField(field, data[field].filter((_, i) => i !== idx));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1">
          <Label>Nama Beasiswa *</Label>
          <Input required value={data.namaBeasiswa} onChange={(e) => setField("namaBeasiswa", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Penyelenggara *</Label>
          <Input required value={data.penyelenggara} onChange={(e) => setField("penyelenggara", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Lokasi</Label>
          <Select value={data.lokasi} onValueChange={(v) => setField("lokasi", v as FormData["lokasi"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DALAM_NEGERI">Dalam Negeri</SelectItem>
              <SelectItem value="LUAR_NEGERI">Luar Negeri</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Skema Pembiayaan</Label>
          <Input value={data.skemaPembiayaan} onChange={(e) => setField("skemaPembiayaan", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Jenis Pembiayaan</Label>
          <Input value={data.jenisPembiayaan} onChange={(e) => setField("jenisPembiayaan", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Link Pendaftaran *</Label>
          <Input required type="url" value={data.linkPendaftaran} onChange={(e) => setField("linkPendaftaran", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Deadline Pendaftaran</Label>
          <Input type="date" value={data.deadline} onChange={(e) => setField("deadline", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={data.status} onValueChange={(v) => setField("status", v as FormData["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pilihan Lokasi */}
      <div className="space-y-2">
        <Label>Pilihan Lokasi / Negara Tujuan</Label>
        <div className="flex gap-2">
          <Input placeholder="Tambah negara/kota..." value={newLokasi} onChange={(e) => setNewLokasi(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("pilihanLokasi", newLokasi, setNewLokasi))} />
          <Button type="button" variant="outline" size="sm" onClick={() => addToArray("pilihanLokasi", newLokasi, setNewLokasi)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {data.pilihanLokasi.map((l, i) => (
            <span key={i} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {l}<button type="button" onClick={() => removeFromArray("pilihanLokasi", i)}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Komponen Pembiayaan */}
      <div className="space-y-2">
        <Label>Komponen Pembiayaan</Label>
        <div className="flex gap-2">
          <Input placeholder="Tambah komponen..." value={newKomponen} onChange={(e) => setNewKomponen(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("komponenPembiayaan", newKomponen, setNewKomponen))} />
          <Button type="button" variant="outline" size="sm" onClick={() => addToArray("komponenPembiayaan", newKomponen, setNewKomponen)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {data.komponenPembiayaan.map((k, i) => (
            <span key={i} className="flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
              {k}<button type="button" onClick={() => removeFromArray("komponenPembiayaan", i)}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Keterangan</Label>
        <Textarea rows={5} value={data.keterangan} onChange={(e) => setField("keterangan", e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {id ? "Simpan Perubahan" : "Tambah Beasiswa"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
      </div>
    </form>
  );
}
