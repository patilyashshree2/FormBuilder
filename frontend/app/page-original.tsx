"use client";
import { useRef, useState } from "react";
import { createForm } from "./api-client";

type FieldType = "text" | "multiple_choice" | "checkboxes" | "rating";
type Field = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  showIf?: { fieldId: string; equals: any } | null;
};

export default function Page() {
  const [title, setTitle] = useState("Untitled Form");
  const [fields, setFields] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);

  function addField(t: FieldType) {
    const id = crypto.randomUUID();
    setFields(f => [...f, {
      id, label: "Question", type: t, required: false,
      options: t !== "text" ? ["Option 1"] : undefined,
      min: t === "rating" ? 1 : undefined, max: t === "rating" ? 5 : undefined
    }]);
  }

  // Drag and drop
  const dragIndex = useRef<number | null>(null);
  function onDragStart(idx: number) { dragIndex.current = idx; }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(idx: number) {
    const from = dragIndex.current;
    if (from === null || from === idx) return;
    setFields(prev => {
      const arr = [...prev];
      const [it] = arr.splice(from, 1);
      arr.splice(idx, 0, it);
      return arr;
    });
    dragIndex.current = null;
  }

  async function save(status: "draft" | "published") {
    setSaving(true);
    const body = { title, status, fields };
    const data = await createForm(body);
    setFormId(data.id);
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <input value={title} onChange={e => setTitle(e.target.value)}
          className="w-full text-2xl font-semibold bg-transparent outline-none border-b border-gray-300 dark:border-gray-700 pb-1" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => addField("text")} className="px-3 py-1 border rounded">Add Text</button>
          <button onClick={() => addField("multiple_choice")} className="px-3 py-1 border rounded">Add Multiple Choice</button>
          <button onClick={() => addField("checkboxes")} className="px-3 py-1 border rounded">Add Checkboxes</button>
          <button onClick={() => addField("rating")} className="px-3 py-1 border rounded">Add Rating</button>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={f.id}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(i)}
            className="p-3 rounded border dark:border-gray-700 bg-white/60 dark:bg-gray-900/40">
            <div className="flex items-center gap-2">
              <span className="cursor-grab select-none pr-2">⠿</span>
              <input value={f.label}
                onChange={e => setFields(x => x.map(y => y.id === f.id ? { ...y, label: e.target.value } : y))}
                className="flex-1 bg-transparent outline-none border-b border-gray-300 dark:border-gray-700" />
              <span className="text-sm opacity-70">{f.type}</span>
              <label className="text-sm flex items-center gap-1 ml-2">
                <input type="checkbox" checked={!!f.required}
                  onChange={e => setFields(x => x.map(y => y.id === f.id ? { ...y, required: e.target.checked } : y))} />
                Required
              </label>
            </div>
            {f.type !== "text" && (
              <div className="mt-2 space-y-2">
                {(f.options || []).map((o, oi) => (
                  <div key={oi} className="flex gap-2 items-center">
                    <input
                      value={o}
                      onChange={e => setFields(x => x.map(y => y.id === f.id ? { ...y, options: (y.options || []).map((oo, ooi) => ooi === oi ? e.target.value : oo) } : y))}
                      className="bg-transparent border-b outline-none"
                    />
                    <button onClick={() => setFields(x => x.map(y => y.id === f.id ? { ...y, options: (y.options || []).filter((_, ooi) => ooi !== oi) } : y))}
                      className="px-2 py-1 border rounded">Remove</button>
                  </div>
                ))}
                <button onClick={() => setFields(x => x.map(y => y.id === f.id ? { ...y, options: [...(y.options || []), `Option ${(y.options?.length || 0) + 1}`] } : y))} className="px-2 py-1 border rounded">Add Option</button>
              </div>
            )}
            {f.type == "rating" && (
              <div className="mt-2 flex gap-2 items-center">
                <label className="text-sm">Min</label>
                <input type="number" value={f.min ?? 1} onChange={e => setFields(x => x.map(y => y.id === f.id ? { ...y, min: parseInt(e.target.value) } : y))} className="w-20 bg-transparent border rounded px-2" />
                <label className="text-sm">Max</label>
                <input type="number" value={f.max ?? 5} onChange={e => setFields(x => x.map(y => y.id === f.id ? { ...y, max: parseInt(e.target.value) } : y))} className="w-20 bg-transparent border rounded px-2" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => save("draft")} disabled={saving} className="px-4 py-2 rounded border">
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button onClick={() => save("published")} disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white">
          {saving ? "Publishing..." : "Publish"}
        </button>
        {formId && (
          <div className="flex items-center gap-3 text-sm">
            <a className="underline" href={`/forms/${formId}/edit`}>Edit</a>
            <a className="underline" href={`/forms/${formId}/share`}>Share</a>
            <a className="underline" href={`/forms/${formId}/analytics`}>Analytics</a>
          </div>
        )}
      </div>
    </div>
  );
}
