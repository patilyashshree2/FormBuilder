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
  showIf?: { fieldId: string; equals: unknown } | null;
};

type CreateFormPayload = {
  title: string;
  status: "draft" | "published";
  fields: Field[];
};

type CreateFormResponse = {
  id: string;
};

function makeId() {
  // Safe in all environments (SSR won't execute because of "use client", but this keeps TS happy)
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export default function Page() {
  const [title, setTitle] = useState("Untitled Form");
  const [fields, setFields] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  function addField(t: FieldType) {
    const id = makeId();
    setFields((f) => [
      ...f,
      {
        id,
        label: "Question",
        type: t,
        required: false,
        options: t !== "text" ? ["Option 1"] : undefined,
        min: t === "rating" ? 1 : undefined,
        max: t === "rating" ? 5 : undefined,
      },
    ]);
  }

  // Drag and drop
  const dragIndex = useRef<number | null>(null);
  function onDragStart(idx: number) {
    dragIndex.current = idx;
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(idx: number) {
    const from = dragIndex.current;
    if (from === null || from === idx) return;
    setFields((prev) => {
      const arr = [...prev];
      const [it] = arr.splice(from, 1);
      arr.splice(idx, 0, it);
      return arr;
    });
    dragIndex.current = null;
  }

  async function save(status: "draft" | "published") {
    try {
      setSaving(true);
      const body: CreateFormPayload = { title, status, fields };
      const data = (await createForm(body)) as CreateFormResponse;
      setFormId(data.id);
    } finally {
      setSaving(false);
    }
  }

  function removeField(fieldId: string) {
    setFields((f) => f.filter((field) => field.id !== fieldId));
  }

  function duplicateField(fieldId: string) {
    const field = fields.find((f) => f.id === fieldId);
    if (field) {
      const newField: Field = {
        ...field,
        id: makeId(),
        label: `${field.label} (Copy)`,
      };
      setFields((f) => [...f, newField]);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex-1 w-full">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl lg:text-3xl font-bold bg-transparent outline-none border-b-2 border-gray-200 dark:border-gray-600 pb-2 focus:border-blue-500 transition-colors"
                placeholder="Enter your form title..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors font-medium"
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
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  Add Fields
                </h3>
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
                    onClick={() => addField("multiple_choice")}
                    className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔘</span>
                      <div>
                        <div className="font-medium">Multiple Choice</div>
                        <div className="text-sm text-gray-500">Radio buttons</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => addField("checkboxes")}
                    className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">☑️</span>
                      <div>
                        <div className="font-medium">Checkboxes</div>
                        <div className="text-sm text-gray-500">Multiple selection</div>
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
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
                <div className="space-y-6 max-w-2xl mx-auto">
                  {fields.map((f) => (
                    <div
                      key={f.id}
                      className="p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl"
                    >
                      <label className="block text-lg font-medium mb-4">
                        {f.label}
                        {f.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {f.type === "text" && (
                        <input
                          className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:border-blue-500 transition-colors"
                          placeholder="Your answer..."
                        />
                      )}
                      {f.type === "multiple_choice" && (
                        <div className="space-y-3">
                          {f.options?.map((o: string, idx) => (
                            <label
                              key={idx}
                              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            >
                              <input type="radio" name={f.id} className="w-4 h-4" />
                              <span className="text-lg">{o}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {f.type === "checkboxes" && (
                        <div className="space-y-3">
                          {f.options?.map((o: string, idx) => (
                            <label
                              key={idx}
                              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            >
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
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-sm">{f.max ?? 5}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <span className="text-6xl mb-4 block">📝</span>
                      <p className="text-xl">No fields added yet</p>
                      <p>Switch to edit mode to add fields</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                {fields.map((f, i) => (
                  <div
                    key={f.id}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(i)}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-all group"
                  >
                    {/* Field Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <span className="cursor-grab text-gray-400 hover:text-gray-600 text-xl">⠿</span>
                      <input
                        value={f.label}
                        onChange={(e) =>
                          setFields((x) =>
                            x.map((y) => (y.id === f.id ? { ...y, label: e.target.value } : y))
                          )
                        }
                        className="flex-1 text-lg font-medium bg-transparent outline-none border-b-2 border-gray-200 dark:border-gray-600 pb-1 focus:border-blue-500 transition-colors"
                        placeholder="Enter question..."
                      />
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {f.type.replace("_", " ")}
                      </span>
                    </div>

                    {/* Field Options */}
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!f.required}
                          onChange={(e) =>
                            setFields((x) =>
                              x.map((y) => (y.id === f.id ? { ...y, required: e.target.checked } : y))
                            )
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Required</span>
                      </label>

                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={() => duplicateField(f.id)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Duplicate field"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => removeField(f.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete field"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Field-specific options */}
                    {f.type !== "text" && (
                      <div className="space-y-3 mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Options:</h4>
                        {(f.options || []).map((o, oi) => (
                          <div key={oi} className="flex gap-3 items-center">
                            <input
                              value={o}
                              onChange={(e) =>
                                setFields((x) =>
                                  x.map((y) =>
                                    y.id === f.id
                                      ? {
                                          ...y,
                                          options: (y.options || []).map((oo, ooi) =>
                                            ooi === oi ? e.target.value : oo
                                          ),
                                        }
                                      : y
                                  )
                                )
                              }
                              className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-blue-500 transition-colors"
                              placeholder={`Option ${oi + 1}`}
                            />
                            <button
                              onClick={() =>
                                setFields((x) =>
                                  x.map((y) =>
                                    y.id === f.id
                                      ? { ...y, options: (y.options || []).filter((_, ooi) => ooi !== oi) }
                                      : y
                                  )
                                )
                              }
                              className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            setFields((x) =>
                              x.map((y) =>
                                y.id === f.id
                                  ? {
                                      ...y,
                                      options: [...(y.options || []), `Option ${(y.options?.length || 0) + 1}`],
                                    }
                                  : y
                              )
                            )
                          }
                          className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                        >
                          + Add Option
                        </button>
                      </div>
                    )}

                    {f.type === "rating" && (
                      <div className="flex gap-4 items-center">
                        <label className="flex items-center gap-2">
                          <span className="text-sm font-medium">Min:</span>
                          <input
                            type="number"
                            value={f.min ?? 1}
                            onChange={(e) =>
                              setFields((x) =>
                                x.map((y) =>
                                  y.id === f.id ? { ...y, min: parseInt(e.target.value, 10) } : y
                                )
                              )
                            }
                            className="w-20 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-blue-500"
                          />
                        </label>
                        <label className="flex items-center gap-2">
                          <span className="text-sm font-medium">Max:</span>
                          <input
                            type="number"
                            value={f.max ?? 5}
                            onChange={(e) =>
                              setFields((x) =>
                                x.map((y) =>
                                  y.id === f.id ? { ...y, max: parseInt(e.target.value, 10) } : y
                                )
                              )
                            }
                            className="w-20 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-blue-500"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}

                {fields.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                    <span className="text-6xl mb-4 block">🚀</span>
                    <h3 className="text-2xl font-bold mb-2">Start Building Your Form</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Add fields from the sidebar to get started
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {formId && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className="text-lg font-medium">Form created successfully!</span>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`/forms/${formId}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Edit Form
                </a>
                <a
                  href={`/forms/${formId}/share`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Share Form
                </a>
                <a
                  href={`/forms/${formId}/analytics`}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  View Analytics
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
