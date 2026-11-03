import { UnprocessableEntityException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { exceptionFactory } from './exception-factory';

describe('exceptionFactory', () => {
  it('should group the messages by top-level field, including nested ones', () => {
    const errors = [
      {
        property: 'name',
        constraints: {
          isString: 'name must be a string',
          isLength: 'name is too short',
        },
        children: [],
      },
      {
        property: 'address',
        children: [
          {
            property: 'zipCode',
            constraints: { isPostalCode: 'zipCode is invalid' },
            children: [],
          },
        ],
      },
    ] as unknown as ValidationError[];

    const exception = exceptionFactory(errors);

    expect(exception).toBeInstanceOf(UnprocessableEntityException);
    expect(exception.getResponse()).toEqual({
      statusCode: 422,
      error: 'Unprocessable Entity',
      message: [
        { name: ['name must be a string', 'name is too short'] },
        { address: ['zipCode is invalid'] },
      ],
    });
  });
});
