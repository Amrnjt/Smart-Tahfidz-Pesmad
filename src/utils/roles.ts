import { User, UserRole } from "../types";

export const isStaffRole = (role?: UserRole) =>
  role === "Ustadz" || role === "Admin" || role === "Superadmin";
export const isAdminRole = (role?: UserRole) =>
  role === "Admin" || role === "Superadmin";
export const isProtectedUser = (user?: User | null) =>
  user?.role === "Superadmin";
