// src/libs/email.ts
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Mật khẩu ứng dụng (App Password)
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Map Pacific Singapore IT Helpdesk" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Thư gửi thành công tới: ${to}`);
  } catch (error) {
    console.error(`[Email Lỗi] Không thể gửi thư tới ${to}:`, error);
  }
};