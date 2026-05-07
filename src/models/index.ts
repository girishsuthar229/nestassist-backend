import { ServiceType } from "./serviceType.model";
import { Category } from "./category.model";
import { SubCategory } from "./subCategory.model";
import { Service } from "./service.model";
import Contact from "./contact.model";
import { ServicePartner } from "./servicePartner.model";
import { ServicePartnerEducation } from "./servicePartnerEducation.model";
import { ServicePartnerExperience } from "./servicePartnerExperience.model";
import { ServicePartnerSkill } from "./servicePartnerSkill.model";
import { ServicePartnerService } from "./servicePartnerService.model";
import { ServicePartnerLanguage } from "./servicePartnerLanguage.model";
import { ServicePartnerDocument } from "./servicePartnerDocument.model";
import User from "./user.model";
import Booking from "./booking.model";
import Admin from "./admin.model";
import Configuration from "./configuration.model";
import CouponUsage from "./couponUsage.model";
import Offer from "./offer.model";
import Address from "./address.model";
import Payment from "./payment.model";
import CustomerOtp from "./customerOtp.model";
import Log from "./log.model";
import Role from "./role.model";
import RecentSearch from "./recentSearch.model";


// One Service → Many Bookings
Service.hasMany(Booking, { foreignKey: "service_id", as: "bookings" });
// One Booking → One Service
Booking.belongsTo(Service, { foreignKey: "service_id", as: "service" });

// One ServiceType → Many Bookings
ServiceType.hasMany(Booking, { foreignKey: "service_type_id", as: "bookings" });
// One Booking → One ServiceType
Booking.belongsTo(ServiceType, { foreignKey: "service_type_id", as: "serviceType" });

// ServiceType has many Categories
ServiceType.hasMany(Category, {
  foreignKey: "service_type_id",
  as: "categories",
});
Category.belongsTo(ServiceType, {
  foreignKey: "service_type_id",
  as: "serviceType",
});

// Category has many SubCategories
Category.hasMany(SubCategory, {
  foreignKey: "category_id",
  as: "subcategories",
});
SubCategory.belongsTo(Category, { foreignKey: "category_id", as: "category" });

// SubCategory has many Services
SubCategory.hasMany(Service, { foreignKey: "sub_category_id", as: "services" });
Service.belongsTo(SubCategory, {
  foreignKey: "sub_category_id",
  as: "subCategory",
});

// Array foreign keys handled natively or via raw mapping.
// ServicePartner <-> ServiceType associations removed because service_type_id is now an array.
ServicePartner.hasMany(ServicePartnerEducation, {
  foreignKey: "partner_id",
  as: "educations",
  onDelete: "CASCADE",
});
ServicePartnerEducation.belongsTo(ServicePartner, { foreignKey: "partner_id" });

ServicePartner.hasMany(ServicePartnerExperience, {
  foreignKey: "partner_id",
  as: "experiences",
  onDelete: "CASCADE",
});
ServicePartnerExperience.belongsTo(ServicePartner, {
  foreignKey: "partner_id",
});

ServicePartner.hasMany(ServicePartnerSkill, {
  foreignKey: "partner_id",
  as: "skills",
  onDelete: "CASCADE",
});
ServicePartnerSkill.belongsTo(ServicePartner, { foreignKey: "partner_id" });
ServicePartnerSkill.belongsTo(Category, {
  foreignKey: "category_id",
  as: "category",
});

ServicePartner.hasMany(ServicePartnerService, {
  foreignKey: "partner_id",
  as: "services",
  onDelete: "CASCADE",
});
ServicePartnerService.belongsTo(ServicePartner, { foreignKey: "partner_id" });
ServicePartnerService.belongsTo(SubCategory, {
  foreignKey: "sub_category_id",
  as: "subCategory",
});

ServicePartner.hasMany(ServicePartnerLanguage, {
  foreignKey: "partner_id",
  as: "languages",
  onDelete: "CASCADE",
});
ServicePartnerLanguage.belongsTo(ServicePartner, { foreignKey: "partner_id" });

ServicePartner.hasMany(ServicePartnerDocument, {
  foreignKey: "partner_id",
  as: "documents",
  onDelete: "CASCADE",
});
ServicePartnerDocument.belongsTo(ServicePartner, { foreignKey: "partner_id" });

Booking.belongsTo(ServicePartner, {
  foreignKey: "service_partner_id",
  as: "servicePartner",
});
ServicePartner.hasMany(Booking, {
  foreignKey: "service_partner_id",
  as: "bookings",
});
Payment.hasOne(Booking, { foreignKey: "payment_id", as: "booking" });
Booking.belongsTo(Payment, { foreignKey: "payment_id", as: "paymentDetails" });
// User Associations
User.belongsTo(Role, { foreignKey: "roleId", as: "role" });
Role.hasMany(User, { foreignKey: "roleId", as: "users" });
User.hasOne(ServicePartner, { foreignKey: "user_id", as: "servicePartner" });
ServicePartner.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User → Many Bookings (Customer)
User.hasMany(Booking, { foreignKey: "user_id", as: "bookings" });
Booking.belongsTo(User, { foreignKey: "user_id", as: "customer" });
User.hasMany(Address, { foreignKey: "user_id", as: "addresses" });
Address.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Address → Many Bookings
Address.hasMany(Booking, { foreignKey: "address_id", as: "bookings" });
Booking.belongsTo(Address, { foreignKey: "address_id", as: "address" });

// Offer and CouponUsage Associations
Offer.hasMany(CouponUsage, { foreignKey: "offerId", as: "usages" });
CouponUsage.belongsTo(Offer, { foreignKey: "offerId", as: "offer" });

// Offer and Payment Associations
Payment.belongsTo(Offer, { foreignKey: "coupon_id", as: "offer" });
Offer.hasMany(Payment, { foreignKey: "coupon_id", as: "payments" });

Payment.hasOne(Booking, { foreignKey: "payment_id", as: "bookings" });
Booking.belongsTo(Payment, { foreignKey: "payment_id", as: "payment" });
Address.hasMany(Payment, { foreignKey: "address_id", as: "payments" });
Payment.belongsTo(Address, { foreignKey: "address_id", as: "address" });

User.hasMany(Payment, { foreignKey: "user_id", as: "payments" });
Payment.belongsTo(User, { foreignKey: "user_id", as: "user" });

Service.hasMany(Payment, { foreignKey: "service_id", as: "payments" });
Payment.belongsTo(Service, { foreignKey: "service_id", as: "service" });

// Log Associations
User.hasMany(Log, { foreignKey: "user_id", as: "logs" });
Log.belongsTo(User, { foreignKey: "user_id", as: "user" });

// RecentSearch Associations
User.hasMany(RecentSearch, { foreignKey: "userId", as: "recentSearches" });
RecentSearch.belongsTo(User, { foreignKey: "userId", as: "user" });


Service.hasMany(Log, { foreignKey: "service_id", as: "logs" });
Log.belongsTo(Service, { foreignKey: "service_id", as: "service" });

Booking.hasMany(Log, { foreignKey: "booking_id", as: "logs" });
Log.belongsTo(Booking, { foreignKey: "booking_id", as: "booking" });

Service.belongsTo(User, { foreignKey: "created_by", as: "creator" });
User.hasMany(Service, { foreignKey: "created_by", as: "createdServices" });

export {
  ServiceType,
  Category,
  SubCategory,
  Service,
  Contact,
  ServicePartner,
  ServicePartnerEducation,
  ServicePartnerExperience,
  ServicePartnerSkill,
  ServicePartnerService,
  ServicePartnerLanguage,
  ServicePartnerDocument,
  User,
  Admin,
  Booking,
  Configuration,
  CouponUsage,
  Offer,
  Address,
  Payment,
  CustomerOtp,
  Log,
  Role,
  RecentSearch,
};

