const { Resend } = require('resend');

const getResend = () => new Resend(process.env.RESEND_API_KEY);
const FROM = () => process.env.RESEND_FROM || 'onboarding@resend.dev';

const sendAlert = async ({ to, apiName, apiUrl, status, responseTime, statusCode, error }) => {
  if (!to || !process.env.RESEND_API_KEY) return;

  const isDown = status === 'down';
  const subject = isDown
    ? `🔴 ALERT: ${apiName} is DOWN`
    : `✅ RECOVERED: ${apiName} is back UP`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${isDown ? '#7f1d1d,#dc2626' : '#14532d,#16a34a'});padding:32px;text-align:center;">
            <div style="font-size:40px;margin-bottom:12px;">${isDown ? '🔴' : '✅'}</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${isDown ? 'API is Down' : 'API Recovered'}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">${new Date().toLocaleString()}</p>
          </td>
        </tr>
        <!-- API Info -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 4px;color:#f8fafc;font-size:18px;">${apiName}</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:13px;font-family:monospace;">${apiUrl}</p>
            <!-- Stats Grid -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding:0 8px 16px 0;">
                  <div style="background:#0f172a;border-radius:10px;padding:16px;border:1px solid rgba(255,255,255,0.06);">
                    <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Status</div>
                    <div style="color:${isDown ? '#ef4444' : '#22c55e'};font-size:18px;font-weight:700;">${status.toUpperCase()}</div>
                  </div>
                </td>
                <td width="50%" style="padding:0 0 16px 8px;">
                  <div style="background:#0f172a;border-radius:10px;padding:16px;border:1px solid rgba(255,255,255,0.06);">
                    <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">HTTP Code</div>
                    <div style="color:#e2e8f0;font-size:18px;font-weight:700;">${statusCode ?? '—'}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:0 8px 0 0;">
                  <div style="background:#0f172a;border-radius:10px;padding:16px;border:1px solid rgba(255,255,255,0.06);">
                    <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Response Time</div>
                    <div style="color:#06b6d4;font-size:18px;font-weight:700;">${responseTime != null ? responseTime + 'ms' : '—'}</div>
                  </div>
                </td>
                <td width="50%" style="padding:0 0 0 8px;">
                  <div style="background:#0f172a;border-radius:10px;padding:16px;border:1px solid rgba(255,255,255,0.06);">
                    <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Checked At</div>
                    <div style="color:#e2e8f0;font-size:13px;font-weight:600;">${new Date().toLocaleTimeString()}</div>
                  </div>
                </td>
              </tr>
            </table>
            ${error ? `<div style="margin-top:16px;background:#450a0a;border:1px solid #7f1d1d;border-radius:10px;padding:16px;"><div style="color:#fca5a5;font-size:12px;font-family:monospace;word-break:break-all;">${error}</div></div>` : ''}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;color:#475569;font-size:12px;">API Performance Monitor &bull; Automated Alert</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const { error: resendError } = await getResend().emails.send({
      from: FROM(),
      to,
      subject,
      html,
    });
    if (resendError) throw new Error(resendError.message);
    console.log(`📧 Alert sent via Resend to ${to} for ${apiName}`);
  } catch (err) {
    console.error(`❌ Resend error: ${err.message}`);
  }
};

module.exports = { sendAlert };
