"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface HomePageProps {
  params: Promise<{
    lang: string;
  }>;
}

export default function HomePage({ params }: HomePageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/en/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[90vh]">
          {/* Left Content Panel */}
          <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-24">
            <div className="max-w-2xl">
              {/* Small label */}
              <span className="inline-block px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
                Nepal&apos;s Healthcare Directory
              </span>

              {/* Main headline */}
              <h1 className="text-6xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tight mb-6">
                Find Your
                <span className="block text-primary-red">Doctor</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg lg:text-xl text-foreground/80 mb-10 max-w-lg">
                Search 40,000+ verified doctors, dentists, and pharmacists across Nepal.
                Find the right healthcare professional for your needs.
              </p>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by name, specialty, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 text-lg bg-white border-4 border-foreground focus:outline-none focus:ring-0 focus:border-primary-blue placeholder:text-foreground/40"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="px-8 py-4 text-lg"
                >
                  Search
                </Button>
              </form>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-blue" />
                  <span className="font-bold">38,000+</span>
                  <span className="text-foreground/60">Doctors</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-red" />
                  <span className="font-bold">2,500+</span>
                  <span className="text-foreground/60">Dentists</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-yellow" />
                  <span className="font-bold">5,000+</span>
                  <span className="text-foreground/60">Pharmacists</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Color Block Panel */}
          <div className="hidden lg:flex lg:w-[45%] bg-primary-blue relative">
            {/* Geometric shapes */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Large circle */}
              <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full border-8 border-white/20" />

              {/* Small filled circle */}
              <div className="absolute bottom-1/3 left-1/4 w-16 h-16 rounded-full bg-primary-yellow" />

              {/* Square */}
              <div className="absolute top-1/2 left-12 w-24 h-24 bg-primary-red rotate-12" />

              {/* Triangle shape using clip-path */}
              <div
                className="absolute bottom-20 right-20 w-32 h-32 bg-white/20"
                style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
              />

              {/* Additional geometric elements */}
              <div className="absolute top-16 left-16 w-8 h-8 bg-white" />
              <div className="absolute top-20 left-28 w-4 h-4 bg-primary-yellow" />

              {/* Large outlined square */}
              <div className="absolute bottom-1/4 right-1/3 w-40 h-40 border-8 border-white/30 rotate-45" />

              {/* Horizontal line */}
              <div className="absolute top-2/3 left-0 w-1/2 h-2 bg-white/20" />
            </div>

            {/* Center content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
              <div className="text-white text-center">
                <div className="text-6xl font-black mb-4">स्वास्थ्य</div>
                <div className="text-xl font-medium uppercase tracking-widest opacity-80">Swasthya</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile geometric accent bar */}
        <div className="lg:hidden h-4 flex">
          <div className="flex-1 bg-primary-blue" />
          <div className="flex-1 bg-primary-red" />
          <div className="flex-1 bg-primary-yellow" />
        </div>
      </section>

      {/* Categories section */}
      <section className="py-16 px-6 lg:px-16 border-t-4 border-foreground">
        <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight mb-12">
          Browse by Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Doctors Card */}
          <a
            href="/en/doctors"
            className="group relative bg-white border-4 border-foreground p-8 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-blue"
          >
            <div className="absolute top-0 right-0 w-8 h-8 bg-primary-blue" />
            <div className="w-16 h-16 rounded-full bg-primary-blue/10 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold uppercase mb-2">Doctors</h3>
            <p className="text-foreground/60 mb-4">Find registered medical practitioners across Nepal</p>
            <span className="text-sm font-bold uppercase tracking-wider text-primary-blue group-hover:underline">
              Browse Doctors →
            </span>
          </a>

          {/* Dentists Card */}
          <a
            href="/en/dentists"
            className="group relative bg-white border-4 border-foreground p-8 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-red"
          >
            <div className="absolute top-0 right-0 w-8 h-8 bg-primary-red" />
            <div className="w-16 h-16 rounded-full bg-primary-red/10 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold uppercase mb-2">Dentists</h3>
            <p className="text-foreground/60 mb-4">Connect with dental professionals near you</p>
            <span className="text-sm font-bold uppercase tracking-wider text-primary-red group-hover:underline">
              Browse Dentists →
            </span>
          </a>

          {/* Pharmacists Card */}
          <a
            href="/en/pharmacists"
            className="group relative bg-white border-4 border-foreground p-8 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-yellow"
          >
            <div className="absolute top-0 right-0 w-8 h-8 bg-primary-yellow" />
            <div className="w-16 h-16 rounded-full bg-primary-yellow/10 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-primary-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold uppercase mb-2">Pharmacists</h3>
            <p className="text-foreground/60 mb-4">Locate licensed pharmacists for medication advice</p>
            <span className="text-sm font-bold uppercase tracking-wider text-primary-yellow group-hover:underline">
              Browse Pharmacists →
            </span>
          </a>
        </div>
      </section>
    </main>
  );
}
