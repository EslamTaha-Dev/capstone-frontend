import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required.')
    .min(2, 'Display name must be at least 2 characters.')
    .max(50, 'Display name must be at most 50 characters.')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Display name can only contain letters, spaces, hyphens, and apostrophes.'
    ),
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),
  website: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || val.startsWith('https://'), {
      message: 'Website must start with https://',
    }),
  bio: z
    .string()
    .max(250, 'Bio must be at most 250 characters.')
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

