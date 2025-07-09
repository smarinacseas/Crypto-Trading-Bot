import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, isSupabaseConfigured } from '../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.jsx';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form.jsx';
import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';
import { Alert, AlertDescription } from './ui/alert.jsx';
import { Separator } from './ui/separator.jsx';

function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  const handleSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login with Supabase
        const { data: authData, error } = await signInWithEmail(data.email, data.password);
        
        if (error) {
          setError(error.message || 'Invalid email or password');
        } else if (authData?.user) {
          onClose();
          // The AuthContext will handle the state updates
        }
      } else {
        // Register with Supabase
        const { data: authData, error } = await signUpWithEmail(
          data.email, 
          data.password,
          {
            first_name: data.firstName,
            last_name: data.lastName,
            full_name: `${data.firstName} ${data.lastName}`.trim(),
          }
        );

        if (error) {
          setError(error.message || 'Registration failed');
        } else if (authData?.user) {
          // Registration successful - user is automatically signed in
          onClose();
          // The AuthContext will handle the state updates
        }
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message || 'Failed to sign in with Google');
        setIsLoading(false);
      }
      // Don't set loading to false here as the user will be redirected
    } catch (error) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-secondary-800 border-secondary-700">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-neutral-100 text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription className="text-neutral-400 text-center">
            {isLogin 
              ? 'Sign in to your account to continue' 
              : 'Join us and start your trading journey'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-danger-500/20 border-danger-500/30">
              <AlertDescription className="text-danger-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-200">First Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                              {...field}
                              placeholder="John"
                              className="pl-10 bg-secondary-700 border-secondary-600 text-neutral-100 placeholder:text-neutral-400"
                              required={!isLogin}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-danger-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-200">Last Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                              {...field}
                              placeholder="Doe"
                              className="pl-10 bg-secondary-700 border-secondary-600 text-neutral-100 placeholder:text-neutral-400"
                              required={!isLogin}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-danger-400" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-200">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="john@example.com"
                          className="pl-10 bg-secondary-700 border-secondary-600 text-neutral-100 placeholder:text-neutral-400"
                          required
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-danger-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-200">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 bg-secondary-700 border-secondary-600 text-neutral-100 placeholder:text-neutral-400"
                          required
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-danger-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium"
                size="lg"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <Separator className="bg-secondary-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-secondary-800 px-2 text-xs text-neutral-400">OR</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading || !isSupabaseConfigured}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300 font-medium"
            size="lg"
            title={!isSupabaseConfigured ? "Please configure Supabase credentials to use Google OAuth" : ""}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isSupabaseConfigured ? 'Continue with Google' : 'Google OAuth (Configure Supabase)'}
          </Button>

          {!isSupabaseConfigured && (
            <p className="text-xs text-neutral-500 text-center mt-2">
              Google OAuth requires Supabase configuration. See setup guide for details.
            </p>
          )}

          <Button
            variant="ghost"
            onClick={toggleMode}
            className="w-full text-primary-400 hover:text-primary-300 hover:bg-primary-600/20"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;