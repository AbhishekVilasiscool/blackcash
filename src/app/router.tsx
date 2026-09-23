import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Loading } from "../components/ui/Loading";
import { ContactDetailPage } from "../features/contacts/ContactDetailPage";
import { ModeDashboard } from "../features/dashboard/ModeDashboard";
import { MODULES, ModuleProvider, type ModuleDef } from "./registry";

function ModuleView({ def }: { def: ModuleDef }) {
  const Component = def.component;
  return (
    <ModuleProvider def={def}>
      <Suspense fallback={<Loading />}>
        <Component />
      </Suspense>
    </ModuleProvider>
  );
}

// Dev-only styleguide route
const isDev = import.meta.env.DEV;
const StyleguidePage = isDev ? lazy(() => import("../features/styleguide/StyleguidePage")) : null;
// Dev Hub route (always available, standalone)
const DevHubPage = lazy(() => import("../features/devhub/DevHubPage"));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ModeDashboard />} />
      {MODULES.filter((def) => def.id !== "dashboard").map((def) => (
        <Route key={def.id} path={def.path} element={<ModuleView def={def} />} />
      ))}
      <Route path="/contacts/:contactId" element={<ContactDetailPage />} />
      <Route path="/dev" element={<Suspense fallback={<Loading />}><DevHubPage /></Suspense>} />
      {isDev && StyleguidePage && (
        <Route path="/styleguide" element={<Suspense fallback={<Loading />}><StyleguidePage /></Suspense>} />
      )}
      <Route path="*" element={<ModeDashboard />} />
    </Routes>
  );
}