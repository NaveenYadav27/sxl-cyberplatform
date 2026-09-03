export const getBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;
  
  if (typeof window !== 'undefined') {
    // If accessed from a public/remote URL, talk to the local Python backend on localhost:8000
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'http://localhost:8000/api/v1';
    }
  }
  return '/api/v1';
};

export const getWsHost = (): string => {
  const envHost = (import.meta as any).env?.VITE_WS_HOST;
  if (envHost) return envHost;
  
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '127.0.0.1:8000';
    }
  }
  return '127.0.0.1:8000';
};

export const BASE_URL = getBaseUrl();
export const WS_HOST = getWsHost();
