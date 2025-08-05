import { Zap, Mail, Clock, BarChart2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataFlowAnimation } from './DataFlowAnimation';

export function HowItWorksSection() {
  const steps = [
    {
      icon: <Mail className="h-6 w-6 text-primary" />,
      title: "1. Connect Your Tools",
      description: "Securely link your email, calendar, and other communication tools to 360Brief."
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "2. AI Analyzes Your Data",
      description: "Our AI processes your communications to identify key insights, action items, and priorities."
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "3. Get Your Daily Briefing",
      description: "Receive a concise, 5-minute executive briefing each morning with everything you need to know."
    },
    {
      icon: <BarChart2 className="h-6 w-6 text-primary" />,
      title: "4. Make Better Decisions",
      description: "Spend less time processing information and more time making strategic decisions."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 text-sm font-medium rounded-full border border-primary/20 bg-primary/10 text-primary">
            How It Works
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            From Information Overload to Executive Clarity
          </h2>
          <p className="text-lg text-muted-foreground">
            See how 360Brief transforms your communication overload into clear, actionable insights, giving you back hours every day.
          </p>
        </div>

        {/* Data Flow Animation */}
        <div className="mb-20">
          <DataFlowAnimation />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => (
            <Card key={index} className="group hover:shadow-lg transition-shadow hover:border-primary/20">
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  {step.icon}
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/30 rounded-2xl p-8 md:p-10 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">Ready to experience the difference?</h3>
              <p className="text-muted-foreground">Join executives who save an average of 5+ hours per week.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started Free
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-6 py-4 text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
