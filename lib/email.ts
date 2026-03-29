import nodemailer from 'nodemailer';
import { getDb } from './db';

interface QuoteEmailData {
  name: string;
  company: string;
  email: string;
  whatsapp: string;
  product_name?: string | null;
  quantity?: number | null;
  message?: string | null;
}

function getTransporter() {
  // SMTP settings from environment variables
  // The client will configure these for their domain
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

function getBusinessEmail(): string {
  try {
    const db = getDb();
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'contact_email'").get() as { value: string } | undefined;
    return setting?.value || 'contact@brindesperfeitos.com.br';
  } catch {
    return 'contact@brindesperfeitos.com.br';
  }
}

export async function sendQuoteNotification(data: QuoteEmailData): Promise<boolean> {
  const businessEmail = getBusinessEmail();
  const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!smtpConfigured) {
    console.log('[EMAIL] SMTP not configured. Quote notification:');
    console.log(`  To: ${businessEmail}`);
    console.log(`  From: ${data.name} <${data.email}>`);
    console.log(`  Product: ${data.product_name || 'General inquiry'}`);
    return false;
  }

  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@brindesperfeitos.com.br';

  const subject = data.product_name
    ? `Novo Orcamento: ${data.product_name}`
    : 'Nova Solicitacao de Contato - Brindes Perfeitos';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #5AA300; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Brindes Perfeitos</h1>
        <p style="color: #d4f5a0; margin: 5px 0 0;">Nova Solicitacao de Orcamento</p>
      </div>
      <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Nome:</td><td style="padding: 8px 0; color: #111827;">${data.name}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Empresa:</td><td style="padding: 8px 0; color: #111827;">${data.company}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td><td style="padding: 8px 0; color: #111827;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">WhatsApp:</td><td style="padding: 8px 0; color: #111827;"><a href="https://wa.me/${data.whatsapp.replace(/\D/g, '')}">${data.whatsapp}</a></td></tr>
          ${data.product_name ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Produto:</td><td style="padding: 8px 0; color: #111827;">${data.product_name}</td></tr>` : ''}
          ${data.quantity ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Quantidade:</td><td style="padding: 8px 0; color: #111827;">${data.quantity}</td></tr>` : ''}
        </table>
        ${data.message ? `<div style="margin-top: 16px; padding: 12px; background: white; border: 1px solid #d1d5db; border-radius: 6px;"><strong style="color: #374151;">Mensagem:</strong><p style="color: #111827; margin: 8px 0 0;">${data.message}</p></div>` : ''}
      </div>
      <div style="padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
        Este email foi enviado automaticamente pelo site Brindes Perfeitos.
      </div>
    </div>
  `;

  const textBody = [
    `NOVA SOLICITACAO DE ORCAMENTO`,
    ``,
    `Nome: ${data.name}`,
    `Empresa: ${data.company}`,
    `Email: ${data.email}`,
    `WhatsApp: ${data.whatsapp}`,
    data.product_name ? `Produto: ${data.product_name}` : null,
    data.quantity ? `Quantidade: ${data.quantity}` : null,
    data.message ? `\nMensagem:\n${data.message}` : null,
  ].filter(Boolean).join('\n');

  try {
    // Send to business email
    await transporter.sendMail({
      from: `"Brindes Perfeitos" <${fromEmail}>`,
      to: businessEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    // Send confirmation to customer
    await transporter.sendMail({
      from: `"Brindes Perfeitos" <${fromEmail}>`,
      to: data.email,
      subject: `Recebemos seu pedido de orcamento - Brindes Perfeitos`,
      text: `Ola ${data.name},\n\nRecebemos sua solicitacao de orcamento${data.product_name ? ` para "${data.product_name}"` : ''}.\n\nNossa equipe entrara em contato em ate 24 horas.\n\nAtenciosamente,\nEquipe Brindes Perfeitos`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #5AA300; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Brindes Perfeitos</h1>
          </div>
          <div style="padding: 24px;">
            <p>Ola <strong>${data.name}</strong>,</p>
            <p>Recebemos sua solicitacao de orcamento${data.product_name ? ` para <strong>"${data.product_name}"</strong>` : ''}.</p>
            <p>Nossa equipe entrara em contato em ate 24 horas.</p>
            <p>Atenciosamente,<br/><strong>Equipe Brindes Perfeitos</strong></p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (err) {
    console.error('[EMAIL] Failed to send:', err);
    return false;
  }
}
