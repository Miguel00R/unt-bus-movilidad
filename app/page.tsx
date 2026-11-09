"use client";

import React, { useState, useEffect } from "react";
import LoginPage from "@/components/LoginPage";
import AdminPortal, { PortalRole } from "@/components/AdminPortal";
import { AuthUser } from "@/lib/auth";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("unt_auth_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("unt_auth_user", JSON.stringify(user));
      localStorage.setItem("unt_bus_active_role", user.role);
    } catch {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("unt_auth_user");
      localStorage.removeItem("unt_bus_active_role");
      localStorage.removeItem("unicontrol_user_role");
    } catch {}
  };

  // 1. If not authenticated, render Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Map authenticated role to AdminPortal role
  let initialRole: PortalRole = "admin";
  if (currentUser.role === "DRIVER") {
    initialRole = "operador";
  } else if (currentUser.role === "STUDENT") {
    initialRole = "estudiante";
  }

  // 3. Render Modern Admin Portal
  return (
    <AdminPortal
      currentUser={currentUser}
      initialRole={initialRole}
      onLogout={handleLogout}
    />
  );
}
