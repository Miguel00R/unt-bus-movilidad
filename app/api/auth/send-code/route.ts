import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email, studentCode } = await req.json();

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (studentCode || "").trim();

    if (!cleanEmail) {
      return NextResponse.json(
        { success: false, error: "Debe ingresar su correo institucional." },
        { status: 400 }
      );
    }

    const isAdmin =
      cleanEmail === "miguelquesquenrodas@gmail.com" ||
      cleanEmail.startsWith("miguelquesquen");

    if (!isAdmin && !cleanEmail.endsWith("@unitru.edu.pe")) {
      return NextResponse.json(
        {
          success: false,
          error: "Solo se permite el envío de códigos a correos institucionales (@unitru.edu.pe).",
        },
        { status: 400 }
      );
    }

    // Generar código numérico seguro de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos de validez

    // Comprobar si existen credenciales SMTP configuradas en variables de entorno
    const rawSmtpUser =
      process.env.GMAIL_USER ||
      process.env.SMTP_USER ||
      process.env.EMAIL_USER ||
      process.env.USUARIO_DE_GMAIL ||
      "miguelquesquenrodas@gmail.com";

    const rawSmtpPass =
      process.env.GMAIL_APP_PASSWORD ||
      process.env.SMTP_PASS ||
      process.env.EMAIL_PASS ||
      process.env.CONTRASENA_DE_APLICACION;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);

    const smtpUser = (rawSmtpUser || "").trim().toLowerCase();
    // Limpiar espacios y caracteres extraños: las contraseñas de Google son 16 letras estrictas
    const smtpPass = (rawSmtpPass || "").replace(/[^a-zA-Z]/g, "").toLowerCase();

    let emailSent = false;
    let emailError: string | null = null;

    if (rawSmtpPass) {
      if (!smtpHost && smtpPass.length !== 16) {
        return NextResponse.json(
          {
            success: false,
            error: `La clave en Vercel tiene ${rawSmtpPass.trim().length} caracteres (empieza por "${rawSmtpPass.slice(0, 4)}..."). Debe ser la contraseña de 16 letras de Google (ej: abcd efgh ijkl mnop).`,
          },
          { status: 400 }
        );
      }

      try {
        const transportConfig = smtpHost
          ? {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: rawSmtpPass.trim() },
          }
          : {
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: { user: smtpUser, pass: smtpPass },
          };

        const transporter = nodemailer.createTransport(transportConfig);

        await transporter.sendMail({
          from: `"Sistema de Movilidad UNT" <${smtpUser}>`,
          to: cleanEmail,
          subject: `${code} es tu código de confirmación UNT`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #d97706;">
                <h1 style="color: #ffffff; font-size: 18px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 1px;">Universidad Nacional de Trujillo</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 0;">Sistema de Transporte y Movilidad Universitaria (OGBU)</p>
              </div>
              <div style="padding: 28px 24px;">
                <h2 style="color: #1e293b; font-size: 16px; margin: 0 0 12px 0;">Código de Verificación de Seguridad</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
                  Hemos recibido una solicitud para restablecer la contraseña de su cuenta vinculada al correo <strong>${cleanEmail}</strong>.
                </p>
                <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 18px; text-align: center; margin-bottom: 22px;">
                  <span style="font-size: 12px; font-weight: 600; color: #64748b; letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 6px;">Su código de 6 dígitos:</span>
                  <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #d97706;">${code}</span>
                  <span style="display: block; font-size: 11px; color: #94a3b8; margin-top: 8px;">Válido durante los próximos 10 minutos</span>
                </div>
                <p style="color: #64748b; font-size: 12px; line-height: 1.4; margin: 0;">
                  Copie o digite este código en la pantalla de recuperación. Si usted no solicitó este cambio, ignore este mensaje.
                </p>
              </div>
              <div style="background: #f1f5f9; padding: 14px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
                © 2026 Universidad Nacional de Trujillo — Trujillo, La Libertad, Perú.
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch (err: any) {
        console.error("Error al enviar email vía Nodemailer:", err);
        emailError = `${err?.message || "Error de autenticación"} [Usuario enviado a Google: "${smtpUser}" | Clave probada: "${smtpPass.slice(0, 3)}***${smtpPass.slice(-2)}" (longitud: ${smtpPass.length} letras)]`;
      }
    } else {
      console.warn("Variables SMTP no configuradas. Configure GMAIL_USER y GMAIL_APP_PASSWORD en Vercel.");
    }

    if (!emailSent && (smtpUser || smtpPass)) {
      return NextResponse.json(
        {
          success: false,
          error: `Error al despachar el correo: ${emailError || "Revise las credenciales de correo en Vercel."}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Código enviado exitosamente a ${cleanEmail}`
        : `Código generado. Configure GMAIL_USER y GMAIL_APP_PASSWORD en Vercel para recibirlo directamente en su bandeja de entrada.`,
      emailSent,
      emailError,
      code,
      expiresAt,
    });
  } catch (error: any) {
    console.error("Error en POST /api/auth/send-code:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al procesar la solicitud." },
      { status: 500 }
    );
  }
}
