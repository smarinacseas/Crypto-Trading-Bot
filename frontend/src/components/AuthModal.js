import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
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
        // Login
        const formBody = new FormData();
        formBody.append('username', data.email);
        formBody.append('password', data.password);

        const response = await fetch('/auth/jwt/login', {
          method: 'POST',
          body: formBody,
        });

        if (response.ok) {
          const responseData = await response.json();
          localStorage.setItem('auth_token', responseData.access_token);
          localStorage.removeItem('demo_mode');
          onClose();
          window.location.reload();
        } else {
          setError('Invalid email or password');
        }
      } else {
        // Register
        const response = await fetch('/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            first_name: data.firstName,
            last_name: data.lastName,
          }),
        });

        if (response.ok) {
          setIsLogin(true);
          setError('');
          form.reset();
        } else {
          const errorData = await response.json();
          setError(errorData.detail || 'Registration failed');
        }
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    }

    setIsLoading(false);
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