"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteScholarshipButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/admin/scholarships/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button variant="destructive" size="sm" onClick={handleDelete} className="text-xs h-7 px-2">Ya</Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} className="text-xs h-7 px-2">Batal</Button>
      </div>
    );
  }
  return (
    <Button variant="ghost" size="icon" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4 text-red-400" />
    </Button>
  );
}
