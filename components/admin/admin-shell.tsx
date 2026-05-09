"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminUsers } from "@/components/admin/admin-users";
import { AdminJobs } from "@/components/admin/admin-jobs";
import { AdminTransactions } from "@/components/admin/admin-transactions";
import { AdminDisputes } from "@/components/admin/admin-disputes";
import { AdminSkills } from "@/components/admin/admin-skills";
import { AdminSettings } from "@/components/admin/admin-settings";

type AdminPageKey =
  | "dashboard"
  | "users"
  | "jobs"
  | "transactions"
  | "disputes"
  | "skills"
  | "config";

interface AdminShellProps {
  initialPage?: AdminPageKey;
}

export function AdminShell({ initialPage = "dashboard" }: AdminShellProps) {
  const [currentPage, setCurrentPage] = useState<AdminPageKey>(initialPage);

  const renderPage = () => {
    switch (currentPage) {
      case "users":
        return <AdminUsers />;
      case "jobs":
        return <AdminJobs />;
      case "transactions":
        return <AdminTransactions />;
      case "disputes":
        return <AdminDisputes />;
      case "skills":
        return <AdminSkills />;
      // case "config":
      //   return <AdminSettings />;
      case "dashboard":
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background adshell">
      <AdminSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-auto">{renderPage()}</main>
    </div>
  );
}
