import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Use Supabase Edge Functions instead of Express server
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";
const API_BASE: string = `${SUPABASE_URL}/functions/v1`;

export const apiRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any
): Promise<Response> => {
  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('Session debug:', { session: !!session, token: session?.access_token ? 'present' : 'missing' })
  
  const headers: Record<string, string> = {}
  
  // Only set Content-Type for JSON data, not FormData
  if (!(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
    console.log('Added Authorization header')
  }

  const config: RequestInit = {
    method,
    headers,
  }

  if (data && method !== 'GET') {
    config.body = data instanceof FormData ? data : JSON.stringify(data)
  }

  const url = `${SUPABASE_URL}/functions/v1${endpoint}`
  console.log('Making API request to:', url)
  
  const response = await fetch(url, config)
  console.log('API response status:', response.status)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('API error response:', errorText)
    throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`)
  }
  
  return response
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const raw = queryKey[0] as string;
    const finalUrl = raw.startsWith("http") ? raw : `${API_BASE}${raw}`;
    const { data: { session } } = await supabase.auth.getSession();
    const hdrs: Record<string,string> = {};
    if (session?.access_token) {
      hdrs["Authorization"] = `Bearer ${session.access_token}`;
    }
    
    const res = await fetch(finalUrl, {
      headers: hdrs,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
