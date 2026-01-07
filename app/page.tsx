'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TranscriptInput from '@/components/TranscriptInput';
import AppLayout from '@/components/AppLayout';
import { FileText, Sparkles, BookOpen } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (text: string) => {
    setIsLoading(true);

    // Store transcript in sessionStorage for the extract page
    sessionStorage.setItem('termstool_transcript', text);

    // Navigate to extract page
    router.push('/extract');
  };

  return (
    <AppLayout>
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
            Extract Terms from Transcripts
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto">
            Paste a training call or meeting transcript and let AI automatically extract
            key terms, acronyms, and industry jargon with clear definitions.
          </p>
        </section>

        {/* Input Section */}
        <section className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <TranscriptInput onSubmit={handleSubmit} isLoading={isLoading} />
        </section>

        {/* Features Section */}
        <section className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="AI-Powered Extraction"
            description="Automatically identifies industry terms, acronyms, and jargon from your transcripts"
          />
          <FeatureCard
            icon={<FileText className="h-6 w-6" />}
            title="Smart Definitions"
            description="Generates clear, contextual definitions with confidence scores for accuracy"
          />
          <FeatureCard
            icon={<BookOpen className="h-6 w-6" />}
            title="Shared Glossary"
            description="All team members contribute to and access the same growing term library"
          />
        </section>

        {/* How It Works */}
        <section className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Step number={1} title="Upload" description="Paste or upload your transcript" />
            <Step number={2} title="Extract" description="AI identifies key terms" />
            <Step number={3} title="Review" description="Edit and approve definitions" />
            <Step number={4} title="Save" description="Add to shared glossary" />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-blue-primary)]/50 transition-colors">
      <div className="w-12 h-12 bg-[var(--color-blue-primary)]/10 text-[var(--color-blue-primary)] rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 bg-[var(--color-blue-primary)] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
        {number}
      </div>
      <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}
