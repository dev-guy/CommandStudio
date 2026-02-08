import { createBrowserRouter } from "react-router-dom";

import { SchedulerDashboard } from "@/pages/scheduler-dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <SchedulerDashboard />,
  },
]);

export default router;
