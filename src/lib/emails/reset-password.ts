interface ResetPasswordEmailProps {
  userName: string;
  resetUrl: string;
}

export function ResetPasswordEmail({ userName, resetUrl }: ResetPasswordEmailProps) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - FinTrack</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 480px; width: 100%; border-collapse: collapse;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" style="border-collapse: collapse;">
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 10px; padding: 8px 8px; line-height: 0;">
                    <span style="color: white; font-size: 18px; font-weight: bold;">📈</span>
                  </td>
                  <td style="padding-left: 8px; font-size: 20px; font-weight: bold; color: #0f172a;">
                    FinTrack
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #0f172a; text-align: center;">
                Redefinir senha
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; text-align: center; line-height: 1.6;">
                Olá <strong style="color: #0f172a;">${userName}</strong>, recebemos uma solicitação para redefinir a senha da sua conta.
              </p>

              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${resetUrl}" style="height:48px;v-text-anchor:middle;width:250px;" arcsize="25%" strokecolor="#4f46e5" fillcolor="#4f46e5">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Redefinir minha senha</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; mso-hide: all;">
                      Redefinir minha senha
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.6;">
                Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição de senha, ignore este email.
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <p style="margin: 0; font-size: 12px; color: #cbd5e1; text-align: center; line-height: 1.5;">
                Se o botão não funcionar, copie e cole este link no navegador:<br />
                <a href="${resetUrl}" style="color: #6366f1; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; 2026 FinTrack. Todos os direitos reservados.
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
