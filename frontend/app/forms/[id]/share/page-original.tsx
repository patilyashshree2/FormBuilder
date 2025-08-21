"use client";
import { useEffect, useState } from "react";
import { getForm, submitResponse } from "../../../api-client";

export default function Share({ params }: { params: { id: string } }) {
  const id = params.id;
  const [form, setForm] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getForm(id).then(setForm); }, [id]);
  if (!form) return <div>Loading...</div>;

  if (form.status !== "published") {
    return <div className="p-3 border rounded">This form is not published.</div>;
  }

  function visible(field: any) {
    if (!field.showIf) return true;
    const val = answers[field.showIf.fieldId];
    return val === field.showIf.equals;
  }

  function validate(): string | null {
    for (const f of form.fields) {
      if (!visible(f)) continue;
      const v = answers[f.id];
      if (f.required) {
        if (v === undefined || v === null || v === "") return `Missing required: ${f.label}`;
      }
      if (f.type === "rating") {
        const min = f.min ?? 1, max = f.max ?? 5;
        if (v !== undefined && (v < min || v > max)) return `Rating out of range for: ${f.label}`;
      }
    }
    return null;
  }

  async function onSubmit() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    await submitResponse(id, answers);
    setDone(true);
  }

  if (done) return <div className="space-y-2"><div className="text-lg font-semibold">Thanks for your feedback</div><a className="underline" href={`/forms/${id}/analytics`}>View analytics</a></div>;

  return (
    <div className="space-y-4">
      <div className="text-2xl font-semibold">{form.title}</div>
      {error && <div className="p-2 text-red-700 bg-red-100 rounded">{error}</div>}
      {form.fields.filter(visible).map((f: any) => (
        <div key={f.id} className="p-3 border rounded dark:border-gray-700">
          <label className="block text-sm opacity-80 mb-2">{f.label}{f.required && <span className="text-red-500">*</span>}</label>
          {f.type === "text" && (
            <input className="w-full border rounded px-3 py-2 bg-transparent" onChange={e => setAnswers(a => ({ ...a, [f.id]: e.target.value }))} />
          )}
          {f.type === "multiple_choice" && (
            <div className="space-y-1">
              {f.options?.map((o: string) => (
                <label key={o} className="flex items-center gap-2">
                  <input type="radio" name={f.id} onChange={() => setAnswers(a => ({ ...a, [f.id]: o }))} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          )}
          {f.type === "checkboxes" && (
            <div className="space-y-1">
              {f.options?.map((o: string) => (
                <label key={o} className="flex items-center gap-2">
                  <input type="checkbox" onChange={(e) => setAnswers(a => {
                    const prev: string[] = Array.isArray(a[f.id]) ? a[f.id] : [];
                    if (e.target.checked) return { ...a, [f.id]: [...prev, o] };
                    return { ...a, [f.id]: prev.filter(x => x !== o) };
                  })} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          )}
          {f.type === "rating" && (
            <input type="number" min={f.min ?? 1} max={f.max ?? 5} className="w-24 border rounded px-2 py-1 bg-transparent" onChange={e => setAnswers(a => ({ ...a, [f.id]: parseFloat(e.target.value) }))} />
          )}
        </div>
      ))}
      <button onClick={onSubmit} className="px-4 py-2 rounded bg-green-600 text-white">Submit</button>
    </div>
  );
}
