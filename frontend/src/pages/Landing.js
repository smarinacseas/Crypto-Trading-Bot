import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  BoltIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Modal } from '../components/ui';
import AuthModal from '../components/AuthModal';

const features = [
  {
    name: 'Strategy Discovery',
    description: 'Explore and choose from our curated collection of proven trading strategies.',
    icon: SparklesIcon,
    color: 'text-purple-600'
  },
  {
    name: 'Advanced Backtesting',
    description: 'Test strategies on historical data with comprehensive performance metrics.',
    icon: ChartBarIcon,
    color: 'text-blue-600'
  },
  {
    name: 'Paper Trading',
    description: 'Practice risk-free with virtual portfolios before going live.',
    icon: CurrencyDollarIcon,
    color: 'text-green-600'
  },
  {
    name: 'Real-time Signals',
    description: 'Get instant notifications when your strategies detect trading opportunities.',
    icon: BoltIcon,
    color: 'text-yellow-600'
  },
  {
    name: 'Secure & Reliable',
    description: 'Bank-level security with encrypted API storage and JWT authentication.',
    icon: ShieldCheckIcon,
    color: 'text-red-600'
  },
  {
    name: 'Performance Analytics',
    description: 'Track your portfolio with professional-grade analytics and insights.',
    icon: ArrowTrendingUpIcon,
    color: 'text-indigo-600'
  }
];

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for beginners',
    features: [
      '3 trading strategies',
      'Basic backtesting',
      'Paper trading',
      'Email notifications',
      'Community support'
    ]
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For serious traders',
    features: [
      'Unlimited strategies',
      'Advanced backtesting',
      'Real-time execution',
      'SMS & push notifications',
      'Priority support',
      'Custom indicators',
      'API access'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For institutions',
    features: [
      'Everything in Pro',
      'White-label solution',
      'Dedicated infrastructure',
      'Custom strategies',
      'SLA guarantee',
      'Dedicated account manager'
    ]
  }
];

const Landing = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  const handleDemoMode = () => {
    // Set demo mode flag and navigate to dashboard
    localStorage.setItem('demo_mode', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-900 to-secondary-800">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-secondary-800/90 backdrop-blur-md z-50 border-b border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-neutral-100">CryptoBot</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleDemoMode}>
                Try Demo
              </Button>
              <Button onClick={() => setShowAuthModal(true)}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-neutral-100 mb-6">
              Automated Crypto Trading
              <span className="block text-primary-400">Made Simple</span>
            </h1>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto mb-10">
              Discover proven trading strategies, backtest with confidence, and automate your crypto investments. 
              Start with paper trading and graduate to real profits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => setShowAuthModal(true)}
                className="px-8"
              >
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => setShowOnboarding(true)}
                className="px-8"
              >
                See How It Works
              </Button>
            </div>
          </div>

          {/* Hero Image/Animation */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-sage-500 opacity-20 blur-3xl"></div>
            <Card className="relative overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-secondary-700 to-accent-600">
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <ChartBarIcon className="h-24 w-24 text-primary-400 mx-auto mb-4" />
                    <p className="text-neutral-300">Interactive Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-100 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
              Our platform provides all the tools and insights you need to trade crypto like a pro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.name} hover className="relative">
                  <div className={`inline-flex p-3 rounded-lg bg-secondary-700 ${feature.color} mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-100 mb-2">
                    {feature.name}
                  </h3>
                  <p className="text-neutral-300">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-100 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
              Choose the plan that fits your trading goals. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'ring-2 ring-primary-600' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-neutral-100 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-neutral-100">{plan.price}</span>
                    {plan.period && <span className="text-neutral-400 ml-1">{plan.period}</span>}
                  </div>
                  <p className="text-neutral-400 mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-neutral-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  fullWidth 
                  variant={plan.popular ? 'primary' : 'outline'}
                  onClick={() => setShowAuthModal(true)}
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Trading Smarter?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of traders who are already using our platform to automate their crypto investments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setShowAuthModal(true)}
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              Start Your Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-white border-white hover:bg-white/10"
              onClick={handleDemoMode}
            >
              Explore Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-neutral-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Strategies</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API Reference</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>&copy; 2024 CryptoBot. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
};

// Onboarding Modal Component
const OnboardingModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      title: 'Choose Your Strategy',
      description: 'Browse our curated collection of trading strategies, each with detailed performance metrics.',
      icon: SparklesIcon
    },
    {
      title: 'Backtest & Optimize',
      description: 'Test strategies on historical data and fine-tune parameters for optimal performance.',
      icon: ChartBarIcon
    },
    {
      title: 'Start Paper Trading',
      description: 'Practice with virtual money to build confidence before trading with real funds.',
      icon: CurrencyDollarIcon
    },
    {
      title: 'Go Live & Profit',
      description: 'Connect your exchange account and let the bot execute trades automatically.',
      icon: ArrowTrendingUpIcon
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep?.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How CryptoBot Works"
      size="lg"
    >
      <div className="text-center py-8">
        {Icon && (
          <div className="inline-flex p-4 rounded-full bg-primary-100 text-primary-600 mb-6">
            <Icon className="h-12 w-12" />
          </div>
        )}
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
          {currentStep?.title}
        </h3>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          {currentStep?.description}
        </p>
        
        {/* Progress indicators */}
        <div className="flex justify-center space-x-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-8 rounded-full transition-colors ${
                index === step ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Previous
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button onClick={onClose}>
              Get Started
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Landing;