import cron from "node-cron";
import { Op } from "sequelize";
import { Booking, Payment, Service } from "@/models";
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/enums/transaction.enum";
import logger from "@/utils/logger";
import sequelize from "@/configs/db";
import { logPaymentFailed } from "@/services/logger/payment.logger";
import { formatDateTimeDetail } from "@/utils/adminBookingManagement.util";

/**
 * Booking Expiry & Cleanup Job
 * Runs every 1 minute to find and delete expired CARD bookings with PENDING payment status.
 */
export const initBookingCleanupJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Find bookings that have expired
      // Filter for CARD payment method and PENDING payment status via association
      const expiredBookings = await Booking.findAll({
        where: {
          expiresAt: {
            [Op.lt]: now,
          },
        },
        include: [
          {
            model: Payment,
            as: "payment",
            where: {
              paymentStatus: PaymentStatus.PENDING,
              paymentMethod: PaymentMethod.CARD,
            },
            required: true,
          },
        ],
      });

      if (expiredBookings.length === 0) {
        return;
      }

      for (const booking of expiredBookings) {
        try {
          const service = await Service.findOne({
            where: {
              id: booking.serviceId,
            },
            attributes: ["name"],
          });
          await sequelize.transaction(async (transaction) => {
            // Failed related Payment if it exists and is still PENDING

            if (booking.paymentId) {
              await Payment.update(
                {
                  paymentStatus: PaymentStatus.FAILED,
                  bookingStatus: BookingStatus.CANCELLED,
                },
                {
                  where: {
                    id: booking.paymentId,
                    paymentStatus: PaymentStatus.PENDING,
                  },
                  transaction,
                },
              );
            }

            // Cancelled Booking record
            await booking.update(
              {
                status: BookingStatus.CANCELLED,
              },
              {
                transaction,
              },
            );
          });

          logPaymentFailed({
            bookingId: booking.id,
            metadata: { userId: booking.userId, serviceId: booking.serviceId },
            message: `Booking${service?.name ? ` of ${service?.name}` : ""} was cancelled due to late payment and has expired ${
              booking?.expiresAt
                ? ` at ${formatDateTimeDetail(booking.expiresAt)}`
                : ""
            }`,
          });
        } catch (bookingError) {
          logger.error(
            `Failed to clean up booking ID: ${booking.id}`,
            bookingError,
          );
        }
      }
    } catch (error) {
      logger.error("Error in Booking Expiry & Cleanup Job:", error);
    }
  });
};
