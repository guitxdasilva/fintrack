interface FeedbackEmailProps {
  userName: string;
  userEmail: string;
  type: string;
  message: string;
  createdAt: string;
}

const typeLabels: Record<string, { label: string; emoji: string; color: string }> = {
  BUG: { label: "Bug", emoji: "🐛", color: "#ef4444" },
  SUGGESTION: { label: "Sugestão", emoji: "💡", color: "#f59e0b" },
  COMPLIMENT: { label: "Elogio", emoji: "🎉", color: "#22c55e" },
};

export function feedbackNotificationEmail({
  userName,
  userEmail,
  type,
  message,
  createdAt,
}: FeedbackEmailProps): string {
  const typeInfo = typeLabels[type] || { label: type, emoji: "📝", color: "#6366f1" };
  const date = new Date(createdAt).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #4f46e5; padding: 24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 700; color: #ffffff;">📬 Novo Feedback</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: ${typeInfo.color}; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">
                      ${typeInfo.emoji} ${typeInfo.label}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <!-- User info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; background-color: #f9fafb; border-radius: 8px;">
                    <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Usuário</p>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #111827;">${userName}</p>
                    <p style="margin: 2px 0 0; font-size: 13px; color: #6b7280;">${userEmail}</p>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Mensagem</p>
              <div style="padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid ${typeInfo.color};">
                <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>

              <!-- Date -->
              <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; text-align: right;">
                Enviado em ${date}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                FinTrack — Dashboard Financeiro
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
