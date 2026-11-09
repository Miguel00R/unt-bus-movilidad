"use client";

import React, { useState, useEffect } from "react";
import { 
  Bus, 
  Wifi, 
  Clock, 
  GraduationCap, 
  Info, 
  ShieldCheck, 
  LogOut, 
  User, 
  ChevronDown 
} from "lucide-react";
import { Role } from "@/lib/types";
import { AuthUser } from "@/lib/auth";

interface NavbarProps {
  currentUser: AuthUser | null;
  activeRole: Role;
  onSelectRole: (role: Role) => void;
  onLogout: () => void;
  onOpenInfo: () => void;
}

export default function Navbar({
  currentUser,
  activeRole,
  onSelectRole,
  onLogout,
  onOpenInfo,
}: NavbarProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        new Intl.DateTimeFormat("es-PE", {
          timeZone: "America/Lima",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(now)
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          {/* Left: Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105">
              <img 
                src="/escudo-unt.png" 
                alt="Escudo UNT" 
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-unt-blue leading-tight">
                  UNT BUS <span className="text-unt-gold font-light">|</span> MOVILIDAD
                </h1>
                <span className="hidden md:inline-block bg-unt-blue/10 text-unt-blue text-[10px] font-bold px-2 py-0.5 rounded-full border border-unt-blue/20">
                  PWA 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Universidad Nacional de Trujillo &bull; Bienestar Universitario
              </p>
            </div>
          </div>

          {/* Center: 3 Roles Interactive Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => onSelectRole("ADMIN")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRole === "ADMIN"
                  ? "bg-unt-blue text-white shadow-md shadow-unt-blue/25"
                  : "text-slate-600 hover:text-unt-blue hover:bg-white/60"
              }`}
              title="Panel de Administración General"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-unt-gold" />
              <span className="hidden sm:inline">Admin</span>
              <span className="sm:hidden">Adm</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectRole("DRIVER")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRole === "DRIVER"
                  ? "bg-unt-blue text-white shadow-md shadow-unt-blue/25"
                  : "text-slate-600 hover:text-unt-blue hover:bg-white/60"
              }`}
              title="Terminal de Conductor / Abordaje"
            >
              <Bus className="w-3.5 h-3.5 text-unt-gold" />
              <span className="hidden sm:inline">Conductor</span>
              <span className="sm:hidden">Chofer</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectRole("STUDENT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRole === "STUDENT"
                  ? "bg-unt-blue text-white shadow-md shadow-unt-blue/25"
                  : "text-slate-600 hover:text-unt-blue hover:bg-white/60"
              }`}
              title="Portal del Alumno / Carné Digital"
            >
              <GraduationCap className="w-3.5 h-3.5 text-unt-gold" />
              <span className="hidden sm:inline">Alumno</span>
              <span className="sm:hidden">Alum</span>
            </button>
          </div>

          {/* Right: User Profile & Session Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Clock */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-unt-blue" />
              <span>{timeStr || "12:00:00"} PE</span>
            </div>

            {/* Active User Badge */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <div className="w-6 h-6 rounded-lg bg-unt-blue text-unt-gold font-black flex items-center justify-center text-[10px]">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left max-w-[130px] truncate">
                  <p className="font-bold text-slate-800 text-[11px] truncate leading-tight">
                    {currentUser.name.split(" ")[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono leading-tight">
                    {currentUser.identifier}
                  </p>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold border border-red-200 transition-colors"
              title="Cerrar sesión y volver al login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </button>

            {/* Quick Info Help Modal */}
            <button
              type="button"
              onClick={onOpenInfo}
              className="p-2 rounded-xl text-slate-500 hover:text-unt-blue hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              title="Información y Guía del Sistema"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
