import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // The URL contains the auth code/tokens from the OAuth provider
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setProcessing(false);
          return;
        }

        if (data?.session?.user) {
          // Authentication successful
          console.log('Authentication successful:', data.session.user);
          
          // Wait a moment for the AuthContext to update
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          // No session found, redirect to landing
          console.log('No session found, redirecting to landing');
          setError('Authentication failed. No session found.');
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        setError('An unexpected error occurred during authentication.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } finally {
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // If auth context is still loading, show loading
  if (loading || processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-neutral-100 mb-2">
            Completing authentication...
          </h2>
          <p className="text-neutral-400">
            Please wait while we sign you in.
          </p>
        </div>
      </div>
    );
  }

  // If there's an error, show it
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-900">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-500/20">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-100 mb-2">
            Authentication Failed
          </h2>
          <p className="text-neutral-400 mb-4">
            {error}
          </p>
          <p className="text-sm text-neutral-500">
            Redirecting you back to the home page...
          </p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show success
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-500/20">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-100 mb-2">
            Welcome back!
          </h2>
          <p className="text-neutral-400">
            Taking you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
};

export default AuthCallback;