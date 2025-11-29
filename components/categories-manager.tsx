"use client";

import * as React from "react";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Plus } from "lucide-react";

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  icon?: string;
  color?: string;
  created_at?: string;
};

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/categories`;

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Category>>({
    name: "",
    parent_id: null,
    icon: "",
    color: "#000000",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setCategories(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setIsEditing(false);
    setForm({ name: "", parent_id: null, icon: "", color: "#000000" });
    setSheetOpen(true);
  }

  function openEdit(cat: Category) {
    setIsEditing(true);
    setForm({ ...cat });
    setSheetOpen(true);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const body = {
        name: form.name,
        parent_id: form.parent_id ?? null,
        icon: form.icon ?? "",
        color: form.color ?? "#000000",
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
      await fetchCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    const ok = confirm("Delete this category?");
    if (!ok) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchCategories();
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
        <h2 className="text-lg font-semibold">Categories</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={openNew} size="sm">
            <Plus className="size-4" /> New
          </Button>
        </div>
      </div>

      {error && <div className="text-destructive mb-2">{error}</div>}

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {loading ? "Loading..." : "No categories"}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => {
                const parent = categories.find((c) => c.id === cat.parent_id);
                return (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>{parent ? parent.name : "—"}</TableCell>
                    <TableCell>{cat.icon ?? ""}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-8 rounded-sm border"
                          style={{ background: cat.color ?? "transparent" }}
                        />
                        <span className="text-sm">{cat.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cat.created_at
                        ? new Date(cat.created_at).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(cat)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(cat.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          {/* Hidden trigger; we open the sheet programmatically */}
          <span />
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {isEditing ? "Edit Category" : "New Category"}
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

              <label className="text-sm">Parent</label>
              <Select
                value={String(form.parent_id ?? "null")}
                onValueChange={(val) =>
                  setForm((s) => ({
                    ...s,
                    parent_id: val === "null" ? null : Number(val),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {form.parent_id
                      ? categories.find((c) => c.id === form.parent_id)?.name
                      : "None"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="text-sm">Icon</label>
              <Input
                value={form.icon ?? ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, icon: e.target.value }))
                }
              />

              <label className="text-sm">Color</label>
              <Input
                type="color"
                value={form.color ?? "#000000"}
                onChange={(e) =>
                  setForm((s) => ({ ...s, color: e.target.value }))
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
