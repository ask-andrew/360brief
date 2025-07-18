import React from 'react';

const CallToAction: React.FC = () => {
  // This form is now configured to work with Netlify Forms.
  // When you deploy your site to Netlify, it will automatically detect
  // this form and handle submissions. You can view entries in your
  // Netlify site dashboard under the "Forms" section.

  // The `data-netlify="true"` attribute and the hidden input with
  // `name="form-name"` are required for Netlify to process the form correctly,
  // especially in a React application.
  
  return (
    <section id="join-waitlist" className="py-20">
      <div className="bg-gradient-to-r from-brand-blue to-sky-400 p-8 md:p-12 rounded-2xl text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
          Be the First to Try 360Brief
        </h2>
        <p className="text-lg text-sky-100 max-w-2xl mx-auto mb-8">
          Join our waitlist for early access and help shape the future of management.
        </p>

        <form
          name="waitlist"
          method="POST"
          data-netlify="true"
          className="max-w-md mx-auto flex flex-col sm:flex-row gap-3"
        >
          {/* This hidden input is required for Netlify Forms to work with React */}
          <input type="hidden" name="form-name" value="waitlist" />
          <label htmlFor="email-input" className="sr-only">Your Email</label>
          <input
            id="email-input"
            type="email"
            name="email" // 'name' attribute is crucial for form submission
            placeholder="your.email@company.com"
            required
            className="w-full px-5 py-3 rounded-lg bg-white/90 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-white/50 transition duration-300"
          />
          <button
            type="submit"
            className="bg-brand-dark text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-800 transition-colors duration-300 flex-shrink-0"
          >
            Join Waitlist
          </button>
        </form>
        <p className="text-sm text-sky-200 mt-4 max-w-md mx-auto">
          You'll be among the first to get access. No spam, ever.
        </p>
      </div>
    </section>
  );
};

export default CallToAction;