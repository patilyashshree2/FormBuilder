const API = process.env.NEXT_PUBLIC_API_URL!;

function getAuthHeaders(): Record<string, string> {
  // Avoid using localStorage during SSR
  if (typeof window === "undefined") return {};

  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createForm(body: any) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const res = await fetch(`${API}/api/forms`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getAllForms() {
  const res = await fetch(`${API}/api/forms`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load forms");
  return res.json();
}

export async function getForm(id: string) {
  const res = await fetch(`${API}/api/forms/${id}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load form");
  return res.json();
}

export async function updateForm(id: string, body: any) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const res = await fetch(`${API}/api/forms/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitResponse(id: string, answers: Record<string, any>) {
  const res = await fetch(`${API}/api/forms/${id}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAnalytics(id: string) {
  const res = await fetch(`${API}/api/forms/${id}/analytics`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function exportCSV(id: string) {
  const res = await fetch(`${API}/api/forms/${id}/export.csv`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to export CSV");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `form-${id}-responses.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
