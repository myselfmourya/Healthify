import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Suspense, lazy } from "react";
const Home = lazy(() => import("@/pages/Home"));
const Consultations = lazy(() => import("@/pages/Consultations"));
const HealthLocker = lazy(() => import("@/pages/HealthLocker"));
const Information = lazy(() => import("@/pages/Information"));
const Settings = lazy(() => import("@/pages/Settings"));
const Radar = lazy(() => import("@/pages/advanced/Radar"));
const Mental = lazy(() => import("@/pages/advanced/Mental"));
const Lifestyle = lazy(() => import("@/pages/advanced/Lifestyle"));
const Alerts = lazy(() => import("@/pages/advanced/Alerts"));
const Family = lazy(() => import("@/pages/advanced/Family"));
const Emergency = lazy(() => import("@/pages/advanced/Emergency"));
const Medicine = lazy(() => import("@/pages/advanced/Medicine"));
const Insurance = lazy(() => import("@/pages/advanced/Insurance"));
const Learning = lazy(() => import("@/pages/advanced/Learning"));
const MiyaVoice = lazy(() => import("@/pages/advanced/MiyaVoice"));
const Support = lazy(() => import("@/pages/advanced/Support"));
const AIFeatures = lazy(() => import("@/pages/AIFeatures"));
const NotFound = lazy(() => import("@/pages/not-found"));
import { Logo } from "@/components/Logo";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";

// Wrapper to prevent "Rendered fewer hooks" error when switching modes
function AIRoute() {
  const { user } = useUser();
  if (user.appMode === "advanced") return <MiyaVoice />;
  return <AIFeatures />;
}

function AppRoutes() {
  const { isOnboarded, user } = useUser();
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-blue-600">
        <div className="w-20 h-20 animate-pulse text-white drop-shadow-2xl">
          <Logo />
        </div>
      </div>
    }>
      {!isOnboarded && <OnboardingModal />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/consult" component={Consultations} />
        <Route path="/ai" component={AIRoute} />
        <Route path="/records" component={HealthLocker} />
        <Route path="/info" component={Information} />
        <Route path="/settings" component={Settings} />
        <Route path="/advanced/radar" component={Radar} />
        <Route path="/advanced/mental" component={Mental} />
        <Route path="/advanced/lifestyle" component={Lifestyle} />
        <Route path="/advanced/alerts" component={Alerts} />
        <Route path="/advanced/family" component={Family} />
        <Route path="/advanced/emergency" component={Emergency} />
        <Route path="/advanced/medicine" component={Medicine} />
        <Route path="/advanced/insurance" component={Insurance} />
        <Route path="/advanced/learning" component={Learning} />
        <Route path="/advanced/support" component={Support} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <LanguageProvider>
            <NotificationProvider>
              <TooltipProvider>
                <OfflineIndicator />
                <Toaster />
                <AppRoutes />
              </TooltipProvider>
            </NotificationProvider>
          </LanguageProvider>
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}