export const passwordResetEmailHtml = ({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}): string => `<!doctype html>
<html>
  <head>
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
  </head>
  <body style="margin:0;padding:0;background:#06060f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#06060f;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0e0e1c;border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#1a1033 0%,#0e0e1c 60%,#1a0a26 100%);padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;padding-right:12px;">
                      <img src="https://raw.githubusercontent.com/touhidurrr/UncivServer.xyz/refs/heads/main/site/assets/logo.png" width="36" height="36" alt="" style="display:block;border:0;border-radius:8px;" />
                    </td>
                    <td style="vertical-align:middle;">
                      <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">UncivServer.xyz</h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">Password reset</h2>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#c4c4dc;">
                  Your password has been reset successfully. Use the credentials below to sign in.
                  You can change the password from the client at any time.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.22);border-radius:10px;">
                  <tr>
                    <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#818cf8;margin-bottom:6px;font-weight:600;">User ID</div>
                      <input type="text" readonly value="${userId}" onclick="this.select();" style="width:100%;border:none;background:transparent;padding:0;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:14px;color:#ffffff;outline:none;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#818cf8;margin-bottom:6px;font-weight:600;">New Password</div>
                      <input type="text" readonly value="${newPassword}" onclick="this.select();" style="width:100%;border:none;background:transparent;padding:0;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:14px;color:#ffffff;outline:none;" />
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#8080a0;">
                  If you did not request this reset, change your password immediately and contact support.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#06060f;padding:18px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
                <p style="margin:0;font-size:12px;color:#8080a0;">
                  <a href="https://uncivserver.xyz" style="color:#818cf8;text-decoration:none;">UncivServer.xyz</a>
                  &middot;
                  <a href="https://github.com/touhidurrr/UncivServer.xyz" style="color:#818cf8;text-decoration:none;">GitHub</a>
                  &middot;
                  <a href="mailto:admin@uncivserver.xyz" style="color:#818cf8;text-decoration:none;">admin@uncivserver.xyz</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
