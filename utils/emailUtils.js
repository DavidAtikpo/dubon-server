import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const loadTemplate = async (templateName) => {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
  const template = await fs.readFile(templatePath, 'utf-8');
  return Handlebars.compile(template);
};

export const sendEmail = async ({ to, subject, template, data }) => {
  try {
    // Charger et compiler le template
    const compiledTemplate = await loadTemplate(template);
    const html = compiledTemplate(data);

    // Envoyer l'email
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });

    return true;
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return false;
  }
}; 