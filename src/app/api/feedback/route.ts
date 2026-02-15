import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/resend";
import { feedbackNotificationEmail } from "@/lib/emails/feedback-notification";

const feedbackSchema = z.object({
  type: z.enum(["BUG", "SUGGESTION", "COMPLIMENT"]),
  message: z.string().min(5, "Mensagem deve ter pelo menos 5 caracteres").max(1000, "Máximo de 1000 caracteres"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = feedbackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        type: result.data.type,
        message: result.data.message,
        userId: session.user.id,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    // Send email notification
    const adminEmail = process.env.SMTP_EMAIL;
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `[FinTrack] Novo feedback: ${typeLabel(result.data.type)}`,
          html: feedbackNotificationEmail({
            userName: feedback.user.name,
            userEmail: feedback.user.email,
            type: result.data.type,
            message: result.data.message,
            createdAt: feedback.createdAt.toISOString(),
          }),
        });
      } catch {
        // Don't fail the request if email fails
        console.error("Failed to send feedback notification email");
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao enviar feedback" },
      { status: 500 }
    );
  }
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    BUG: "Bug",
    SUGGESTION: "Sugestão",
    COMPLIMENT: "Elogio",
  };
  return labels[type] || type;
}
