"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

/**
 * Tombol Publikasikan cepat di Kelola Beasiswa.
 * Mengubah status ke PUBLISHED + isActive=true (sekaligus mengaktifkan
 * kembali beasiswa yang sempat dinonaktifkan auto-expire).
 */
export function PublishButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function publish() {
    setLoading(true);
    await fetch(`/api/admin/scholarships/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={publish}
      disabled={loading}
      className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 px-2"
      title="Publikasikan beasiswa ini"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <><CheckCircle className="h-4 w-4 mr-1" /> Publikasikan</>
      )}
    </Button>
  );
}
