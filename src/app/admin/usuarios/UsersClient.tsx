"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Upload, Download, Pencil, Trash2, Loader2, X } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth-utils";

const ROLES = [
  "RECTOR",
  "COORDINADOR",
  "DOCENTE_TECNOLOGIA",
  "ORIENTADOR",
  "DOCENTE_APOYO",
] as const;

type UserRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
};

export function UsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalUser, setModalUser] = useState<Partial<UserRow> | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function saveUser() {
    if (!modalUser?.email || !modalUser?.role) return;
    const method = modalUser.id ? "PUT" : "POST";
    const res = await fetch("/api/admin/users", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modalUser),
    });
    if (res.ok) {
      setModalUser(null);
      loadUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Error al guardar");
    }
  }

  async function toggleActive(user: UserRow) {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, active: !user.active }),
    });
    loadUsers();
  }

  async function deleteUser(id: string) {
    if (!confirm("¿Eliminar este usuario? Sus respuestas previas se conservan en el historial.")) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadUsers();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/users/import", { method: "POST", body: formData });
    const data = await res.json();
    setImporting(false);
    if (res.ok) {
      setImportMsg(`Creados: ${data.created} · Omitidos (ya existían): ${data.skipped}${data.errors.length ? ` · Errores: ${data.errors.length}` : ""}`);
      loadUsers();
    } else {
      setImportMsg(data.error || "Error al importar");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function exportCsv() {
    const headers = ["Correo", "Nombre", "Rol", "Activo", "Último ingreso"];
    const rows = users.map((u) => [
      u.email,
      u.fullName || "",
      ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role,
      u.active ? "Sí" : "No",
      u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("es-CO") : "Nunca",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "usuarios.csv";
    a.click();
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Gestión de usuarios</h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="mr-1.5 animate-spin" size={16} /> : <Upload className="mr-1.5" size={16} />}
            Importar Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleImport} />
          <button className="btn-secondary" onClick={exportCsv}>
            <Download className="mr-1.5" size={16} /> Exportar
          </button>
          <button
            className="btn-primary"
            onClick={() => setModalUser({ email: "", role: "DOCENTE_TECNOLOGIA" })}
          >
            <Plus className="mr-1.5" size={16} /> Nuevo usuario
          </button>
        </div>
      </div>

      {importMsg && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
          {importMsg}
        </p>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        El archivo Excel debe tener columnas: <code>correo</code>, <code>rol</code> (RECTOR, COORDINADOR,
        DOCENTE_TECNOLOGIA, ORIENTADOR, DOCENTE_APOYO) y opcionalmente <code>nombre</code>.
      </p>

      <div className="card overflow-x-auto p-0">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-brand-500" size={24} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Último ingreso</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.fullName || <span className="text-slate-400">Sin ingresar</span>}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}
                    >
                      {u.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("es-CO") : "Nunca"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="text-slate-400 hover:text-brand-600" onClick={() => setModalUser(u)}>
                        <Pencil size={16} />
                      </button>
                      <button className="text-slate-400 hover:text-red-600" onClick={() => deleteUser(u.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalUser && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{modalUser.id ? "Editar usuario" : "Nuevo usuario"}</h2>
              <button onClick={() => setModalUser(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Correo</label>
                <input
                  className="input-field disabled:opacity-60"
                  disabled={!!modalUser.id}
                  value={modalUser.email || ""}
                  onChange={(e) => setModalUser({ ...modalUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Nombre completo</label>
                <input
                  className="input-field"
                  value={modalUser.fullName || ""}
                  onChange={(e) => setModalUser({ ...modalUser, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Rol</label>
                <select
                  className="input-field"
                  value={modalUser.role || "DOCENTE_TECNOLOGIA"}
                  onChange={(e) => setModalUser({ ...modalUser, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn-primary mt-5 w-full" onClick={saveUser}>
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
