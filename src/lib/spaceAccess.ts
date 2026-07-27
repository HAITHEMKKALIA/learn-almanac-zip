import type { School, SpaceType } from "@/contexts/ActiveSchoolContext";

type SpaceAccessRule = {
  types?: SpaceType[];
  roles?: string[];
};

export function isSpaceAllowed(
  space: School | null,
  rule: SpaceAccessRule,
): boolean {
  if (!space) return false;
  const tenantType = space.tenant_type ?? "school";
  if (rule.types?.length && !rule.types.includes(tenantType)) return false;
  if (rule.roles?.length && !rule.roles.includes(space.role)) return false;
  return true;
}

export function homeForSpace(space: School): string {
  if (space.tenant_type === "independent_teacher") return "/teacher-studio";
  if (space.tenant_type === "independent_student") return "/solo-student";

  switch (space.role) {
    case "owner":
    case "school_admin":
    case "admin":
      return "/school-admin";
    case "academic_director":
    case "pedagogical_coordinator":
      return "/academic";
    case "teacher":
    case "examiner":
    case "staff":
      return "/teacher";
    case "parent":
      return "/parent";
    default:
      return "/student";
  }
}

