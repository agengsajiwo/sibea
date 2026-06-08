import Link from "next/link";
import { Calendar, MapPin, ExternalLink, Globe, Building } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ScholarshipCardProps {
  id: string;
  namaBeasiswa: string;
  penyelenggara: string;
  lokasi: "DALAM_NEGERI" | "LUAR_NEGERI";
  skemaPembiayaan: string;
  pilihanLokasi: string[];
  deadline: Date | null;
  keterangan: string;
  linkPendaftaran: string;
}

function getDeadlineBadge(deadline: Date | null) {
  if (!deadline) return null;
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Pendaftaran Ditutup", variant: "destructive" as const };
  if (days <= 14) return { label: `Tutup ${days} hari lagi`, variant: "warning" as const };
  return {
    label: deadline.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    variant: "info" as const,
  };
}

export function ScholarshipCard({
  id, namaBeasiswa, penyelenggara, lokasi, skemaPembiayaan,
  pilihanLokasi, deadline, keterangan, linkPendaftaran,
}: ScholarshipCardProps) {
  const deadlineBadge = getDeadlineBadge(deadline);
  const isClosed = deadline && deadline < new Date();

  return (
    <Card className={`flex flex-col h-full transition-shadow hover:shadow-md ${isClosed ? "opacity-75" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant={lokasi === "DALAM_NEGERI" ? "success" : "info"}>
            {lokasi === "DALAM_NEGERI" ? (
              <><Building className="h-3 w-3 mr-1" />Dalam Negeri</>
            ) : (
              <><Globe className="h-3 w-3 mr-1" />Luar Negeri</>
            )}
          </Badge>
          {skemaPembiayaan.toLowerCase().includes("fully") && (
            <Badge variant="default" className="text-xs">Fully Funded</Badge>
          )}
        </div>
        <CardTitle className="text-base leading-snug line-clamp-2">{namaBeasiswa}</CardTitle>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <Building className="h-3 w-3 shrink-0" />
          {penyelenggara}
        </p>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {pilihanLokasi.length > 0 && (
          <div className="flex items-start gap-1 text-sm text-gray-600 mb-2">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
            <span className="line-clamp-1">{pilihanLokasi.join(", ")}</span>
          </div>
        )}
        <p className="text-sm text-gray-600 line-clamp-3">{keterangan}</p>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-0">
        {deadlineBadge && (
          <div className="w-full flex items-center gap-1 text-xs">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <Badge variant={deadlineBadge.variant} className="text-xs">
              {deadlineBadge.label}
            </Badge>
          </div>
        )}
        <div className="w-full flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/beasiswa/${id}`}>Detail</Link>
          </Button>
          <Button size="sm" className="flex-1" asChild disabled={!!isClosed}>
            <a href={linkPendaftaran} target="_blank" rel="noopener noreferrer">
              Daftar <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
