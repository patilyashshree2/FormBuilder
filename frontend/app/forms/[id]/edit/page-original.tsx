"use client";
import { useEffect, useState } from "react";
import { getForm, updateForm } from "../../../api-client";

export default function EditForm({ params }: { params: { id: string } }) {
  const id = params.id;
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getForm(id).then(setForm); }, [id]);
  if (!form) return <div>Loading...</div>;

  async function save() {
    setSaving(true);
    const updated = await updateForm(id, form);
    setForm(updated);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="text-sm opacity-70">Status: {form.status}</div>
      <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="text-2xl font-semibold bg-transparent border-b dark:border-gray-700" />
      <div className="space-y-4">
        {form.fields.map((f: any) => (
          <div key={f.id} className="p-3 border rounded dark:border-gray-700">
            <div className="flex items-center gap-2">
              <input value={f.label} onChange={e => setForm({ ...form, fields: form.fields.map((x: any) => x.id === f.id ? { ...x, label: e.target.value } : x) })} className="bg-transparent border-b dark:border-gray-700 w-full" />
              <label className="text-sm flex items-center gap-1">
                <input type="checkbox" checked={!!f.required} onChange={e => setForm({ ...form, fields: form.fields.map((x: any) => x.id === f.id ? { ...x, required: e.target.checked } : x) })} />
                Required
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="px-4 py-2 rounded bg-blue-600 text-white">
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={async () => { setSaving(true); const updated = await updateForm(id, { ...form, status: "published" }); setForm(updated); setSaving(false); }} className="px-4 py-2 rounded border">
          Publish
        </button>
      </div>
    </div>
  );
}
