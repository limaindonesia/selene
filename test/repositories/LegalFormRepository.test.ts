import { LegalFormRepository } from "../../src/repositories/LegalFormRepository";
import { LegalFormModel } from "../../src/models/LegalForm";

const repository = new LegalFormRepository();

describe("LegalForm Repository", () => {
  it("should create a legal form", async () => {
    const legalForm = await repository.create({ title: "Test Form", content: "Test Content" });
    expect(legalForm._id).toBeDefined();
    expect(legalForm.title).toBe("Test Form");
    expect(legalForm.content).toBe("Test Content");
  });

  it("should find all legal forms", async () => {
    await LegalFormModel.create({ title: "Form 1", content: "Content 1" });
    await LegalFormModel.create({ title: "Form 2", content: "Content 2" });

    const legalForms = await repository.findAll();
    expect(legalForms).toHaveLength(2);
  });

  it("should find a legal form by ID", async () => {
    const legalForm = await repository.create({ title: "Find Me", content: "Find Content" });
    const foundForm = await repository.findById(legalForm._id);

    expect(foundForm).toBeDefined();
    expect(foundForm?.title).toBe("Find Me");
  });

  it("should update a legal form", async () => {
    const legalForm = await repository.create({ title: "Update Me", content: "Update Content" });
    const updatedForm = await repository.update(legalForm._id, { title: "Updated Title" });

    expect(updatedForm?.title).toBe("Updated Title");
  });

  it("should delete a legal form", async () => {
    const legalForm = await repository.create({ title: "Delete Me", content: "Delete Content" });
    await repository.delete(legalForm._id);

    const foundForm = await repository.findById(legalForm._id);
    expect(foundForm).toBeNull();
  });
});
