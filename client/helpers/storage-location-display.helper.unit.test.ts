import {
  DEFAULT_UI_DISPLAY,
  formatCaselaLabel,
} from "@/helpers/storage-location-display.helper";

describe("formatCaselaLabel", () => {
  const display = { ...DEFAULT_UI_DISPLAY, caselaSetor: "todos" as const };

  it("shows only casela number in numero mode", () => {
    expect(
      formatCaselaLabel(
        { ...display, casela: "numero" },
        { caselaId: 12, residentName: "Maria", sector: "farmacia" },
      ),
    ).toBe("12");
  });

  it("shows resident name only in nome mode", () => {
    expect(
      formatCaselaLabel(
        { ...display, casela: "nome" },
        { caselaId: 12, residentName: "Maria", sector: "farmacia" },
      ),
    ).toBe("Maria");
  });

  it("shows name and casela number in nome_casela mode", () => {
    expect(
      formatCaselaLabel(
        { ...display, casela: "nome_casela" },
        { caselaId: 12, residentName: "Maria", sector: "farmacia" },
      ),
    ).toBe("Maria (12)");
  });

  it("falls back to Casela N when name is missing", () => {
    expect(
      formatCaselaLabel(
        { ...display, casela: "nome" },
        { caselaId: 12, residentName: null, sector: "farmacia" },
      ),
    ).toBe("Casela 12");
  });
});
