"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Compass,
  QrCode,
  Users,
  GraduationCap,
  History,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  CameraOff,
  Search,
  Pencil,
  Trash2,
  Eye,
  Check,
  Play,
  X,
  Upload,
  LogOut,
  UserCheck,
  ChevronRight,
  Bus,
  Sun,
  Moon,
  Menu,
  PenTool,
  RefreshCw,
} from "lucide-react";
import SignaturePad from "./SignaturePad";
import { AuthUser } from "@/lib/auth";
import { playSuccessBeep, playErrorBeep } from "@/lib/audio";
import {
  UniEstudiante,
  UniViaje,
  UniPasajero,
  exportarExcelViaje,
  exportarPDFViaje,
} from "@/lib/export-utils";
import { UNT_CAREERS } from "@/lib/mock-data";

// Initial seed data with UNT Filial Jequetepeque students
const SEED_ESTUDIANTES: UniEstudiante[] = [
  {
    id: 1,
    codigo: "1052300512",
    nombres: "Carlos Alberto",
    apellidos: "García Vega",
    carrera: "Agronomía",
    lugar: "Guadalupe",
  },
  {
    id: 2,
    codigo: "1052100122",
    nombres: "Jhon Robinson",
    apellidos: "Llique Chávarry",
    carrera: "Ingeniería de Sistemas",
    lugar: "Pacasmayo",
  },
  {
    id: 3,
    codigo: "1052100890",
    nombres: "Ana Lucía",
    apellidos: "Rojas Mendoza",
    carrera: "Ingeniería de Sistemas",
    lugar: "San Pedro de Lloc",
  },
  {
    id: 4,
    codigo: "1052200341",
    nombres: "María Fernanda",
    apellidos: "Torres Silva",
    carrera: "Administración",
    lugar: "Chepén",
  },
  {
    id: 5,
    codigo: "1052100455",
    nombres: "Diana Carolina",
    apellidos: "Vásquez Paredes",
    carrera: "Trabajo Social",
    lugar: "Pacasmayo",
  },
  {
    id: 6,
    codigo: "1052200612",
    nombres: "Luis Fernando",
    apellidos: "Quiroz Benites",
    carrera: "Ingeniería Mecánica",
    lugar: "Guadalupe",
  },
  {
    id: 7,
    codigo: "1052300789",
    nombres: "Jorge Anthony",
    apellidos: "Saldaña Cruz",
    carrera: "Ingeniería Agroindustrial",
    lugar: "Chepén",
  },
];

export type NavTab = "viaje" | "pasajeros" | "estudiantes" | "historial";
export type PortalRole = "admin" | "operador" | "estudiante";
export type ThemeMode = "light" | "dark";

interface AdminPortalProps {
  currentUser?: AuthUser | null;
  initialRole?: PortalRole;
  onLogout?: () => void;
}

export default function AdminPortal({
  currentUser,
  initialRole = "admin",
  onLogout,
}: AdminPortalProps) {
  // --- THEME STATE (Modo Claro / Modo Oscuro) ---
  const [theme, setTheme] = useState<ThemeMode>("light");

  // --- STATE ---
  const [estudiantes, setEstudiantes] = useState<UniEstudiante[]>([]);
  const [viajes, setViajes] = useState<UniViaje[]>([]);
  const [pasajeros, setPasajeros] = useState<UniPasajero[]>([]);
  const [activeViajeId, setActiveViajeId] = useState<number | null>(null);

  const [currentRole, setCurrentRole] = useState<PortalRole>(initialRole);
  const [activeTab, setActiveTab] = useState<NavTab>("viaje");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedViajeDetail, setSelectedViajeDetail] = useState<UniViaje | null>(null);

  // New Trip form state
  const [viajeChofer, setViajeChofer] = useState("Miguel Quesquén Rodas");
  const [viajePlaca, setViajePlaca] = useState("T2B-964");
  const [viajeOrigen, setViajeOrigen] = useState("Filial Jequetepeque");
  const [viajeDestino, setViajeDestino] = useState("Chepén / Guadalupe");
  const [viajeRuta, setViajeRuta] = useState("Ruta A - Chepén");
  const [viajeTurno, setViajeTurno] = useState("Mañana");
  const [viajeAsientos, setViajeAsientos] = useState(48);
  const [viajeFecha, setViajeFecha] = useState(new Date().toISOString().split("T")[0]);

  // Scanner & Boarding state
  const [inputCode, setInputCode] = useState("");
  const [scanResult, setScanResult] = useState<{
    type: "neutral" | "success" | "duplicate" | "error";
    title: string;
    subtitle: string;
    badges: string[];
  }>({
    type: "neutral",
    title: "Esperando lectura de carnet",
    subtitle: "Ingrese o escanee el código de matrícula para validar abordaje.",
    badges: [],
  });

  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickNombres, setQuickNombres] = useState("");
  const [quickApellidos, setQuickApellidos] = useState("");
  const [quickCarrera, setQuickCarrera] = useState("Ingeniería de Sistemas");
  const [quickLugar, setQuickLugar] = useState("Filial");

  // Filter states
  const [searchPasajeros, setSearchPasajeros] = useState("");
  const [searchEstudiantes, setSearchEstudiantes] = useState("");
  const [selectedCareerFilter, setSelectedCareerFilter] = useState("TODAS");
  const [filterHistorialDate, setFilterHistorialDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Student Form state
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [estCodigo, setEstCodigo] = useState("");
  const [estCarrera, setEstCarrera] = useState("Ingeniería de Sistemas");
  const [estNombres, setEstNombres] = useState("");
  const [estApellidos, setEstApellidos] = useState("");
  const [estLugar, setEstLugar] = useState("");

  // Touch Signature Boarding State
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signCodigo, setSignCodigo] = useState("");
  const [signNombres, setSignNombres] = useState("");
  const [signApellidos, setSignApellidos] = useState("");
  const [signCarrera, setSignCarrera] = useState("Ingeniería de Sistemas");
  const [signParadero, setSignParadero] = useState("Pacasmayo");
  const [signTelefono, setSignTelefono] = useState("");
  const [signFirma, setSignFirma] = useState<string | null>(null);
  const [signFeedback, setSignFeedback] = useState<string | null>(null);
  const [selectedSignaturePreview, setSelectedSignaturePreview] = useState<{
    estudiante: string;
    codigo: string;
    firma: string;
    hora: string;
  } | null>(null);

  const hasSyncedRef = useRef<boolean>(false);
  const lastServerUpdatedRef = useRef<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Helper to send mutations to the central server
  const sendServerAction = async (action: string, payload: any) => {
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          hasSyncedRef.current = true;
          if (data.lastUpdated) lastServerUpdatedRef.current = data.lastUpdated;
          if (data.activeViajeId !== undefined) setActiveViajeId(data.activeViajeId);
          if (Array.isArray(data.viajes)) setViajes(data.viajes);
          if (Array.isArray(data.pasajeros)) {
            setPasajeros((prev) => {
              const map = new Map<number, UniPasajero>();
              data.pasajeros.forEach((p: UniPasajero) => map.set(p.id, p));
              prev.forEach((p) => {
                if (!map.has(p.id)) map.set(p.id, p);
              });
              const merged = Array.from(map.values());
              localStorage.setItem("unicontrol_pasajeros", JSON.stringify(merged));
              return merged;
            });
          }
          if (Array.isArray(data.estudiantes)) setEstudiantes(data.estudiantes);
        }
      }
    } catch {
      // offline fallback: continues safely with localStorage
    }
  };

  // Synchronize with central server across all connected devices
  const syncFromServer = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/sync?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) {
        setIsSyncing(false);
        return;
      }
      const data = await res.json();
      setIsSyncing(false);
      if (!data.success) return;

      // Synchronize whenever server has new data or on initial load
      if (!hasSyncedRef.current || (data.lastUpdated && data.lastUpdated !== lastServerUpdatedRef.current)) {
        hasSyncedRef.current = true;
        if (data.lastUpdated) lastServerUpdatedRef.current = data.lastUpdated;

        if (Array.isArray(data.viajes)) {
          setViajes(data.viajes);
          localStorage.setItem("unicontrol_viajes", JSON.stringify(data.viajes));
        }

        if (data.activeViajeId !== undefined) {
          setActiveViajeId(data.activeViajeId);
          localStorage.setItem("unicontrol_active_viaje_id", JSON.stringify(data.activeViajeId));
        }

        if (Array.isArray(data.pasajeros)) {
          setPasajeros((prev) => {
            const map = new Map<number, UniPasajero>();
            data.pasajeros.forEach((p: UniPasajero) => map.set(p.id, p));
            prev.forEach((p) => {
              if (!map.has(p.id)) map.set(p.id, p);
            });
            const merged = Array.from(map.values());
            localStorage.setItem("unicontrol_pasajeros", JSON.stringify(merged));
            return merged;
          });
        }

        if (Array.isArray(data.estudiantes) && data.estudiantes.length > 0) {
          setEstudiantes(data.estudiantes);
          localStorage.setItem("unicontrol_estudiantes", JSON.stringify(data.estudiantes));
        }
      }
    } catch {
      setIsSyncing(false);
    }
  }, []);

  // Synchronize active role if initialRole changes
  useEffect(() => {
    setCurrentRole(initialRole);
  }, [initialRole]);

  // 1. Storage & Clock Init + Multi-Device Realtime Polling
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("unt_theme_mode") as ThemeMode | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }

      const storedEst = localStorage.getItem("unicontrol_estudiantes");
      if (storedEst) {
        const parsed: UniEstudiante[] = JSON.parse(storedEst);
        const existingCodes = new Set(parsed.map((e) => e.codigo));
        const missingSeeds = SEED_ESTUDIANTES.filter((s) => !existingCodes.has(s.codigo));
        const merged = [...parsed, ...missingSeeds];
        setEstudiantes(merged);
        if (missingSeeds.length > 0) {
          localStorage.setItem("unicontrol_estudiantes", JSON.stringify(merged));
        }
      } else {
        setEstudiantes(SEED_ESTUDIANTES);
        localStorage.setItem("unicontrol_estudiantes", JSON.stringify(SEED_ESTUDIANTES));
      }

      const storedViajes = localStorage.getItem("unicontrol_viajes");
      if (storedViajes) setViajes(JSON.parse(storedViajes));

      const storedPasajeros = localStorage.getItem("unicontrol_pasajeros");
      if (storedPasajeros) setPasajeros(JSON.parse(storedPasajeros));

      const storedActiveId = localStorage.getItem("unicontrol_active_viaje_id");
      if (storedActiveId) setActiveViajeId(JSON.parse(storedActiveId));
    } catch { }

    // Initial instant sync from server
    syncFromServer();

    // Multi-device polling every 2 seconds
    const syncInterval = setInterval(syncFromServer, 2000);

    // Immediate sync on screen wake / focus (mobile support)
    const handleScreenWake = () => {
      if (document.visibilityState === "visible") {
        syncFromServer();
      }
    };
    window.addEventListener("focus", syncFromServer);
    window.addEventListener("visibilitychange", handleScreenWake);

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(syncInterval);
      window.removeEventListener("focus", syncFromServer);
      window.removeEventListener("visibilitychange", handleScreenWake);
    };
  }, [syncFromServer]);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("unt_theme_mode", nextTheme);
  };

  // Save Helpers
  const persistEstudiantes = (data: UniEstudiante[]) => {
    setEstudiantes(data);
    localStorage.setItem("unicontrol_estudiantes", JSON.stringify(data));
  };
  const persistViajes = (data: UniViaje[]) => {
    setViajes(data);
    localStorage.setItem("unicontrol_viajes", JSON.stringify(data));
  };
  const persistPasajeros = (data: UniPasajero[]) => {
    setPasajeros(data);
    localStorage.setItem("unicontrol_pasajeros", JSON.stringify(data));
  };
  const persistActiveViajeId = (id: number | null) => {
    setActiveViajeId(id);
    localStorage.setItem("unicontrol_active_viaje_id", JSON.stringify(id));
  };

  const activeViaje = viajes.find((v) => String(v.id) === String(activeViajeId) && !v.cerrado) || null;
  const activePasajeros = activeViaje ? pasajeros.filter((p) => p.viajeId === activeViaje.id) : [];

  const myStudentCode = (currentUser?.code || currentUser?.studentCode || currentUser?.identifier || "").trim().toLowerCase();
  const myBoardingRecord = activeViaje && myStudentCode
    ? activePasajeros.find((p) => p.codigo.toLowerCase() === myStudentCode)
    : undefined;

  useEffect(() => {
    if (currentRole === "estudiante" && activeTab !== "viaje") {
      setActiveTab("viaje");
    }
  }, [currentRole, activeTab]);

  const occupancyPercentage = activeViaje
    ? Math.min(100, Math.round((activePasajeros.length / activeViaje.totalAsientos) * 100))
    : 0;

  // --- TRIP ACTIONS ---
  const handleStartTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeViaje) {
      alert(`Ya existe un viaje en curso (${activeViaje.ruta}). Ciérrelo antes de iniciar otro.`);
      return;
    }
    if (!viajeChofer.trim()) {
      alert("Ingrese el nombre del conductor.");
      return;
    }

    const nuevo: UniViaje = {
      id: Date.now(),
      chofer: viajeChofer.trim(),
      placa: viajePlaca.trim().toUpperCase(),
      origen: viajeOrigen.trim(),
      destino: viajeDestino.trim(),
      ruta: viajeRuta,
      turno: viajeTurno,
      horaSalida: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      horaLlegada: "",
      fecha: viajeFecha,
      totalAsientos: viajeAsientos || 48,
      cerrado: false,
    };

    const updated = [nuevo, ...viajes];
    persistViajes(updated);
    persistActiveViajeId(nuevo.id);
    await sendServerAction("START_TRIP", nuevo);
    playSuccessBeep();
  };

  const handleUpdateDepartureTime = () => {
    if (!activeViaje) return;
    const now = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    const updated = viajes.map((v) => (v.id === activeViaje.id ? { ...v, horaSalida: now } : v));
    persistViajes(updated);
    sendServerAction("UPDATE_DEPARTURE", { viajeId: activeViaje.id, horaSalida: now });
    alert(`Hora de salida registrada: ${now}`);
  };

  const handleCloseActiveTrip = () => {
    if (!activeViaje) return;
    if (!confirm(`¿Confirma finalizar y cerrar el viaje ${activeViaje.ruta}?`)) return;

    const arrivalTime = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    const updated = viajes.map((v) =>
      v.id === activeViaje.id ? { ...v, cerrado: true, horaLlegada: arrivalTime } : v
    );
    persistViajes(updated);
    persistActiveViajeId(null);
    sendServerAction("CLOSE_TRIP", { viajeId: activeViaje.id });
    alert(`Viaje cerrado exitosamente a las ${arrivalTime}`);
  };

  // --- BOARDING / VALIDATION ---
  const handleValidateBoarding = () => {
    const code = inputCode.trim();
    if (!code) return;

    if (!activeViaje) {
      setScanResult({
        type: "error",
        title: "No hay viaje activo",
        subtitle: "Inicie un recorrido en 'Gestión de Viaje' para registrar abordajes.",
        badges: [],
      });
      playErrorBeep();
      return;
    }

    const yaAbordo = pasajeros.some(
      (p) => p.viajeId === activeViaje.id && p.codigo.toLowerCase() === code.toLowerCase()
    );
    if (yaAbordo) {
      setScanResult({
        type: "duplicate",
        title: "Abordaje Ya Registrado",
        subtitle: `El estudiante con código ${code} ya está a bordo de este bus.`,
        badges: [code],
      });
      playErrorBeep();
      return;
    }

    const student = estudiantes.find((e) => e.codigo.toLowerCase() === code.toLowerCase());

    if (student) {
      const now = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
      const newPassenger: UniPasajero = {
        id: Date.now(),
        viajeId: activeViaje.id,
        horaAbordaje: now,
        nombres: student.nombres,
        apellidos: student.apellidos,
        codigo: student.codigo,
        carrera: student.carrera,
        estado: "Abordó",
      };

      persistPasajeros([newPassenger, ...pasajeros]);
      sendServerAction("BOARD_PASSENGER", { pasajero: newPassenger });
      setScanResult({
        type: "success",
        title: `${student.apellidos}, ${student.nombres}`,
        subtitle: `Abordaje verificado &bull; ${now}`,
        badges: [student.codigo, student.carrera, student.lugar || "UNT"],
      });
      playSuccessBeep();
      setInputCode("");
      setShowQuickRegister(false);
    } else {
      setScanResult({
        type: "error",
        title: "Estudiante No Empadronado",
        subtitle: `El código ${code} no existe en el padrón. Puede ingresarlo en el formulario rápido inferior.`,
        badges: [code],
      });
      playErrorBeep();
      setShowQuickRegister(true);
      setQuickNombres("");
      setQuickApellidos("");
      setQuickLugar("Filial");
    }
  };

  const handleQuickRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputCode.trim();
    if (!code || !quickNombres.trim() || !quickApellidos.trim()) return;

    const newStudent: UniEstudiante = {
      id: Date.now(),
      codigo: code,
      nombres: quickNombres.trim(),
      apellidos: quickApellidos.trim(),
      carrera: quickCarrera,
      lugar: quickLugar.trim(),
    };
    persistEstudiantes([...estudiantes, newStudent]);

    if (activeViaje) {
      const now = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
      const newPassenger: UniPasajero = {
        id: Date.now() + 1,
        viajeId: activeViaje.id,
        horaAbordaje: now,
        nombres: newStudent.nombres,
        apellidos: newStudent.apellidos,
        codigo: newStudent.codigo,
        carrera: newStudent.carrera,
        estado: "Abordó",
      };
      persistPasajeros([newPassenger, ...pasajeros]);
      sendServerAction("BOARD_PASSENGER", { pasajero: newPassenger, estudiante: newStudent });
    }

    setScanResult({
      type: "success",
      title: `${newStudent.apellidos}, ${newStudent.nombres}`,
      subtitle: "Estudiante guardado en el padrón y registrado a bordo.",
      badges: [newStudent.codigo, newStudent.carrera],
    });
    playSuccessBeep();
    setShowQuickRegister(false);
    setInputCode("");
  };

  const handleRemovePassenger = (id: number) => {
    if (!confirm("¿Desea anular este registro de abordaje?")) return;
    persistPasajeros(pasajeros.filter((p) => p.id !== id));
    sendServerAction("CANCEL_PASSENGER", { pasajeroId: id });
  };

  // --- TOUCH SIGNATURE BOARDING ACTIONS ---
  const handleOpenSignModal = () => {
    if (currentUser && currentUser.role === "STUDENT") {
      setSignCodigo(currentUser.code || currentUser.studentCode || currentUser.identifier || "");
      setSignNombres(currentUser.name || "");
      setSignApellidos(currentUser.lastName || "");
      if (currentUser.career || currentUser.subTitle) setSignCarrera(currentUser.career || currentUser.subTitle || "Ingeniería de Sistemas");
    } else {
      setSignCodigo("");
      setSignNombres("");
      setSignApellidos("");
      setSignCarrera("Ingeniería de Sistemas");
    }
    setSignParadero("Pacasmayo");
    setSignTelefono("");
    setSignFirma(null);
    setSignFeedback(null);
    setIsSignModalOpen(true);
  };

  const handleSignCodigoChange = (codeVal: string) => {
    setSignCodigo(codeVal);
    const clean = codeVal.trim().toLowerCase();
    if (!clean) {
      setSignFeedback(null);
      return;
    }

    const found = estudiantes.find((e) => e.codigo.toLowerCase() === clean);
    if (found) {
      setSignNombres(found.nombres);
      setSignApellidos(found.apellidos);
      setSignCarrera(found.carrera);
      if (found.lugar) setSignParadero(found.lugar);
      setSignFeedback(`✓ Estudiante: ${found.apellidos}, ${found.nombres} (${found.carrera})`);
    } else {
      setSignFeedback(null);
    }
  };

  const handleSubmitSignatureBoarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeViaje) {
      alert("No hay un viaje activo en curso actualmente. Inicie un recorrido primero.");
      return;
    }
    if (!signCodigo.trim() || !signNombres.trim() || !signApellidos.trim()) {
      alert("Por favor complete el código universitario, nombres y apellidos.");
      return;
    }
    if (!signFirma) {
      alert("⚠️ Falta la firma digital. Por favor realice su firma con el dedo en el recuadro táctil.");
      return;
    }

    const cleanCode = signCodigo.trim();
    const already = activePasajeros.some(
      (p) => p.codigo.toLowerCase() === cleanCode.toLowerCase()
    );
    if (already) {
      playErrorBeep();
      alert(`⚠️ El estudiante con código ${cleanCode} ya fue registrado a bordo de este recorrido.`);
      return;
    }

    if (activePasajeros.length >= activeViaje.totalAsientos) {
      playErrorBeep();
      if (!confirm("⚠️ ¡El bus ha alcanzado su capacidad máxima! ¿Desea registrar al pasajero de todas formas?")) {
        return;
      }
    }

    const now = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    const newPassenger: UniPasajero = {
      id: Date.now(),
      viajeId: activeViaje.id,
      horaAbordaje: now,
      nombres: signNombres.trim(),
      apellidos: signApellidos.trim(),
      codigo: cleanCode,
      carrera: signCarrera,
      estado: "Abordado",
      firma: signFirma,
      paradero: signParadero,
      telefono: signTelefono.trim(),
    };

    const inPadron = estudiantes.some((e) => e.codigo.toLowerCase() === cleanCode.toLowerCase());
    const newEst: UniEstudiante | undefined = !inPadron ? {
      id: Date.now(),
      codigo: cleanCode,
      nombres: signNombres.trim(),
      apellidos: signApellidos.trim(),
      carrera: signCarrera,
      lugar: signParadero,
    } : undefined;

    if (newEst) {
      persistEstudiantes([...estudiantes, newEst]);
    }

    persistPasajeros([newPassenger, ...pasajeros]);
    sendServerAction("BOARD_PASSENGER", { pasajero: newPassenger, estudiante: newEst });
    playSuccessBeep();
    setIsSignModalOpen(false);

    setScanResult({
      type: "success",
      title: "Abordaje con Firma Confirmado",
      subtitle: `${newPassenger.apellidos}, ${newPassenger.nombres} (${cleanCode}) abordó a las ${now} con firma digital registrada.`,
      badges: [newPassenger.carrera, signParadero],
    });
  };

  // --- STUDENT DIRECTORY ---
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estCodigo.trim() || !estNombres.trim() || !estApellidos.trim()) return;

    if (editingStudentId) {
      const updated = estudiantes.map((s) =>
        s.id === editingStudentId
          ? {
            ...s,
            codigo: estCodigo.trim(),
            carrera: estCarrera,
            nombres: estNombres.trim(),
            apellidos: estApellidos.trim(),
            lugar: estLugar.trim(),
          }
          : s
      );
      persistEstudiantes(updated);
      handleCancelStudentEdit();
    } else {
      if (estudiantes.some((s) => s.codigo.toLowerCase() === estCodigo.trim().toLowerCase())) {
        alert("Ya existe un estudiante registrado con este código.");
        return;
      }
      const nuevo: UniEstudiante = {
        id: Date.now(),
        codigo: estCodigo.trim(),
        carrera: estCarrera,
        nombres: estNombres.trim(),
        apellidos: estApellidos.trim(),
        lugar: estLugar.trim(),
      };
      persistEstudiantes([...estudiantes, nuevo]);
      handleCancelStudentEdit();
    }
  };

  const handleEditStudent = (s: UniEstudiante) => {
    setEditingStudentId(s.id);
    setEstCodigo(s.codigo);
    setEstCarrera(s.carrera);
    setEstNombres(s.nombres);
    setEstApellidos(s.apellidos);
    setEstLugar(s.lugar || "");
  };

  const handleCancelStudentEdit = () => {
    setEditingStudentId(null);
    setEstCodigo("");
    setEstNombres("");
    setEstApellidos("");
    setEstLugar("");
  };

  const handleDeleteStudent = (id: number) => {
    if (!confirm("¿Desea eliminar a este estudiante del padrón?")) return;
    persistEstudiantes(estudiantes.filter((s) => s.id !== id));
  };

  // --- TRIP HISTORY ---
  const handleDeleteTrip = (viajeId: number) => {
    if (!confirm("¿Desea eliminar este registro de recorrido?")) return;
    persistViajes(viajes.filter((v) => v.id !== viajeId));
    persistPasajeros(pasajeros.filter((p) => p.viajeId !== viajeId));
    if (activeViajeId === viajeId) {
      persistActiveViajeId(null);
    }
  };



  // --- EXPORTS ---
  const handleExportPDF = () => {
    if (!activeViaje) {
      alert("No hay un viaje activo para exportar. Seleccione uno desde el Historial de Viajes.");
      return;
    }
    exportarPDFViaje(activeViaje, activePasajeros);
  };

  const handleExportExcel = () => {
    if (!activeViaje) {
      alert("No hay un viaje activo para exportar. Seleccione uno desde el Historial de Viajes.");
      return;
    }
    exportarExcelViaje(activeViaje, activePasajeros);
  };

  // Filtered lists
  const filteredPasajeros = activePasajeros.filter((p) => {
    if (!searchPasajeros.trim()) return true;
    const q = searchPasajeros.toLowerCase();
    return (
      p.nombres.toLowerCase().includes(q) ||
      p.apellidos.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      p.carrera.toLowerCase().includes(q)
    );
  });

  const uniqueCareers = Array.from(new Set(estudiantes.map((e) => e.carrera)));

  const filteredEstudiantes = estudiantes.filter((e) => {
    const matchesSearch =
      !searchEstudiantes.trim() ||
      e.nombres.toLowerCase().includes(searchEstudiantes.toLowerCase()) ||
      e.apellidos.toLowerCase().includes(searchEstudiantes.toLowerCase()) ||
      e.codigo.toLowerCase().includes(searchEstudiantes.toLowerCase()) ||
      e.carrera.toLowerCase().includes(searchEstudiantes.toLowerCase());

    const matchesCareer = selectedCareerFilter === "TODAS" || e.carrera === selectedCareerFilter;
    return matchesSearch && matchesCareer;
  });

  const filteredViajes = viajes.filter((v) => {
    if (!filterHistorialDate) return true;
    return v.fecha === filterHistorialDate;
  });

  const tabDescriptions: Record<NavTab, { title: string; subtitle: string }> = {
    viaje: {
      title: currentRole === "estudiante" ? "Estado del Recorrido" : "Gestión de Recorridos",
      subtitle:
        currentRole === "estudiante"
          ? "Información de la unidad en ruta y registro de abordaje"
          : "Control de flota, conductores y despacho de unidades de transporte",
    },
    pasajeros: {
      title: "Pasajeros a Bordo",
      subtitle: "Manifiesto de alumnos registrados en el recorrido en curso",
    },
    estudiantes: {
      title: "Padrón Estudiantil",
      subtitle: "Directorio de estudiantes matriculados y autorizados",
    },
    historial: {
      title: "Historial de Recorridos",
      subtitle: "Auditoría de viajes anteriores y reportes consolidados",
    },
  };

  const isLight = theme === "light";

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200 ${isLight ? "bg-[#f8fafc] text-slate-800" : "bg-[#0b1120] text-slate-200"
        }`}
    >
      {/* ================= TOP MOBILE BAR (SOLO EN TELÉFONOS) ================= */}
      <div
        className={`md:hidden sticky top-0 z-40 border-b px-4 py-2.5 flex items-center justify-between transition-colors duration-200 ${isLight
          ? "bg-white/95 backdrop-blur-md border-slate-200 text-slate-800 shadow-xs"
          : "bg-[#0d1527]/95 backdrop-blur-md border-slate-800 text-white"
          }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg border p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-700/60"
              }`}
          >
            <img
              src="/escudo-unt.png"
              alt="Escudo UNT"
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>
          <div className="min-w-0">
            <h1 className={`font-bold text-xs tracking-tight leading-tight truncate ${isLight ? "text-slate-900" : "text-white"}`}>
              UNT <span className={isLight ? "text-slate-600 font-semibold" : "text-slate-300 font-semibold"}>Movilidad</span>
            </h1>
            <p className={`text-[10px] truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              Filial Jequetepeque
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Realtime sync button */}
          <button
            onClick={() => syncFromServer()}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center justify-center ${isLight
              ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
              : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
              }`}
            title="Sincronizar en tiempo real"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-500 ${isSyncing ? "animate-spin" : ""}`} />
          </button>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center justify-center ${isLight
              ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
              : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
              }`}
            title="Cambiar tema"
          >
            {isLight ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Drawer menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center justify-center ${isLight
              ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
              : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-white"
              }`}
            title="Menú"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ================= MOBILE DRAWER MENU ================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer content */}
          <div
            className={`relative w-4/5 max-w-xs h-full border-r p-5 flex flex-col justify-between z-10 transition-colors shadow-2xl ${isLight
              ? "bg-white border-slate-200 text-slate-800"
              : "bg-[#0d1527] border-slate-800 text-white"
              }`}
          >
            <div className="space-y-4">
              <div className={`flex items-center justify-between pb-3 border-b ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg border p-0.5 flex items-center justify-center">
                    <img src="/escudo-unt.png" alt="Escudo UNT" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xs">UNT Movilidad</h2>
                    <p className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>Filial Jequetepeque</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-1 rounded ${isLight ? "hover:bg-slate-100 text-slate-500" : "text-slate-400 hover:text-white"}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Discreet Active Trip Pill */}
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${activeViaje
                  ? isLight
                    ? "bg-slate-50 border-slate-300 text-slate-800"
                    : "bg-slate-900/90 border-slate-700/80 text-slate-200"
                  : isLight
                    ? "bg-slate-50/60 border-slate-200 text-slate-400"
                    : "bg-slate-900/40 border-slate-800/60 text-slate-500"
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${activeViaje ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                />
                <div className="min-w-0 flex-1">
                  <span className={`text-[10px] uppercase font-bold block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    {activeViaje ? "Recorrido Activo" : "Estado"}
                  </span>
                  <strong className="text-xs truncate block">
                    {activeViaje ? activeViaje.ruta : "Sin viaje activo"}
                  </strong>
                </div>
              </div>

              {/* Navigation links */}
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("viaje");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${activeTab === "viaje"
                    ? isLight ? "bg-slate-900 text-white font-bold" : "bg-slate-800 text-white font-bold"
                    : isLight ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 hover:bg-slate-800"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-slate-400" />
                    <span>{currentRole === "estudiante" ? "Estado del Recorrido" : "Gestión de Recorridos"}</span>
                  </div>
                </button>

                {currentRole !== "estudiante" && (
                  <button
                    onClick={() => {
                      setActiveTab("pasajeros");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${activeTab === "pasajeros"
                      ? isLight ? "bg-slate-900 text-white font-bold" : "bg-slate-800 text-white font-bold"
                      : isLight ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 hover:bg-slate-800"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Pasajeros a Bordo</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${isLight ? "bg-slate-100 text-slate-700" : "bg-slate-800 text-slate-300"}`}>
                      {activePasajeros.length}
                    </span>
                  </button>
                )}

                {currentRole === "admin" && (
                  <button
                    onClick={() => {
                      setActiveTab("estudiantes");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${activeTab === "estudiantes"
                      ? isLight ? "bg-slate-900 text-white font-bold" : "bg-slate-800 text-white font-bold"
                      : isLight ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 hover:bg-slate-800"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <span>Padrón Estudiantil</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${isLight ? "bg-slate-100 text-slate-700" : "bg-slate-800 text-slate-300"}`}>
                      {estudiantes.length}
                    </span>
                  </button>
                )}

                {currentRole === "admin" && (
                  <button
                    onClick={() => {
                      setActiveTab("historial");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${activeTab === "historial"
                      ? isLight ? "bg-slate-900 text-white font-bold" : "bg-slate-800 text-white font-bold"
                      : isLight ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 hover:bg-slate-800"
                      }`}
                  >
                    <History className="w-4 h-4 text-slate-400" />
                    <span>Historial de Viajes</span>
                  </button>
                )}
              </nav>
            </div>

            {/* Drawer Footer Controls */}
            <div className={`pt-4 border-t space-y-2 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
              {currentUser?.role === "ADMIN" ? (
                <button
                  onClick={() => {
                    setIsRoleModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between ${isLight
                    ? "bg-slate-50 border-slate-200 text-slate-700"
                    : "bg-slate-900 border-slate-700/60 text-slate-300"
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 text-slate-400" />
                    <div className="truncate text-left">
                      <span className="block text-[11px] font-bold">
                        {currentRole === "admin" ? "Administrador" : currentRole === "operador" ? "Conductor" : "Estudiante"}
                      </span>
                      <span className={`block text-[10px] truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        {currentUser?.name || "Cambiar perfil"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <div
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between ${isLight
                    ? "bg-slate-50 border-slate-200 text-slate-700"
                    : "bg-slate-900 border-slate-700/60 text-slate-300"
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <GraduationCap className={`w-4 h-4 flex-shrink-0 ${isLight ? "text-blue-600" : "text-blue-400"}`} />
                    <div className="truncate text-left">
                      <span className="block text-[11px] font-bold">
                        {currentRole === "operador" ? "Conductor" : "Estudiante"}
                      </span>
                      <span className={`block text-[10px] truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        {currentUser?.name ? `${currentUser.name} ${currentUser.lastName || ""}` : "Estudiante UNT"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-600 bg-red-50/80 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= LEFT SIDEBAR (DESKTOP) ================= */}
      <aside
        className={`hidden md:flex md:w-64 border-r p-4 sm:p-5 flex-col justify-between flex-shrink-0 z-30 transition-colors duration-200 ${isLight
          ? "bg-white border-slate-200 shadow-sm"
          : "bg-[#0d1527] border-slate-800/80"
          }`}
      >
        <div className="space-y-5">
          {/* Brand Header with ESCUDO UNT */}
          <div
            className={`flex items-center gap-3 pb-4 border-b ${isLight ? "border-slate-200" : "border-slate-800"
              }`}
          >
            <div
              className={`w-11 h-11 rounded-lg border p-1 flex items-center justify-center flex-shrink-0 shadow-sm ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-700/60"
                }`}
            >
              <img
                src="/escudo-unt.png"
                alt="Escudo Universidad Nacional de Trujillo"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <div className="min-w-0">
              <h1
                className={`font-bold text-sm tracking-tight leading-tight ${isLight ? "text-slate-900" : "text-white"
                  }`}
              >
                UNT <span className={isLight ? "text-slate-600 font-semibold" : "text-slate-300 font-semibold"}>Movilidad</span>
              </h1>
              <p className={`text-[11px] font-medium truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Filial Jequetepeque
              </p>
              <p className={`text-[10px] truncate ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                Universidad Nacional de Trujillo
              </p>
            </div>
          </div>

          {/* Discreet Active Trip Pill */}
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors ${activeViaje
              ? isLight
                ? "bg-slate-50 border-slate-300 text-slate-800"
                : "bg-slate-900/90 border-slate-700/80 text-slate-200"
              : isLight
                ? "bg-slate-50/60 border-slate-200 text-slate-400"
                : "bg-slate-900/40 border-slate-800/60 text-slate-500"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${activeViaje
                ? isLight
                  ? "bg-emerald-600"
                  : "bg-emerald-400 animate-pulse"
                : isLight
                  ? "bg-slate-300"
                  : "bg-slate-600"
                }`}
            />
            <div className="min-w-0 flex-1">
              <span
                className={`text-[10px] uppercase font-bold block tracking-wider leading-none ${isLight ? "text-slate-500" : "text-slate-400"
                  }`}
              >
                {activeViaje ? "Recorrido Activo" : "Estado"}
              </span>
              <strong
                className={`text-xs font-semibold truncate block mt-0.5 ${isLight ? "text-slate-900" : "text-slate-200"
                  }`}
              >
                {activeViaje ? activeViaje.ruta : "Sin viaje activo"}
              </strong>
            </div>
          </div>

          {/* Navigation Items (Módulos a la izquierda) */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("viaje")}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${activeTab === "viaje"
                ? isLight
                  ? "bg-slate-900 text-white font-bold shadow-sm"
                  : "bg-slate-800 text-white font-bold border border-slate-700/70"
                : isLight
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Compass className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
                <span>{currentRole === "estudiante" ? "Estado del Recorrido" : "Gestión de Recorridos"}</span>
              </div>
              {activeViaje && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isLight ? "bg-emerald-400" : "bg-emerald-400"
                    }`}
                />
              )}
            </button>

            {currentRole !== "estudiante" && (
              <button
                onClick={() => setActiveTab("pasajeros")}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${activeTab === "pasajeros"
                  ? isLight
                    ? "bg-slate-900 text-white font-bold shadow-sm"
                    : "bg-slate-800 text-white font-bold border border-slate-700/70"
                  : isLight
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
                  <span>Pasajeros a Bordo</span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${activeTab === "pasajeros"
                    ? isLight
                      ? "bg-slate-800 text-white"
                      : "bg-slate-900 text-slate-200"
                    : isLight
                      ? "bg-slate-100 text-slate-700 border border-slate-200"
                      : "bg-slate-900 border border-slate-700 text-slate-300"
                    }`}
                >
                  {activePasajeros.length}
                </span>
              </button>
            )}

            {currentRole === "admin" && (
              <button
                onClick={() => setActiveTab("estudiantes")}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${activeTab === "estudiantes"
                  ? isLight
                    ? "bg-slate-900 text-white font-bold shadow-sm"
                    : "bg-slate-800 text-white font-bold border border-slate-700/70"
                  : isLight
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
                  <span>Padrón Estudiantil</span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${activeTab === "estudiantes"
                    ? isLight
                      ? "bg-slate-800 text-white"
                      : "bg-slate-900 text-slate-200"
                    : isLight
                      ? "bg-slate-100 text-slate-700 border border-slate-200"
                      : "bg-slate-900 border border-slate-700 text-slate-300"
                    }`}
                >
                  {estudiantes.length}
                </span>
              </button>
            )}

            {currentRole === "admin" && (
              <button
                onClick={() => setActiveTab("historial")}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${activeTab === "historial"
                  ? isLight
                    ? "bg-slate-900 text-white font-bold shadow-sm"
                    : "bg-slate-800 text-white font-bold border border-slate-700/70"
                  : isLight
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
              >
                <History className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
                <span>Historial de Viajes</span>
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div
          className={`pt-4 border-t space-y-2 mt-4 ${isLight ? "border-slate-200" : "border-slate-800"
            }`}
        >
          {/* Theme Switcher Toggle (Modo Claro / Modo Oscuro) */}
          <button
            onClick={toggleTheme}
            className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${isLight
              ? "bg-slate-100 hover:bg-slate-200/80 border-slate-300 text-slate-700"
              : "bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300"
              }`}
            title="Alternar entre modo claro y modo oscuro"
          >
            <div className="flex items-center gap-2">
              {isLight ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
              <span>{isLight ? "Modo Claro" : "Modo Oscuro"}</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isLight ? "bg-white text-slate-600 shadow-xs" : "bg-slate-800 text-slate-400"
                }`}
            >
              {isLight ? "Cambiar a Oscuro" : "Cambiar a Claro"}
            </span>
          </button>

          {/* Clock and Offline indicator */}
          <div
            className={`text-center text-[11px] font-mono py-1 ${isLight ? "text-slate-500" : "text-slate-400"
              }`}
          >
            <span>{currentTime || "--:--:--"}</span> &bull;{" "}
            <span className={isLight ? "text-emerald-600 font-semibold" : "text-emerald-400 font-medium"}>
              Offline (Local)
            </span>
          </div>

          {/* Role Profile Card / Changer */}
          {currentUser?.role === "ADMIN" ? (
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${isLight
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                : "bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300"
                }`}
            >
              <div className="flex items-center gap-2 text-left truncate">
                <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
                <div className="truncate">
                  <span className={`block text-[11px] font-bold truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                    {currentRole === "admin"
                      ? "Administrador"
                      : currentRole === "operador"
                        ? "Conductor"
                        : "Estudiante"}
                  </span>
                  <span className={`block text-[10px] truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    {currentUser?.name || "Cambiar perfil"}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
            </button>
          ) : (
            <div
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between ${isLight
                ? "bg-slate-50 border-slate-200 text-slate-700"
                : "bg-slate-900/80 border-slate-700/60 text-slate-300"
                }`}
            >
              <div className="flex items-center gap-2 text-left truncate">
                <GraduationCap className={`w-4 h-4 flex-shrink-0 ${isLight ? "text-blue-600" : "text-blue-400"}`} />
                <div className="truncate">
                  <span className={`block text-[11px] font-bold truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                    {currentRole === "operador" ? "Conductor" : "Estudiante"}
                  </span>
                  <span className={`block text-[10px] truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    {currentUser?.name ? `${currentUser.name} ${currentUser.lastName || ""}` : "Estudiante UNT"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-2 ${isLight
                ? "bg-red-50/80 hover:bg-red-100 text-red-700 border-red-200"
                : "bg-slate-900/40 hover:bg-slate-800/80 text-slate-400 hover:text-rose-300 border-slate-800 hover:border-slate-700"
                }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>
      </aside>

      {/* ================= MAIN CONTENT WORKSPACE ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sober Top Bar */}
        <header
          className={`border-b px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4 flex-wrap transition-colors duration-200 ${isLight
            ? "bg-white/95 border-slate-200 text-slate-800 shadow-xs"
            : "bg-[#0e1628] border-slate-800/80"
            }`}
        >
          <div>
            <h2 className={`text-base font-bold leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
              {tabDescriptions[activeTab].title}
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {tabDescriptions[activeTab].subtitle}
            </p>
          </div>

          {/* Sober Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick manual sync button */}
            <button
              onClick={() => syncFromServer()}
              className={`p-2 rounded-lg border text-xs transition-colors flex items-center justify-center ${isLight
                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
                }`}
              title="Sincronizar en tiempo real con el servidor"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-500 ${isSyncing ? "animate-spin" : ""}`} />
            </button>

            {/* Quick theme toggle button in header */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border text-xs transition-colors flex items-center justify-center ${isLight
                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
                }`}
              title={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            >
              {isLight ? (
                <Moon className="w-4 h-4 text-slate-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {currentRole === "admin" && (
              <>
                <button
                  onClick={handleExportPDF}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs ${isLight
                    ? "bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white"
                    }`}
                  title="Exportar reporte oficial en PDF"
                >
                  <FileText className={`w-3.5 h-3.5 ${isLight ? "text-slate-600" : "text-slate-400"}`} />
                  <span>Reporte PDF</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs ${isLight
                    ? "bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white"
                    }`}
                  title="Exportar datos a Excel"
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${isLight ? "text-slate-600" : "text-slate-400"}`} />
                  <span>Excel</span>
                </button>
              </>
            )}


          </div>
        </header>

        {/* Workspace Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto pb-24 md:pb-8">
          {/* ================= TAB 1: GESTIÓN DE RECORRIDOS ================= */}
          {activeTab === "viaje" && (
            <div className="space-y-6">
              {/* Active Trip Status Card */}
              <div
                className={`rounded-xl border p-5 space-y-4 transition-colors duration-200 ${isLight
                  ? "bg-white border-slate-200 shadow-xs"
                  : "bg-[#111c30] border-slate-800"
                  }`}
              >
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b ${isLight ? "border-slate-200" : "border-slate-800/80"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center ${isLight
                        ? "bg-slate-100 border-slate-300 text-slate-700"
                        : "bg-slate-900 border-slate-700/60 text-slate-300"
                        }`}
                    >
                      <Compass className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${activeViaje
                            ? isLight
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-emerald-950/50 text-emerald-300 border border-emerald-800/50"
                            : isLight
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-slate-900 text-slate-400 border border-slate-800"
                            }`}
                        >
                          {activeViaje ? "En Curso" : "Inactivo"}
                        </span>
                        <span
                          className={`text-xs font-mono ${isLight ? "text-slate-500" : "text-slate-400"
                            }`}
                        >
                          {activeViaje ? `Turno ${activeViaje.turno}` : "Sin unidad en ruta"}
                        </span>
                      </div>
                      <h3
                        className={`text-base font-bold mt-0.5 ${isLight ? "text-slate-900" : "text-white"
                          }`}
                      >
                        {activeViaje ? activeViaje.ruta : "No hay viaje iniciado"}
                      </h3>
                    </div>
                  </div>

                  {activeViaje && currentRole !== "estudiante" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleUpdateDepartureTime}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 ${isLight
                          ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                          : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
                          }`}
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> Marcar Salida
                      </button>
                      <button
                        onClick={handleCloseActiveTrip}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${isLight
                          ? "bg-slate-900 hover:bg-slate-800 text-white"
                          : "bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white"
                          }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Finalizar Viaje
                      </button>
                    </div>
                  )}
                </div>

                {activeViaje ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                      <div
                        className={`p-3 rounded-lg border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                          }`}
                      >
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Conductor
                        </span>
                        <strong
                          className={`text-xs font-semibold block truncate mt-1 ${isLight ? "text-slate-900" : "text-white"
                            }`}
                        >
                          {activeViaje.chofer}
                        </strong>
                      </div>
                      <div
                        className={`p-3 rounded-lg border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                          }`}
                      >
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Placa
                        </span>
                        <strong
                          className={`text-xs font-mono font-semibold block mt-1 ${isLight ? "text-slate-800" : "text-slate-200"
                            }`}
                        >
                          {activeViaje.placa || "EGB-123"}
                        </strong>
                      </div>
                      <div
                        className={`p-3 rounded-lg border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                          }`}
                      >
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Tramo
                        </span>
                        <strong
                          className={`text-xs font-medium block truncate mt-1 ${isLight ? "text-slate-700" : "text-slate-300"
                            }`}
                        >
                          {activeViaje.origen} &rarr; {activeViaje.destino}
                        </strong>
                      </div>
                      <div
                        className={`p-3 rounded-lg border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                          }`}
                      >
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Hora Salida
                        </span>
                        <strong
                          className={`text-xs font-mono font-semibold block mt-1 ${isLight ? "text-slate-800" : "text-slate-200"
                            }`}
                        >
                          {activeViaje.horaSalida || "No marcada"}
                        </strong>
                      </div>
                      <div
                        className={`p-3 rounded-lg border col-span-2 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                          }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Aforo de Pasajeros
                          </span>
                          <strong
                            className={`text-xs font-mono font-bold ${isLight ? "text-slate-900" : "text-white"
                              }`}
                          >
                            {activePasajeros.length} / {activeViaje.totalAsientos} ({occupancyPercentage}%)
                          </strong>
                        </div>
                        <div
                          className={`w-full h-2 rounded overflow-hidden ${isLight ? "bg-slate-200" : "bg-slate-800"
                            }`}
                        >
                          <div
                            className={`h-full transition-all duration-300 ${isLight ? "bg-slate-700" : "bg-slate-400"
                              }`}
                            style={{ width: `${occupancyPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Student Boarding with Touch Signature Action Banner */}
                    {currentRole === "estudiante" && myBoardingRecord ? (
                      <div
                        className={`mt-4 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isLight
                          ? "bg-emerald-50/90 border-emerald-200 text-slate-800"
                          : "bg-emerald-950/40 border-emerald-800/60 text-slate-200"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLight ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-500 text-white"
                              }`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className={`text-xs sm:text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                              ¡Ya estás registrado a bordo de este recorrido!
                            </h4>
                            <p className={`text-[11px] sm:text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                              Abordaje confirmado a las {myBoardingRecord.horaAbordaje} hrs con tu firma digital registrada.
                            </p>
                          </div>
                        </div>
                        {myBoardingRecord.firma && (
                          <button
                            onClick={() =>
                              setSelectedSignaturePreview({
                                estudiante: `${myBoardingRecord.nombres} ${myBoardingRecord.apellidos}`,
                                codigo: myBoardingRecord.codigo,
                                firma: myBoardingRecord.firma!,
                                hora: myBoardingRecord.horaAbordaje,
                              })
                            }
                            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs ${isLight
                              ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                              : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
                              }`}
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ver Mi Firma</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`mt-4 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isLight
                          ? "bg-blue-50/80 border-blue-200 text-slate-800"
                          : "bg-blue-950/30 border-blue-800/60 text-slate-200"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLight ? "bg-blue-600 text-white shadow-xs" : "bg-blue-500 text-white"
                              }`}
                          >
                            <PenTool className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className={`text-xs sm:text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                              {currentRole === "estudiante"
                                ? "Registro de Mi Abordaje y Firma Digital"
                                : "Registro de Pasajero con Firma Táctil"}
                            </h4>
                            <p className={`text-[11px] sm:text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                              {currentRole === "estudiante"
                                ? "Ingresa tus datos y realiza tu firma con el dedo en tu celular para confirmar tu asiento."
                                : "Permite al estudiante ingresar sus datos y firmar en la pantalla táctil de este celular."}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleOpenSignModal}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
                        >
                          <PenTool className="w-4 h-4" />
                          <span>{currentRole === "estudiante" ? "Firmar Mi Abordaje" : "Nuevo Abordaje con Firma"}</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className={`text-xs py-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    {currentRole === "estudiante"
                      ? "Actualmente no hay ninguna unidad en ruta. El registro de abordaje se habilitará automáticamente cuando el conductor o administrador despache el recorrido."
                      : "Inicie un nuevo recorrido completando el formulario a continuación para habilitar el registro de abordaje."}
                  </p>
                )}
              </div>

              {/* Start New Trip Form */}
              {currentRole !== "estudiante" && (
                <div
                  className={`rounded-xl border p-5 space-y-4 transition-colors duration-200 ${isLight
                    ? "bg-white border-slate-200 shadow-xs"
                    : "bg-[#111c30] border-slate-800"
                    }`}
                >
                  <div
                    className={`flex items-center gap-2 pb-3 border-b ${isLight ? "border-slate-200" : "border-slate-800"
                      }`}
                  >
                    <PlusCircle className="w-4 h-4 text-slate-500" />
                    <h3 className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
                      Despachar Nuevo Recorrido
                    </h3>
                  </div>

                  <form onSubmit={handleStartTrip} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="space-y-1">
                      <label className={`text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        Chofer Encargado *
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${isLight
                          ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-600"
                          : "bg-slate-900 border-slate-700/80 text-white placeholder-slate-500 focus:border-slate-500"
                          }`}
                        placeholder="Ej: Miguel Quesquén Rodas"
                        value={viajeChofer}
                        onChange={(e) => setViajeChofer(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={`text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        Placa del Vehículo
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-mono uppercase focus:outline-none transition-colors ${isLight
                          ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-600"
                          : "bg-slate-900 border-slate-700/80 text-white placeholder-slate-500 focus:border-slate-500"
                          }`}
                        placeholder="Ej: T2B-964"
                        value={viajePlaca}
                        onChange={(e) => setViajePlaca(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={`text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        Origen *
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${isLight
                          ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-600"
                          : "bg-slate-900 border-slate-700/80 text-white focus:border-slate-500"
                          }`}
                        value={viajeOrigen}
                        onChange={(e) => setViajeOrigen(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={`text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        Destino *
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${isLight
                          ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-600"
                          : "bg-slate-900 border-slate-700/80 text-white focus:border-slate-500"
                          }`}
                        value={viajeDestino}
                        onChange={(e) => setViajeDestino(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={`text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        Ruta
                      </label>
                      <select
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${isLight
                          ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-600"
                          : "bg-slate-900 border-slate-700/80 text-white focus:border-slate-500"
                          }`}
                        value={viajeRuta}
                        onChange={(e) => setViajeRuta(e.target.value)}
                      >
                        <option value="Ruta A - Chepén">Ruta A - Chepén</option>
                        <option value="Ruta B - Guadalupe">Ruta B - Guadalupe</option>
                        <option value="Ruta C - Pacasmayo">Ruta C - Pacasmayo</option>
                        <option value="Ruta Directa Central">Ruta Directa Central</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className={`text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        Turno
                      </label>
                      <select
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${isLight
                          ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-600"
                          : "bg-slate-900 border-slate-700/80 text-white focus:border-slate-500"
                          }`}
                        value={viajeTurno}
                        onChange={(e) => setViajeTurno(e.target.value)}
                      >
                        <option value="Mañana">Mañana</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noche">Noche</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className={`text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        Total de Asientos
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-none transition-colors ${isLight
                          ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-600"
                          : "bg-slate-900 border-slate-700/80 text-white focus:border-slate-500"
                          }`}
                        value={viajeAsientos}
                        onChange={(e) => setViajeAsientos(parseInt(e.target.value) || 48)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={`text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        Fecha
                      </label>
                      <input
                        type="date"
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${isLight
                          ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-600"
                          : "bg-slate-900 border-slate-700/80 text-white focus:border-slate-500"
                          }`}
                        value={viajeFecha}
                        onChange={(e) => setViajeFecha(e.target.value)}
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4 pt-1">
                      <button
                        type="submit"
                        className={`w-full py-2.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs ${isLight
                          ? "bg-slate-900 hover:bg-slate-800 text-white"
                          : "bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white"
                          }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Iniciar Recorrido
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}



          {/* ================= TAB 3: PASAJEROS A BORDO ================= */}
          {activeTab === "pasajeros" && currentRole !== "estudiante" && (
            <div
              className={`rounded-xl border p-5 space-y-4 transition-colors duration-200 ${isLight ? "bg-white border-slate-200 shadow-xs" : "bg-[#111c30] border-slate-800"
                }`}
            >
              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${isLight ? "border-slate-200" : "border-slate-800"
                  }`}
              >
                <div>
                  <h3 className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
                    Pasajeros a Bordo (Viaje Activo)
                  </h3>
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    {activeViaje
                      ? `${activeViaje.ruta} &bull; ${activePasajeros.length} de ${activeViaje.totalAsientos} asientos ocupados`
                      : "Sin viaje activo en este momento."}
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Filtrar por código o nombre..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${isLight
                      ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500"
                      : "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500"
                      }`}
                    value={searchPasajeros}
                    onChange={(e) => setSearchPasajeros(e.target.value)}
                  />
                </div>
              </div>

              {/* Registro rápido de abordaje para el viaje activo */}
              {activeViaje && (
                <div
                  className={`p-3 rounded-lg border space-y-2.5 transition-colors ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                    }`}
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Código de estudiante para registrar abordaje (presione Enter)..."
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleValidateBoarding();
                        }
                      }}
                      className={`flex-1 px-3 py-1.5 rounded-lg border font-mono text-xs focus:outline-none transition-colors ${isLight
                        ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500"
                        : "bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500"
                        }`}
                    />
                    <button
                      onClick={handleValidateBoarding}
                      className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs ${isLight
                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                        : "bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white"
                        }`}
                    >
                      <Check className="w-3.5 h-3.5" /> Registrar Abordaje
                    </button>
                    <button
                      onClick={handleOpenSignModal}
                      className="px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                      title="Registrar abordaje con firma dibujada en pantalla táctil"
                    >
                      <PenTool className="w-3.5 h-3.5" /> Con Firma Táctil
                    </button>
                  </div>

                  {scanResult.type !== "neutral" && (
                    <div
                      className={`p-2.5 rounded-md border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${scanResult.type === "success"
                        ? isLight
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : "bg-slate-900/90 border-emerald-800/60 text-slate-200"
                        : scanResult.type === "duplicate"
                          ? isLight
                            ? "bg-amber-50 border-amber-300 text-amber-900"
                            : "bg-slate-900/90 border-amber-800/60 text-slate-200"
                          : isLight
                            ? "bg-rose-50 border-rose-300 text-rose-900"
                            : "bg-slate-900/90 border-rose-800/60 text-slate-200"
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {scanResult.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                        {scanResult.type === "duplicate" && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                        {scanResult.type === "error" && <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                        <span className="font-semibold truncate">{scanResult.title}</span>
                        <span className={`text-[11px] truncate hidden sm:inline ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                          &bull; {scanResult.subtitle}
                        </span>
                      </div>
                      <button
                        onClick={() => setScanResult({ type: "neutral", title: "", subtitle: "", badges: [] })}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Formulario rápido si el estudiante no existe en padrón */}
                  {showQuickRegister && (
                    <form onSubmit={handleQuickRegisterSubmit} className="pt-1.5 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                      <input
                        type="text"
                        required
                        placeholder="Nombres"
                        value={quickNombres}
                        onChange={(e) => setQuickNombres(e.target.value)}
                        className={`px-2 py-1 rounded border ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-slate-950 border-slate-700 text-white"}`}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Apellidos"
                        value={quickApellidos}
                        onChange={(e) => setQuickApellidos(e.target.value)}
                        className={`px-2 py-1 rounded border ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-slate-950 border-slate-700 text-white"}`}
                      />
                      <select
                        value={quickCarrera}
                        onChange={(e) => setQuickCarrera(e.target.value)}
                        className={`px-2 py-1 rounded border ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-slate-950 border-slate-700 text-white"}`}
                      >
                        {UNT_CAREERS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className={`py-1 px-2 rounded font-semibold text-xs ${isLight ? "bg-slate-900 text-white" : "bg-slate-800 text-white border border-slate-700"}`}
                      >
                        Guardar y Abordar
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div
                className={`overflow-x-auto rounded-lg border ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/40"
                  }`}
              >
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`text-[10px] uppercase font-bold border-b ${isLight
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : "bg-slate-900/90 text-slate-400 border-slate-800"
                        }`}
                    >
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Hora</th>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Estudiante</th>
                      <th className="py-2.5 px-3">Carrera</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-center">Firma</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? "divide-slate-100" : "divide-slate-800/60"}`}>
                    {!activeViaje ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          No hay viaje activo en curso
                        </td>
                      </tr>
                    ) : filteredPasajeros.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          {searchPasajeros ? "Sin coincidencias" : "No hay pasajeros a bordo registrados aún"}
                        </td>
                      </tr>
                    ) : (
                      filteredPasajeros.map((p, idx) => (
                        <tr
                          key={p.id}
                          className={`transition-colors ${isLight ? "hover:bg-slate-50" : "hover:bg-slate-900/40"
                            }`}
                        >
                          <td className={`py-2.5 px-3 font-bold ${isLight ? "text-slate-400" : "text-slate-400"}`}>{idx + 1}</td>
                          <td className={`py-2.5 px-3 font-mono ${isLight ? "text-slate-600" : "text-slate-300"}`}>{p.horaAbordaje}</td>
                          <td className={`py-2.5 px-3 font-mono font-bold ${isLight ? "text-slate-900" : "text-slate-200"}`}>{p.codigo}</td>
                          <td className={`py-2.5 px-3 font-medium ${isLight ? "text-slate-900" : "text-white"}`}>
                            {p.apellidos}, {p.nombres}
                          </td>
                          <td className={`py-2.5 px-3 ${isLight ? "text-slate-600" : "text-slate-400"}`}>{p.carrera}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${isLight
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-900 text-emerald-300 border border-slate-700"
                                }`}
                            >
                              {p.estado}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {p.firma ? (
                              <button
                                onClick={() =>
                                  setSelectedSignaturePreview({
                                    estudiante: `${p.apellidos}, ${p.nombres}`,
                                    codigo: p.codigo,
                                    firma: p.firma!,
                                    hora: p.horaAbordaje,
                                  })
                                }
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors shadow-2xs ${isLight
                                  ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                                  : "bg-blue-950/70 hover:bg-blue-900 border border-blue-800 text-blue-300"
                                  }`}
                                title="Ver firma digital capturada"
                              >
                                <PenTool className="w-3 h-3 text-blue-500" />
                                <span>Ver Firma</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">Sin firma</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleRemovePassenger(p.id)}
                              className={`p-1 rounded border transition-colors ${isLight
                                ? "bg-slate-50 hover:bg-red-50 border-slate-200 text-slate-400 hover:text-red-600"
                                : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-rose-400"
                                }`}
                              title="Anular abordaje"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 4: PADRÓN ESTUDIANTIL ================= */}
          {activeTab === "estudiantes" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Students Table (8 cols) */}
              <div
                className={`lg:col-span-8 rounded-xl border p-5 space-y-3.5 transition-colors duration-200 ${isLight ? "bg-white border-slate-200 shadow-xs" : "bg-[#111c30] border-slate-800"
                  }`}
              >
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${isLight ? "border-slate-200" : "border-slate-800"
                    }`}
                >
                  <div>
                    <h3 className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
                      Padrón de Estudiantes Registrados
                    </h3>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {estudiantes.length} alumnos registrados en la base local
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <select
                      value={selectedCareerFilter}
                      onChange={(e) => setSelectedCareerFilter(e.target.value)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${isLight
                        ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500"
                        : "bg-slate-900 border-slate-700 text-white focus:border-slate-500"
                        }`}
                    >
                      <option value="TODAS">Todas las carreras</option>
                      {UNT_CAREERS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar estudiante..."
                        className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${isLight
                          ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500"
                          : "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500"
                          }`}
                        value={searchEstudiantes}
                        onChange={(e) => setSearchEstudiantes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`overflow-x-auto rounded-lg border ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/40"
                    }`}
                >
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr
                        className={`text-[10px] uppercase font-bold border-b ${isLight
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-slate-900/90 text-slate-400 border-slate-800"
                          }`}
                      >
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Estudiante</th>
                        <th className="py-2.5 px-3">Carrera</th>
                        <th className="py-2.5 px-3">Lugar</th>
                        <th className="py-2.5 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? "divide-slate-100" : "divide-slate-800/60"}`}>
                      {filteredEstudiantes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No se encontraron estudiantes
                          </td>
                        </tr>
                      ) : (
                        filteredEstudiantes.map((s) => (
                          <tr
                            key={s.id}
                            className={`transition-colors ${isLight ? "hover:bg-slate-50" : "hover:bg-slate-900/40"
                              }`}
                          >
                            <td className={`py-2.5 px-3 font-mono font-bold ${isLight ? "text-slate-900" : "text-slate-200"}`}>{s.codigo}</td>
                            <td className={`py-2.5 px-3 font-medium ${isLight ? "text-slate-900" : "text-white"}`}>
                              {s.apellidos}, {s.nombres}
                            </td>
                            <td className={`py-2.5 px-3 ${isLight ? "text-slate-600" : "text-slate-300"}`}>{s.carrera}</td>
                            <td className={`py-2.5 px-3 ${isLight ? "text-slate-500" : "text-slate-400"}`}>{s.lugar || "—"}</td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditStudent(s)}
                                  className={`p-1 rounded transition-colors ${isLight
                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    : "bg-slate-900 hover:bg-slate-800 text-slate-300"
                                    }`}
                                  title="Editar"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(s.id)}
                                  className={`p-1 rounded transition-colors ${isLight
                                    ? "bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600"
                                    : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                                    }`}
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Form Add/Edit (4 cols) */}
              <div
                className={`lg:col-span-4 rounded-xl border p-5 space-y-3.5 transition-colors duration-200 ${isLight ? "bg-white border-slate-200 shadow-xs" : "bg-[#111c30] border-slate-800"
                  }`}
              >
                <div
                  className={`flex items-center gap-2 pb-2.5 border-b ${isLight ? "border-slate-200" : "border-slate-800"
                    }`}
                >
                  <GraduationCap className="w-4 h-4 text-slate-500" />
                  <h3 className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
                    {editingStudentId ? "Modificar Estudiante" : "Agregar Estudiante"}
                  </h3>
                </div>

                <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className={`font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>Código Universitario *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 1052100122"
                      className={`w-full px-2.5 py-1.5 rounded border font-mono focus:outline-none transition-colors ${isLight
                        ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500"
                        : "bg-slate-900 border-slate-700 text-white focus:border-slate-500"
                        }`}
                      value={estCodigo}
                      onChange={(e) => setEstCodigo(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>Carrera / Escuela *</label>
                    <select
                      className={`w-full px-2.5 py-1.5 rounded border focus:outline-none transition-colors ${isLight
                        ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500"
                        : "bg-slate-900 border-slate-700 text-white focus:border-slate-500"
                        }`}
                      value={estCarrera}
                      onChange={(e) => setEstCarrera(e.target.value)}
                    >
                      {UNT_CAREERS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className={`font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>Nombres *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Jhon Robinson"
                      className={`w-full px-2.5 py-1.5 rounded border focus:outline-none transition-colors ${isLight
                        ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500"
                        : "bg-slate-900 border-slate-700 text-white focus:border-slate-500"
                        }`}
                      value={estNombres}
                      onChange={(e) => setEstNombres(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>Apellidos *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Llique Chávarry"
                      className={`w-full px-2.5 py-1.5 rounded border focus:outline-none transition-colors ${isLight
                        ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500"
                        : "bg-slate-900 border-slate-700 text-white focus:border-slate-500"
                        }`}
                      value={estApellidos}
                      onChange={(e) => setEstApellidos(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>Lugar / Paradero Habitual</label>
                    <input
                      type="text"
                      placeholder="Ej: Pacasmayo"
                      className={`w-full px-2.5 py-1.5 rounded border focus:outline-none transition-colors ${isLight
                        ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500"
                        : "bg-slate-900 border-slate-700 text-white focus:border-slate-500"
                        }`}
                      value={estLugar}
                      onChange={(e) => setEstLugar(e.target.value)}
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      className={`flex-1 py-2 rounded font-semibold transition-colors flex items-center justify-center gap-1.5 ${isLight
                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                        : "bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white"
                        }`}
                    >
                      <Check className="w-3.5 h-3.5" /> {editingStudentId ? "Actualizar" : "Guardar Estudiante"}
                    </button>
                    {editingStudentId && (
                      <button
                        type="button"
                        onClick={handleCancelStudentEdit}
                        className={`px-2.5 py-2 rounded border transition-colors ${isLight
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300"
                          : "bg-slate-900 text-slate-400 hover:text-white border-slate-800"
                          }`}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= TAB 5: HISTORIAL DE VIAJES ================= */}
          {activeTab === "historial" && (
            <div
              className={`rounded-xl border p-5 space-y-4 transition-colors duration-200 ${isLight ? "bg-white border-slate-200 shadow-xs" : "bg-[#111c30] border-slate-800"
                }`}
            >
              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${isLight ? "border-slate-200" : "border-slate-800"
                  }`}
              >
                <div>
                  <h3 className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
                    Historial de Recorridos
                  </h3>
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Registro histórico de viajes despachados y concluidos
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Fecha:</span>
                  <input
                    type="date"
                    className={`px-2.5 py-1 rounded border text-xs focus:outline-none transition-colors ${isLight
                      ? "bg-slate-50 border-slate-300 text-slate-900"
                      : "bg-slate-900 border-slate-700 text-white"
                      }`}
                    value={filterHistorialDate}
                    onChange={(e) => setFilterHistorialDate(e.target.value)}
                  />
                </div>
              </div>

              <div
                className={`overflow-x-auto rounded-lg border ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/40"
                  }`}
              >
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`text-[10px] uppercase font-bold border-b ${isLight
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : "bg-slate-900/90 text-slate-400 border-slate-800"
                        }`}
                    >
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Ruta</th>
                      <th className="py-2.5 px-3">Turno</th>
                      <th className="py-2.5 px-3">Chofer / Placa</th>
                      <th className="py-2.5 px-3">Horario</th>
                      <th className="py-2.5 px-3">Aforo</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? "divide-slate-100" : "divide-slate-800/60"}`}>
                    {filteredViajes.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          No se registraron viajes en esta fecha
                        </td>
                      </tr>
                    ) : (
                      filteredViajes.map((v) => {
                        const count = pasajeros.filter((p) => p.viajeId === v.id).length;
                        return (
                          <tr
                            key={v.id}
                            className={`transition-colors ${isLight ? "hover:bg-slate-50" : "hover:bg-slate-900/40"
                              }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-slate-400">#{v.id.toString().slice(-4)}</td>
                            <td className={`py-2.5 px-3 ${isLight ? "text-slate-600" : "text-slate-300"}`}>{v.fecha}</td>
                            <td className={`py-2.5 px-3 font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{v.ruta}</td>
                            <td className={`py-2.5 px-3 ${isLight ? "text-slate-500" : "text-slate-400"}`}>{v.turno}</td>
                            <td className={`py-2.5 px-3 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                              {v.chofer} <span className="text-slate-400">({v.placa || "EGB-123"})</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                              {v.horaSalida || "—"} / {v.horaLlegada || "En curso"}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${isLight
                                  ? "bg-slate-100 text-slate-700 border-slate-200"
                                  : "bg-slate-900 text-slate-300 border-slate-800"
                                  }`}
                              >
                                {count} / {v.totalAsientos}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${v.cerrado
                                  ? isLight
                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-slate-900 text-slate-400 border border-slate-800"
                                  : isLight
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-900 text-emerald-300 border border-slate-700"
                                  }`}
                              >
                                {v.cerrado ? "Cerrado" : "En Curso"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedViajeDetail(v)}
                                  className={`px-2 py-1 rounded font-semibold text-[11px] transition-colors flex items-center gap-1 border ${isLight
                                    ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                                    }`}
                                >
                                  <Eye className="w-3 h-3 text-slate-400" /> Ver
                                </button>
                                <button
                                  onClick={() => handleDeleteTrip(v.id)}
                                  className={`p-1 rounded transition-colors ${isLight
                                    ? "bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600"
                                    : "bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-rose-400"
                                    }`}
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL: DETALLES DEL RECORRIDO ================= */}
      {selectedViajeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl rounded-xl border shadow-2xl p-5 space-y-3.5 ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0e1628] border-slate-700 text-white"
              }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? "border-slate-200" : "border-slate-800"}`}>
              <h3 className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
                {selectedViajeDetail.ruta} &bull; {selectedViajeDetail.fecha}
              </h3>
              <button
                onClick={() => setSelectedViajeDetail(null)}
                className={`p-1 rounded ${isLight ? "hover:bg-slate-100 text-slate-500" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className={`p-2 rounded border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                <span className={`block text-[10px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>Conductor</span>
                <strong className={`block mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>{selectedViajeDetail.chofer}</strong>
              </div>
              <div className={`p-2 rounded border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                <span className={`block text-[10px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>Placa</span>
                <strong className={`font-mono block mt-0.5 ${isLight ? "text-slate-800" : "text-slate-300"}`}>{selectedViajeDetail.placa || "EGB-123"}</strong>
              </div>
              <div className={`p-2 rounded border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                <span className={`block text-[10px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>Salida / Llegada</span>
                <strong className={`block mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>
                  {selectedViajeDetail.horaSalida || "—"} / {selectedViajeDetail.horaLlegada || "En curso"}
                </strong>
              </div>
              <div className={`p-2 rounded border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                <span className={`block text-[10px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>Pasajeros</span>
                <strong className={`font-mono block mt-0.5 ${isLight ? "text-slate-900" : "text-slate-200"}`}>
                  {pasajeros.filter((p) => p.viajeId === selectedViajeDetail.id).length} de {selectedViajeDetail.totalAsientos}
                </strong>
              </div>
            </div>

            <h4 className={`text-[11px] font-bold uppercase tracking-wider pt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              Estudiantes a bordo:
            </h4>
            <div className={`max-h-52 overflow-x-auto overflow-y-auto rounded-lg border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/40 border-slate-800"}`}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`text-[10px] uppercase font-bold border-b ${isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-slate-900 text-slate-400 border-slate-800"}`}>
                    <th className="py-2 px-2.5">#</th>
                    <th className="py-2 px-2.5">Hora</th>
                    <th className="py-2 px-2.5">Código</th>
                    <th className="py-2 px-2.5">Estudiante</th>
                    <th className="py-2 px-2.5">Carrera</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? "divide-slate-200" : "divide-slate-800/60"}`}>
                  {pasajeros
                    .filter((p) => p.viajeId === selectedViajeDetail.id)
                    .map((p, idx) => (
                      <tr key={p.id}>
                        <td className="py-1.5 px-2.5 text-slate-400 font-bold">{idx + 1}</td>
                        <td className={`py-1.5 px-2.5 font-mono ${isLight ? "text-slate-600" : "text-slate-300"}`}>{p.horaAbordaje}</td>
                        <td className={`py-1.5 px-2.5 font-mono font-bold ${isLight ? "text-slate-900" : "text-slate-200"}`}>{p.codigo}</td>
                        <td className={`py-1.5 px-2.5 font-medium ${isLight ? "text-slate-900" : "text-white"}`}>
                          {p.apellidos}, {p.nombres}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-400">{p.carrera}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() =>
                  exportarPDFViaje(
                    selectedViajeDetail,
                    pasajeros.filter((p) => p.viajeId === selectedViajeDetail.id)
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                  : "bg-slate-800 hover:bg-slate-700 text-white"
                  }`}
              >
                <FileText className="w-3.5 h-3.5" /> Descargar PDF
              </button>
              <button
                onClick={() =>
                  exportarExcelViaje(
                    selectedViajeDetail,
                    pasajeros.filter((p) => p.viajeId === selectedViajeDetail.id)
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${isLight
                  ? "bg-slate-900 hover:bg-slate-800 text-white"
                  : "bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white"
                  }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Descargar Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SELECCIÓN DE ROLES ================= */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-xl border shadow-2xl p-5 space-y-3.5 ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0e1628] border-slate-700 text-white"
              }`}
          >
            <div className={`flex items-center justify-between pb-2.5 border-b ${isLight ? "border-slate-200" : "border-slate-800"}`}>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <h3 className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
                  Cambiar Perfil de Acceso
                </h3>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className={`p-1 rounded ${isLight ? "hover:bg-slate-100 text-slate-500" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Seleccione el rol correspondiente para acceder a sus funciones y vistas:
            </p>

            <div className="space-y-2">
              <div
                onClick={() => {
                  setCurrentRole("admin");
                  setIsRoleModalOpen(false);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${currentRole === "admin"
                  ? isLight
                    ? "bg-slate-100 border-slate-400 text-slate-900"
                    : "bg-slate-800/80 border-slate-600 text-white"
                  : isLight
                    ? "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isLight ? "bg-slate-200 text-slate-700" : "bg-slate-800 text-slate-300"
                    }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-xs ${isLight ? "text-slate-900" : "text-white"}`}>
                    Administrador General
                  </h4>
                  <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Acceso a todos los módulos, padrón y exportaciones.
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  setCurrentRole("operador");
                  setActiveTab("viaje");
                  setIsRoleModalOpen(false);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${currentRole === "operador"
                  ? isLight
                    ? "bg-slate-100 border-slate-400 text-slate-900"
                    : "bg-slate-800/80 border-slate-600 text-white"
                  : isLight
                    ? "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isLight ? "bg-slate-200 text-slate-700" : "bg-slate-800 text-slate-300"
                    }`}
                >
                  <Bus className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-xs ${isLight ? "text-slate-900" : "text-white"}`}>
                    Conductor / Chofer
                  </h4>
                  <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Control de recorrido y lista de pasajeros.
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  setCurrentRole("estudiante");
                  setActiveTab("viaje");
                  setIsRoleModalOpen(false);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${currentRole === "estudiante"
                  ? isLight
                    ? "bg-slate-100 border-slate-400 text-slate-900"
                    : "bg-slate-800/80 border-slate-600 text-white"
                  : isLight
                    ? "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isLight ? "bg-slate-200 text-slate-700" : "bg-slate-800 text-slate-300"
                    }`}
                >
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-xs ${isLight ? "text-slate-900" : "text-white"}`}>
                    Estudiante Universitario
                  </h4>
                  <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Modo consulta para ver la unidad en ruta y aforo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ABORDAJE Y FIRMA DIGITAL TÁCTIL ================= */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-4 my-auto transition-colors duration-200 ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0e1628] border-slate-700 text-white"
              }`}
          >
            {/* Modal Header */}
            <div className={`flex items-start justify-between pb-3 border-b ${isLight ? "border-slate-200" : "border-slate-800"}`}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl border p-1 flex items-center justify-center flex-shrink-0 shadow-xs ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-700/60"
                    }`}
                >
                  <img
                    src="/escudo-unt.png"
                    alt="Escudo UNT"
                    className="w-full h-full object-contain filter drop-shadow-xs"
                  />
                </div>
                <div>
                  <h3 className={`font-bold text-sm sm:text-base leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                    Registro de Abordaje y Firma Digital
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    {activeViaje ? `${activeViaje.ruta} • Bus ${activeViaje.placa || "UNT"}` : "Sin viaje activo"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSignModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${isLight ? "hover:bg-slate-100 text-slate-500" : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitSignatureBoarding} className="space-y-3.5">
              {/* Código de Matrícula */}
              <div className="space-y-1">
                <label className={`text-xs font-semibold block ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  Código de Matrícula UNT *
                </label>
                <input
                  type="text"
                  required
                  value={signCodigo}
                  onChange={(e) => handleSignCodigoChange(e.target.value)}
                  placeholder="Ej: 1020304021"
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xs sm:text-sm focus:outline-none transition-all ${isLight
                    ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    : "bg-slate-950 border-slate-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    }`}
                />
                {signFeedback && (
                  <p className="text-[11px] text-emerald-600 font-medium animate-in fade-in duration-200">
                    {signFeedback}
                  </p>
                )}
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-semibold block ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={signNombres}
                    onChange={(e) => setSignNombres(e.target.value)}
                    placeholder="Ej: Carlos Eduardo"
                    className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all ${isLight
                      ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600"
                      : "bg-slate-950 border-slate-700 text-white focus:border-blue-500"
                      }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-semibold block ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={signApellidos}
                    onChange={(e) => setSignApellidos(e.target.value)}
                    placeholder="Ej: Mendoza Silva"
                    className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all ${isLight
                      ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600"
                      : "bg-slate-950 border-slate-700 text-white focus:border-blue-500"
                      }`}
                  />
                </div>
              </div>

              {/* Carrera / Escuela */}
              <div className="space-y-1">
                <label className={`text-xs font-semibold block ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  Carrera / Escuela Profesional *
                </label>
                <select
                  value={signCarrera}
                  onChange={(e) => setSignCarrera(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none cursor-pointer transition-all ${isLight
                    ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600"
                    : "bg-slate-950 border-slate-700 text-white focus:border-blue-500"
                    }`}
                >
                  {UNT_CAREERS.map((c) => (
                    <option key={c} value={c} className={isLight ? "bg-white text-slate-900" : "bg-slate-900 text-white"}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paradero Habitual y Celular WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-semibold block ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                    Paradero de Abordaje *
                  </label>
                  <input
                    type="text"
                    required
                    value={signParadero}
                    onChange={(e) => setSignParadero(e.target.value)}
                    placeholder="Ej: Pacasmayo, Chepén..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all ${isLight
                      ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600"
                      : "bg-slate-950 border-slate-700 text-white focus:border-blue-500"
                      }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-semibold block ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                    Celular WhatsApp (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={signTelefono}
                    onChange={(e) => setSignTelefono(e.target.value)}
                    placeholder="Ej: 948123456"
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-xs sm:text-sm focus:outline-none transition-all ${isLight
                      ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600"
                      : "bg-slate-950 border-slate-700 text-white focus:border-blue-500"
                      }`}
                  />
                </div>
              </div>

              {/* Canvas de Firma Táctil */}
              <div className="pt-1">
                <SignaturePad onSignatureChange={setSignFirma} height={165} />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${isLight
                    ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Abordaje y Firmar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VISTA PREVIA DE FIRMA DIGITAL ================= */}
      {selectedSignaturePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 space-y-4 transition-colors duration-200 ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0e1628] border-slate-700 text-white"
              }`}
          >
            <div className={`flex items-center justify-between pb-2.5 border-b ${isLight ? "border-slate-200" : "border-slate-800"}`}>
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-xs sm:text-sm">Firma Digital Capturada</h4>
              </div>
              <button
                onClick={() => setSelectedSignaturePreview(null)}
                className={`p-1 rounded-lg ${isLight ? "hover:bg-slate-100 text-slate-500" : "hover:bg-slate-800 text-slate-400"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <p><strong>Estudiante:</strong> {selectedSignaturePreview.estudiante}</p>
              <p className="font-mono"><strong>Código:</strong> {selectedSignaturePreview.codigo}</p>
              <p className="font-mono"><strong>Hora de firma:</strong> {selectedSignaturePreview.hora}</p>
            </div>

            <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-white shadow-inner flex items-center justify-center">
              <img
                src={selectedSignaturePreview.firma}
                alt="Firma del estudiante"
                className="max-h-32 object-contain"
              />
            </div>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => setSelectedSignaturePreview(null)}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM MOBILE NAVIGATION BAR ================= */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t py-1 px-1 flex items-center justify-around transition-colors duration-200 ${isLight
          ? "bg-white/95 backdrop-blur-md border-slate-200 shadow-lg text-slate-700"
          : "bg-[#0d1527]/95 backdrop-blur-md border-slate-800 shadow-lg text-slate-300"
          }`}
      >
        <button
          onClick={() => setActiveTab("viaje")}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium transition-all ${activeTab === "viaje"
            ? isLight ? "text-slate-900 font-bold" : "text-white font-bold"
            : "text-slate-400 hover:text-slate-600"
            }`}
        >
          <Compass className={`w-5 h-5 mb-0.5 ${activeTab === "viaje" ? "text-blue-600 stroke-[2.5]" : ""}`} />
          <span>Recorridos</span>
        </button>

        {currentRole !== "estudiante" && (
          <button
            onClick={() => setActiveTab("pasajeros")}
            className={`flex-1 relative flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium transition-all ${activeTab === "pasajeros"
              ? isLight ? "text-slate-900 font-bold" : "text-white font-bold"
              : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <div className="relative">
              <Users className={`w-5 h-5 mb-0.5 ${activeTab === "pasajeros" ? "text-blue-600 stroke-[2.5]" : ""}`} />
              {activePasajeros.length > 0 && (
                <span className="absolute -top-1 -right-2 px-1 min-w-[15px] h-3.5 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {activePasajeros.length}
                </span>
              )}
            </div>
            <span>Pasajeros</span>
          </button>
        )}

        {currentRole === "admin" && (
          <button
            onClick={() => setActiveTab("estudiantes")}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium transition-all ${activeTab === "estudiantes"
              ? isLight ? "text-slate-900 font-bold" : "text-white font-bold"
              : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <GraduationCap className={`w-5 h-5 mb-0.5 ${activeTab === "estudiantes" ? "text-blue-600 stroke-[2.5]" : ""}`} />
            <span>Padrón</span>
          </button>
        )}

        {currentRole === "admin" && (
          <button
            onClick={() => setActiveTab("historial")}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium transition-all ${activeTab === "historial"
              ? isLight ? "text-slate-900 font-bold" : "text-white font-bold"
              : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <History className={`w-5 h-5 mb-0.5 ${activeTab === "historial" ? "text-blue-600 stroke-[2.5]" : ""}`} />
            <span>Historial</span>
          </button>
        )}
      </nav>
    </div>
  );
}
