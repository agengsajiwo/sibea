"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Edit2, Globe, Building, Calendar, ExternalLink, Bot, User } from "lucide-react";

interface ReviewScholarship {
  id: string;
  namaBeasiswa: string;
  penyelenggara: string;
  lokasi: "DALAM_NEGERI" | "LUAR_NEGERI";
  pilihanLokasi: string[];
  skemaPembiayaan: string;
  jenisPembiayaan: string;
  komponenPembiayaan: string[];
  keterangan: string;
  linkPendaftaran: string;
  deadline: Date | null;
  tanggalCrawling: Date;
  isManualEntry: boolean;
  sumberCrawling: string;
}

export function ReviewCard({ scholarship }: { scholarship: ReviewScholarship }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [edits, setEdits] = useState({
    namaBeasiswa: scholarship.namaBeasiswa,
    penyelenggara: scholarship.penyelenggara,
    keterangan: scholarship.keterangan,
    linkPendaftaran: scholarship.linkPendaftaran,
    skemaPembiayaan: scholarship.skemaPembiayaan,
  });

  async function handleAction(action: "approve" | "reject") {
    setLoading(action);
    const body = action === "approve" && editMode ? { action, ...edits } : { action };
    await fetch(`/api/admin/review/${scholarship.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <Card className="border-l-4 border-l-yellow-400">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant={scholarship.lokasi === "DALAM_NEGERI" ? "success" : "info"}>
                {scholarship.lokasi === "DALAM_NEGERI"
                  ? <><Building className="h-3 w-3 mr-1" />Dalam Negeri</>
                  : <><Globe className="h-3 w-3 mr-1" />Luar Negeri</>}
              </Badge>
              <Badge variant={scholarship.isManualEntry ? "secondary" : "outline"} className="text-xs">
                {scholarship.isManualEntry
                  ? <><User className="h-3 w-3 mr-1" />Input Manual</>
                  : <><Bot className="h-3 w-3 mr-1" />Hasil Crawler</>}
              </Badge>
              <Badge variant="warning" className="text-xs">PENDING REVIEW</Badge>
            </div>
            <CardTitle className="text-base">{scholarship.namaBeasiswa}</CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">{scholarship.penyelenggara}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Deadline: {scholarship.deadline
              ? scholarship.deadline.toLocaleDateString("id-ID")
              : "—"}
          </span>
          <span className="flex items-center gap-1">
            <ExternalLink className="h-3.5 w-3.5" />
            <a href={scholarship.linkPendaftaran} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate max-w-xs">
              {scholarship.linkPendaftaran}
            </a>
          </span>
          <span>Skema: {scholarship.skemaPembiayaan}</span>
          <span>Crawled: {scholarship.tanggalCrawling.toLocaleString("id-ID")}</span>
        </div>

        <div className="text-sm text-gray-700 bg-gray-50 rounded p-3">
          <p className="line-clamp-3">{scholarship.keterangan || "—"}</p>
        </div>

        {!scholarship.isManualEntry && (
          <p className="text-xs text-gray-400">
            Sumber: <a href={scholarship.sumberCrawling} target="_blank" rel="noopener noreferrer"
              className="underline">{scholarship.sumberCrawling}</a>
          </p>
        )}

        {/* Edit fields */}
        {editMode && (
          <div className="border rounded-lg p-4 space-y-3 bg-blue-50">
            <p className="text-xs font-medium text-blue-700">Mode Edit — perubahan berlaku saat disetujui</p>
            <div>
              <Label className="text-xs">Nama Beasiswa</Label>
              <Input value={edits.namaBeasiswa}
                onChange={(e) => setEdits(p => ({ ...p, namaBeasiswa: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Penyelenggara</Label>
              <Input value={edits.penyelenggara}
                onChange={(e) => setEdits(p => ({ ...p, penyelenggara: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Skema Pembiayaan</Label>
              <Input value={edits.skemaPembiayaan}
                onChange={(e) => setEdits(p => ({ ...p, skemaPembiayaan: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Link Pendaftaran</Label>
              <Input value={edits.linkPendaftaran}
                onChange={(e) => setEdits(p => ({ ...p, linkPendaftaran: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Keterangan</Label>
              <Textarea value={edits.keterangan} rows={4}
                onChange={(e) => setEdits(p => ({ ...p, keterangan: e.target.value }))} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => handleAction("approve")}
            disabled={loading !== null}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {loading === "approve" ? "Menyetujui..." : editMode ? "Edit & Setujui" : "Setujui"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction("reject")}
            disabled={loading !== null}
          >
            <XCircle className="h-4 w-4 mr-1" />
            {loading === "reject" ? "Menolak..." : "Tolak"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditMode((v) => !v)}
            disabled={loading !== null}
          >
            <Edit2 className="h-4 w-4 mr-1" />
            {editMode ? "Batal Edit" : "Edit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
