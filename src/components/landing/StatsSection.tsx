import { Clock, Calendar, Users, Zap } from 'lucide-react';

const stats = [
  { 
    icon: <Clock className="h-8 w-8 text-primary" />, 
    value: "5.6 hours", 
    label: "Average weekly time saved per executive" 
  },
  { 
    icon: <Calendar className="h-8 w-8 text-primary" />, 
    value: "89%", 
    label: "Of users report better meeting outcomes" 
  },
  { 
    icon: <Users className="h-8 w-8 text-primary" />, 
    value: "3.2x", 
    label: "Faster decision making with 360Brief" 
  },
  { 
    icon: <Zap className="h-8 w-8 text-primary" />, 
    value: "94%", 
    label: "User satisfaction rating from executives" 
  },
];

export function StatsSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            🚀 Results That Matter
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Measurable Impact on Executive Productivity
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Don't just take our word for it. See how 360Brief is transforming the way leaders work and make decisions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-background p-6 rounded-xl shadow-sm border border-border/50 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  {stat.icon}
                </div>
                <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground italic">
            Sources: Harvard Business Review, The Muse, Atlassian, Doodle
          </p>
        </div>
      </div>
    </section>
  );
}
