import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { ResetPasswordEmail } from "@/lib/emails/reset-password";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { hashToken } from "@/lib/tokens";
import crypto from "crypto";
import { z } from "zod";

const forgotSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
});

const SUCCESS_MESSAGE =
  "Se o email existir, você receberá um link para redefinir sua senha.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = forgotSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

    const ip = getClientIp(request.headers);
    const byIp = rateLimit(`forgot:ip:${ip}`, 10, 60 * 60 * 1000);
    const byEmail = rateLimit(`forgot:email:${email.toLowerCase()}`, 3, 60 * 60 * 1000);
    if (!byIp.success || !byEmail.success) {
      return NextResponse.json(
        { error: "Muitas solicitações. Tente novamente mais tarde." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(byIp.retryAfter, byEmail.retryAfter)) },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: SUCCESS_MESSAGE });
    }

    // Delete any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate a secure token; only its hash is stored
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token: hashToken(token),
        email: user.email,
        userId: user.id,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Redefinir sua senha - Finplanix",
      html: ResetPasswordEmail({
        userName: user.name,
        resetUrl,
      }),
    });

    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
