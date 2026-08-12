import DashboardShell from "../../shared/components/sidebar/shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
