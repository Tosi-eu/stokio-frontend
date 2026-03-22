import { getBackendHealthCheck } from "@/api/requests";
import { APP_PUBLIC_LOGO_URL, APP_PUBLIC_NAME } from "@/constants/app-branding";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await getBackendHealthCheck();
        if (res?.status === "ok") {
          setProgress(100);
          clearInterval(intervalId);
          setTimeout(() => navigate("/user/login"), 500);
        } else {
          throw new Error("Backend ainda não pronto");
        }
      } catch {
        setProgress((prev) => Math.min(prev + 5, 90));
      }
    };

    const intervalId = setInterval(checkBackend, 800);

    return () => clearInterval(intervalId);
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center bg-brand-mesh px-6">
      <img
        src={APP_PUBLIC_LOGO_URL}
        alt={APP_PUBLIC_NAME}
        className="w-48 h-auto max-h-32 object-contain mb-4 drop-shadow-md"
      />
      <h1 className="font-display text-foreground font-semibold text-3xl mb-6 tracking-tight text-center">
        {APP_PUBLIC_NAME}
      </h1>

      <div className="w-64 h-2.5 bg-muted rounded-full overflow-hidden shadow-inner ring-1 ring-border/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(88_48%_52%)] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
