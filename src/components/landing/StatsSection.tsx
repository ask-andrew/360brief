import { Clock, Calendar, Users, Zap } from 'lucide-react';

const stats = [
  { 
    icon: <Clock className="h-8 w-8 text-primary" />, 
    value: "71%", 
    label: "of meetings are considered unproductive" 
  },
  { 
    icon: <Calendar className="h-8 w-8 text-primary" />, 
    value: "31 hours", 
    label: "average time spent in meetings per month" 
  },
  { 
    icon: <Users className="h-8 w-8 text-primary" />, 
    value: "$541 billion", 
    label: "lost annually to unproductive meetings in the US" 
  },
  { 
    icon: <Zap className="h-8 w-8 text-primary" />, 
    value: "3.5x", 
    label: "more likely to be engaged with concise, well-structured briefs" 
  },
];

export function StatsSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            The High Cost of Unfocused Communication
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Modern professionals are drowning in meetings and emails. 360°Brief helps you cut through the noise.
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
