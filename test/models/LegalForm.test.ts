import { LegalFormModel } from "../../src/models/LegalForm";

describe("LegalForm Model", () => {
  it("should create and save a legal form successfully", async () => {
    const validLegalForm = new LegalFormModel({
      title: "Test Legal Form",
      content: "This is a test content",
    });
    const savedLegalForm = await validLegalForm.save();

    expect(savedLegalForm._id).toBeDefined();
    expect(savedLegalForm.title).toBe("Test Legal Form");
    expect(savedLegalForm.content).toBe("This is a test content");
  });

  it("should not save a legal form without required fields", async () => {
    const invalidLegalForm = new LegalFormModel({});
    try {
      await invalidLegalForm.save();
    } catch (error) {
      const err = error as any; // Type assertion
      expect(err.errors.title).toBeDefined();
      expect(err.errors.content).toBeDefined();
    }
  });
});
