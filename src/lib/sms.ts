// Msg91 SMS integration
const MSG91_API_KEY = process.env.MSG91_API_KEY || '';
const MSG91_TEMPLATE_OTP = process.env.MSG91_TEMPLATE_ID_OTP || '';

async function msg91Send(endpoint: string, body: object) {
  if (!MSG91_API_KEY) return; // skip if not configured
  const res = await fetch(`https://api.msg91.com/api/v5/${endpoint}`, {
    method: 'POST',
    headers: { 'authkey': MSG91_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendPaymentConfirmationSMS(phone: string, amount: number, academyName: string) {
  if (!MSG91_API_KEY) return;
  return msg91Send('flow', {
    template_id: process.env.MSG91_TEMPLATE_ID_PAYMENT || MSG91_TEMPLATE_OTP,
    short_url: '0',
    mobiles: phone.startsWith('+91') ? phone.replace('+91', '') : phone,
    var1: amount.toString(),
    var2: academyName,
  });
}

export async function sendAbsenceAlertSMS(phone: string, studentName: string, daysMissed: number) {
  if (!MSG91_API_KEY) return;
  return msg91Send('flow', {
    template_id: process.env.MSG91_TEMPLATE_ID_ABSENCE || MSG91_TEMPLATE_OTP,
    short_url: '0',
    mobiles: phone.startsWith('+91') ? phone.replace('+91', '') : phone,
    var1: studentName,
    var2: daysMissed.toString(),
  });
}
