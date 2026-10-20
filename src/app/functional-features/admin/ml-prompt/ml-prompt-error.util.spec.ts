import { HttpErrorResponse } from '@angular/common/http';
import { extractErrorMessages } from './ml-prompt-error.util';

describe('extractErrorMessages', () => {
  it('uses the fallback when there is no response body', () => {
    expect(extractErrorMessages(new HttpErrorResponse({ status: 500 }), 'Fallback')).toEqual(['Fallback']);
    expect(extractErrorMessages(undefined, 'Fallback')).toEqual(['Fallback']);
  });

  it('returns a plain string body', () => {
    expect(extractErrorMessages(new HttpErrorResponse({ status: 400, error: 'Bad input' }), 'Fallback')).toEqual(['Bad input']);
  });

  it('returns the message and string details', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Cannot publish', details: { first: 'Rule 3 is missing', second: 'Cannot publish' } }
    });

    expect(extractErrorMessages(error, 'Fallback')).toEqual(['Cannot publish', 'Rule 3 is missing']);
  });

  it('flattens nested detail objects', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Validation failed', details: { validationErrors: { name: 'Name is required', count: 3 } } }
    });

    expect(extractErrorMessages(error, 'Fallback')).toEqual(['Validation failed', 'Name is required']);
  });

  it('falls back when the body has nothing readable', () => {
    expect(extractErrorMessages(new HttpErrorResponse({ status: 400, error: {} }), 'Fallback')).toEqual(['Fallback']);
  });
});
