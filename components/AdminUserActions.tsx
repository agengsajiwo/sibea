"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Loader2 } from "lucide-react";
import { AdminUserEditModal } from "./AdminUserEditModal";

interface Props {
  userId: string;
  userName: string;
  userEmail: string;
  isCurrentUser: boolean;
  totalUsers: number;
}

export function AdminUserActions({ userId, userName, userEmail, isCurrentUser, totalUsers }: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Gagal menghapus");
    }
    setConfirmDelete(false);
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
          <Edit2 className="h-4 w-4 mr-1" /> Edit
        </Button>

        {!isCurrentUser && totalUsers > 1 ? (
          confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading} className="h-8 text-xs">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ya, Hapus"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} className="h-8 text-xs">
                Batal
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          )
        ) : (
          <Button variant="ghost" size="sm" disabled className="text-gray-300">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showEdit && (
        <AdminUserEditModal
          userId={userId}
          initialName={userName}
          initialEmail={userEmail}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
