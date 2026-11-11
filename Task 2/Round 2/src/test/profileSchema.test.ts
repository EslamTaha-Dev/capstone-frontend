import { describe, it, expect } from 'vitest';
import { profileSchema } from '../schemas/profileSchema';

describe('profileSchema', () => {
  const validBaseData = {
    displayName: 'Jane Doe',
    email: 'jane@example.com',
    website: 'https://example.com',
    bio: 'Hello, this is my bio.',
  };

  describe('displayName validation', () => {
    it('fails when empty with "Display name is required."', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        displayName: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Display name is required.');
      }
    });

    it('fails when shorter than 2 characters', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        displayName: 'J',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Display name must be at least 2 characters.');
      }
    });

    it('fails when longer than 50 characters', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        displayName: 'A'.repeat(51),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Display name must be at most 50 characters.');
      }
    });

    it('fails when containing numbers (e.g. "Jane123")', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        displayName: 'Jane123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Display name can only contain letters, spaces, hyphens, and apostrophes.'
        );
      }
    });

    it('fails when containing special symbols not allowed', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        displayName: 'Jane@Doe',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Display name can only contain letters, spaces, hyphens, and apostrophes.'
        );
      }
    });

    it('passes with letters, spaces, hyphens, and apostrophes', () => {
      expect(
        profileSchema.safeParse({
          ...validBaseData,
          displayName: "Mary-Jane O'Connor",
        }).success
      ).toBe(true);
    });
  });

  describe('email validation', () => {
    it('fails when empty with "Email is required."', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        email: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email is required.');
      }
    });

    it('fails with invalid email format', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address.');
      }
    });

    it('passes with valid email', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        email: 'user@example.org',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('website validation', () => {
    it('passes when omitted or empty', () => {
      expect(
        profileSchema.safeParse({
          ...validBaseData,
          website: '',
        }).success
      ).toBe(true);

      const { website, ...withoutWebsite } = validBaseData;
      expect(profileSchema.safeParse(withoutWebsite).success).toBe(true);
    });

    it('fails with "Website must start with https://" when using http', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        website: 'http://x.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Website must start with https://');
      }
    });

    it('passes when starting with https://', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        website: 'https://x.com',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('bio validation', () => {
    it('passes when omitted or empty', () => {
      expect(
        profileSchema.safeParse({
          ...validBaseData,
          bio: '',
        }).success
      ).toBe(true);

      const { bio, ...withoutBio } = validBaseData;
      expect(profileSchema.safeParse(withoutBio).success).toBe(true);
    });

    it('passes at exactly 250 characters', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        bio: 'a'.repeat(250),
      });
      expect(result.success).toBe(true);
    });

    it('fails with "Bio must be at most 250 characters." when exceeding 250 characters', () => {
      const result = profileSchema.safeParse({
        ...validBaseData,
        bio: 'a'.repeat(251),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bio must be at most 250 characters.');
      }
    });
  });
});

