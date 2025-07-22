
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
import { useAuth0 } from '@auth0/auth0-react';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark overflow-x-hidden">
      <Header />
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default App;
