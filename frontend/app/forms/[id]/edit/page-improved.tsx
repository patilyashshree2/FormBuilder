"use client";
import { useEffect, useRef, useState } from "react";
import { getForm, updateForm } from "../../../api-client";

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

export default function EditForm({ params }: { params: { id: string } }) {
  const id = params.id;
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    getForm(id).then(data => {
      setForm(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // Drag and drop
  const dragIndex = useRef<number | null>(null);
  function onDragStart(idx: number) { dragIndex.current = idx; }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(idx: number) {
    const from = dragIndex.current;
    if (from === null || from === idx) return;
    setForm((prev: any) => {
      const fields = [...prev.fields];
      const [item] = fields.splice(from, 1);
      fields.splice(idx, 0, item);
      return { ...prev, fields };
    });
    dragIndex.current = null;
  }

  function addField(type: FieldType) {
    const newField: Field = {
      id: crypto.randomUUID(),
      label: "New Question",
      type,
      required: false,
      options: type !== "text" ? ["Option 1"] : undefined,
      min: type === "rating" ? 1 : undefined,
      max: type === "rating" ? 5 : undefined
    };
    setForm((prev: any) => ({ ...prev, fields: [...prev.fields, newField] }));
  }

  function updateField(fieldId: string, updates: Partial<Field>) {
    setForm((prev: any) => ({
      ...prev,
      fields: prev.fields.map((f: Field) => f.id === fieldId ? { ...f, ...updates } : f)
    }));
  }

  function removeField(fieldId: string) {
    setForm((prev: any) => ({
      ...prev,
      fields: prev.fields.filter((f: Field) => f.id !== fieldId)
    }));
  }

  function duplicateField(fieldId: string) {
    const field = form.fields.find((f: Field) => f.id === fieldId);
    if (field) {
      const newField = { ...field, id: crypto.randomUUID(), label: field.label + " (Copy)" };
      setForm((prev: any) => ({ ...prev, fields: [...prev.fields, newField] }));
    }
  }

  async function save(status?: "draft" | "published") {
    setSaving(true);
    try {
      const updated = await updateForm(id, { ...form, status: status || form.status });
      setForm(updated);
    } catch (error) {
      console.error("Save failed:", error);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Form not found</h2>
        <p className="text-gray-600 dark:text-gray-400">The form you're looking for doesn't exist or has been deleted.</p>
      </div>
    );
  }

  return (
    <div className="container-responsive py-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              form.status === 'published' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {form.status === 'published' ? '🟢 Published' : '🟡 Draft'}
            </div>
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="btn-secondary"
            >
              {isPreview ? '✏️ Edit' : '👁️ Preview'}
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => save("draft")} 
              disabled={saving}
              className="btn-secondary"
            >
              {saving ? "💾 Saving..." : "💾 Save Draft"}
            </button>
            <button 
              onClick={() => save("published")} 
              disabled={saving}
              className="btn-primary"
            >
              {saving ? "🚀 Publishing..." : "🚀 Publish"}
            </button>
          </div>
        </div>

        <input 
          value={form.title} 
          onChange={e => setForm({ ...form, title: e.target.value })}
          disabled={isPreview}
          className="w-full text-2xl font-bold bg-transparent outline-none border-b-2 border-transparent focus:border-blue-500 pb-2 transition-colors"
          placeholder="Form Title"
        />
      </div>

      {!isPreview && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">➕ Add Fields</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => addField("text")} className="field-type-btn">
              📝 Text
            </button>
            <button onClick={() => addField("multiple_choice")} className="field-type-btn">
              🔘 Multiple Choice
            </button>
            <button onClick={() => addField("checkboxes")} className="field-type-btn">
              ☑️ Checkboxes
            </button>
            <button onClick={() => addField("rating")} className="field-type-btn">
              ⭐ Rating
            </button>
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        {form.fields.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No fields added yet</p>
            {!isPreview && (
              <button onClick={() => addField("text")} className="btn-primary">
                Add Your First Field
              </button>
            )}
          </div>
        ) : (
          form.fields.map((field: Field, index: number) => (
            <div
              key={field.id}
              draggable={!isPreview}
              onDragStart={() => onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(index)}
              className={`field-card ${!isPreview ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              <div className="flex items-start gap-3">
                {!isPreview && (
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-gray-400 cursor-grab select-none">⠿</span>
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      value={field.label}
                      onChange={e => updateField(field.id, { label: e.target.value })}
                      disabled={isPreview}
                      className="flex-1 text-lg font-medium bg-transparent outline-none border-b border-transparent focus:border-blue-500 pb-1 transition-colors"
                      placeholder="Question text"
                    />
                    <span className="field-type-badge">
                      {field.type === 'text' && '📝'}
                      {field.type === 'multiple_choice' && '🔘'}
                      {field.type === 'checkboxes' && '☑️'}
                      {field.type === 'rating' && '⭐'}
                      {field.type.replace('_', ' ')}
                    </span>
                  </div>

                  {!isPreview && (
                    <div className="flex items-center gap-4 mb-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!field.required}
                          onChange={e => updateField(field.id, { required: e.target.checked })}
                          className="rounded"
                        />
                        Required
                      </label>
                    </div>
                  )}

                  {/* Field Options */}
                  {field.type !== "text" && (
                    <div className="space-y-2 mb-3">
                      {(field.options || []).map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <span className="text-gray-400">
                            {field.type === 'multiple_choice' ? '○' : '☐'}
                          </span>
                          {isPreview ? (
                            <span>{option}</span>
                          ) : (
                            <>
                              <input
                                value={option}
                                onChange={e => {
                                  const newOptions = [...(field.options || [])];
                                  newOptions[optionIndex] = e.target.value;
                                  updateField(field.id, { options: newOptions });
                                }}
                                className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none focus:border-blue-500 pb-1"
                                placeholder="Option text"
                              />
                              <button
                                onClick={() => {
                                  const newOptions = (field.options || []).filter((_, i) => i !== optionIndex);
                                  updateField(field.id, { options: newOptions });
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                      {!isPreview && (
                        <button
                          onClick={() => {
                            const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                            updateField(field.id, { options: newOptions });
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          + Add Option
                        </button>
                      )}
                    </div>
                  )}

                  {/* Rating Range */}
                  {field.type === "rating" && (
                    <div className="flex items-center gap-4 mb-3">
                      {isPreview ? (
                        <div className="flex gap-1">
                          {Array.from({ length: (field.max || 5) - (field.min || 1) + 1 }, (_, i) => (
                            <span key={i} className="text-2xl text-gray-300">⭐</span>
                          ))}
                        </div>
                      ) : (
                        <>
                          <label className="text-sm">Min:</label>
                          <input
                            type="number"
                            value={field.min ?? 1}
                            onChange={e => updateField(field.id, { min: parseInt(e.target.value) })}
                            className="w-16 px-2 py-1 border rounded dark:border-gray-600 dark:bg-gray-700"
                            min="1"
                          />
                          <label className="text-sm">Max:</label>
                          <input
                            type="number"
                            value={field.max ?? 5}
                            onChange={e => updateField(field.id, { max: parseInt(e.target.value) })}
                            className="w-16 px-2 py-1 border rounded dark:border-gray-600 dark:bg-gray-700"
                            min="1"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>

                {!isPreview && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => duplicateField(field.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title="Duplicate field"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => removeField(field.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete field"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">🚀 Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a 
            href={`/forms/${id}/share`}
            className="btn-secondary text-center"
          >
            🔗 Share Form
          </a>
          <a 
            href={`/forms/${id}/analytics`}
            className="btn-secondary text-center"
          >
            📊 View Analytics
          </a>
          <button 
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/forms/${id}/share`)}
            className="btn-secondary"
          >
            📋 Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}
