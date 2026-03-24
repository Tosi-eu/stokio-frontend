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
        <Route
          path="/inicio"
          element={<Navigate to="/loading" replace />}
        />
        <Route
          path="/loading"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="A carregar…" />}
              >
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

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando dashboard..." />}
              >
                <ModuleRoute moduleKey="dashboard">
                  <Dashboard />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/movements"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <LoadingFallback title="Carregando movimentações..." />
                }
              >
                <ModuleRoute moduleKey="movements">
                  <Movements />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/medicines"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <LoadingFallback title="Carregando medicamentos..." />
                }
              >
                <ModuleRoute moduleKey="medicines">
                  <Medicines />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/medicines/register"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando formulário..." />}
              >
                <ModuleRoute moduleKey="medicines">
                  <SignUpMedicine />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/medicines/edit"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando edição..." />}
              >
                <ModuleRoute moduleKey="medicines">
                  <EditMedicine />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando estoque..." />}
              >
                <ModuleRoute moduleKey="stock">
                  <Stock />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock/in"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando entrada..." />}
              >
                <ModuleRoute moduleKey="stock">
                  <StockEntry />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock/out"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando saída..." />}
              >
                <ModuleRoute moduleKey="stock">
                  <StockOut />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock/edit"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando edição..." />}
              >
                <ModuleRoute moduleKey="stock">
                  <EditStock />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/residents"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando residentes..." />}
              >
                <ModuleRoute moduleKey="residents">
                  <Resident />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/residents/register"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando formulário..." />}
              >
                <ModuleRoute moduleKey="residents">
                  <RegisterResident />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/residents/edit"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando edição..." />}
              >
                <ModuleRoute moduleKey="residents">
                  <EditResident />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/inputs"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando insumos..." />}
              >
                <ModuleRoute moduleKey="inputs">
                  <Inputs />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/inputs/register"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando formulário..." />}
              >
                <ModuleRoute moduleKey="inputs">
                  <RegisterInput />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/inputs/edit"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando edição..." />}
              >
                <ModuleRoute moduleKey="inputs">
                  <EditInput />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/cabinets"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando armários..." />}
              >
                <ModuleRoute moduleKey="cabinets">
                  <Cabinets />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/cabinets/register"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando formulário..." />}
              >
                <ModuleRoute moduleKey="cabinets">
                  <RegisterCabinet />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/cabinets/edit"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando edição..." />}
              >
                <ModuleRoute moduleKey="cabinets">
                  <EditCabinet />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/drawers"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando gavetas..." />}
              >
                <ModuleRoute moduleKey="drawers">
                  <Drawers />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/drawer/register"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando formulário..." />}
              >
                <ModuleRoute moduleKey="drawers">
                  <RegisterDrawer />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/drawers/edit"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando edição..." />}
              >
                <ModuleRoute moduleKey="drawers">
                  <EditDrawer />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando perfil..." />}
              >
                <ModuleRoute moduleKey="profile">
                  <Profile />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
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
          path="/reports/transfers"
          element={
            <PrivateRoute>
              <Suspense
                fallback={<LoadingFallback title="Carregando relatório..." />}
              >
                <ModuleRoute moduleKey="reports">
                  <TransferReport />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <LoadingFallback title="Carregando painel administrativo..." />
                }
              >
                <ModuleRoute moduleKey="admin">
                  <AdminPanel />
                </ModuleRoute>
              </Suspense>
            </PrivateRoute>
          }
        />
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
