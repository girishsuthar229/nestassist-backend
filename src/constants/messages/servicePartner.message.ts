export const SERVICE_PARTNER = {
    //Success
    PROFILE_FETCH_SUCCESS: "Profile fetched successfully",
    PROFILE_UPDATE_SUCCESS: "Profile updated successfully",
  
    // Errors
    INVALID_UPDATE_TYPE: "Invalid update type",
    PROFILE_IMG_REQUIRED: "Profile image is required",
    PROFILE_NOT_FOUND: "Service partner profile not found",
    PROFILE_UPDATE_FAILED: "Failed to update profile",
    INVALID_CURRENT_PASSWORD: "Current password is incorrect",
    NEW_PASSWORD_SAME_AS_OLD: "New password cannot be same as current password",
    PASSWORD_MISMATCH: "Password and confirmation do not match",
    UNAUTHORIZED_PROFILE_ACCESS: "You are not authorized to access this profile",
  } as const;
  