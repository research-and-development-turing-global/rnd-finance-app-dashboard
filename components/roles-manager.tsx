"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, Trash2 } from "lucide-react";

type Role = {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
};

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/roles`;

export default function RolesManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Role>>({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      // Normalize response: accept either an array or an object with a list field
      const normalize = (arr: unknown[]): Role[] =>
        arr.map((it) => {
          const obj = (it as Record<string, unknown>) || {};
          const description =
            typeof obj.description === "string"
              ? (obj.description as string)
              : "";
          return { ...(obj as Role), description };
        });

      if (Array.isArray(data)) {
        setRoles(normalize(data));
      } else if (
        data &&
        typeof data === "object" &&
        Array.isArray((data as { data?: Role[] }).data)
      ) {
        setRoles(normalize((data as { data?: Role[] }).data || []));
      } else if (
        data &&
        typeof data === "object" &&
        Array.isArray((data as { roles?: Role[] }).roles)
      ) {
        setRoles(normalize((data as { roles?: Role[] }).roles || []));
      } else {
        // Fallback: try to coerce to array, or set empty
        setRoles([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => {
      if (r.name && r.name.toLowerCase().includes(q)) return true;
      if (r.description && r.description.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [roles, searchTerm]);

  function openNew() {
    setIsEditing(false);
    setForm({ name: "", description: "" });
    setSheetOpen(true);
  }

  function openEdit(role: Role) {
    setIsEditing(true);
    setForm({ ...role });
    setSheetOpen(true);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const body = {
        name: form.name,
        description: form.description ?? null,
      };

      if (isEditing && form.id) {
        const res = await fetch(`${API_BASE}/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Create failed");
      }

      setSheetOpen(false);
      await fetchRoles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to save role");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    const ok = confirm("Delete this role?");
    if (!ok) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchRoles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 py-4">
        <h2 className="text-lg font-semibold">Admin Roles</h2>
        <Input
          placeholder="Search roles or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto">
          <Button onClick={openNew} size="sm">
            <Plus className="size-4" /> New Role
          </Button>
        </div>
      </div>

      {error && <div className="text-destructive mb-2">{error}</div>}

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!Array.isArray(filtered) || filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {loading ? "Loading..." : "No roles"}
                </TableCell>
              </TableRow>
            ) : (
              (Array.isArray(filtered) ? filtered : []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    <div className="max-w-xl text-sm text-muted-foreground">
                      {r.description ? r.description : "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(r)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <span />
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{isEditing ? "Edit Role" : "New Role"}</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleSubmit}
            className="flex h-full flex-col gap-4 p-4"
          >
            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm">Name</label>
              <Input
                value={form.name ?? ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, name: e.target.value }))
                }
                required
              />

              <label className="text-sm">Description</label>
              <Input
                placeholder="Handles finances and approvals"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, description: e.target.value }))
                }
              />
            </div>

            <SheetFooter>
              <div className="flex w-full justify-end gap-2">
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSheetOpen(false)}
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={loading}>
                  {isEditing ? "Update" : "Create"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
