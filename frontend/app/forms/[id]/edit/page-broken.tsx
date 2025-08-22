"use client";
import { useEffect, useRef, useState } from "react";
import { getForm, updateForm } from "../../../api-client";
import AuthGuard from "../../../../components/AuthGuard";

type FieldType = "text" | "single_choice" | "multi_select" | "rating";
type Field = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  showIf?: { fieldId: string; equals: any } | null;
  isPII?: boolean;
};

export default function EditForm({ params }: { params: { id: string } }) {
  const id = params.id;
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

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
      label: "",
      type,
      required: false,
      options: (type === "single_choice" || type === "multi_select") ? [""] : undefined,
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
    // Validation
    if (!form.title.trim() || form.title === "Untitled Form") {
      alert("Please enter a form title");
      return;
    }
    
    if (form.fields.length === 0) {
      alert("Please add at least one field to your form");
      return;
    }
    
    const hasRequiredField = form.fields.some((f: Field) => f.required);
    if (!hasRequiredField) {
      alert("Please make at least one field required");
      return;
    }
    
    // Check for placeholder values
    for (const field of form.fields) {
      if (!field.label.trim() || field.label === "Question" || field.label === "New Question") {
        alert("Please provide a proper question for all fields");
        return;
      }
      
      // Validate choice fields have at least one non-empty option
      if ((field.type === "single_choice" || field.type === "multi_select")) {
        const options: string[] = field.options ?? [];
        const validOptions = options.filter(opt => opt.trim() !== "");

        if (validOptions.length === 0) {
          alert(`Please add at least one option for "${field.label}"`);
          return;
        }
        if (validOptions.length !== (field.options || []).length) {
          alert(`Please fill in all option texts for "${field.label}"`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const updated = await updateForm(id, { ...form, status: status || form.status });
      setForm(updated);
      setShowSuccess(true);
    } catch (error) {
      console.error("Save failed:", error);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthGuard>
    );
  }

  if (!form) {
    return (
      <AuthGuard>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Form not found</h2>
          <p className="text-gray-600 dark:text-gray-400">The form you're looking for doesn't exist or has been deleted.</p>
        </div>
      </AuthGuard>
    );
  }

  if (form.status === 'published') {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center max-w-md">
            <span className="text-6xl mb-4 block">🔒</span>
            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">Cannot Edit Published Form</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This form is already published and cannot be edited. Published forms are locked to maintain data integrity.
            </p>
            <div className="flex gap-3 justify-center">
              <a 
                href="/forms"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Back to My Forms
              </a>
              <a 
                href={`/forms/${id}/analytics`}
                className="px-4 py-2 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
              >
                View Analytics
              </a>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* FormBuilder Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">Edit Form</h1>
          <p className="text-gray-600 dark:text-gray-400">Modify your form and republish when ready</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">Form updated successfully!</span>
              <div className="flex flex-wrap gap-3">
                <a 
                  href={`/forms/${id}/share`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Share Form
                </a>
                <a 
                  href={`/forms/${id}/analytics`}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  View Analytics
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex-1 w-full">
              <input 
                value={form.title} 
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full text-2xl lg:text-3xl font-bold bg-transparent outline-none border-b-2 border-gray-200 dark:border-gray-600 pb-2 focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100"
                placeholder="Enter your form title (required)"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button 
                onClick={() => setShowPreview(!showPreview)}
                className="px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
              >
                {showPreview ? "Edit Mode" : "Preview"}
              </button>
              <button 
                onClick={() => save("draft")} 
                disabled={saving} 
                className="px-6 py-3 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors font-medium shadow-md"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button 
                onClick={() => save("published")} 
                disabled={saving} 
                className="px-6 py-3 rounded-lg bg-green-600 text-white disabled:opacity-50 hover:bg-green-700 transition-colors font-medium shadow-md"
              >
                {saving ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Sidebar - Field Types */}
          {!showPreview && (
            <div className="xl:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Add Fields</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => addField("text")} 
                    className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📝</span>
                      <div>
                        <div className="font-medium">Text Input</div>
                        <div className="text-sm text-gray-500">Single line text</div>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={() => addField("single_choice")} 
                    className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔘</span>
                      <div>
                        <div className="font-medium">Single Choice</div>
                        <div className="text-sm text-gray-500">Select one option</div>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={() => addField("multi_select")} 
                    className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">☑️</span>
                      <div>
                        <div className="font-medium">Multi Select</div>
                        <div className="text-sm text-gray-500">Select multiple options</div>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={() => addField("rating")} 
                    className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <div className="font-medium">Rating</div>
                        <div className="text-sm text-gray-500">Numeric scale</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={showPreview ? "xl:col-span-4" : "xl:col-span-3"}>
            {showPreview ? (
              /* Preview Mode */
              <>
                  /* Preview Mode */
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <h2 className="text-3xl font-bold mb-8 text-center">{form.title}</h2>
                    <div className="space-y-6 max-w-2xl mx-auto">
                      {form.fields.filter((f: Field) => {
                        if (!f.showIf) return true;
                        // In preview, we can't check actual answers, so show all fields
                        return true;
                      }).map((f: Field) => (
                        <div key={f.id} className="p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl">
                          <label className="block text-lg font-medium mb-4">
                            {f.label}
                            {f.required && <span className="text-red-500 ml-1">*</span>}
                            {f.showIf && (
                              <span className="text-sm text-blue-600 dark:text-blue-400 ml-2">
                                (Shows if "{form.fields.find((field: Field) => field.id === f.showIf?.fieldId)?.label}" = "{f.showIf.equals}")
                              </span>
                            )}
                          </label>
                          {f.type === "text" && (
                            <input
                              className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:border-blue-500 transition-colors"
                              placeholder="Your answer..." />
                          )}
                          {f.type === "single_choice" && (
                            <div className="space-y-3">
                              {f.options?.map((o: string, idx) => (
                                <label key={idx} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                  <input type="radio" name={f.id} className="w-4 h-4" />
                                  <span className="text-lg">{o}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {f.type === "multi_select" && (
                            <div className="space-y-3">
                              {f.options?.map((o: string, idx) => (
                                <label key={idx} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                  <input type="checkbox" className="w-4 h-4" />
                                  <span className="text-lg">{o}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {f.type === "rating" && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{f.min ?? 1}</span>
                              <input
                                type="range"
                                min={f.min ?? 1}
                                max={f.max ?? 5}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                              <span className="text-sm">{f.max ?? 5}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </>):(<>
                  /* Edit Mode */
                  <div className="space-y-6">
                    {form.fields.map((f: Field, i: number) => (
                      <div
                        key={f.id}
                        draggable
                        onDragStart={() => onDragStart(i)}
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(i)}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-2 pt-2">
                            <span className="text-gray-400 text-lg">⠿</span>
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">#{i + 1}</span>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <input
                                value={f.label}
                                onChange={e => updateField(f.id, { label: e.target.value })}
                                className="flex-1 text-xl font-semibold bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                placeholder="Enter your question (required)" />
                              <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm font-medium">
                                <span>
                                  {f.type === 'text' && '📝'}
                                  {f.type === 'single_choice' && '🔘'}
                                  {f.type === 'multi_select' && '☑️'}
                                  {f.type === 'rating' && '⭐'}
                                </span>
                                {f.type.replace('_', ' ')}
                              </div>
                            </div>

                            <div className="flex items-center gap-6 mb-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!f.required}
                                  onChange={e => updateField(f.id, { required: e.target.checked })}
                                  className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm font-medium">Required</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!f.isPII}
                                  onChange={e => updateField(f.id, { isPII: e.target.checked })}
                                  className="w-4 h-4 text-orange-600 rounded" />
                                <span className="text-sm font-medium text-orange-600">PII Field</span>
                              </label>
                            </div>

                            {/* Field-specific options */}
                            {(f.type === "single_choice" || f.type === "multi_select") && (
                              <div className="space-y-3 mb-4">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Options:</h4>
                                {(f.options || []).map((o, oi) => (
                                  <div key={oi} className="flex gap-3 items-center">
                                    <input
                                      value={o}
                                      onChange={e => {
                                        const newOptions = [...(f.options || [])];
                                        newOptions[oi] = e.target.value;
                                        updateField(f.id, { options: newOptions });
                                      } }
                                      className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-blue-500 transition-colors"
                                      placeholder="Enter option text (required)" />
                                    <button
                                      onClick={() => {
                                        const newOptions = (f.options || []).filter((_, ooi) => ooi !== oi);
                                        updateField(f.id, { options: newOptions });
                                      } }
                                      className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newOptions = [...(f.options || []), ""];
                                    updateField(f.id, { options: newOptions });
                                  } }
                                  className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                                >
                                  + Add Option
                                </button>
                              </div>
                            )}

                            {/* Conditional Logic */}
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conditional Logic</h4>
                              <div className="space-y-2">
                                <select
                                  value={f.showIf?.fieldId || ""}
                                  onChange={e => {
                                    const fieldId = e.target.value;
                                    if (fieldId) {
                                      updateField(f.id, { showIf: { fieldId, equals: "" } });
                                    } else {
                                      updateField(f.id, { showIf: null });
                                    }
                                  } }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                  <option value="">No condition</option>
                                  {form.fields.filter((field: Field) => field.id !== f.id).map((field: Field) => (
                                    <option key={field.id} value={field.id}>
                                      Show if "{field.label || 'Untitled Question'}" equals...
                                    </option>
                                  ))}
                                </select>

                                {f.showIf && (() => {
                                  const dependentField = form.fields.find((field: Field) => field.id === f.showIf?.fieldId);
                                  if (!dependentField) return null;

                                  if (dependentField.type === "single_choice" || dependentField.type === "multi_select") {
                                    return (
                                      <select
                                        value={f.showIf.equals}
                                        onChange={e => updateField(f.id, { showIf: { ...f.showIf!, equals: e.target.value } })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                      >
                                        <option value="">Select an option</option>
                                        {(dependentField.options ?? []).map((option: string, idx: number) => (
                                          <option key={idx} value={option}>
                                            {option || `Option ${idx + 1}`}
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  } else if (dependentField.type === "rating") {
                                    return (
                                      <input
                                        type="number"
                                        min={dependentField.min || 1}
                                        max={dependentField.max || 5}
                                        value={f.showIf.equals}
                                        onChange={e => {
                                          const value = parseInt(e.target.value);
                                          const min = dependentField.min || 1;
                                          const max = dependentField.max || 5;
                                          if (value >= min && value <= max) {
                                            updateField(f.id, { showIf: { ...f.showIf!, equals: value } });
                                          }
                                        } }
                                        placeholder={`Enter rating (${dependentField.min || 1}-${dependentField.max || 5})`}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                                    );
                                  } else {
                                    return (
                                      <input
                                        type="text"
                                        value={f.showIf.equals}
                                        onChange={e => updateField(f.id, { showIf: { ...f.showIf!, equals: e.target.value } })}
                                        placeholder="Enter expected text value"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                                    );
                                  }
                                })()}
                              </div>
                            </div>

                            {f.type === "rating" && (
                              <div className="flex gap-4 items-center">
                                <label className="flex items-center gap-2">
                                  <span className="text-sm font-medium">Min:</span>
                                  <input
                                    type="number"
                                    value={f.min ?? 1}
                                    onChange={e => updateField(f.id, { min: parseInt(e.target.value) })}
                                    className="w-20 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-blue-500" />
                                </label>
                                <label className="flex items-center gap-2">
                                  <span className="text-sm font-medium">Max:</span>
                                  <input
                                    type="number"
                                    value={f.max ?? 5}
                                    onChange={e => updateField(f.id, { max: parseInt(e.target.value) })}
                                    className="w-20 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-blue-500" />
                                </label>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => duplicateField(f.id)}
                              className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Duplicate field"
                            >
                              📋
                            </button>
                            <button
                              onClick={() => removeField(f.id)}
                              className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete field"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {form.fields.length === 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                        <span className="text-6xl mb-4 block">🚀</span>
                        <h3 className="text-2xl font-bold mb-2">Start Building Your Form</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Add fields from the sidebar to get started</p>
                      </div>
                    )}
                  </div></>
            )}
          </div>
        </div>
        </div>
      </div>
    </AuthGuard>
  );
}
