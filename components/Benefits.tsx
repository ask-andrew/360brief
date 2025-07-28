
import React from 'react';
import { ClockIcon, EyeIcon, ZapIcon } from './Icons';

interface BenefitCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon, title, description }) => (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 transition-all duration-300 hover:border-brand-blue hover:bg-slate-700/50">
        <div className="flex items-center gap-4 mb-3">
            {icon}
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-slate-400">{description}</p>
    </div>
);


const Benefits: React.FC = () => {
    const benefits = [
        {
            icon: <ClockIcon className="h-8 w-8 text-brand-blue" />,
            title: "Save Time",
            description: "Reclaim 15-30 minutes every single day by getting the summary, not the noise."
        },
        {
            icon: <EyeIcon className="h-8 w-8 text-brand-blue" />,
            title: "Gain Clarity",
            description: "Catch subtle blockers and celebrate team wins you might have otherwise missed."
        },
        {
            icon: <ZapIcon className="h-8 w-8 text-brand-blue" />,
            title: "Reduce Fatigue",
            description: "Stay in the loop without constant tool-hopping and notification overload."
        },
    ];

    return (
        <section id="benefits" className="py-20">
            <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Your Unfair Advantage</h2>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
                    Lighter-weight management for a heavier workload.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {benefits.map(benefit => (
                    <BenefitCard key={benefit.title} {...benefit} />
                ))}
            </div>
        </section>
    );
};

export default Benefits;
