import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen overflow-hidden px-3 py-3 md:px-4">
      <div className="grid h-full w-full gap-3 xl:grid-cols-[264px_minmax(0,1fr)]">
        <AppSidebar />
        <div className="flex min-h-0 flex-col gap-3">
          <AppTopbar />
          <div className="min-h-0 flex-1 overflow-auto rounded-[1.75rem] border border-white/70 bg-white/78 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-5">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
