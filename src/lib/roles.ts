// Phase 4: Extended role system
// Centralized role definitions, hierarchy and permission helpers.

export type AppRole =
  | "super_admin"
  | "admin"
  | "school_admin"
  | "academic_director"
  | "pedagogical_coordinator"
  | "examiner"
  | "teacher"
  | "staff"
  | "parent"
  | "student";

export const ALL_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "school_admin",
  "academic_director",
  "pedagogical_coordinator",
  "examiner",
  "teacher",
  "staff",
  "parent",
  "student",
];

// Higher number = more privileges
export const ROLE_RANK: Record<AppRole, number> = {
  super_admin: 100,
  admin: 90,
  school_admin: 80,
  academic_director: 70,
  pedagogical_coordinator: 60,
  examiner: 55,
  teacher: 50,
  staff: 30,
  parent: 20,
  student: 10,
};

export const ROLE_LABELS: Record<AppRole, { fr: string; de: string; ar: string }> = {
  super_admin: { fr: "Super Admin", de: "Super-Admin", ar: "مدير عام" },
  admin: { fr: "Administrateur", de: "Administrator", ar: "مشرف" },
  school_admin: { fr: "Admin école", de: "Schulleitung", ar: "إدارة المدرسة" },
  academic_director: { fr: "Directeur pédagogique", de: "Schulleiter Akademik", ar: "المدير الأكاديمي" },
  pedagogical_coordinator: { fr: "Coordinateur péda.", de: "Pädagogische Koordination", ar: "منسق تربوي" },
  examiner: { fr: "Examinateur", de: "Prüfer", ar: "ممتحن" },
  teacher: { fr: "Enseignant", de: "Lehrkraft", ar: "معلم" },
  staff: { fr: "Personnel", de: "Mitarbeiter", ar: "موظف" },
  parent: { fr: "Parent", de: "Eltern", ar: "ولي أمر" },
  student: { fr: "Élève", de: "Schüler", ar: "طالب" },
};

export const ADMIN_ROLES: AppRole[] = ["super_admin", "admin", "school_admin"];
export const STAFF_ROLES: AppRole[] = [
  ...ADMIN_ROLES,
  "academic_director",
  "pedagogical_coordinator",
  "examiner",
  "teacher",
  "staff",
];

export const hasAnyRole = (userRoles: string[] | undefined | null, allowed: AppRole[]): boolean =>
  !!userRoles?.some((r) => allowed.includes(r as AppRole));

export const isAdminLike = (userRoles: string[] | undefined | null) =>
  hasAnyRole(userRoles, ADMIN_ROLES);

export const isStaff = (userRoles: string[] | undefined | null) =>
  hasAnyRole(userRoles, STAFF_ROLES);

export const highestRole = (userRoles: string[] | undefined | null): AppRole | null => {
  if (!userRoles?.length) return null;
  let best: AppRole | null = null;
  let bestRank = -1;
  for (const r of userRoles) {
    const rank = ROLE_RANK[r as AppRole];
    if (rank !== undefined && rank > bestRank) {
      bestRank = rank;
      best = r as AppRole;
    }
  }
  return best;
};
