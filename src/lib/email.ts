import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
const FROM = process.env.FROM_EMAIL || 'noreply@gwd.in';

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  academyName: string;
  academySlug: string;
}) {
  if (!process.env.RESEND_API_KEY) return; // gracefully skip if not configured
  await resend.emails.send({
    from: `GWD Sports <${FROM}>`,
    to: opts.to,
    subject: `Welcome to ${opts.academyName} on GWD Sports!`,
    html: `
      <div style="font-family:'Plus Jakarta Sans',sans-serif;background:#050508;color:#fff;padding:40px;max-width:600px;margin:0 auto;border-radius:16px;">
        <h1 style="font-family:Georgia,serif;font-size:32px;margin-bottom:8px;color:#fff;">Welcome, ${opts.name}! 🎉</h1>
        <p style="color:#aaa;font-size:16px;">You've successfully joined <strong style="color:#FF1744;">${opts.academyName}</strong> on GWD Sports Ecosystem.</p>
        <a href="https://gwd.in/${opts.academySlug}" style="display:inline-block;margin-top:24px;background:#FF1744;color:#fff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:700;">View Your Academy</a>
        <p style="margin-top:32px;color:#555;font-size:12px;">Powered by GWD Sports Ecosystem | support@gwd.in</p>
      </div>
    `
  });
}

export async function sendPaymentReceiptEmail(opts: {
  to: string;
  name: string;
  academyName: string;
  amount: number;
  period: string;
  orderId: string;
  date: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: `GWD Sports <${FROM}>`,
    to: opts.to,
    subject: `Payment Confirmed — ₹${opts.amount} for ${opts.academyName}`,
    html: `
      <div style="font-family:'Plus Jakarta Sans',sans-serif;background:#050508;color:#fff;padding:40px;max-width:600px;margin:0 auto;border-radius:16px;">
        <h1 style="font-family:Georgia,serif;font-size:28px;color:#fff;">Payment Receipt</h1>
        <div style="background:#12121a;border:1px solid #222;border-radius:12px;padding:20px;margin:20px 0;">
          <p><strong style="color:#aaa;">Academy:</strong> ${opts.academyName}</p>
          <p><strong style="color:#aaa;">Period:</strong> ${opts.period}</p>
          <p><strong style="color:#aaa;">Amount:</strong> <span style="color:#10b981;font-size:20px;font-weight:700;">₹${opts.amount}</span></p>
          <p><strong style="color:#aaa;">Date:</strong> ${opts.date}</p>
          <p><strong style="color:#aaa;">Order ID:</strong> <span style="font-family:monospace;color:#888;font-size:12px;">${opts.orderId}</span></p>
        </div>
        <p style="color:#555;font-size:12px;">Powered by GWD Sports Ecosystem | support@gwd.in</p>
      </div>
    `
  });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetToken: string;
  baseUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resetUrl = `${opts.baseUrl}/user/reset-password?token=${opts.resetToken}`;
  await resend.emails.send({
    from: `GWD Sports <${FROM}>`,
    to: opts.to,
    subject: 'Reset your GWD Sports password',
    html: `
      <div style="font-family:'Plus Jakarta Sans',sans-serif;background:#050508;color:#fff;padding:40px;max-width:600px;margin:0 auto;border-radius:16px;">
        <h1 style="font-family:Georgia,serif;font-size:28px;color:#fff;">Reset Your Password</h1>
        <p style="color:#aaa;">Hi ${opts.name}, click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:24px 0;background:#FF1744;color:#fff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:700;">Reset Password</a>
        <p style="color:#555;font-size:12px;">If you didn't request this, ignore this email. | support@gwd.in</p>
      </div>
    `
  });
}

export async function sendAbsenceAlertEmail(opts: {
  to: string;
  parentName: string;
  studentName: string;
  academyName: string;
  daysMissed: number;
}) {
  if (!process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: `GWD Sports <${FROM}>`,
    to: opts.to,
    subject: `Attendance Alert — ${opts.studentName} has missed ${opts.daysMissed} sessions`,
    html: `
      <div style="font-family:'Plus Jakarta Sans',sans-serif;background:#050508;color:#fff;padding:40px;max-width:600px;margin:0 auto;border-radius:16px;">
        <h1 style="font-family:Georgia,serif;font-size:28px;color:#FF1744;">Attendance Alert</h1>
        <p style="color:#aaa;">Dear ${opts.parentName},</p>
        <p style="color:#fff;">We noticed that <strong>${opts.studentName}</strong> has missed <strong style="color:#FF1744;">${opts.daysMissed} consecutive sessions</strong> at <strong>${opts.academyName}</strong>.</p>
        <p style="color:#aaa;">Please contact the academy to discuss attendance.</p>
        <p style="color:#555;font-size:12px;">GWD Sports Ecosystem | support@gwd.in</p>
      </div>
    `
  });
}
