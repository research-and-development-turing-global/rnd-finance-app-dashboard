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

type Permission = {
  id: number;
  name: string;
  slug?: string;
  module?: string;
  description?: string | null;
  created_at?: string;
};

type Role = { id: number; name: string };

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/permissions`;
const ROLES_API = `${process.env.NEXT_PUBLIC_API_URL}/api/roles`;

export default function PermissionsManager() {
  const [items, setItems] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Permission>>({
    name: "",
    slug: "",
    module: "",
    description: "",
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [assignedRoleIds, setAssignedRoleIds] = useState<number[]>([]);
  const [currentPermissionId, setCurrentPermissionId] = useState<number | null>(
    null
  );

  useEffect(() => {
    fetchPermissions();
    fetchRoles();
  }, []);

  async function fetchPermissions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      const arr = Array.isArray(data)
        ? data
        : data?.data ?? data?.permissions ?? [];
      const normalized = (arr as unknown[]).map((it) => {
        const obj = (it as Record<string, unknown>) || {};
        return {
          id: Number(obj.id) || 0,
          name: String(obj.name ?? ""),
          slug: obj.slug ? String(obj.slug) : undefined,
          module: obj.module ? String(obj.module) : undefined,
          description:
            typeof obj.description === "string"
              ? String(obj.description)
              : null,
          created_at: obj.created_at ? String(obj.created_at) : undefined,
        } as Permission;
      });
      setItems(normalized as Permission[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to fetch permissions");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoles() {
    try {
      const res = await fetch(ROLES_API);
      if (!res.ok) return;
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.data ?? data?.roles ?? [];
      const roles = (arr as unknown[]).map((r) => {
        const obj = (r as Record<string, unknown>) || {};
        return { id: Number(obj.id), name: String(obj.name ?? "") };
      });
      setRoles(roles);
    } catch {
      // Silently fail if roles fetch fails
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => {
      if (p.name && p.name.toLowerCase().includes(q)) return true;
      if (p.slug && p.slug.toLowerCase().includes(q)) return true;
      if (p.module && p.module.toLowerCase().includes(q)) return true;
      if (p.description && p.description.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [items, searchTerm]);

  function openNew() {
    setIsEditing(false);
    setForm({ name: "", slug: "", module: "", description: "" });
    setSheetOpen(true);
  }

  function openEdit(it: Permission) {
    setIsEditing(true);
    setForm({ ...it });
    setSheetOpen(true);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const body = {
        name: form.name,
        slug: form.slug,
        module: form.module,
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
      await fetchPermissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to save permission");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    if (!confirm("Delete this permission?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchPermissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  // Assign / remove role
  async function openAssign(it: Permission) {
    setCurrentPermissionId(it.id);
    setAssignedRoleIds([]);
    setAssignOpen(true);
    // Attempt to fetch permission detail to find assigned roles
    try {
      const res = await fetch(`${API_BASE}/${it.id}`);
      if (!res.ok) {
        // no detail available; leave assigned empty
        return;
      }
      const data = await res.json();
      const payload = Array.isArray(data)
        ? data[0]
        : data?.data
        ? data.data[0]
        : data?.permission ?? data;
      // check for roles/assigned_roles
      const assigned =
        payload?.roles ?? payload?.assigned_roles ?? payload?.role_ids ?? [];
      if (Array.isArray(assigned)) {
        setAssignedRoleIds(
          (assigned as unknown[]).map((r) => {
            const obj = (r as Record<string, unknown>) || {};
            return Number(obj.id ?? r);
          })
        );
      }
    } catch {
      // Silently fail if permission detail fetch fails
    }
  }

  async function toggleAssign(roleId: number) {
    if (!currentPermissionId) return;
    const assigned = assignedRoleIds.includes(roleId);
    try {
      setLoading(true);
      const url = assigned ? `${API_BASE}/remove` : `${API_BASE}/assign`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: roleId,
          permission_id: currentPermissionId,
        }),
      });
      if (!res.ok) throw new Error("Action failed");
      setAssignedRoleIds((prev) =>
        assigned ? prev.filter((id) => id !== roleId) : [...prev, roleId]
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to assign/remove");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 py-4">
        <h2 className="text-lg font-semibold">Permissions</h2>
        <Input
          placeholder="Search name, slug, module, description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-lg"
        />
        <div className="ml-auto">
          <Button onClick={openNew} size="sm">
            <Plus className="size-4" /> New Permission
          </Button>
        </div>
      </div>

      {error && <div className="text-destructive mb-2">{error}</div>}

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filtered.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {loading ? "Loading..." : "No permissions"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.slug ?? "—"}</TableCell>
                  <TableCell>{p.module ?? "—"}</TableCell>
                  <TableCell className="max-w-xl text-sm text-muted-foreground">
                    {p.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(p)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAssign(p)}
                      >
                        Assign
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <span />
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {isEditing ? "Edit Permission" : "New Permission"}
            </SheetTitle>
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

              <label className="text-sm">Slug</label>
              <Input
                value={form.slug ?? ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, slug: e.target.value }))
                }
              />

              <label className="text-sm">Module</label>
              <Input
                value={form.module ?? ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, module: e.target.value }))
                }
              />

              <label className="text-sm">Description</label>
              <Input
                placeholder="Allows admin to do X"
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

      {/* Assign sheet */}
      <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
        <SheetTrigger asChild>
          <span />
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Assign Permission to Roles</SheetTitle>
          </SheetHeader>
          <div className="p-4 flex flex-col gap-3">
            {!roles.length ? (
              <div>No roles found</div>
            ) : (
              roles.map((r) => {
                const assigned = assignedRoleIds.includes(r.id);
                return (
                  <div key={r.id} className="flex items-center justify-between">
                    <div>{r.name}</div>
                    <div>
                      <Button
                        size="sm"
                        variant={assigned ? "destructive" : "default"}
                        onClick={() => toggleAssign(r.id)}
                      >
                        {assigned ? "Remove" : "Assign"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <SheetFooter>
            <div className="flex w-full justify-end gap-2 p-4">
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
