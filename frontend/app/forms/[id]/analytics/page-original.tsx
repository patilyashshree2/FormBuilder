"use client";
import { useEffect, useState } from "react";
import { fetchAnalytics, getForm } from "../../../api-client";

const WS = process.env.NEXT_PUBLIC_WS_URL!;

export default function Analytics({ params }: { params: { id: string } }) {
  const id = params.id;
  const [form, setForm] = useState<any>(null);
  const [an, setAn] = useState<any>(null);

  async function refresh() {
    setAn(await fetchAnalytics(id));
  }
  useEffect(() => { getForm(id).then(setForm); refresh(); }, [id]);
  useEffect(() => {
    const ws = new WebSocket(`${WS}/ws/forms/${id}`);
    ws.onmessage = () => refresh();
    return () => ws.close();
  }, [id]);

  if (!form || !an) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">{form.title} Analytics</div>
      <div>Responses: {an.count}</div>
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(an.fieldBreakdown).map(([fieldId, dist]: any) => {
          const field = form.fields.find((f: any) => f.id === fieldId);
          const buckets = Object.entries(dist.buckets as Record<string, number>);
          const max = buckets.reduce((m, [,v]) => Math.max(m, v), 0) || 1;
          return (
            <div key={fieldId} className="p-3 border rounded dark:border-gray-700">
              <div className="font-semibold mb-2">{field?.label || fieldId}</div>
              <div className="space-y-1">
                {buckets.map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <div className="w-32 text-sm">{k}</div>
                    <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
                      <div className="h-3 bg-blue-600" style={{ width: `${(v / max) * 100}%` }} />
                    </div>
                    <div className="w-8 text-right text-sm">{v}</div>
                  </div>
                ))}
              </div>
              {an.averageRating[fieldId] !== undefined && (
                <div className="mt-2 text-sm">Average rating: {an.averageRating[fieldId].toFixed(2)}</div>
              )}
            </div>
          );
        })}
      </div>
      <a className="underline" href={`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}/export.csv`}>Export CSV</a>
    </div>
  );
}
