import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const testSchema = z.object({
    name: z.string().min(3),
    age: z.number().positive(),
  });

  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(testSchema);
  });

  it('should transform and return valid input', () => {
    const validData = { name: 'Alice', age: 30 };
    const result = pipe.transform(validData);
    expect(result).toEqual(validData);
  });

  it('should throw BadRequestException for invalid input', () => {
    const invalidData = { name: 'Al', age: -5 };

    expect(() => pipe.transform(invalidData)).toThrow(BadRequestException);
  });

  it('should format errors properly in BadRequestException response', () => {
    const invalidData = { name: 'Al', age: -5 };

    try {
      pipe.transform(invalidData);
      fail('Expected pipe.transform to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as any;
      expect(response.message).toBe('Validation failed');
      expect(response.errors).toBeDefined();
      expect(response.errors.name).toBeDefined();
      expect(response.errors.age).toBeDefined();
    }
  });
});
