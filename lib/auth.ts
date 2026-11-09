import { Role, Student } from "./types";
import { UNT_STUDENTS, UNT_BUSES } from "./mock-data";

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  lastName?: string;
  identifier: string; // email, studentCode, or driverCode
  subTitle?: string; // career or role title
  phone?: string;
  email?: string;
  studentCode?: string;
  code?: string;
  career?: string;
  busInfo?: string;
}

export const DEMO_CREDENTIALS = [
  {
    role: "ADMIN" as Role,
    roleTitle: "Administrador General",
    institution: "Oficina General de Bienestar Universitario (OGBU)",
    identifier: "admin.transporte@unitru.edu.pe",
    name: "Dra. Carmen Rosa Valderrama",
    pin: "admin123",
    description: "Gestión global de flota, padrones, reportes oficiales y métricas.",
  },
  {
    role: "DRIVER" as Role,
    roleTitle: "Conductor / Operador",
    institution: "Área de Transporte Institucional UNT",
    identifier: "COND-01",
    name: "Manuel Morales Cerna",
    busInfo: "Bus UNT #01 — Placa EGB-123",
    pin: "chofer123",
    description: "Terminal de abordaje rápido, lector QR, firma táctil y control de aforo.",
  },
  {
    role: "STUDENT" as Role,
    roleTitle: "Alumno a Bordo / Estudiante",
    institution: "Pregrado — Universidad Nacional de Trujillo",
    identifier: "1020304021",
    name: "Carlos Eduardo Mendoza Silva",
    subTitle: "Ingeniería de Sistemas",
    pin: "unt2026",
    description: "Carné digital UNT, QR de abordaje, monitor de bus y estado de ruta.",
  },
];

export function authenticate(
  role: Role,
  identifier: string,
  pin: string
): { success: boolean; user?: AuthUser; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPin = pin.trim();

  if (!cleanId) {
    return { success: false, error: "Por favor ingrese su correo o usuario institucional" };
  }
  if (!cleanPin) {
    return { success: false, error: "Por favor ingrese su contraseña" };
  }

  // Institutional student email validation
  if (role === "STUDENT" && cleanId.includes("@") && !cleanId.endsWith("@unitru.edu.pe")) {
    return {
      success: false,
      error: "Los alumnos deben ingresar obligatoriamente con su correo institucional (@unitru.edu.pe) o su código de matrícula UNT.",
    };
  }

  // 1. ADMIN Authentication
  if (role === "ADMIN" || cleanId.startsWith("admin")) {
    if (
      cleanId === "admin" ||
      cleanId === "admin.transporte@unitru.edu.pe" ||
      cleanId === "admin@unitru.edu.pe" ||
      cleanId === "admin@unt.edu.pe" ||
      cleanId.includes("admin")
    ) {
      return {
        success: true,
        user: {
          id: "usr-admin-01",
          role: "ADMIN",
          name: "Dra. Carmen Valderrama",
          lastName: "Pinedo",
          identifier: cleanId,
          email: "admin.transporte@unitru.edu.pe",
          subTitle: "Oficina General de Bienestar Universitario",
          phone: "(044) 205600",
        },
      };
    }
  }

  // 2. DRIVER Authentication
  if (role === "DRIVER" || cleanId.includes("conductor") || cleanId.includes("chofer") || cleanId.startsWith("cond")) {
    const bus = UNT_BUSES[0];
    return {
      success: true,
      user: {
        id: "usr-driver-01",
        role: "DRIVER",
        name: "Manuel Morales Cerna",
        identifier: cleanId,
        busInfo: `${bus.unitNumber} (${bus.plateNumber})`,
        subTitle: `Conductor Oficial &bull; ${bus.unitNumber}`,
        phone: "948999888",
      },
    };
  }

  // 3. STUDENT Authentication (Default)
  let allStudents = [...UNT_STUDENTS];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("unt_registered_students");
      if (stored) {
        const customStudents: Student[] = JSON.parse(stored);
        allStudents = [...customStudents, ...UNT_STUDENTS];
      }
    } catch {
      // ignore
    }
  }

  const matchedStudent = allStudents.find(
    (s) =>
      s.code.toLowerCase() === cleanId ||
      s.email.toLowerCase() === cleanId ||
      cleanId.includes(s.code.toLowerCase())
  ) || allStudents[0];

  return {
    success: true,
    user: {
      id: matchedStudent.id,
      role: "STUDENT",
      name: `${matchedStudent.name} ${matchedStudent.lastName}`,
      lastName: matchedStudent.lastName,
      identifier: cleanId.includes("@") ? cleanId : matchedStudent.code,
      studentCode: matchedStudent.code,
      subTitle: matchedStudent.career,
      email: matchedStudent.email,
      phone: matchedStudent.phone,
    },
  };
}

export interface NewAccountData {
  name: string;
  lastName: string;
  code: string;
  career: string;
  phone: string;
  email: string;
  password?: string;
}

export function registerAccount(data: NewAccountData): { success: boolean; user?: AuthUser; error?: string } {
  const cleanCode = data.code.trim();
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();
  const cleanLastName = data.lastName.trim();

  if (!cleanName || !cleanLastName) {
    return { success: false, error: "Nombres y apellidos son requeridos." };
  }
  if (!cleanCode || cleanCode.length < 5) {
    return { success: false, error: "Ingrese un código de matrícula UNT válido." };
  }
  if (!cleanEmail || !cleanEmail.endsWith("@unitru.edu.pe")) {
    return {
      success: false,
      error: "Los alumnos deben registrarse obligatoriamente con su correo institucional oficial (@unitru.edu.pe).",
    };
  }

  const newStudent: Student = {
    id: `std-custom-${Date.now()}`,
    code: cleanCode,
    name: cleanName,
    lastName: cleanLastName,
    career: data.career.trim() || "Ingeniería de Sistemas",
    phone: data.phone.trim() || "999111222",
    email: cleanEmail,
    role: "STUDENT",
  };

  // Add to in-memory list
  if (!UNT_STUDENTS.some((s) => s.code === cleanCode)) {
    UNT_STUDENTS.unshift(newStudent);
  }

  // Persist to localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("unt_registered_students");
      const list: Student[] = stored ? JSON.parse(stored) : [];
      if (!list.some((s) => s.code === cleanCode)) {
        list.unshift(newStudent);
        localStorage.setItem("unt_registered_students", JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  }

  const authUser: AuthUser = {
    id: newStudent.id,
    role: "STUDENT",
    name: `${newStudent.name} ${newStudent.lastName}`,
    lastName: newStudent.lastName,
    identifier: cleanEmail,
    studentCode: newStudent.code,
    subTitle: newStudent.career,
    email: newStudent.email,
    phone: newStudent.phone,
  };

  return { success: true, user: authUser };
}


