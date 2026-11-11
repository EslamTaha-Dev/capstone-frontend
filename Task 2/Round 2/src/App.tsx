import React from 'react';
import ProfileSettingsForm from './components/ProfileSettingsForm';

export const App: React.FC = () => {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <ProfileSettingsForm />
    </main>
  );
};

export default App;

