import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { getDefaultHomePath } from "@/helpers/default-home-route.helper";
import { APP_PUBLIC_NAME } from "@/constants/app-branding";
import { useTenantBrandLogoSrc } from "@/hooks/use-tenant-brand-logo-src.hook";

const POST_LOGIN_MIN_VISIBLE_MS = 3000;

export default function PostLoginRedirect() {
  const { loading, tenant, effectiveEnabled } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();

  const userId = user?.id;
  const userRole = user?.role;

  const doneRef = useRef(false);
  const screenStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (screenStartRef.current === null) {
      screenStartRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    if (loading || doneRef.current || screenStartRef.current === null) return;

    const path =
    getDefaultHomePath(
      (key) => effectiveEnabled.includes(key),
      { role: userRole }
    ) ?? "/user/profile";

    const elapsed = Date.now() - screenStartRef.current;
    const remaining = Math.max(0, POST_LOGIN_MIN_VISIBLE_MS - elapsed);

    const timer = window.setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      navigate(path, { replace: true });
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [loading, userId, userRole, navigate, effectiveEnabled]);

  const title = tenant?.brandName || tenant?.name || APP_PUBLIC_NAME;

  const { displaySrc: logoSrc, isLogoResolved } = useTenantBrandLogoSrc(
    tenant,
    { tenantConfigLoading: loading },
  );

  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-mesh px-6 py-10 [perspective:1800px]">
      <div
        className="flex w-full max-w-md flex-col items-center rounded-3xl border border-border/55 bg-card/85 px-8 py-10 shadow-[0_32px_64px_-24px_rgba(15,40,35,0.25),0_0_0_1px_rgba(255,255,255,0.08)_inset] ring-1 ring-black/[0.05] backdrop-blur-md transition-shadow duration-500 dark:ring-white/[0.08] sm:[transform:rotateX(5deg)]"
        style={{ transformStyle: "preserve-3d" }}
        role="status"
        aria-live="polite"
        aria-label="A preparar o seu espaço"
      >
        <div className="mb-6 flex w-full flex-col items-center">
          <span className="sr-only">Logo do abrigo</span>

          <div
            className="flex min-h-[8.5rem] w-full max-w-[300px] items-center justify-center rounded-2xl border border-border/70 bg-muted/35 p-5 shadow-inner ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
            aria-busy={!isLogoResolved}
          >
            {!isLogoResolved ? (
              <div className="min-h-[7rem] w-full max-w-[280px]" aria-hidden />
            ) : logoSrc && !imageFailed ? (
              <img
                key={logoSrc}
                src={logoSrc}
                alt={`Logo de ${title}`}
                className="max-h-[7rem] w-full object-contain object-center drop-shadow-md"
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="async"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <Building2
                className="h-16 w-16 text-muted-foreground/50"
                strokeWidth={1.25}
                aria-hidden
              />
            )}
          </div>
        </div>

        <h1 className="font-display mb-6 text-center text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>

        <div
          className="h-9 w-9 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin"
          aria-hidden
        />

        <p className="mt-4 text-center text-sm text-muted-foreground">
          A preparar o seu espaço…
        </p>
      </div>
    </div>
  );
}