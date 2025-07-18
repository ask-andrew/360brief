
import React from 'react';
import { LayersIcon, BarChart2Icon, UsersIcon, BrainCircuitIcon } from './Icons';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-full">
    <div className="text-brand-blue mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-sm">{description}</p>
  </div>
);

const FutureFeatures: React.FC = () => {
  const features = [
    {
      icon: <LayersIcon className="h-8 w-8" />,
      title: "Deeper Integrations",
      description: "Connect Asana, Jira, Linear, and your CRM to get a truly complete picture of your team's work."
    },
    {
      icon: <BarChart2Icon className="h-8 w-8" />,
      title: "Manager Dashboards",
      description: "Visualize trends, team-wide sentiment, and project velocity over time."
    },
    {
      icon: <UsersIcon className="h-8 w-8" />,
      title: "Team-wide Insights",
      description: "Enable shared digests and alerts to keep entire teams aligned and informed."
    },
    {
      icon: <BrainCircuitIcon className="h-8 w-8" />,
      title: "Long-term Memory",
      description: "Build context with a secure, opt-in vector DB for historical project knowledge."
    },
  ];

  return (
    <section id="roadmap" className="py-20">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">The Future is Brief</h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-16">
          We're just getting started. Here's a glimpse of what's next for 360Brief.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
};

export default FutureFeatures;