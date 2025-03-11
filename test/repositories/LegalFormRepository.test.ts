import { LegalFormRepository } from "../../src/repositories/LegalFormRepository";

const repository = new LegalFormRepository();

describe("LegalForm Repository", () => {
  it("should create a legal form", async () => {
    const legalForm = await repository.create({ 
      name: "Test Form", 
      description: "Test Content",
      category: "Test Category",
      status: "SHOW",
      original_price: 75000,
      picture_url: "https://example.com/image.jpg",
      template_doc_id: "template1"
    });
    expect(legalForm._id).toBeDefined();
    expect(legalForm.name).toBe("Test Form");
    expect(legalForm.description).toBe("Test Content");
  });

  it("should find all legal forms", async () => {
    // Create test data directly through the repository
    await repository.create({ 
      name: "Form 1", 
      description: "Content 1",
      category: "Test Category",
      status: "SHOW",
      original_price: 75000,
      picture_url: "https://example.com/image.jpg",
      template_doc_id: "template1"
    });
    await repository.create({ 
      name: "Form 2", 
      description: "Content 2",
      category: "Test Category",
      status: "SHOW",
      original_price: 75000,
      picture_url: "https://example.com/image.jpg",
      template_doc_id: "template1"
    });

    const legalForms = await repository.findAll();
    expect(legalForms.length).toBeGreaterThan(0);
  });

  it("should find a legal form by ID", async () => {
    const legalForm = await repository.create({ 
      name: "Find Me", 
      description: "Find Content",
      category: "Test Category",
      status: "SHOW",
      original_price: 75000,
      picture_url: "https://example.com/image.jpg",
      template_doc_id: "template1"
    });
    const foundForm = await repository.findById(legalForm.id);

    expect(foundForm).toBeDefined();
    expect(foundForm?.name).toBe("Find Me");
  });

  it("should update a legal form", async () => {
    const legalForm = await repository.create({ 
      name: "Update Me", 
      description: "Update Content",
      category: "Test Category",
      status: "SHOW",
      original_price: 75000,
      picture_url: "https://example.com/image.jpg",
      template_doc_id: "template1"
    });
    const updatedForm = await repository.update(legalForm.id, { name: "Updated Title" });

    expect(updatedForm?.name).toBe("Updated Title");
  });

  it("should delete a legal form", async () => {
    const legalForm = await repository.create({ 
      name: "Delete Me", 
      description: "Delete Content",
      category: "Test Category",
      status: "SHOW",
      original_price: 75000,
      picture_url: "https://example.com/image.jpg",
      template_doc_id: "template1"
    });
    await repository.delete(legalForm.id);

    const foundForm = await repository.findById(legalForm.id);
    expect(foundForm).toBeNull();
  });
});
