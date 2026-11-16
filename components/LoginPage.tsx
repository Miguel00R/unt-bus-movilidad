"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  AlertCircle,
  User,
  Phone,
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  IdCard,
  KeyRound,
  ShieldCheck,
  Send,
  RefreshCw,
  Copy,
  Check
} from "lucide-react";
import { Role } from "@/lib/types";
import { AuthUser, authenticate, registerAccount, resetPassword } from "@/lib/auth";
import { UNT_CAREERS } from "@/lib/mock-data";

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  // Mode toggle: Login vs Register vs Forgot Password
  const [authView, setAuthView] = useState<"login" | "register" | "forgot">("login");

  // Login form state
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Registration form state
  const [regName, setRegName] = useState<string>("");
  const [regLastName, setRegLastName] = useState<string>("");
  const [regCode, setRegCode] = useState<string>("");
  const [regCareer, setRegCareer] = useState<string>("Ingeniería de Sistemas");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");

  // Password Recovery form state
  const [recStep, setRecStep] = useState<"input_email" | "verify_code">("input_email");
  const [recEmail, setRecEmail] = useState<string>("");
  const [recCode, setRecCode] = useState<string>("");
  const [recVerificationCode, setRecVerificationCode] = useState<string>("");
  const [recGeneratedCode, setRecGeneratedCode] = useState<string>("");
  const [recEmailSent, setRecEmailSent] = useState<boolean>(false);
  const [recCooldown, setRecCooldown] = useState<number>(0);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);
  const [recNewPassword, setRecNewPassword] = useState<string>("");
  const [recConfirmPassword, setRecConfirmPassword] = useState<string>("");

  // Countdown timer for resending recovery code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (recCooldown > 0) {
      timer = setInterval(() => {
        setRecCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [recCooldown]);

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
    if (
      cleanId !== "miguelquesquenrodas@gmail.com" &&
      !cleanId.startsWith("miguelquesquen") &&
      cleanId.includes("@") &&
      !cleanId.endsWith("@unitru.edu.pe")
    ) {
      setErrorMsg("Los alumnos deben ingresar obligatoriamente con su correo institucional (@unitru.edu.pe) o código de matrícula UNT.");
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      const result = authenticate(identifier, password);
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

  // Paso 1 de Recuperación: Solicitar Código al Correo
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = recEmail.trim().toLowerCase();
    const cleanCode = recCode.trim();

    if (!cleanEmail) {
      setErrorMsg("Ingrese su correo institucional oficial o de administrador.");
      setIsLoading(false);
      return;
    }

    const isAdmin =
      cleanEmail === "miguelquesquenrodas@gmail.com" ||
      cleanEmail.startsWith("miguelquesquen");

    if (!isAdmin && !cleanEmail.endsWith("@unitru.edu.pe")) {
      setErrorMsg("Solo los correos oficiales @unitru.edu.pe pueden solicitar recuperación.");
      setIsLoading(false);
      return;
    }

    if (!cleanCode) {
      setErrorMsg("Ingrese su código de matrícula UNT para verificar su identidad.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, studentCode: cleanCode }),
      });
      const data = await res.json();

      setIsLoading(false);
      if (data.success) {
        setRecGeneratedCode(data.code || "");
        setRecEmailSent(Boolean(data.emailSent));
        setRecStep("verify_code");
        setRecCooldown(60);
        setSuccessMsg(
          data.emailSent
            ? `Código de 6 dígitos enviado a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`
            : `Código de confirmación generado para ${cleanEmail}.`
        );
      } else {
        setErrorMsg(data.error || "No se pudo generar el código. Intente nuevamente.");
      }
    } catch {
      setIsLoading(false);
      setErrorMsg("Error de conexión al solicitar el código. Verifique su red.");
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    if (recCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recEmail.trim().toLowerCase(),
          studentCode: recCode.trim(),
        }),
      });
      const data = await res.json();

      setIsLoading(false);
      if (data.success) {
        setRecGeneratedCode(data.code || "");
        setRecEmailSent(Boolean(data.emailSent));
        setRecCooldown(60);
        setSuccessMsg(
          data.emailSent
            ? `Nuevo código enviado a ${recEmail}.`
            : `Nuevo código generado para ${recEmail}.`
        );
      } else {
        setErrorMsg(data.error || "No se pudo reenviar el código.");
      }
    } catch {
      setIsLoading(false);
      setErrorMsg("Error de conexión al reenviar el código.");
    }
  };

  // Copiar código de prueba
  const handleCopyCode = () => {
    if (recGeneratedCode) {
      navigator.clipboard.writeText(recGeneratedCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  // Paso 2 de Recuperación: Validar Código y Establecer Nueva Contraseña
  const handleVerifyAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanVerification = recVerificationCode.trim();
    const cleanNewPass = recNewPassword.trim();
    const cleanConfirmPass = recConfirmPassword.trim();

    if (!cleanVerification || cleanVerification.length !== 6) {
      setErrorMsg("Debe ingresar el código de verificación de 6 dígitos.");
      setIsLoading(false);
      return;
    }

    if (recGeneratedCode && cleanVerification !== recGeneratedCode) {
      setErrorMsg("El código de verificación ingresado no es correcto. Verifíquelo e intente de nuevo.");
      setIsLoading(false);
      return;
    }

    if (cleanNewPass.length < 6) {
      setErrorMsg("La nueva contraseña debe tener al menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    if (cleanNewPass !== cleanConfirmPass) {
      setErrorMsg("Las nuevas contraseñas no coinciden. Verifíquelas e intente nuevamente.");
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      const res = resetPassword({
        identifier: recEmail.trim().toLowerCase(),
        studentCode: recCode.trim(),
        newPassword: cleanNewPass,
        verificationCode: cleanVerification,
        expectedCode: recGeneratedCode,
      });

      setIsLoading(false);

      if (res.success) {
        setSuccessMsg(res.message || "¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...");
        setIdentifier(recEmail.trim().toLowerCase());
        setPassword(cleanNewPass);
        setTimeout(() => {
          setAuthView("login");
          setRecStep("input_email");
          setRecVerificationCode("");
          setRecNewPassword("");
          setRecConfirmPassword("");
          setSuccessMsg("Tu contraseña ha sido restablecida. Inicia sesión con tu nueva clave.");
        }, 1500);
      } else {
        setErrorMsg(res.error || "No se pudo restablecer la contraseña.");
      }
    }, 550);
  };

  const switchToRegister = () => {
    setAuthView("register");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const switchToLogin = () => {
    setAuthView("login");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const switchToForgot = () => {
    setAuthView("forgot");
    setRecStep("input_email");
    setRecEmail(identifier || "");
    setRecCode("");
    setRecVerificationCode("");
    setRecGeneratedCode("");
    setRecNewPassword("");
    setRecConfirmPassword("");
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
      <div className={`relative z-10 w-full mx-4 my-auto transition-all duration-300 ${authView !== "login" ? "max-w-[490px]" : "max-w-[420px]"
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
              {authView === "register"
                ? "CREAR NUEVA CUENTA DE ESTUDIANTE"
                : authView === "forgot"
                  ? (recStep === "verify_code" ? "CONFIRMAR CÓDIGO Y NUEVA CLAVE" : "RECUPERACIÓN DE CONTRASEÑA")
                  : "ACCESO AL SISTEMA DE MOVILIDAD UNT"}
            </h1>
            {authView === "register" && (
              <p className="text-xs font-normal text-slate-300">
                Regístrate con tu código de matrícula y carné universitario UNT
              </p>
            )}
            {authView === "forgot" && (
              <p className="text-xs font-normal text-slate-300">
                {recStep === "input_email"
                  ? "Paso 1 de 2: Ingrese su correo institucional para recibir un código de seguridad de 6 dígitos"
                  : "Paso 2 de 2: Ingrese el código recibido y configure su nueva contraseña"}
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
          {authView === "login" && (
            <>
              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
                {/* Field 1: Correo Electrónico Institucional o Código */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium block text-slate-300">
                      Correo Electrónico o Código UNT
                    </label>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                      Acceso Oficial
                    </span>
                  </div>

                  <div className="relative flex items-center rounded-xl px-3.5 py-2.5 transition-all border bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 focus-within:ring-1 focus-within:ring-white/40 text-white">
                    <Mail className="w-4 h-4 flex-shrink-0 mr-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Correo @unitru.edu.pe o código de matrícula"
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
                    onClick={switchToForgot}
                    className="text-slate-300 hover:text-white hover:underline transition-colors cursor-pointer"
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
          {authView === "register" && (
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
                  className="text-xs transition-colors inline-flex items-center gap-1.5 font-medium text-slate-300 hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>¿Ya tienes una cuenta registrada? Iniciar Sesión</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD (2 STEPS WITH EMAIL CONFIRMATION CODE) */}
          {authView === "forgot" && recStep === "input_email" && (
            <form onSubmit={handleRequestCode} className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Paso 1 de 2: Verificación de Identidad
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  @unitru.edu.pe
                </span>
              </div>

              {/* Correo Institucional */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium block text-slate-300">
                  Correo Institucional Oficial *
                </label>
                <div className="relative flex items-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 text-white">
                  <Mail className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={recEmail}
                    onChange={(e) => setRecEmail(e.target.value)}
                    placeholder="ejemplo@unitru.edu.pe"
                    className="w-full bg-transparent text-xs focus:outline-none text-white placeholder-slate-400"
                  />
                </div>
                {!recEmail.includes("@") && recEmail.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRecEmail((prev) => `${prev.trim()}@unitru.edu.pe`)}
                    className="text-[10px] text-amber-300 hover:text-amber-200 bg-amber-950/50 border border-amber-700/60 px-2 py-0.5 rounded flex items-center gap-1 transition-colors mt-1"
                  >
                    <span>+ Completar con <strong>@unitru.edu.pe</strong></span>
                  </button>
                )}
              </div>

              {/* Código de Matrícula UNT */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium block text-slate-300">
                  Código de Matrícula UNT (Identidad) *
                </label>
                <div className="relative flex items-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 text-white">
                  <IdCard className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={recCode}
                    onChange={(e) => setRecCode(e.target.value)}
                    placeholder="Ej. 1020304021"
                    className="w-full bg-transparent text-xs focus:outline-none font-mono text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Botón: Solicitar Código */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ENVIANDO CÓDIGO...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Send className="w-3.5 h-3.5" />
                      ENVIAR CÓDIGO DE CONFIRMACIÓN
                    </span>
                  )}
                </button>
              </div>

              {/* Volver a Iniciar Sesión */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="text-xs transition-colors inline-flex items-center gap-1.5 font-medium text-slate-300 hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Iniciar Sesión</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 3 - PASO 2: VERIFY CODE AND SET NEW PASSWORD */}
          {authView === "forgot" && recStep === "verify_code" && (
            <form onSubmit={handleVerifyAndReset} className="space-y-3 pt-1">
              {/* Info Box sobre el código */}
              <div className="p-3 rounded-xl border bg-slate-900/80 border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Enviado a:</span>
                    <strong className="text-white truncate max-w-[200px]">{recEmail}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRecStep("input_email");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                  >
                    Cambiar
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Revise su bandeja de entrada o spam. El código de 6 dígitos expira en 10 minutos.
                </p>

                {/* Banner si el sistema no tiene servidor SMTP propio en la nube */}
                {!recEmailSent && recGeneratedCode && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider">
                          Código de Confirmación:
                        </span>
                        <span className="font-mono text-sm font-black tracking-widest text-amber-300">
                          {recGeneratedCode}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRecVerificationCode(recGeneratedCode);
                        handleCopyCode();
                      }}
                      className="px-2 py-1 text-[10px] font-bold rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {codeCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{codeCopied ? "¡Copiado!" : "Rellenar"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Input: Código de Verificación */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium block text-slate-300 text-center">
                  Código de Seguridad Recibido (6 dígitos) *
                </label>
                <div className="relative flex items-center justify-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/90 border-amber-500/60 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/40 text-white">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={recVerificationCode}
                    onChange={(e) => setRecVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="w-full bg-transparent text-center font-mono text-lg font-black tracking-[0.4em] focus:outline-none text-amber-300 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Input: Nueva Contraseña */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium block text-slate-300">
                  Nueva Contraseña de Acceso *
                </label>
                <div className="relative flex items-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 text-white">
                  <Lock className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={recNewPassword}
                    onChange={(e) => setRecNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-transparent text-xs focus:outline-none font-mono text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Input: Confirmar Nueva Contraseña */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium block text-slate-300">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative flex items-center rounded-xl px-3 py-2 border transition-all bg-[#1d2a3c]/85 border-slate-500/60 focus-within:border-white/70 text-white">
                  <Lock className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={recConfirmPassword}
                    onChange={(e) => setRecConfirmPassword(e.target.value)}
                    placeholder="Repita su nueva contraseña"
                    className="w-full bg-transparent text-xs focus:outline-none font-mono text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Action Button: Validar y Cambiar */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ACTUALIZANDO CLAVE...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      RESTABLECER MI CONTRASEÑA
                    </span>
                  )}
                </button>
              </div>

              {/* Reenviar código y volver */}
              <div className="text-center pt-1 space-y-2">
                <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <span>¿No recibiste el código?</span>
                  {recCooldown > 0 ? (
                    <span className="text-amber-400 font-semibold font-mono">
                      Reenviar en {recCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="text-amber-300 hover:text-amber-200 underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reenviar código</span>
                    </button>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setRecStep("input_email");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs transition-colors inline-flex items-center gap-1.5 font-medium text-slate-400 hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver al paso anterior</span>
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
