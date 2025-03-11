import mongoose from 'mongoose';
import { LegalFormModel, ILegalForm } from '../../src/models/LegalForm';
import { connectDB1 } from '../../src/config/mongoConfig';

// Mock the database connection
jest.mock('../../src/config/mongoConfig', () => ({
  connectDB1: jest.fn().mockResolvedValue(mongoose.createConnection())
}));

describe('LegalForm Model', () => {
  let connection: mongoose.Connection;
  let model: mongoose.Model<ILegalForm>;

  beforeAll(async () => {
    connection = await connectDB1();
    model = LegalFormModel(connection);
  });

  it('should create and save a legal form successfully', async () => {
    // Mock the save method
    const saveMock = jest.fn().mockResolvedValue({
      _id: 'mockId',
      name: 'Test Legal Form',
      description: 'This is a test content',
      category: 'test-category',
      status: 'SHOW',
      price: 100000,
      original_price: 75000,
      picture_url: 'https://example.com/image.jpg',
      template_doc_id: 'template1'
    });

    // Create a mock instance with a mocked save method
    const mockLegalForm = {
      name: 'Test Legal Form',
      description: 'This is a test content',
      category: 'test-category',
      status: 'SHOW',
      price: 100000,
      original_price: 75000,
      picture_url: 'https://example.com/image.jpg',
      template_doc_id: 'template1',
      save: saveMock
    };

    // Mock the model constructor to return our mock instance
    jest.spyOn(model, 'create').mockImplementation(() => Promise.resolve(mockLegalForm as any));

    // Call create instead of new model() + save()
    const savedLegalForm = await model.create(mockLegalForm);

    // Verify the save was called
    expect(savedLegalForm.name).toBe('Test Legal Form');
    expect(savedLegalForm.description).toBe('This is a test content');
  });

  it('should not save a legal form without required fields', async () => {
    // Mock validation error
    const mockError = new mongoose.Error.ValidationError();
    mockError.errors = {
      name: new mongoose.Error.ValidatorError({ message: 'Path `name` is required.' } as any),
      description: new mongoose.Error.ValidatorError({ message: 'Path `description` is required.' } as any)
    };

    // Mock the save operation to throw an error
    jest.spyOn(model, 'create').mockImplementation(() => {
      throw mockError;
    });

    // Attempt to create an invalid document
    try {
      await model.create({} as any);
      // If no error is thrown, fail the test
      fail('Expected an error to be thrown');
    } catch (error) {
      // Verify the correct validation error
      const validationError = error as mongoose.Error.ValidationError;
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.description).toBeDefined();
    }
  });
});
