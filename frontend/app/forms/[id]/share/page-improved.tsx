"use client";
import { useEffect, useState } from "react";
import { getForm, submitResponse } from "../../../api-client";

export default function Share({ params }: { params: { id: string } }) {
  const id = params.id;
  const [form, setForm] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => { 
    getForm(id)
      .then(setForm)
      .catch(() => setError("Form not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center max-w-md">
          <span className="text-6xl mb-4 block">❌</span>
          <h2 className="text-2xl font-bold mb-2">Form Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The form you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (form.status !== "published") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center max-w-md">
          <span className="text-6xl mb-4 block">🚧</span>
          <h2 className="text-2xl font-bold mb-2">Form Not Available</h2>
          <p className="text-gray-600 dark:text-gray-400">This form is currently in draft mode and not accepting responses.</p>
        </div>
      </div>
    );
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
        if (v === undefined || v === null || v === "") return `Please answer: ${f.label}`;
        if (Array.isArray(v) && v.length === 0) return `Please select at least one option for: ${f.label}`;
      }
      if (f.type === "rating") {
        const min = f.min ?? 1, max = f.max ?? 5;
        if (v !== undefined && (v < min || v > max)) return `Rating must be between ${min} and ${max} for: ${f.label}`;
      }
    }
    return null;
  }

  async function onSubmit() {
    const err = validate();
    if (err) { 
      setError(err); 
      return; 
    }
    
    setError(null);
    setSubmitting(true);
    
    try {
      await submitResponse(id, answers);
      setDone(true);
    } catch (error) {
      setError("Failed to submit response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const visibleFields = form.fields.filter(visible);
  const progress = visibleFields.length > 0 ? (Object.keys(answers).length / visibleFields.length) * 100 : 0;

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Thank You!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Your response has been submitted successfully.</p>
          </div>
          <div className="space-y-3">
            <a 
              href={`/forms/${id}/analytics`}
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View Results
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="block w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors font-medium"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">
            {form.title}
          </h1>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {visibleFields.map((f: any, index: number) => (
            <div key={f.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 lg:p-8 transition-all duration-200 hover:shadow-xl">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-2">
                  <label className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {f.label}
                    {f.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {index + 1} of {visibleFields.length}
                  </span>
                </div>
                {f.type !== "text" && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {f.type === "multiple_choice" && "Select one option"}
                    {f.type === "checkboxes" && "Select all that apply"}
                    {f.type === "rating" && `Rate from ${f.min ?? 1} to ${f.max ?? 5}`}
                  </p>
                )}
              </div>

              {f.type === "text" && (
                <textarea 
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all resize-none"
                  rows={3}
                  placeholder="Type your answer here..."
                  value={answers[f.id] || ""}
                  onChange={e => setAnswers(a => ({ ...a, [f.id]: e.target.value }))}
                />
              )}

              {f.type === "multiple_choice" && (
                <div className="space-y-3">
                  {f.options?.map((o: string, idx: number) => (
                    <label key={idx} className="flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all">
                      <input 
                        type="radio" 
                        name={f.id} 
                        value={o}
                        checked={answers[f.id] === o}
                        onChange={() => setAnswers(a => ({ ...a, [f.id]: o }))}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-lg text-gray-700 dark:text-gray-300">{o}</span>
                    </label>
                  ))}
                </div>
              )}

              {f.type === "checkboxes" && (
                <div className="space-y-3">
                  {f.options?.map((o: string, idx: number) => (
                    <label key={idx} className="flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all">
                      <input 
                        type="checkbox" 
                        checked={(answers[f.id] || []).includes(o)}
                        onChange={(e) => setAnswers(a => {
                          const prev: string[] = Array.isArray(a[f.id]) ? a[f.id] : [];
                          if (e.target.checked) return { ...a, [f.id]: [...prev, o] };
                          return { ...a, [f.id]: prev.filter(x => x !== o) };
                        })}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-lg text-gray-700 dark:text-gray-300">{o}</span>
                    </label>
                  ))}
                </div>
              )}

              {f.type === "rating" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{f.min ?? 1} (Lowest)</span>
                    <span>{f.max ?? 5} (Highest)</span>
                  </div>
                  <div className="flex justify-center">
                    <input 
                      type="range" 
                      min={f.min ?? 1} 
                      max={f.max ?? 5} 
                      value={answers[f.id] || f.min ?? 1}
                      onChange={e => setAnswers(a => ({ ...a, [f.id]: parseFloat(e.target.value) }))}
                      className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div className="text-center">
                    <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xl font-bold">
                      {answers[f.id] || f.min ?? 1}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <button 
            onClick={onSubmit} 
            disabled={submitting}
            className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </div>
            ) : (
              "Submit Response"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
