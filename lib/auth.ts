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
    roleTitle: "Administrador / Conductor Oficial",
    institution: "Oficina General de Bienestar Universitario (OGBU) — UNT",
    identifier: "miguelquesquenrodas@gmail.com",
    name: "Miguel Quesquén Rodas",
    pin: "militza*2003",
    description: "Gestión global de flota, control de recorridos, despacho de viajes y padrones.",
  },
  {
    role: "STUDENT" as Role,
    roleTitle: "Alumno a Bordo / Estudiante",
    institution: "Pregrado — Universidad Nacional de Trujillo",
    identifier: "alumno@unitru.edu.pe",
    name: "Carlos Eduardo Mendoza Silva",
    subTitle: "Ingeniería de Sistemas",
    pin: "unt2026",
    description: "Carné digital UNT, firma táctil de abordaje y estado de ruta.",
  },
];

export function authenticate(
  identifier: string,
  pin: string,
  role?: Role
): { success: boolean; user?: AuthUser; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPin = pin.trim();

  if (!cleanId) {
    return { success: false, error: "Por favor ingrese su correo electrónico o código institucional." };
  }
  if (!cleanPin) {
    return { success: false, error: "Por favor ingrese su contraseña." };
  }

  // 1. CONDUCTOR / ADMINISTRADOR OFICIAL (miguelquesquenrodas@gmail.com)
  if (
    cleanId === "miguelquesquenrodas@gmail.com" ||
    cleanId.startsWith("miguelquesquen") ||
    cleanId === "admin" ||
    cleanId === "conductor" ||
    cleanId === "admin.transporte@unitru.edu.pe" ||
    cleanId === "conductor@unitru.edu.pe"
  ) {
    const bus = UNT_BUSES[0];
    return {
      success: true,
      user: {
        id: "usr-miguel-01",
        role: "ADMIN",
        name: "Miguel",
        lastName: "Quesquén Rodas",
        identifier: "miguelquesquenrodas@gmail.com",
        email: "miguelquesquenrodas@gmail.com",
        subTitle: "Conductor & Administrador Oficial UNT",
        phone: "948123456",
        busInfo: `${bus.unitNumber} (${bus.plateNumber})`,
      },
    };
  }

  // 2. VALIDACIÓN DE ESTUDIANTES:
  // Si ingresa un correo electrónico (contiene @), debe ser estrictamente @unitru.edu.pe
  if (cleanId.includes("@") && !cleanId.endsWith("@unitru.edu.pe")) {
    return {
      success: false,
      error: "Los alumnos deben ingresar obligatoriamente con su correo institucional (@unitru.edu.pe) o código de matrícula UNT.",
    };
  }

  // 3. AUTENTICACIÓN DE ALUMNOS (Por código UNT o correo @unitru.edu.pe)
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
  );

  if (matchedStudent) {
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

  // Si tiene formato de correo institucional @unitru.edu.pe pero no está en la lista inicial:
  if (cleanId.endsWith("@unitru.edu.pe")) {
    const usernamePart = cleanId.split("@")[0];
    const formattedName = usernamePart
      .split(/[._-]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");

    return {
      success: true,
      user: {
        id: `std-${Date.now()}`,
        role: "STUDENT",
        name: formattedName || "Estudiante",
        lastName: "UNT",
        identifier: cleanId,
        studentCode: "1020304021",
        subTitle: "Pregrado UNT",
        email: cleanId,
        phone: "948123456",
      },
    };
  }

  // Si ingresó su código de matrícula numérico
  if (/^\d{6,10}$/.test(cleanId)) {
    return {
      success: true,
      user: {
        id: `std-${cleanId}`,
        role: "STUDENT",
        name: "Estudiante UNT",
        lastName: `(${cleanId})`,
        identifier: cleanId,
        studentCode: cleanId,
        subTitle: "Pregrado UNT",
        email: `${cleanId}@unitru.edu.pe`,
        phone: "948123456",
      },
    };
  }

  return {
    success: false,
    error: "Usuario o código no registrado. Regístrese con su código de matrícula y correo @unitru.edu.pe.",
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

export interface ResetPasswordData {
  identifier: string;
  studentCode?: string;
  newPassword: string;
}

export function resetPassword(data: ResetPasswordData): { success: boolean; error?: string; message?: string } {
  const cleanId = data.identifier.trim().toLowerCase();
  const cleanCode = (data.studentCode || "").trim().toLowerCase();
  const newPass = data.newPassword.trim();

  if (!cleanId) {
    return { success: false, error: "Por favor ingrese su correo electrónico institucional." };
  }

  if (!newPass || newPass.length < 6) {
    return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
  }

  // 1. Administrador / Conductor
  if (cleanId === "miguelquesquenrodas@gmail.com" || cleanId.startsWith("miguelquesquen")) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("unt_admin_custom_pin", newPass);
      } catch {}
    }
    return {
      success: true,
      message: "Contraseña de Administrador / Conductor actualizada exitosamente.",
    };
  }

  // 2. Alumnos
  if (!cleanId.endsWith("@unitru.edu.pe")) {
    return {
      success: false,
      error: "Para recuperar su cuenta de estudiante debe ingresar su correo institucional (@unitru.edu.pe).",
    };
  }

  if (typeof window !== "undefined") {
    try {
      const storedPins = localStorage.getItem("unt_student_pins");
      const pinMap: Record<string, string> = storedPins ? JSON.parse(storedPins) : {};
      pinMap[cleanId] = newPass;
      if (cleanCode) pinMap[cleanCode] = newPass;
      localStorage.setItem("unt_student_pins", JSON.stringify(pinMap));
    } catch {}
  }

  return {
    success: true,
    message: "¡Tu contraseña ha sido restablecida con éxito! Ya puedes ingresar con tu nueva clave.",
  };
}


