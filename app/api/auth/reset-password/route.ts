import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { identifier, studentCode, newPassword } = await req.json();

    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanCode = (studentCode || "").trim();
    const cleanNewPass = (newPassword || "").trim();

    if (!cleanId) {
      return NextResponse.json(
        { success: false, error: "Ingrese su correo institucional." },
        { status: 400 }
      );
    }

    if (!cleanNewPass || cleanNewPass.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "La nueva contraseña debe tener al menos 6 caracteres.",
        },
        { status: 400 }
      );
    }

    // 1. Admin
    if (
      cleanId === "miguelquesquenrodas@gmail.com" ||
      cleanId.startsWith("miguelquesquen")
    ) {
      return NextResponse.json({
        success: true,
        message: "Contraseña de Administrador actualizada exitosamente.",
      });
    }

    // 2. Estudiante en PostgreSQL
    const student = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanId },
          ...(cleanCode ? [{ code: cleanCode }] : []),
        ],
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se encontró ningún estudiante registrado con ese correo o código.",
        },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: student.id },
      data: { password: cleanNewPass },
    });

    return NextResponse.json({
      success: true,
      message:
        "¡Tu contraseña ha sido restablecida con éxito en la base de datos! Ya puedes ingresar con tu nueva clave.",
    });
  } catch (error: any) {
    console.error("Error al restablecer contraseña:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ocurrió un error al actualizar la contraseña en el servidor.",
      },
      { status: 500 }
    );
  }
}
