import { useState, useEffect } from "react";

export function useClientId(): number {
  const [clientId, setClientId] = useState<number>(1);

  useEffect(() => {
    const stored = localStorage.getItem("blackcash-client-id");
    if (stored) {
      setClientId(parseInt(stored, 10));
    } else {
      localStorage.setItem("blackcash-client-id", "1");
    }
  }, []);

  return clientId;
}