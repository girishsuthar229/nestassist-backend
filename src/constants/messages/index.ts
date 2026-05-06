/**
 * Centralized API messages — import from here everywhere.
 *
 * @example
 * import { MESSAGES } from "@/constants/messages";
 *
 * throw new ApiError(404, MESSAGES.BOOKING.NOT_FOUND);
 * return sendResponse(res, MESSAGES.AUTH.LOGIN_SUCCESS, data);
 */

import { AUTH }        from "./auth.messages";
import { USER }        from "./user.messages";
import { CUSTOMER }    from "./customer.messages";
import { BOOKING }     from "./booking.messages";
import { SERVICE, SERVICE_TYPE, EXPERT } from "./service.messages";
import { CATEGORY, SUBCATEGORY }         from "./category.messages";
import { PAYMENT, TRANSACTION }          from "./payment.messages";
import { CONFIGURATION, DASHBOARD, CONTACT } from "./config.messages";
import { OFFER, OFFER_VALIDATION } from "./offer.messages";
import { COMMON }      from "./common.messages";
import { ROLE } from "./role.messages";
import { SERVICE_PARTNER } from "./servicePartner.message";


export const MESSAGES = {
  AUTH,
  USER,
  CUSTOMER,
  BOOKING,
  SERVICE,
  SERVICE_TYPE,
  EXPERT,
  CATEGORY,
  SUBCATEGORY,
  PAYMENT,
  TRANSACTION,
  CONFIGURATION,
  DASHBOARD,
  CONTACT,
  COMMON,
  ROLE,
  OFFER,
  OFFER_VALIDATION,
  SERVICE_PARTNER
} as const;
