import { Clock, Calendar, Users, Zap } from 'lucide-react';

const stats = [
  { 
    icon: <Clock className="h-8 w-8 text-blue-600" />, 
    value: "62", 
    label: "Meetings per month (average per employee)",
    source: "Ambitions ABA (2023)",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100"
  },
  { 
    icon: <Calendar className="h-8 w-8 text-emerald-600" />, 
    value: "71%", 
    label: "Of senior managers say meetings are unproductive",
    source: "Ambitions ABA (2023)",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-100"
  },
  { 
    icon: <Users className="h-8 w-8 text-amber-600" />, 
    value: "23 hrs", 
    label: "Per week executives spend in meetings",
    source: "Harvard Business Review (via Ambitions ABA)",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-100"
  },
  { 
    icon: <Zap className="h-8 w-8 text-purple-600" />, 
    value: "92%", 
    label: "Of attendees multitask during meetings",
    source: "UC Irvine (via Asana)",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100"
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
            Real data on workplace productivity challenges that 360Brief helps solve through better meeting management.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className={`${stat.bgColor} p-6 rounded-xl shadow-sm border ${stat.borderColor} hover:shadow-md transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className="p-3 rounded-full mb-4 bg-white shadow-sm">
                  {stat.icon}
                </div>
                <h3 className="text-3xl font-bold mb-2 text-gray-900">{stat.value}</h3>
                <p className="text-gray-700 mb-2">{stat.label}</p>
                <p className="text-xs text-gray-500 mt-auto">Source: {stat.source}</p>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
