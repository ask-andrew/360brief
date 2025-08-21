import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah K.',
    role: 'VP Operations',
    company: 'TechScale',
    avatar: 'SK',
    content: "360Brief has completely transformed how I start my day. Instead of drowning in emails, I get a concise briefing that highlights exactly what needs my attention. I've reclaimed 6 hours a week!",
    rating: 5
  },
  {
    name: 'Michael R.',
    role: 'CEO',
    company: 'GrowthHarbor',
    avatar: 'MR',
    content: "The AI does an incredible job of surfacing the most important information across all my communication channels. It's like having an executive assistant who knows exactly what I care about.",
    rating: 5
  },
  {
    name: 'Priya M.',
    role: 'Head of Product',
    company: 'NovaLabs',
    avatar: 'PM',
    content: "As someone who was skeptical about adding another tool to my stack, I was blown away by how quickly 360Brief proved its value. The time savings are real and substantial.",
    rating: 4
  },
  {
    name: 'David T.',
    role: 'CTO',
    company: 'InnoVentures',
    avatar: 'DT',
    content: "The ability to quickly understand what's happening across all my teams without getting lost in the noise has been a game-changer for my productivity and decision-making.",
    rating: 5
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 text-sm font-medium rounded-full border border-primary/20 bg-primary/10 text-primary">
            Trusted by Industry Leaders
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            What Our Customers Say About 360Brief
          </h2>
          <p className="text-lg text-muted-foreground">
            Don't just take our word for it. See what executives are saying about how 360Brief has transformed their workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-background rounded-2xl p-8 border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {testimonial.avatar}
                </div>
                <div className="text-left">
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < testimonial.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} 
                    />
                  ))}
                </div>
              </div>
              <blockquote className="text-muted-foreground italic">
                "{testimonial.content}"
              </blockquote>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">
            Join thousands of executives who trust 360Brief to stay on top of their work
          </p>
          <a
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Your Free Trial
          </a>
        </div>
      </div>
    </section>
  );
}
