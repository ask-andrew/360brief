import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons';

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      question: "How does 360Brief ensure my data is secure?",
      answer: "We take security seriously. 360Brief uses bank-grade 256-bit encryption for all data in transit and at rest. We follow a privacy-first approach, processing your data to extract insights while minimizing storage of raw sensitive information. Our infrastructure is hosted on SOC 2 compliant cloud providers, and we never sell or share your data with third parties."
    },
    {
      question: "What communication channels can I connect?",
      answer: "Currently, 360Brief supports Gmail, Google Calendar, and Slack, with more integrations coming soon. Our platform is designed to be extensible, and we're actively working on adding support for Microsoft 365, Outlook, Microsoft Teams, and popular project management tools."
    },
    {
      question: "How long does it take to set up?",
      answer: "You can be up and running in under 2 minutes. Simply sign up, connect your accounts, and our AI will start processing your communications. You'll receive your first brief during the next scheduled time (or immediately if you choose to generate one manually)."
    },
    {
      question: "Can I customize what information appears in my brief?",
      answer: "Absolutely! Our platform allows you to customize your briefing preferences, including which senders are prioritized, what types of information to highlight, and how frequently you receive updates. You can adjust these settings at any time to match your preferences."
    },
    {
      question: "What's included in the free plan?",
      answer: "The free plan includes basic email summarization for one connected account, daily briefings with a 7-day message history, and standard support. It's a great way to experience the core value of 360Brief before upgrading to access advanced features and additional integrations."
    },
    {
      question: "How does the AI determine what's important?",
      answer: "Our AI uses a combination of natural language processing and machine learning to analyze your communications. It learns from your behavior—what you read, reply to, and flag as important—to continuously improve the relevance of your briefs. You can also provide feedback to help train the AI to better understand your priorities."
    },
    {
      question: "Can I try before I buy?",
      answer: "Yes! We offer a 14-day free trial of our Professional plan with no credit card required. This gives you full access to all features, so you can experience the full power of 360Brief before making a commitment."
    },
    {
      question: "What if I need to cancel?",
      answer: "You can cancel your subscription at any time, and you'll continue to have access to the service until the end of your billing period. We don't believe in making cancellation difficult—if 360Brief isn't right for you, we'll help you export your data and close your account without any hassle."
    }
  ];

  const toggleItem = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Everything you need to know about 360Brief. Can't find the answer you're looking for?{' '}
            <a href="#contact" className="text-brand-blue hover:underline">Contact our support team</a>.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div 
                key={index}
                className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border ${
                  activeIndex === index 
                    ? 'border-brand-blue/50' 
                    : 'border-slate-700/50 hover:border-slate-600/50'
                } transition-all duration-300 overflow-hidden`}
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  onClick={() => toggleItem(index)}
                  aria-expanded={activeIndex === index}
                  aria-controls={`faq-${index}`}
                >
                  <h3 className="text-lg font-semibold text-white pr-4">
                    {item.question}
                  </h3>
                  <ChevronDownIcon 
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                      activeIndex === index ? 'transform rotate-180' : ''
                    }`} 
                  />
                </button>
                <div 
                  id={`faq-${index}`}
                  className={`px-6 pb-6 pt-0 transition-all duration-300 ${
                    activeIndex === index 
                      ? 'opacity-100 max-h-96' 
                      : 'opacity-0 max-h-0 overflow-hidden'
                  }`}
                  aria-hidden={activeIndex !== index}
                >
                  <div className="text-slate-400">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center bg-slate-800/50 backdrop-blur-sm px-8 py-6 rounded-2xl border border-slate-700/50">
              <div className="text-left sm:text-center">
                <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
                <p className="text-slate-400 max-w-md">
                  Our support team is here to help you get the most out of 360Brief.
                </p>
              </div>
              <div className="mt-6 sm:mt-0 sm:ml-8">
                <a
                  href="mailto:support@360brief.com"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-blue hover:bg-sky-500 transition-colors duration-300"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
