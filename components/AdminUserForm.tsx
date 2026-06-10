"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface Props {
  userId?: string;
  initialData?: { name: string; email: string };
}

export function AdminUserForm({ userId, initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    password: "",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: [] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const url = userId ? `/api/admin/users/${userId}` : "/api/admin/users";
    const method = userId ? "PUT" : "POST";
    const body: Record<string, string> = { name: form.name, email: form.email };
    if (form.password) body.password = form.password;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/admin/users");
      router.refresh();
    } else {
      const data = await res.json();
      if (data.error && typeof data.error === "object") {
        setErrors(data.error);
      } else {
        setErrors({ _: [data.error ?? "Terjadi kesalahan"] });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
        <Input
          id="name"
          required
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="contoh: Dr. Ahmad Fauzi"
        />
        {errors.name && <p className="text-xs text-red-600">{errors.name[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          placeholder="contoh: ahmadfauzi@unu.ac.id"
        />
        {errors.email && <p className="text-xs text-red-600">{errors.email[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">
          Password {!userId && <span className="text-red-500">*</span>}
          {userId && <span className="text-gray-400 text-xs font-normal"> (kosongkan jika tidak ingin mengubah)</span>}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required={!userId}
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            placeholder={userId ? "Biarkan kosong jika tidak diubah" : "Minimal 8 karakter"}
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
        {!userId && (
          <p className="text-xs text-gray-500">Password minimal 8 karakter. Gunakan kombinasi huruf, angka, dan simbol.</p>
        )}
      </div>

      {errors._ && (
        <p className="text-sm text-red-600 bg-red-50 rounded p-2">{errors._[0]}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {userId ? "Simpan Perubahan" : "Buat Akun Admin"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
      </div>
    </form>
  );
}
