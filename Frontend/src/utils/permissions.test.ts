import { isInternalRole } from "./permissions";
import type { UserRoleCode } from "./index";

describe("permissions", () => {
  it.each<UserRoleCode>(["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"])(
    "treats %s as an internal role",
    (role) => {
      expect(isInternalRole(role)).toBe(true);
    }
  );

  it.each<UserRoleCode>(["khach_hang", "guest"])(
    "does not treat %s as an internal role",
    (role) => {
      expect(isInternalRole(role)).toBe(false);
    }
  );
});
