import { LegalFormService } from "../../src/services/LegalFormService";

const service = new LegalFormService();

describe("LegalForm Service", () => {
  it("should create a legal form", async () => {
    const legalForm = await service.createLegalForm({ title: "Service Test", content: "Service Content" });
    expect(legalForm._id).toBeDefined();
    expect(legalForm.title).toBe("Service Test");
  });

  it("should get all legal forms", async () => {
    await service.createLegalForm({ title: "Form 1", content: "Content 1" });
    await service.createLegalForm({ title: "Form 2", content: "Content 2" });

    const legalForms = await service.getLegalForms();
    expect(legalForms).toHaveLength(2);
  });

  it("should update a legal form", async () => {
    const legalForm = await service.createLegalForm({ title: "Old Title", content: "Old Content" });
    const updatedForm = await service.updateLegalForm(legalForm._id, { title: "New Title" });

    expect(updatedForm?.title).toBe("New Title");
  });

  it("should delete a legal form", async () => {
    const legalForm = await service.createLegalForm({ title: "Delete Service", content: "Delete Content" });
    await service.deleteLegalForm(legalForm._id);

    const allForms = await service.getLegalForms();
    expect(allForms).toHaveLength(0);
  });
});
