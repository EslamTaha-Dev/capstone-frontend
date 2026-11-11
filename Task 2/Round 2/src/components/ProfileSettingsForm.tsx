import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileFormData } from '../schemas/profileSchema';

export const ProfileSettingsForm: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      displayName: '',
      email: '',
      website: '',
      bio: '',
    },
  });

  const bioValue = watch('bio') || '';

  const onSubmit = (data: ProfileFormData) => {
    console.log('Profile submitted successfully:', data);
    setSuccessMessage('Profile updated successfully!');
  };

  return (
    <div className="max-w-xl mx-auto my-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

      {successMessage && (
        <div
          role="status"
          className="mb-6 p-4 text-sm font-medium text-green-800 bg-green-100 border border-green-300 rounded-md"
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Display Name */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            {...register('displayName')}
            aria-invalid={errors.displayName ? 'true' : 'false'}
            aria-describedby={errors.displayName ? 'displayName-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-sm ${
              errors.displayName
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
            }`}
          />
          {errors.displayName && (
            <p id="displayName-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.displayName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-sm ${
              errors.email
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
            }`}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Website */}
        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Website
          </label>
          <input
            id="website"
            type="url"
            {...register('website')}
            aria-invalid={errors.website ? 'true' : 'false'}
            aria-describedby={errors.website ? 'website-error' : undefined}
            placeholder="https://example.com"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-sm ${
              errors.website
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
            }`}
          />
          {errors.website && (
            <p id="website-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.website.message}
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700"
            >
              Bio
            </label>
            <span
              id="bio-counter"
              aria-live="polite"
              className="text-xs text-gray-500"
            >
              {bioValue.length} / 250
            </span>
          </div>
          <textarea
            id="bio"
            rows={4}
            {...register('bio')}
            aria-invalid={errors.bio ? 'true' : 'false'}
            aria-describedby={errors.bio ? 'bio-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-sm ${
              errors.bio
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
            }`}
          />
          {errors.bio && (
            <p id="bio-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.bio.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-md shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
};
export default ProfileSettingsForm;

