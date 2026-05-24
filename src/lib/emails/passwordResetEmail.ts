export const passwordResetEmailHtml = ({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}): string => `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
            <tr>
              <td style="background:#111827;color:#ffffff;padding:24px 32px;">
                <h1 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.01em;">UncivServer.xyz</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#111827;">Password reset</h2>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4b5563;">
                  Your password has been reset successfully. Use the credentials below to sign in.
                  You can change the password from the client at any time.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                  <tr>
                    <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;margin-bottom:4px;">User ID</div>
                      <code style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:14px;color:#111827;word-break:break-all;">${userId}</code>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;margin-bottom:4px;">New Password</div>
                      <code style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:14px;color:#111827;word-break:break-all;">${newPassword}</code>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#9ca3af;">
                  If you did not request this reset, change your password immediately and contact support.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">
                  UncivServer.xyz &middot; <a href="https://uncivserver.xyz" style="color:#6b7280;text-decoration:none;">uncivserver.xyz</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
