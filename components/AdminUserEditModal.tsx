"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X, Eye, EyeOff } from "lucide-react";

interface Props {
  userId: string;
  initialName: string;
  initialEmail: string;
  onClose: () => void;
}

export function AdminUserEditModal({ userId, initialName, initialEmail, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({ name: initialName, email: initialEmail, password: "" });

  function setField(key: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: [] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const body: Record<string, string> = { name: form.name, email: form.email };
    if (form.password) body.password = form.password;

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (res.ok) {
      onClose();
      router.refresh();
    } else {
      const data = await res.json();
      if (data.error && typeof data.error === "object") setErrors(data.error);
      else setErrors({ _: [data.error ?? "Terjadi kesalahan"] });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit Admin</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nama Lengkap</Label>
            <Input id="edit-name" required value={form.name} onChange={(e) => setField("name", e.target.value)} />
            {errors.name && <p className="text-xs text-red-600">{errors.name[0]}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" required value={form.email} onChange={(e) => setField("email", e.target.value)} />
            {errors.email && <p className="text-xs text-red-600">{errors.email[0]}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-password">
              Password Baru <span className="text-gray-400 text-xs font-normal">(kosongkan jika tidak diubah)</span>
            </Label>
            <div className="relative">
              <Input
                id="edit-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder="Minimal 8 karakter"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600">{errors.password[0]}</p>}
          </div>

          {errors._ && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{errors._[0]}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan Perubahan
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
