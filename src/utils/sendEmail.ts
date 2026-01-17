import nodemailer from "nodemailer";
import { EMAIL_CONFIG } from "../config/config";

interface EmailAttachment {
    filename: string;
    path: string;
}

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: EmailAttachment[] | null;
}

export const sendEmail = async (options: EmailOptions) => {
    const transporter = nodemailer.createTransport({
        host: EMAIL_CONFIG.host,
        port: EMAIL_CONFIG.port,
        secure: EMAIL_CONFIG.secure,
        auth: EMAIL_CONFIG.auth,
        debug: true,
        logger: true,
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: EMAIL_CONFIG.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments || [],
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info.messageId;
    } catch (error) {
        console.error("Mail Dispatch Error:", error);
        throw error;
    }

};