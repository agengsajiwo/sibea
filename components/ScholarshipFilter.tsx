"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function ScholarshipFilter() {
  const router = useRouter();
  const params = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(params.toString());
      if (value && value !== "all") p.set(key, value);
      else p.delete(key);
      p.delete("page");
      router.push(`/?${p.toString()}`);
    },
    [params, router]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      updateParam("search", fd.get("search") as string);
    },
    [updateParam]
  );

  const handleReset = () => router.push("/");

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Filter className="h-4 w-4" />
        Filter Beasiswa
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            name="search"
            placeholder="Cari nama atau penyelenggara..."
            defaultValue={params.get("search") ?? ""}
            className="pl-9"
          />
        </div>
        <Button type="submit" size="sm">Cari</Button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Lokasi</label>
          <Select
            value={params.get("lokasi") ?? "all"}
            onValueChange={(v) => updateParam("lokasi", v)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Semua Lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              <SelectItem value="DALAM_NEGERI">Dalam Negeri</SelectItem>
              <SelectItem value="LUAR_NEGERI">Luar Negeri</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-500">Skema Pembiayaan</label>
          <Select
            value={params.get("skema") ?? "all"}
            onValueChange={(v) => updateParam("skema", v)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Semua Skema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Skema</SelectItem>
              <SelectItem value="Fully Funded">Fully Funded</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(params.get("lokasi") || params.get("skema") || params.get("search")) && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-gray-500">
          Reset Filter
        </Button>
      )}
    </div>
  );
}
