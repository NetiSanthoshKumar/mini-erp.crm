const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : "";

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiClientError(res.status, body?.error || "Request failed", body?.details);
  }
  return body;
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, data?: unknown) => request(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path: string, data?: unknown) => request(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: (path: string, data?: unknown) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
};
