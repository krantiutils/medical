"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface DoctorProfile {
  id: string;
  full_name: string;
  bio: string;
  bio_ne: string;
  email: string;
  phone: string;
  website: string;
  social_links: Record<string, string>;
  custom_links: Array<{ title: string; url: string; icon?: string }>;
  languages: string[];
  consultation_fee: number | null;
  consultation_duration: number | null;
  booking_enabled: boolean;
  show_reviews: boolean;
  photo_url: string;
}

interface ProfileEditorProps {
  doctor: DoctorProfile;
  lang: string;
}

export function ProfileEditor({ doctor, lang }: ProfileEditorProps) {
  const router = useRouter();

  // Contact info
  const [email, setEmail] = useState(doctor.email);
  const [phone, setPhone] = useState(doctor.phone);
  const [website, setWebsite] = useState(doctor.website);

  // Bio
  const [bio, setBio] = useState(doctor.bio);
  const [bioNe, setBioNe] = useState(doctor.bio_ne);

  // Languages
  const [languages, setLanguages] = useState<string[]>(doctor.languages);
  const [newLanguage, setNewLanguage] = useState("");

  // Social links
  const [twitter, setTwitter] = useState(doctor.social_links.twitter || "");
  const [linkedin, setLinkedin] = useState(doctor.social_links.linkedin || "");
  const [facebook, setFacebook] = useState(doctor.social_links.facebook || "");
  const [instagram, setInstagram] = useState(doctor.social_links.instagram || "");
  const [youtube, setYoutube] = useState(doctor.social_links.youtube || "");

  // Consultation
  const [consultationFee, setConsultationFee] = useState(
    doctor.consultation_fee?.toString() || ""
  );
  const [consultationDuration, setConsultationDuration] = useState(
    doctor.consultation_duration?.toString() || ""
  );

  // Settings
  const [bookingEnabled, setBookingEnabled] = useState(doctor.booking_enabled);
  const [showReviews, setShowReviews] = useState(doctor.show_reviews);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddLanguage = () => {
    const trimmed = newLanguage.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed]);
      setNewLanguage("");
    }
  };

  const handleRemoveLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/doctor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio || null,
          bio_ne: bioNe || null,
          email: email || null,
          phone: phone || null,
          website: website || null,
          social_links: {
            twitter: twitter || undefined,
            linkedin: linkedin || undefined,
            facebook: facebook || undefined,
            instagram: instagram || undefined,
            youtube: youtube || undefined,
          },
          languages: languages.length > 0 ? languages : null,
          consultation_fee: consultationFee ? parseFloat(consultationFee) : null,
          consultation_duration: consultationDuration
            ? parseInt(consultationDuration, 10)
            : null,
          booking_enabled: bookingEnabled,
          show_reviews: showReviews,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccessMessage("Profile updated successfully!");
      router.refresh();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 bg-verified text-white px-6 py-4 border-4 border-black shadow-[4px_4px_0_0_#121212] flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-bold">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-2 hover:opacity-70">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-4">
          {error}
        </div>
      )}

      {/* Contact Info */}
      <Card decorator="blue" decoratorPosition="top-left">
        <CardHeader>
          <h2 className="text-2xl font-bold">Contact Info</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98XXXXXXXX"
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card decorator="yellow" decoratorPosition="top-right">
        <CardHeader>
          <h2 className="text-2xl font-bold">Bio</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Bio (English)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a short bio about yourself and your practice..."
              maxLength={2000}
              rows={5}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
            />
            <p className="text-xs text-foreground/50 mt-1">
              {2000 - bio.length} characters remaining
            </p>
          </div>

          <div className="border-t-2 border-black/20 my-6" />

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Bio (Nepali)
            </label>
            <textarea
              value={bioNe}
              onChange={(e) => setBioNe(e.target.value)}
              placeholder="आफ्नो बारेमा र आफ्नो अभ्यासको बारेमा संक्षिप्त परिचय लेख्नुहोस्..."
              maxLength={2000}
              rows={5}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
            />
            <p className="text-xs text-foreground/50 mt-1">
              {2000 - bioNe.length} characters remaining
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card decorator="red" decoratorPosition="top-left">
        <CardHeader>
          <h2 className="text-2xl font-bold">Languages</h2>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddLanguage();
                }
              }}
              placeholder="Type a language and press Enter..."
              className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
            <button
              type="button"
              onClick={handleAddLanguage}
              className="px-4 py-2 bg-foreground/10 border-2 border-black font-bold hover:bg-foreground/20 transition-colors"
            >
              Add
            </button>
          </div>

          {languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {languages.map((language, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleRemoveLanguage(index)}
                  className="inline-flex items-center gap-2 bg-primary-blue/10 text-primary-blue border-2 border-primary-blue px-3 py-1 hover:bg-primary-red/10 hover:text-primary-red hover:border-primary-red transition-colors"
                >
                  {language}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-foreground/50 mt-2">
            Click a language tag to remove it
          </p>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card decorator="blue" decoratorPosition="top-right">
        <CardHeader>
          <h2 className="text-2xl font-bold">Social Links</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Twitter / X
            </label>
            <input
              type="url"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://twitter.com/yourhandle"
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              LinkedIn
            </label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Facebook
            </label>
            <input
              type="url"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/yourpage"
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Instagram
            </label>
            <input
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/yourhandle"
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              YouTube
            </label>
            <input
              type="url"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </CardContent>
      </Card>

      {/* Consultation */}
      <Card decorator="yellow" decoratorPosition="top-left">
        <CardHeader>
          <h2 className="text-2xl font-bold">Consultation</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Consultation Fee
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-4 bg-foreground/10 border-2 border-r-0 border-black text-foreground font-bold">
                NPR
              </span>
              <input
                type="number"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                placeholder="500"
                min="0"
                max="100000"
                className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Consultation Duration
            </label>
            <div className="flex">
              <input
                type="number"
                value={consultationDuration}
                onChange={(e) => setConsultationDuration(e.target.value)}
                placeholder="30"
                min="5"
                max="180"
                className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
              <span className="inline-flex items-center px-4 bg-foreground/10 border-2 border-l-0 border-black text-foreground font-bold">
                minutes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card decorator="red" decoratorPosition="top-right">
        <CardHeader>
          <h2 className="text-2xl font-bold">Settings</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 border-2 border-black/10">
            <input
              type="checkbox"
              id="booking-enabled"
              checked={bookingEnabled}
              onChange={(e) => setBookingEnabled(e.target.checked)}
              className="w-5 h-5 border-2 border-black"
            />
            <label htmlFor="booking-enabled" className="font-bold cursor-pointer">
              Enable online booking
            </label>
          </div>

          <div className="flex items-center gap-3 p-4 border-2 border-black/10">
            <input
              type="checkbox"
              id="show-reviews"
              checked={showReviews}
              onChange={(e) => setShowReviews(e.target.checked)}
              className="w-5 h-5 border-2 border-black"
            />
            <label htmlFor="show-reviews" className="font-bold cursor-pointer">
              Show patient reviews on profile
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 font-bold border-2 border-black transition-all ${
            saving
              ? "bg-foreground/10 text-foreground/50 cursor-not-allowed"
              : "bg-primary-blue text-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#121212]"
          }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          onClick={() => router.back()}
          className="px-6 py-3 font-bold border-2 border-black hover:bg-foreground/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
