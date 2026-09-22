import { Suspense } from "react";
import { Loading } from "../../components/ui/Loading";
import { useMode } from "../../app/modes/ModeProvider";
import { MODE_DASHBOARDS } from "../../app/registry/dashboards";

export function ModeDashboard() {
  const { modeId } = useMode();
  const DashboardComponent = MODE_DASHBOARDS[modeId];

  return (
    <Suspense fallback={<Loading />}>
      <DashboardComponent />
    </Suspense>
  );
}

export default ModeDashboard;