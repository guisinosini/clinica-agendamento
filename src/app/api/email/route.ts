import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { to, subject, taskTitle, taskDescription, assignedBy, taskLink } = await req.json();

    if (!to || !subject || !taskTitle) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 });
    }

    // Configurar o transporter do nodemailer para o Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Template HTML premium
    const htmlContent = `
      <div style="font-family: 'Inter', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 40px 20px; border-radius: 12px;">
        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #111827; font-size: 24px; margin: 0;">Nova Tarefa Atribuída</h1>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Olá,</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Você recebeu uma nova tarefa atribuída por <strong>${assignedBy}</strong>.</p>
          
          <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 8px 0;">${taskTitle}</h2>
            ${taskDescription ? `<p style="color: #6b7280; font-size: 14px; margin: 0;">${taskDescription}</p>` : ''}
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${taskLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; transition: background-color 0.2s;">
              Visualizar Tarefa
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Este é um e-mail automático, por favor não responda.</p>
          </div>
        </div>
      </div>
    `;

    // Opções do e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
    };

    // Enviar e-mail
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'E-mail enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return NextResponse.json({ error: 'Erro interno ao enviar e-mail' }, { status: 500 });
  }
}
