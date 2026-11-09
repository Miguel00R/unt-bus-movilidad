"use client";

import React, { useState } from "react";
import {
  Mail,
  Lock,
  AlertCircle,
  User,
  Phone,
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  IdCard
} from "lucide-react";
import { Role } from "@/lib/types";
import { AuthUser, authenticate, registerAccount } from "@/lib/auth";
import { UNT_CAREERS } from "@/lib/mock-data";

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  // Mode toggle: Login vs Register
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Login form state
  const [identifier, setIdentifier] = useState<string>("alumno@unitru.edu.pe");
  const [password, setPassword] = useState<string>("unt2026");
  const [selectedRole, setSelectedRole] = useState<Role>("STUDENT");

  // Registration form state
  const [regName, setRegName] = useState<string>("");
  const [regLastName, setRegLastName] = useState<string>("");
  const [regCode, setRegCode] = useState<string>("");
  const [regCareer, setRegCareer] = useState<string>("Ingeniería de Sistemas");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanId = identifier.trim().toLowerCase();
    if (selectedRole === "STUDENT" && cleanId.includes("@") && !cleanId.endsWith("@unitru.edu.pe")) {
      setErrorMsg("Los alumnos deben ingresar obligatoriamente con su correo institucional (@unitru.edu.pe) o código de matrícula UNT.");
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      const result = authenticate(selectedRole, identifier, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.error || "Credenciales incorrectas");
      }
    }, 450);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith("@unitru.edu.pe")) {
      setErrorMsg("Los alumnos deben registrarse obligatoriamente con su correo institucional oficial (@unitru.edu.pe).");
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      const res = registerAccount({
        name: regName,
        lastName: regLastName,
        code: regCode,
        career: regCareer,
        phone: regPhone,
        email: cleanEmail,
        password: regPassword,
      });

      setIsLoading(false);

      if (res.success && res.user) {
        // Sincronizar nuevo alumno a la base central en el servidor
        fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REGISTER_STUDENT",
            payload: {
              estudiante: {
                id: Date.now(),
                codigo: regCode.trim(),
                nombres: regName.trim(),
                apellidos: regLastName.trim(),
                carrera: regCareer.trim(),
                lugar: "Pacasmayo",
              },
            },
          }),
        }).catch(() => { });

        setSuccessMsg("¡Cuenta creada exitosamente! Accediendo al sistema de movilidad...");
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 650);
      } else {
        setErrorMsg(res.error || "Error al crear la cuenta. Verifique los datos ingresados.");
      }
    }, 500);
  };

  const handleRolePreset = (role: Role, email: string) => {
    setSelectedRole(role);
    setIdentifier(email);
    setPassword("unt2026");
    setErrorMsg(null);
  };

  const switchToRegister = () => {
    setIsRegisterMode(true);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const switchToLogin = () => {
    setIsRegisterMode(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-y-auto font-sans select-none py-8 bg-slate-950">
      {/* Real Bus Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-[position:68%_center] sm:bg-center bg-no-repeat transition-transform duration-1000 scale-100"
        style={{
          backgroundImage: "url('/login-bg.jpg')",
        }}
      />

      {/* Atmospheric Subtle Vignette (without blurring out the bus) */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950/60 pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className={`relative z-10 w-full mx-4 my-auto transition-all duration-300 ${isRegisterMode ? "max-w-[490px]" : "max-w-[420px]"
        }`}>
        <div className="relative backdrop-blur-md border rounded-[24px] sm:rounded-[28px] p-5 sm:p-8 shadow-2xl space-y-5 bg-[#0a1526]/65 sm:bg-[#0c1829]/75 border-white/25 text-white shadow-black/80">

          {/* Header with Institutional Coat of Arms & University Title */}
          <div className="flex flex-col items-center text-center space-y-3 font-sans">
            {/* UNT Heraldic Shield Logo */}
            <div className="flex items-center justify-center gap-3.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 duration-300">
                <img
                  src="/escudo-unt.png"
                  alt="Escudo Universidad Nacional de Trujillo"
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                />
              </div>

              <div className="text-left font-sans tracking-tight leading-tight">
                <span className="block text-[12px] sm:text-[13px] font-black tracking-wider uppercase text-white">
                  Universidad
                </span>
                <span className="block text-[12px] sm:text-[13px] font-black tracking-wider uppercase text-white">
                  Nacional
                </span>
                <span className="block text-[12px] sm:text-[13px] font-black text-unt-gold tracking-wider uppercase">
                  De Trujillo
                </span>
              </div>
            </div>

            {/* Main Title */}
            <h1 className="text-lg sm:text-[21px] font-black tracking-tight uppercase leading-snug pt-1 font-sans text-white">
              {isRegisterMode ? "CREAR NUEVA CUENTA DE ESTUDIANTE" : "ACCESO AL SISTEMA DE MOVILIDAD UNT"}
            </h1>
            {isRegisterMode && (
              <p className="text-xs font-normal text-slate-300">
                Regístrate con tu código de matrícula y carné universitario UNT
              </p>
            )}
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in duration-200 bg-red-950/80 border-red-500/60 text-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in duration-200 bg-emerald-950/80 border-emerald-500/60 text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {!isRegisterMode && (
            <>
              {/* Quick Role Selector Chips (Admin, Conductor, Alumnos) */}
              <div className="flex items-center justify-center gap-1.5 p-1 rounded-xl border text-xs font-sans bg-white/5 border-white/10">
                <button
                  type="button"
                  onClick={() => handleRolePreset("STUDENT", "alumno@unitru.edu.pe")}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all text-center ${selectedRole === "STUDENT"
                      ? "bg-white/20 text-white shadow"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  Alumnos
                </button>
                <button
                  type="button"
                  onClick={() => handleRolePreset("DRIVER", "conductor@unitru.edu.pe")}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all text-center ${selectedRole === "DRIVER"
                      ? "bg-amber-600/60 text-white shadow"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  Conductor
                </button>
                <button
                  type="button"
                  onClick={() => handleRolePreset("ADMIN", "admin.transporte@unitru.edu.pe")}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all text-center ${selectedRole === "ADMIN"
                      ? "bg-blue-600/60 text-white shadow"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  Admin
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
                {/* Field 1: Correo Electrónico Institucional */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium block text-slate-300">
                      Correo Electrónico Institucional
                    </label>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                      @unitru.edu.pe
                    </span>
                  </div>

                  <div className="relative flex items-center rounded-xl px-3.5 py-2.5 transition-all border bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 focus-within:ring-1 focus-within:ring-white/40 text-white">
                    <Mail className="w-4 h-4 flex-shrink-0 mr-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="alumno@unitru.edu.pe o código UNT"
                      className="w-full bg-transparent text-sm focus:outline-none font-normal text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Field 2: Contraseña */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium block text-slate-300">
                    Contraseña
                  </label>

                  <div className="relative flex items-center rounded-xl px-3.5 py-2.5 transition-all border bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 focus-within:ring-1 focus-within:ring-white/40 text-white">
                    <Lock className="w-4 h-4 flex-shrink-0 mr-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className="w-full bg-transparent text-sm focus:outline-none font-mono text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Red Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-[#8c1c1c] hover:bg-[#a12020] active:scale-[0.98] text-white font-bold text-sm tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        AUTENTICANDO...
                      </span>
                    ) : (
                      <span>INICIAR SESIÓN</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Links below button */}
              <div className="text-center space-y-2.5 pt-2 text-xs text-slate-300">
                <div>
                  <button
                    type="button"
                    onClick={() => alert("Para recuperar su contraseña institucional comuníquese con soporte@unitru.edu.pe o la Dirección de Bienestar Universitario UNT.")}
                    className="transition-colors hover:text-white"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={switchToRegister}
                    className="text-unt-gold hover:text-amber-400 font-bold hover:underline transition-colors flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <span>¿Eres nuevo? Registrarse o Crear Cuenta</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* MODE 2: REGISTRATION FORM */}
          {isRegisterMode && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-1">
              {/* Names and Last Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium block text-slate-300">
                    Nombres *
                  </label>
                  <div className="relative flex items-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 text-white">
                    <User className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ej. Juan Carlos"
                      className="w-full bg-transparent text-xs focus:outline-none text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium block text-slate-300">
                    Apellidos *
                  </label>
                  <div className="relative flex items-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 text-white">
                    <User className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="Ej. Pérez Silva"
                      className="w-full bg-transparent text-xs focus:outline-none text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Código UNT and WhatsApp Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium block text-slate-300">
                    Código de Matrícula UNT *
                  </label>
                  <div className="relative flex items-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 text-white">
                    <IdCard className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value)}
                      placeholder="Ej. 1020304035"
                      className="w-full bg-transparent text-xs focus:outline-none font-mono text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium block text-slate-300">
                    Celular WhatsApp *
                  </label>
                  <div className="relative flex items-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 text-white">
                    <Phone className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Ej. 948123456"
                      className="w-full bg-transparent text-xs focus:outline-none font-mono text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Escuela Profesional / Carrera */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium block text-slate-300">
                  Escuela Profesional / Carrera *
                </label>
                <div className="relative flex items-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 text-white">
                  <GraduationCap className="w-3.5 h-3.5 text-unt-gold mr-2 shrink-0" />
                  <select
                    value={regCareer}
                    onChange={(e) => setRegCareer(e.target.value)}
                    className="w-full bg-transparent text-xs focus:outline-none cursor-pointer text-white"
                  >
                    {UNT_CAREERS.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Correo Institucional */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium block text-slate-300">
                    Correo Institucional Oficial *
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                    Obligatorio @unitru.edu.pe
                  </span>
                </div>
                <div className="relative flex items-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 text-white">
                  <Mail className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ejemplo@unitru.edu.pe"
                    className="w-full bg-transparent text-xs focus:outline-none text-white placeholder-slate-400"
                  />
                </div>
                {!regEmail.includes("@") && regEmail.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRegEmail((prev) => `${prev.trim()}@unitru.edu.pe`)}
                    className="text-[10px] text-amber-300 hover:text-amber-200 bg-amber-950/50 border border-amber-700/60 px-2 py-0.5 rounded flex items-center gap-1 transition-colors mt-1"
                  >
                    <span>+ Completar con <strong>@unitru.edu.pe</strong></span>
                  </button>
                )}
              </div>

              {/* Contraseña */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium block text-slate-300">
                  Contraseña de Acceso *
                </label>
                <div className="relative flex items-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 text-white">
                  <Lock className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-transparent text-xs focus:outline-none font-mono text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      REGISTRANDO CUENTA...
                    </span>
                  ) : (
                    <span>CREAR CUENTA E INGRESAR AL BUS</span>
                  )}
                </button>
              </div>

              {/* Back to Login Link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="text-xs transition-colors inline-flex items-center gap-1.5 font-medium text-slate-300 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>¿Ya tienes una cuenta registrada? Iniciar Sesión</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
