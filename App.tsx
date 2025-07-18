import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProblemSolution from './components/ProblemSolution';
import HowItWorks from './components/HowItWorks';
import FutureFeatures from './components/FutureFeatures';
import Benefits from './components/Benefits';
import AudioBrief from './components/AudioBrief';
import ProductivityCalculator from './components/ProductivityCalculator';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-dark overflow-x-hidden">
      <Header />
      <main className="container mx-auto px-6 md:px-12">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <Benefits />
        <ProductivityCalculator />
        <AudioBrief />
        <FutureFeatures />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default App;