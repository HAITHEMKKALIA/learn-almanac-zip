import { describe, expect, it } from "vitest";
import type { School } from "@/contexts/ActiveSchoolContext";
import { homeForSpace, isSpaceAllowed } from "@/lib/spaceAccess";

const space = (role: string, tenant_type: School["tenant_type"] = "school"): School => ({
  id: crypto.randomUUID(),
  name: "Test",
  slug: "test",
  logo_url: null,
  role,
  tenant_type,
});

describe("tenant route isolation", () => {
  it("routes each membership persona to its own interface", () => {
    expect(homeForSpace(space("school_admin"))).toBe("/school-admin");
    expect(homeForSpace(space("academic_director"))).toBe("/academic");
    expect(homeForSpace(space("teacher"))).toBe("/teacher");
    expect(homeForSpace(space("parent"))).toBe("/parent");
    expect(homeForSpace(space("student"))).toBe("/student");
  });

  it("keeps independent spaces separate from school roles", () => {
    expect(homeForSpace(space("teacher", "independent_teacher"))).toBe("/teacher-studio");
    expect(homeForSpace(space("student", "independent_student"))).toBe("/solo-student");
    expect(isSpaceAllowed(space("teacher", "independent_teacher"), {
      types: ["school"],
      roles: ["teacher"],
    })).toBe(false);
  });

  it("does not let one role enter another persona route", () => {
    expect(isSpaceAllowed(space("student"), {
      types: ["school"],
      roles: ["teacher", "examiner", "staff"],
    })).toBe(false);
    expect(isSpaceAllowed(space("teacher"), {
      types: ["school"],
      roles: ["student"],
    })).toBe(false);
  });

  it("requires a server-approved active space", () => {
    expect(isSpaceAllowed(null, { types: ["school"] })).toBe(false);
  });
});

