"use client";

import React from "react";
import AdminPortal from "./AdminPortal";

interface AdminDashboardProps {
  trip?: any;
  onOpenTripManager?: () => void;
  onSelectStudentForView?: (studentCode: string) => void;
}

export default function AdminDashboard(_props: AdminDashboardProps) {
  return <AdminPortal />;
}
