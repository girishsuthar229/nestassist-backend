import nodemailer from "nodemailer";
import dotenv from "dotenv";
import logger from "./logger";
import path from "path";
import { addEmailJob } from "../jobs/queues/email.queue";
import { EMAIL_WORKER } from "@/enums/email.enum";

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

// Logo path updated to public folder
const LOGO_PATH = path.join(__dirname, "../../public/assets/logo.png");

/**
 * @name sendMail
 * @description
 * Base wrapper for sending emails (Physical sending)
 * @access Public
 */
const sendMail = async (options: nodemailer.SendMailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: `Home Care <${process.env.SMTP_FROM}>`,
      ...options,
      attachments: [
        ...(options.attachments || []),
        {
          filename: "logo.png",
          path: LOGO_PATH,
          cid: "logo",
        },
      ],
    });
    logger.debug(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email:`, error);
    throw error;
  }
};

/**
 * @name sendAdminCredentialsDirect
 * @description
 * Directly sends an email with admin credentials (Used for immediate sending without queue)
 * @access Private
 */
export const sendAdminCredentialsDirect = async (
  email: string,
  name: string,
  password: string
) => {
  return sendMail({
    to: email,
    subject: "Welcome to Home Care",
    html: `
        <div style="font-family: Alexandria, sans-serif; line-height: 1.6; color: #444; max-width: 550px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="cid:logo" alt="NestAssist" width="160" style="display: block; margin: 0 auto; height: 45px;">
            <hr style="border: none; border-bottom: 1px solid #ddd; margin-top: 20px;">
          </div>
          <h2 style="font-size: 22px; color: #222; margin-top: 0; margin-bottom: 20px;">Admin Account Credentials</h2>
          <p style="font-size: 16px; margin-bottom: 15px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 15px; color: #555; margin-bottom: 25px;">
            Use the following credentials to access your NestAssist admin account. Please make sure to keep these details secure.
          </p>

          <div style="background-color: #E1E0FA; border-left: 4px solid #4540E1; padding: 15px; text-align: left; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 14px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Admin Credentials</p>
            <div style="margin-top: 15px; font-size: 18px; color: #4540E1; font-weight: bold;">
              <div>Email: ${email}</div>
              <div>Password: ${password}</div>
            </div>
          </div>

          <div style="background-color: #fff9f2; border-left: 4px solid #f5a623; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 14px; color: #555;">
              <strong style="color: #f5a623;">Security Notice:</strong> For your protection, do not share these credentials with anyone. We recommend logging in and changing your password immediately.
            </p>
          </div>
          <p style="font-size: 14px; color: #777; margin-bottom: 10px;">
            If you did not request this account, please ignore this email or contact support if you have concerns.
          </p>
          <p style="font-size: 14px; color: #777; margin-bottom: 30px;">
            Need help? Please visit our support center.
          </p>

          <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #999;">
            <p style="margin: 0;">&copy; 2026 NestAssist. All rights reserved.</p>
            <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
  });
};

/**
 * @name sendPartnerApprovalEmailDirect
 * @description
 * Directly sends an email to service partner upon profile approval with a link to set their password (Used for immediate sending without queue)
 * @access Private
 */
export const sendPartnerApprovalEmailDirect = async (
  email: string,
  name: string,
  resetLink: string
) => {
  return sendMail({
    to: email,
    subject: "Welcome to Home Care - Profile Approved!",
    html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #444; max-width: 550px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="cid:logo" alt="NestAssist" width="160" style="display: block; margin: 0 auto; height: 45px;">
            <hr style="border: none; border-bottom: 1px solid #ddd; margin-top: 20px;">
          </div>
          <h2 style="font-size: 22px; color: #222; margin-top: 0; margin-bottom: 20px;">Profile Approved!</h2>
          <p style="font-size: 16px; margin-bottom: 15px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 15px; color: #555; margin-bottom: 25px;">
            Congratulations! Your service partner profile has been reviewed and approved by our team. You are now part of the NestAssist partner network.
          </p>
          <p style="font-size: 15px; color: #555; margin-bottom: 25px;">
            To get started, you need to set up your account password. Please click the button below to set your new password:
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetLink}" style="background-color: #4540E1; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Set Your Password</a>
          </div>
      
          <div style="background-color: #fff9f2; border-left: 4px solid #f5a623; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 14px; color: #555;">
                <strong style="color: #f5a623;">Note:</strong> This link will expire shortly for security reasons. If you didn't expect this email, please contact our support team.
            </p>
          </div>
          
          <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #999;">
            <p style="margin: 0;">&copy; 2026 NestAssist. All rights reserved.</p>
            <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
  });
};

/**
 * @name sendPartnerRejectionEmailDirect
 * @description
 * Directly sends an email to service partner upon profile rejection (Used for immediate sending without queue)
 * @access Private
 */
export const sendPartnerRejectionEmailDirect = async (
  email: string,
  name: string
) => {
  return sendMail({
    to: email,
    subject: "Home Care - Profile Rejected!",
    html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #444; max-width: 550px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="cid:logo" alt="NestAssist" width="160" style="display: block; margin: 0 auto; height: 45px;">
            <hr style="border: none; border-bottom: 1px solid #ddd; margin-top: 20px;">
          </div>
          <h2 style="font-size: 22px; color: #222; margin-top: 0; margin-bottom: 20px;">Profile Rejected!</h2>
          <p style="font-size: 16px; margin-bottom: 15px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 15px; color: #555; margin-bottom: 25px;">
            Sorry! We regret to inform you that your service partner profile has been reviewed and did not meet our criteria for approval at this time. We encourage you to review our requirements and consider reapplying in the future.
          </p>
          <p style="font-size: 15px; color: #555; margin-bottom: 25px;">
            If you have any questions or would like feedback on your application, please feel free to contact our support team.
          </p>
          
          <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #999;">
            <p style="margin: 0;">&copy; 2026 NestAssist. All rights reserved.</p>
            <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
  });
};

/**
 * @name sendForgotPasswordEmailDirect
 * @description
 * Directly sends an email with password reset instructions to service partner (Used for immediate sending without queue)
 * @access Private
 */
export const sendForgotPasswordEmailDirect = async (
  email: string,
  name: string,
  resetLink: string
) => {
  return sendMail({
    to: email,
    subject: "Home Care - Password Reset Request",
    html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #444; max-width: 550px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="cid:logo" alt="NestAssist" width="160" style="display: block; margin: 0 auto; height: 45px;">
            <hr style="border: none; border-bottom: 1px solid #ddd; margin-top: 20px;">
          </div>
          <h2 style="font-size: 22px; color: #222; margin-top: 0; margin-bottom: 20px;">Password Reset Request</h2>
          <p style="font-size: 16px; margin-bottom: 15px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 15px; color: #555; margin-bottom: 25px;">
            We received a request to reset your password. Click the button below to proceed.
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetLink}" style="background-color: #4540E1; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>

          <div style="background-color: #fff9f2; border-left: 4px solid #f5a623; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 14px; color: #555;">
                <strong style="color: #f5a623;">Note:</strong> If you did not request this, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #999;">
            <p style="margin: 0;">&copy; 2026 NestAssist. All rights reserved.</p>
            <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
  });
};

/**
 * @name sendBookingConfirmationEmailDirect
 * @description
 * Directly sends a booking confirmation email to customer (Used for immediate sending without queue)
 * @access Private
 */
export const sendBookingConfirmationEmailDirect = async (
  email: string,
  name: string,
  bookingId: string | number,
  serviceName: string,
  slot: string,
  amount: string | number
) => {
  return sendMail({
    to: email,
    subject: `Booking Confirmed! - #${bookingId}`,
    html: `
        <div style="font-family: Alexandria, sans-serif; line-height: 1.6; color: #444; max-width: 550px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="cid:logo" alt="NestAssist" width="160" style="display: block; margin: 0 auto; height: 45px;">
            <hr style="border: none; border-bottom: 1px solid #ddd; margin-top: 20px;">
          </div>
          <h2 style="font-size: 22px; color: #222; margin-top: 0; margin-bottom: 20px;">Booking Confirmed!</h2>
          <p style="font-size: 16px; margin-bottom: 15px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 15px; color: #555; margin-bottom: 25px;">
            Thank you for choosing NestAssist! Your booking has been successfully confirmed. Our service provider will arrive at your location as per the scheduled slot.
          </p>

          <div style="background-color: #E1E0FA; border: 1px solid #4540E1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 14px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Booking Details</p>
            <div style="margin-top: 15px; font-size: 18px; color: #4540E1; font-weight: bold;">
              <div>Booking ID: ${bookingId}</div>
              <div>Service: ${serviceName}</div>
              <div>Scheduled Slot: ${slot}</div>
              <div>Amount Paid: ${amount}</div>
            </div>
          </div>

          <div style="background-color: #fff9f2; border-left: 4px solid #f5a623; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 14px; color: #555;">
              You can track your booking status and view more details in the "My Bookings" section of the NestAssist.
            </p>
          </div>
          
          <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #999;">
            <p style="margin: 0;">&copy; 2026 NestAssist. All rights reserved.</p>
            <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
  });
};

/**
 * Queued functions (Queued)
 */
export const sendAdminCredentials = async (
  email: string,
  name: string,
  password: string
) => {
  await addEmailJob(EMAIL_WORKER.SEND_ADMIN_CREDENTIALS, {
    email,
    name,
    password,
  });
};

export const sendPartnerApprovalEmail = async (
  email: string,
  name: string,
  resetLink: string
) => {
  await addEmailJob(EMAIL_WORKER.SEND_PARTNER_APPROVAL, {
    email,
    name,
    resetLink,
  });
};

export const sendPartnerRejectionEmail = async (
  email: string,
  name: string
) => {
  await addEmailJob(EMAIL_WORKER.SEND_PARTNER_REJECTION, { email, name });
};

export const sendForgotPasswordEmail = async (
  email: string,
  name: string,
  resetLink: string
) => {
  await addEmailJob(EMAIL_WORKER.SEND_FORGOT_PASSWORD, {
    email,
    name,
    resetLink,
  });
};

export const sendBookingConfirmationEmail = async (
  email: string,
  name: string,
  bookingId: string | number,
  serviceName: string,
  slot: string,
  amount: string | number
) => {
  await addEmailJob(EMAIL_WORKER.SEND_BOOKING_CONFIRMATION, {
    email,
    name,
    bookingId,
    serviceName,
    slot,
    amount,
  });
};
