import { z } from 'zod';


export const VerificationValidation = z.object({
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

export const LoginValidation = z.object({
  email: z
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .trim()
    .toLowerCase(),
  terms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the terms and conditions'),
});
