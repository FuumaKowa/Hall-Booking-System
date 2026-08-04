export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Server returned non-JSON content (${res.status})`
      };
    }
    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
      error: res.ok ? undefined : (data?.error || `Request failed with status ${res.status}`)
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Network request failed'
    };
  }
}
