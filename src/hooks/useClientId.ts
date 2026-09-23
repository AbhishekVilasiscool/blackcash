import { useState, useEffect } from "react";

export function useClientId(): number {
  const [clientId, setClientId] = useState<number>(1);

  useEffect(() => {
    // localStorage access itself throws when site storage is blocked.
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("blackcash-client-id");
    } catch {
      return;
    }
    if (stored) {
      setClientId(parseInt(stored, 10));
    } else {
      try {
        localStorage.setItem("blackcash-client-id", "1");
      } catch {
        // Best-effort only; default client id 1 still works for this session.
      }
    }
  }, []);

  return clientId;
}