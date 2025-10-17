import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FEATURES } from '@/data/sportsData';
import type { Feature } from '@/types/landing';

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="section-padding bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="px-4 py-2 text-primary-700 border-primary-300">
            Why Choose Us
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            Everything You Need to <span className="gradient-text">Excel</span>
          </h2>
          <p className="text-lg text-gray-600">
            We provide comprehensive support to help you achieve your athletic goals
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-16 glass-effect rounded-3xl p-8 md:p-12 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold">
              Ready to Start Your Journey?
            </h3>
            <p className="text-lg text-gray-600">
              Join Master Grade today and experience world-class sports training
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all hover:scale-105 shadow-lg shadow-primary-500/30">
                Enroll Now
              </button>
              <button className="px-8 py-4 border-2 border-primary-300 text-primary-700 rounded-lg font-medium hover:bg-primary-50 transition-all hover:scale-105">
                Schedule a Tour
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  return (
    <Card
      className="group relative overflow-hidden border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{
        animation: `fade-in 0.6s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 group-hover:from-primary-50/50 group-hover:to-primary-100/50 transition-all duration-500" />

      <CardContent className="p-8 relative z-10">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center text-4xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
            {feature.icon}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
            {feature.title}
          </h3>
          <p className="text-gray-600 leading-relaxed">{feature.description}</p>
        </div>

        {/* Decorative Element */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-primary-100/20 rounded-full blur-2xl group-hover:bg-primary-200/40 transition-all duration-500" />
      </CardContent>
    </Card>
  );
};