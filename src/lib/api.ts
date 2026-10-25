export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Can't connect to the StatVerse server. Make sure npm run dev is running, then refresh this page.");
    }
    throw error;
  }
  const body = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(body.error || "The request could not be completed.");
  return body;
}
