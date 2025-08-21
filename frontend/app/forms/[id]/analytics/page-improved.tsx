"use client";
import { useEffect, useState } from "react";
import { fetchAnalytics, getForm } from "../../../api-client";

const WS = process.env.NEXT_PUBLIC_WS_URL!;

function asNumberRecord(obj: unknown): Record<string, number> {
  if (obj && typeof obj === "object") {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const n = Number(v);
      if (!Number.isNaN(n)) out[k] = n;
    }
    return out;
  }
  return {};
}


export default function Analytics({ params }: { params: { id: string } }) {
  const id = params.id;
  const [form, setForm] = useState<any>(null);
  const [an, setAn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const avgMap = asNumberRecord(an?.averageRating);
  const vals = Object.values(avgMap);
  const overallAverage = vals.length ? vals.reduce((s, n) => s + n, 0) / vals.length : 0;

  async function refresh() {
    try {
      const analytics = await fetchAnalytics(id);
      setAn(analytics);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  }

  useEffect(() => { 
    Promise.all([getForm(id), fetchAnalytics(id)])
      .then(([formData, analyticsData]) => {
        setForm(formData);
        setAn(analyticsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const ws = new WebSocket(`${WS}/ws/forms/${id}`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = () => refresh();
    return () => ws.close();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!form || !an) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📊</span>
          <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
          <p className="text-gray-600 dark:text-gray-400">Unable to load form analytics</p>
        </div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                {form.title} Analytics
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {connected ? 'Live Updates' : 'Disconnected'}
                </span>
                <span className="text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href={`/forms/${id}/share`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
              >
                View Form
              </a>
              <a 
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}/export.csv`}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-center"
              >
                Export CSV
              </a>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{an.count}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Form Fields</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{form.fields.length}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Rating</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {/* {overallAverage.toFixed(2)} */}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">{form.status}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <span className="text-2xl">{form.status === 'published' ? '🟢' : '🟡'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Field Analytics */}
        {Object.keys(an.fieldBreakdown).length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.entries(an.fieldBreakdown).map(([fieldId, dist]: any) => {
              const field = form.fields.find((f: any) => f.id === fieldId);
              const buckets = Object.entries(dist.buckets as Record<string, number>);
              const max = buckets.reduce((m, [,v]) => Math.max(m, v), 0) || 1;
              const total = buckets.reduce((sum, [,v]) => sum + v, 0);

              return (
                <div key={fieldId} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      {field?.label || fieldId}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                      {field?.type?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {buckets.map(([k, v]) => {
                      const percentage = total > 0 ? (v / total * 100) : 0;
                      return (
                        <div key={k} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                              {k}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{percentage.toFixed(1)}%</span>
                              <span className="font-bold text-gray-900 dark:text-gray-100">{v}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div 
                              className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${(v / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {an.averageRating[fieldId] !== undefined && (
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Average Rating
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {an.averageRating[fieldId].toFixed(2)}
                          </span>
                          <span className="text-yellow-500">⭐</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <span className="text-6xl mb-4 block">📈</span>
            <h3 className="text-2xl font-bold mb-2">No Responses Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Share your form to start collecting responses and see analytics here.
            </p>
            <a 
              href={`/forms/${id}/share`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Share Form
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
