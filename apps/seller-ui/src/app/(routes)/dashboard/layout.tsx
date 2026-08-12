import React from "react";
import DashboardShell from "@/shared/components/sidebar/shell";

const layout = ({ children }: { children: React.ReactNode }) => {
  return <DashboardShell>{children}</DashboardShell>;
};

export default layout;
