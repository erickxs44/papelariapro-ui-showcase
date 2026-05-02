import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "../components/app-sidebar";
import { Topbar } from "../components/topbar";
import { FAB } from "../components/FAB";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const isLogged = localStorage.getItem("isLoggedIn");
    if (isLogged !== "true") {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground gradient-bg">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
      <FAB />
    </div>
  );
}