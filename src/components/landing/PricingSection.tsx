import { Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pricingPlans = [
  {
    name: 'Starter',
    price: 9,
    description: 'For individual professionals',
    features: [
      '2 connected channels',
      'Daily digest',
      '14-day history',
      'Web access',
      'Email support'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Pro',
    price: 15,
    description: 'For busy executives',
    features: [
      '4 connected channels',
      'AI insights',
      '30-day history',
      'Web + email',
      'Priority support'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Team',
    price: 20,
    description: 'For growing teams',
    features: [
      'Unlimited channels',
      'Custom AI models',
      '90-day history',
      'Multi-delivery',
      'Team features',
      'Dedicated support'
    ],
    cta: 'Contact Sales',
    popular: false,
    annualPrice: 200
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 text-sm font-medium rounded-full border border-primary/20 bg-primary/10 text-primary">
            Simple Pricing
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Plans That Scale With You
          </h2>
          <p className="text-lg text-muted-foreground">
            Start small, upgrade as you grow. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div 
              key={index}
              className={`relative rounded-2xl border ${
                plan.popular ? 'border-primary/30 shadow-lg' : 'border-border/50'
              } overflow-hidden`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Popular
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/user/month</span>
                </div>

                <Button className={`w-full mb-4 ${plan.popular ? 'bg-primary' : ''}`}>
                  {plan.cta}
                </Button>

                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-4 w-4 text-primary mt-0.5 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted/50 text-sm mb-4">
            <Zap className="h-4 w-4 text-yellow-500 mr-2" />
            <span>14-day free trial. No credit card required.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
