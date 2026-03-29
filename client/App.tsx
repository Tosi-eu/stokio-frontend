import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense, useEffect, type ReactNode } from "react";

import { AuthProvider } from "./context/auth-context";
import PrivateRoute from "./pages/PrivateRoute";
import ModuleRoute from "./pages/ModuleRoute";
import { NotificationProvider } from "./context/notification.context";
import { TenantProvider } from "./context/tenant-context";
import {
  InvalidSessionProvider,
  useInvalidSession,
} from "./context/invalid-session.context";
import { LoadingFallback } from "./components/LoadingFallback";
import { AppShellLayout } from "./components/AppShellLayout";
import { InvalidSessionModal } from "./components/InvalidSessionModal";
import { toast } from "@/hooks/use-toast.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { useTenant } from "@/hooks/use-tenant.hook";

const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SignUpMedicine = lazy(() => import("./pages/RegisterMedicine"));
const Movements = lazy(() => import("./pages/Movements"));
const Stock = lazy(() => import("./pages/Stock"));
const StockEntry = lazy(() => import("./pages/StockIn"));
const Resident = lazy(() => import("./pages/Residents"));
const RegisterResident = lazy(() => import("./pages/RegisterResident"));
const EditResident = lazy(() => import("./pages/EditResident"));
const StockOut = lazy(() => import("./pages/StockOut"));
const EditStock = lazy(() => import("./pages/EditStock"));
const EditMedicine = lazy(() => import("./pages/EditMedicine"));
const EditInput = lazy(() => import("./pages/EditInput"));
const Medicines = lazy(() => import("./pages/Medicines"));
const Cabinets = lazy(() => import("./pages/Cabinets"));
const RegisterCabinet = lazy(() => import("./pages/RegisterCabinet"));
const EditCabinet = lazy(() => import("./pages/EditCabinet"));
const RegisterInput = lazy(() => import("./pages/RegisterInput"));
const Inputs = lazy(() => import("./pages/Inputs"));
const Drawers = lazy(() => import("./pages/Drawers"));
const EditDrawer = lazy(() => import("./pages/EditDrawer"));
const RegisterDrawer = lazy(() => import("./pages/RegisterDrawer"));
const TransferReport = lazy(() => import("./pages/TransferReport"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const TenantOnboarding = lazy(() => import("./pages/TenantOnboarding"));
const PostLoginRedirect = lazy(() => import("./pages/PostLoginRedirect"));

const queryClient = new QueryClient();

function TenantProviderWithUserKey({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <TenantProvider key={user?.id ?? "none"}>{children}</TenantProvider>;
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/user/login" replace />;
  return <Navigate to="/loading" replace />;
}

const AppContent = () => {
  const { showModal, setShowModal } = useInvalidSession();
  const { user } = useAuth();
  const { onboardingComplete, loading: tenantLoading } = useTenant();

  const location = useLocation();

  const needsSetup = Boolean(user && !tenantLoading && !onboardingComplete);

  const isOnboardingPath = location.pathname === "/tenant/onboarding";

  useEffect(() => {
    const handleInvalidSession = () => {
      setShowModal(true);
    };

    window.addEventListener("invalid-session", handleInvalidSession);
    return () => {
      window.removeEventListener("invalid-session", handleInvalidSession);
    };
  }, [setShowModal]);

  useEffect(() => {
    const handler = (e: Event) => {
      const message =
        (e as CustomEvent<{ message?: string }>).detail?.message ||
        "Você não tem os privilégios necessários. Contate o administrador.";
      toast({
        title: message,
        variant: "error",
        duration: 5000,
      });
    };
    window.addEventListener("insufficient-privileges", handler);
    return () => window.removeEventListener("insufficient-privileges", handler);
  }, []);

  if (needsSetup && !isOnboardingPath) {
    return <Navigate to="/tenant/onboarding" replace />;
  }

  return (
    <>
      <InvalidSessionModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/inicio" element={<Navigate to="/loading" replace />} />
        <Route
          path="/loading"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback title="A carregar…" />}>
                <PostLoginRedirect />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/user/login"
          element={
            <Suspense
              fallback={<LoadingFallback title="Carregando login..." />}
            >
              <Auth />
            </Suspense>
          }
        />
        <Route
          path="/user/forgot-password"
          element={
            <Suspense fallback={<LoadingFallback title="Carregando..." />}>
              <ForgotPassword />
            </Suspense>
          }
        />

        <Route
          path="/tenant/onboarding"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <LoadingFallback title="Carregando configuração..." />
                }
              >
                <TenantOnboarding />
              </Suspense>
            </PrivateRoute>
          }
        />

        <Route element={<PrivateRoute />}>
          <Route element={<AppShellLayout />}>
            <Route
              path="/dashboard"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando dashboard..." />}
                >
                  <ModuleRoute moduleKey="dashboard">
                    <Dashboard />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/movements"
              element={
                <Suspense
                  fallback={
                    <LoadingFallback title="Carregando movimentações..." />
                  }
                >
                  <ModuleRoute moduleKey="movements">
                    <Movements />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/medicines"
              element={
                <Suspense
                  fallback={
                    <LoadingFallback title="Carregando medicamentos..." />
                  }
                >
                  <ModuleRoute moduleKey="medicines">
                    <Medicines />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/medicines/register"
              element={
                <Suspense
                  fallback={
                    <LoadingFallback title="Carregando formulário..." />
                  }
                >
                  <ModuleRoute moduleKey="medicines">
                    <SignUpMedicine />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/medicines/edit"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando edição..." />}
                >
                  <ModuleRoute moduleKey="medicines">
                    <EditMedicine />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/stock"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando estoque..." />}
                >
                  <ModuleRoute moduleKey="stock">
                    <Stock />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/stock/in"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando entrada..." />}
                >
                  <ModuleRoute moduleKey="stock">
                    <StockEntry />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/stock/out"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando saída..." />}
                >
                  <ModuleRoute moduleKey="stock">
                    <StockOut />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/stock/edit"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando edição..." />}
                >
                  <ModuleRoute moduleKey="stock">
                    <EditStock />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/residents"
              element={
                <Suspense
                  fallback={
                    <LoadingFallback title="Carregando residentes..." />
                  }
                >
                  <ModuleRoute moduleKey="residents">
                    <Resident />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/residents/register"
              element={
                <Suspense
                  fallback={
                    <LoadingFallback title="Carregando formulário..." />
                  }
                >
                  <ModuleRoute moduleKey="residents">
                    <RegisterResident />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/residents/edit"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando edição..." />}
                >
                  <ModuleRoute moduleKey="residents">
                    <EditResident />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/inputs"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando insumos..." />}
                >
                  <ModuleRoute moduleKey="inputs">
                    <Inputs />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/inputs/register"
              element={
                <Suspense
                  fallback={
                    <LoadingFallback title="Carregando formulário..." />
                  }
                >
                  <ModuleRoute moduleKey="inputs">
                    <RegisterInput />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/inputs/edit"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando edição..." />}
                >
                  <ModuleRoute moduleKey="inputs">
                    <EditInput />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/cabinets"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando armários..." />}
                >
                  <ModuleRoute moduleKey="cabinets">
                    <Cabinets />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/cabinets/register"
              element={
                <Suspense
                  fallback={
                    <LoadingFallback title="Carregando formulário..." />
                  }
                >
                  <ModuleRoute moduleKey="cabinets">
                    <RegisterCabinet />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/cabinets/edit"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando edição..." />}
                >
                  <ModuleRoute moduleKey="cabinets">
                    <EditCabinet />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/drawers"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando gavetas..." />}
                >
                  <ModuleRoute moduleKey="drawers">
                    <Drawers />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/drawer/register"
              element={
                <Suspense
                  fallback={
                    <LoadingFallback title="Carregando formulário..." />
                  }
                >
                  <ModuleRoute moduleKey="drawers">
                    <RegisterDrawer />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/drawers/edit"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando edição..." />}
                >
                  <ModuleRoute moduleKey="drawers">
                    <EditDrawer />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/user/profile"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando perfil..." />}
                >
                  <ModuleRoute moduleKey="profile">
                    <Profile />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/reports/transfers"
              element={
                <Suspense
                  fallback={<LoadingFallback title="Carregando relatório..." />}
                >
                  <ModuleRoute moduleKey="reports">
                    <TransferReport />
                  </ModuleRoute>
                </Suspense>
              }
            />
            <Route
              path="/admin"
              element={
                <Suspense
                  fallback={
                    <LoadingFallback title="Carregando painel administrativo..." />
                  }
                >
                  <ModuleRoute moduleKey="admin">
                    <AdminPanel />
                  </ModuleRoute>
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <TenantProviderWithUserKey>
            <NotificationProvider>
              <InvalidSessionProvider>
                <AppContent />
              </InvalidSessionProvider>
            </NotificationProvider>
          </TenantProviderWithUserKey>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
