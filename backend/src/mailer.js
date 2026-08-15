const nodemailer = require('nodemailer');
const db = require('./database');

function getTransporter() {
  const smtpHost = db.prepare("SELECT value FROM settings WHERE key = 'smtp_host'").get()?.value;
  const smtpPort = db.prepare("SELECT value FROM settings WHERE key = 'smtp_port'").get()?.value;
  const smtpUser = db.prepare("SELECT value FROM settings WHERE key = 'smtp_user'").get()?.value;
  const smtpPass = db.prepare("SELECT value FROM settings WHERE key = 'smtp_pass'").get()?.value;
  if (!smtpHost) return null;
  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || '587'),
    secure: (smtpPort || '587') === '465',
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });
}

function getFromEmail() {
  return db.prepare("SELECT value FROM settings WHERE key = 'smtp_from_email'").get()?.value || 'noreply@bignetiktel.cu';
}

const companyName = () => db.prepare("SELECT value FROM settings WHERE key = 'company_name'").get()?.value || 'BigNetiK Telecom';
const companyPhone = () => db.prepare("SELECT value FROM settings WHERE key = 'company_phone'").get()?.value || '';
const companyAddress = () => db.prepare("SELECT value FROM settings WHERE key = 'company_address'").get()?.value || '';

const getSetting = (key) => db.prepare("SELECT value FROM settings WHERE key = ?").get(key)?.value;

async function sendMail(to, subject, html) {
  const transporter = getTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({ from: getFromEmail(), to, subject, html });
    return true;
  } catch (e) { console.error('Mail error:', e.message); return false; }
}

// Reemplaza {{variables}} en una plantilla de texto.
function renderTemplate(str, vars) {
  return String(str || '').replace(/{{\s*(\w+)\s*}}/g, (_, k) => (vars[k] ?? ''));
}

const DEFAULT_WELCOME_SUBJECT = 'Bienvenido/a a {{company}}';
const DEFAULT_WELCOME_BODY = `Hola {{name}},

¡Te damos la bienvenida al equipo de {{company}}! 🎉

Tu cuenta del Portal del Empleado ya está lista. Desde ahí podrás ver tus horas trabajadas, tu pago estimado, solicitar vacaciones y comunicarte con Recursos Humanos.

En tu primer inicio de sesión el sistema te pedirá cambiar la contraseña por una tuya.`;

// Correo de bienvenida con las credenciales del portal. Devuelve true si se envió.
async function sendWelcomeEmail(employee, tempPassword, portalUrl) {
  if (!employee?.email) return false;
  if (getSetting('welcome_email_enabled') === '0') return false; // habilitado por defecto
  const name = `${employee.first_name} ${employee.last_name || ''}`.trim();
  const vars = {
    name, company: companyName(), position: employee.position || '',
    employee_code: employee.employee_code, id: employee.employee_code,
    password: tempPassword, portal_url: portalUrl || '',
  };
  const subject = renderTemplate(getSetting('welcome_email_subject') || DEFAULT_WELCOME_SUBJECT, vars);
  const bodyText = renderTemplate(getSetting('welcome_email_body') || DEFAULT_WELCOME_BODY, vars);
  const bodyHtml = bodyText.split('\n').map(l => l.trim() === '' ? '<br>' : `<p style="margin:0 0 10px;color:#374151">${l}</p>`).join('');
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#047857">${companyName()}</h2>
      ${bodyHtml}
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;margin:18px 0">
        <p style="margin:0 0 8px;color:#065f46;font-weight:bold">Tus credenciales de acceso</p>
        <p style="margin:0 0 4px;color:#374151">ID de empleado: <strong>${vars.employee_code}</strong></p>
        <p style="margin:0 0 4px;color:#374151">Contraseña temporal: <strong>${vars.password}</strong></p>
        ${portalUrl ? `<p style="margin:8px 0 0"><a href="${portalUrl}" style="background:#059669;color:#fff;text-decoration:none;padding:8px 16px;border-radius:6px;display:inline-block">Entrar al Portal</a></p>` : ''}
      </div>
      <p style="color:#6b7280;font-size:12px;margin-top:24px">${companyName()}${companyAddress() ? ' - ' + companyAddress() : ''}${companyPhone() ? ' - Tel: ' + companyPhone() : ''}</p>
    </div>`;
  return sendMail(employee.email, subject, html);
}

async function sendSaleConfirmation(clientEmail, clientName, saleData, items, total) {
  if (!clientEmail) return false;
  const itemsHtml = items.map(i => `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${i.model_name}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i.quantity}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right">$${Number(i.unit_price).toFixed(2)}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right">$${(Number(i.unit_price) * i.quantity).toFixed(2)}</td></tr>`).join('');
  return sendMail(clientEmail,
    `Confirmación de Venta #${saleData.id} - ${companyName()}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1e3a5f">${companyName()}</h2>
      <p style="color:#374151">Hola <strong>${clientName}</strong>,</p>
      <p style="color:#374151">Gracias por tu compra. Aquí los detalles:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#f1f5f9"><th style="padding:8px 12px;text-align:left">Modelo</th><th style="padding:8px 12px">Cant.</th><th style="padding:8px 12px;text-align:right">Precio</th><th style="padding:8px 12px;text-align:right">Subtotal</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot><tr><td colspan="3" style="padding:8px 12px;text-align:right;font-weight:bold">Total</td><td style="padding:8px 12px;text-align:right;font-weight:bold">$${Number(total).toFixed(2)}</td></tr></tfoot>
      </table>
      ${saleData.payment_plan === 'installments' ? `<p style="color:#374151">Plan de pago: <strong>${saleData.installments} meses</strong> | Interés: <strong>${saleData.interest_rate}%</strong></p><p style="color:#374151">Próximo pago: <strong>${saleData.next_payment_date || '—'}</strong></p>` : '<p style="color:#059669;font-weight:bold">Pagado en su totalidad</p>'}
      <p style="color:#6b7280;font-size:12px;margin-top:24px">${companyName()}${companyAddress() ? ' - ' + companyAddress() : ''}${companyPhone() ? ' - Tel: ' + companyPhone() : ''}</p>
    </div>`
  );
}

async function sendPaymentReceipt(clientEmail, clientName, saleId, amount, remaining, installment, totalInstallments, paidSoFar) {
  if (!clientEmail) return false;
  return sendMail(clientEmail,
    `Recibo de Pago - Venta #${saleId} - ${companyName()}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1e3a5f">${companyName()}</h2>
      <p style="color:#374151">Hola <strong>${clientName}</strong>,</p>
      <p style="color:#374151">Hemos recibido tu pago:</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0 0 4px"><strong>Venta #${saleId}</strong></p>
        <p style="margin:0 0 4px">Monto pagado: <strong>$${Number(amount).toFixed(2)}</strong></p>
        <p style="margin:0 0 4px">Cuota: ${installment} de ${totalInstallments}</p>
        <p style="margin:0 0 4px">Total pagado: <strong>$${Number(paidSoFar).toFixed(2)}</strong></p>
        <p style="margin:0">Saldo restante: <strong>$${Number(remaining).toFixed(2)}</strong></p>
      </div>
      <p style="color:#6b7280;font-size:12px;margin-top:24px">${companyName()}${companyAddress() ? ' - ' + companyAddress() : ''}${companyPhone() ? ' - Tel: ' + companyPhone() : ''}</p>
    </div>`
  );
}

async function sendLatePaymentReminder(clientEmail, clientName, saleId, daysLate, pendingAmount, nextPaymentDate) {
  if (!clientEmail) return false;
  return sendMail(clientEmail,
    `Recordatorio de Pago Atrasado - Venta #${saleId} - ${companyName()}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1e3a5f">${companyName()}</h2>
      <p style="color:#374151">Hola <strong>${clientName}</strong>,</p>
      <p style="color:#dc2626">Tu pago de la venta <strong>#${saleId}</strong> está atrasado por <strong>${daysLate} días</strong>.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0 0 4px">Monto pendiente: <strong>$${Number(pendingAmount).toFixed(2)}</strong></p>
        <p style="margin:0">Fecha esperada: <strong>${nextPaymentDate || '—'}</strong></p>
      </div>
      <p style="color:#374151">Por favor, ponte al día con tu pago para evitar cargos adicionales.</p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px">${companyName()}${companyAddress() ? ' - ' + companyAddress() : ''}${companyPhone() ? ' - Tel: ' + companyPhone() : ''}</p>
    </div>`
  );
}

module.exports = { sendMail, sendWelcomeEmail, sendSaleConfirmation, sendPaymentReceipt, sendLatePaymentReminder };
