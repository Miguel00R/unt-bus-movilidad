import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, lastName, code, career, phone, email, password } = body;

    const cleanName = (name || "").trim();
    const cleanLastName = (lastName || "").trim();
    const cleanCode = (code || "").trim();
    const cleanCareer = (career || "Ingeniería de Sistemas").trim();
    const cleanPhone = (phone || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    if (!cleanName || !cleanLastName) {
      return NextResponse.json(
        { success: false, error: "Nombres y apellidos son requeridos." },
        { status: 400 }
      );
    }

    if (!cleanCode || cleanCode.length < 5) {
      return NextResponse.json(
        { success: false, error: "Ingrese un código de matrícula UNT válido." },
        { status: 400 }
      );
    }

    if (!cleanEmail || !cleanEmail.endsWith("@unitru.edu.pe")) {
      return NextResponse.json(
        {
          success: false,
          error: "Los estudiantes deben registrarse obligatoriamente con su correo institucional (@unitru.edu.pe).",
        },
        { status: 400 }
      );
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "La contraseña debe tener un mínimo de 6 caracteres.",
        },
        { status: 400 }
      );
    }

    // Verificar si ya existe en la base de datos central de PostgreSQL (Supabase)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { code: cleanCode }],
      },
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return NextResponse.json(
          {
            success: false,
            error: "Ya existe una cuenta registrada con este correo institucional. Inicie sesión directamente.",
          },
          { status: 400 }
        );
      }
      if (existingUser.code === cleanCode) {
        return NextResponse.json(
          {
            success: false,
            error: "Ya existe una cuenta registrada con este código de matrícula UNT.",
          },
          { status: 400 }
        );
      }
    }

    // Guardar en la base de datos central (Soporta miles de estudiantes)
    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        lastName: cleanLastName,
        code: cleanCode,
        career: cleanCareer,
        phone: cleanPhone || "999111222",
        email: cleanEmail,
        password: cleanPassword,
        role: "STUDENT",
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        role: "STUDENT",
        name: `${newUser.name} ${newUser.lastName}`,
        lastName: newUser.lastName,
        identifier: newUser.email,
        studentCode: newUser.code,
        subTitle: newUser.career,
        email: newUser.email,
        phone: newUser.phone,
      },
    });
  } catch (error: any) {
    console.error("Error al registrar cuenta en PostgreSQL:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ocurrió un error al guardar la cuenta en la base de datos central.",
      },
      { status: 500 }
    );
  }
}
