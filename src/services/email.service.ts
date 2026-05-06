import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import logger from "../utils/logger";
import dotenv from "dotenv";
import { MESSAGES } from "@/constants/messages";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Build the OTP email HTML template — matches the NestAssist design.
 */
const buildOtpEmailHtml = (name: string, otp: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NestAssist – OTP Verification</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e1e1e1;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding:28px 40px 20px;">
              <img 
                src="cid:logo" 
                alt="NestAssist Logo" 
                style="max-width:180px;height:auto;display:block;margin:0 auto;"
              />
              <hr style="border:none;border-bottom:1px solid #ddd;margin-top:18px;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px 30px;">

              <h2 style="font-size:20px;color:#222;margin:0 0 16px;">Verification Code</h2>

              <p style="font-size:15px;color:#444;margin:0 0 8px;">
                Hello <strong>${name}</strong>,
              </p>
              <p style="font-size:14px;color:#555;margin:0 0 24px;">
                Use the following verification code to complete your NestAssist login or signup process.
              </p>

              <!-- OTP Box – blue left border -->
              <div style="background-color:#f4f8ff;border-left:4px solid #4A90E2;padding:20px;text-align:center;margin-bottom:24px;">
                <p style="margin:0;font-size:36px;font-weight:bold;letter-spacing:12px;color:#4A90E2;
                           font-family:'Courier New',monospace;">
                  ${otp}
                </p>
              </div>

              <!-- Security Notice – amber left border -->
              <div style="background-color:#fff9f2;border-left:4px solid #f5a623;padding:15px;margin-bottom:28px;">
                <p style="margin:0;font-size:14px;color:#555;">
                  <strong style="color:#f5a623;">Security Notice:</strong>
                  For your protection, this code will expire in exactly
                  <strong style="color:#f5a623;">10 minutes</strong>.
                  Do not share this OTP with anyone.
                </p>
              </div>

              <p style="font-size:13px;color:#888;margin:0 0 6px;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9f9f9;padding:18px 40px;border-top:1px solid #eee;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;">
                &copy; 2026 NestAssist. All rights reserved.
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#bbb;">
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Send OTP verification email to a customer.
 */
export const sendOtpEmail = async (
  email: string,
  name: string,
  otp: string
): Promise<void> => {
  try {
    const info = await transporter.sendMail({
      from: `NestAssist <${process.env.SMTP_FROM}>`,
      to: email,
      subject: "Your OTP Verification Code – NestAssist",
      html: buildOtpEmailHtml(name, otp),
      attachments: fs.existsSync(
        path.join(__dirname, "../../public/assets/logo.png")
      )
        ? [
            {
              filename: "logo.png",
              path: path.join(__dirname, "../../public/assets/logo.png"),
              cid: "logo",
            },
          ]
        : [],
    });

    logger.debug(`OTP email sent to ${email}: ${info.messageId}`);
  } catch (error) {
    logger.error(`Failed to send OTP email to ${email}:`, error);
    throw new Error(MESSAGES.COMMON.FAILED_TO_SEND_OTP);
  }
};
