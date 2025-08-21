'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Update the folder name to match the new title
// Note: You'll need to rename the folder from 'why-i-built-this' to 'why-im-building-this' in your file system

// Dynamically import the Navbar with SSR disabled to avoid window/document issues
const Navbar = dynamic(
  () => import('@/components/layout/Navbar').then(mod => mod.Navbar),
  { 
    ssr: false,
    loading: () => (
      <div className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg h-20" />
    )
  }
);

import { motion } from 'framer-motion';
import { Mail as MailIcon, Linkedin as LinkedinIcon } from 'lucide-react';

// DropCap component for the first letter of paragraphs
const DropCap = ({ children }: { children: React.ReactNode }) => (
  <span className="float-left text-6xl font-serif font-bold leading-none mr-2 mt-1 text-blue-600">
    {children}
  </span>
);

// PullQuote component for highlighted text
const PullQuote = ({ children }: { children: React.ReactNode }) => (
  <div className="my-8 pl-6 border-l-4 border-blue-500 italic text-gray-700 text-lg">
    <blockquote className="m-0">
      {children}
    </blockquote>
  </div>
);

export default function WhyIBuiltThis() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Why I'm Building This
          </h1>
          <div className="mt-6 h-1 w-24 bg-blue-600 mx-auto rounded-full" />
        </motion.div>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-card rounded-xl shadow-lg overflow-hidden"
        >
          <div className="md:flex">
            {/* Left Column - Headshot */}
            <div className="md:w-1/3 p-8 bg-muted/20">
              <div className="sticky top-24">
                <div className="relative w-full aspect-square max-w-xs mx-auto">
                  <div className="rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                    <Image
                      src="/images/headshot.jpeg"
                      alt="Andrew Ledet, Founder & CEO"
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="md:w-2/3 p-8 md:p-12">
              <div className="prose prose-lg text-foreground/90 max-w-none">
                <p className="mb-8 leading-relaxed">
                  <DropCap>M</DropCap>
                  <span className="font-medium">y days as a manager were a relentless cycle of juggling.</span> I'd be in a meeting discussing a project, only to glance at my phone and see a dozen new messages pop up. Then, after the meeting, I'd dive back into a flooded inbox. It was a constant battle to stay current, feeling like I was always one step behind the critical information I needed. I remember reading that the average professional spends <span className="font-semibold text-blue-600">over 25% of their day in meetings</span>, and I felt every single minute of it.
                </p>
                
                <PullQuote>
                  "For the first time, I could see the forest for the trees. No more drowning in a sea of emails and messages—just clear, actionable insights when I need them."
                </PullQuote>
                
                <p className="mb-8 leading-relaxed">
                  I saw a stark contrast with C-suite executives, who often have dedicated admins or chiefs of staff to connect the dots for them—threading together fragmented communications and creating a clean, easy-to-understand brief. For the rest of us, that kind of personalized support didn't exist. My critical updates were scattered across every channel, making it nearly impossible to get a holistic view of what was truly happening with my team.
                </p>
                
                <p className="mb-8 leading-relaxed">
                  I knew there had to be a better way for leaders to stay on top of all the moving pieces without being overwhelmed. That's why I created this product. It's a solution born from a personal pain point, designed to automatically consolidate all your communication channels into a personalized, daily brief. <span className="font-semibold text-blue-600">It's the closest thing a busy manager can get to having a chief of staff, ensuring you never miss a beat.</span>
                </p>
                
                <PullQuote>
                  "This isn't just another tool; it's a personal mission to solve a problem I lived every day. If you're a manager who feels like you're constantly playing catch-up, I invite you to try this solution and see if it can give you back a little bit of your day."
                </PullQuote>
                
                <p className="mb-6 leading-relaxed">
                  Beyond my own experience, I kept seeing friends and coworkers struggle to keep their <span className="font-semibold text-blue-600">professional and personal worlds</span> straight — <span className="font-semibold text-blue-600">family athletic events</span>, <span className="font-semibold text-blue-600">work travel</span>, <span className="font-semibold text-blue-600">pickup responsibilities</span>, <span className="font-semibold text-blue-600">client issues</span>. The constant <span className="font-semibold text-blue-600">context‑switching</span> across inboxes, calendars, and chat apps made even simple follow‑ups easy to miss.
                </p>

                <p className="mb-8 leading-relaxed">
                  That's exactly the chaos <span className="font-semibold text-blue-600">360Brief</span> was built to calm: one place to surface <span className="font-semibold text-blue-600">what actually matters today</span>, so you can <span className="font-semibold text-blue-600">act with confidence</span> and <span className="font-semibold text-blue-600">enjoy the moments that matter</span> outside of work, too. If that resonates, I'd love for you to <Link href="/signup" className="text-blue-600 font-semibold underline underline-offset-4 hover:text-blue-700">try 360Brief</Link> and tell me what would make it indispensable for you.
                </p>

                <p className="mb-8 leading-relaxed">
                  We'd also love to hear from you: what do you wish this product did for you? Your feedback will help us build the features you need most.
                </p>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-l-4 border-blue-500">
                  <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-3">Looking Ahead</h3>
                  <p className="text-blue-800 dark:text-blue-200">
                    I'm excited about building on this foundation. I envision an intelligent analytics dashboard that flags crucial, unread messages and analyzes sentiment to spot when a project or client needs your immediate attention. This product isn't just about managing information—it's about giving you back the time and mental space to lead with confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <h2 className="text-3xl font-bold text-foreground mb-6">Ready to take back control of your day?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Join hundreds of managers who have transformed their workflow with our platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-base font-medium text-white shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Try It Free for 14 Days
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-accent px-8 py-4 text-base font-medium text-accent-foreground hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors"
            >
              <MailIcon className="mr-2 h-5 w-5" />
              Share Your Feedback
            </Link>
            <a
              href="https://www.linkedin.com/in/andrewledet/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-[#0077B5] px-6 py-4 text-base font-medium text-white hover:bg-[#006097] focus:outline-none focus:ring-2 focus:ring-[#0077B5] focus:ring-offset-2 transition-colors"
            >
              <LinkedinIcon className="mr-2 h-5 w-5" />
              Connect on LinkedIn
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
