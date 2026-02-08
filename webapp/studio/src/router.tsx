import { createBrowserRouter, redirect } from "react-router-dom";

import { loadCurrentUser } from "@/lib/auth";
import { LoginPage } from "@/pages/login";
import { SchedulerDashboard } from "@/pages/scheduler-dashboard";

const requireAuthenticated = async () => {
  const user = await loadCurrentUser();

  if (!user) {
    throw redirect("/login");
  }

  return user;
};

const requireAnonymous = async () => {
  const user = await loadCurrentUser();

  if (user) {
    throw redirect("/");
  }

  return null;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <SchedulerDashboard />,
    loader: requireAuthenticated,
  },
  {
    path: "/login",
    element: <LoginPage />,
    loader: requireAnonymous,
  },
]);

export default router;
