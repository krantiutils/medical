"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
  created_at: string;
}

const RELATIONS = ["SELF", "SPOUSE", "CHILD", "PARENT", "SIBLING", "OTHER"] as const;
const GENDERS = ["male", "female", "other"] as const;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const translations = {
  en: {
    title: "Family Members",
    subtitle: "Manage family members to book appointments on their behalf",
    addMember: "Add Family Member",
    editMember: "Edit Family Member",
    noMembers: "No family members added yet",
    noMembersDesc: "Add family members to book appointments for them",
    name: "Full Name",
    namePlaceholder: "Enter full name",
    relation: "Relation",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    bloodGroup: "Blood Group",
    phone: "Phone Number",
    phonePlaceholder: "98XXXXXXXX",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Are you sure you want to delete this family member?",
    loginRequired: "Please log in to manage family members",
    login: "Login",
    errorLoading: "Failed to load family members",
    errorSaving: "Failed to save family member",
    successAdded: "Family member added!",
    successUpdated: "Family member updated!",
    successDeleted: "Family member deleted!",
    required: "Required",
    selectRelation: "Select relation",
    selectGender: "Select gender",
    selectBloodGroup: "Select blood group",
    relations: {
      SELF: "Self",
      SPOUSE: "Spouse",
      CHILD: "Child",
      PARENT: "Parent",
      SIBLING: "Sibling",
      OTHER: "Other",
    },
    genders: {
      male: "Male",
      female: "Female",
      other: "Other",
    },
  },
  ne: {
    title: "परिवारका सदस्यहरू",
    subtitle: "उनीहरूको तर्फबाट अपोइन्टमेन्ट बुक गर्न परिवारका सदस्यहरू व्यवस्थापन गर्नुहोस्",
    addMember: "सदस्य थप्नुहोस्",
    editMember: "सदस्य सम्पादन गर्नुहोस्",
    noMembers: "अझै कुनै परिवारको सदस्य थपिएको छैन",
    noMembersDesc: "तिनीहरूको लागि अपोइन्टमेन्ट बुक गर्न परिवारका सदस्यहरू थप्नुहोस्",
    name: "पूरा नाम",
    namePlaceholder: "पूरा नाम लेख्नुहोस्",
    relation: "सम्बन्ध",
    dateOfBirth: "जन्म मिति",
    gender: "लिङ्ग",
    bloodGroup: "रक्त समूह",
    phone: "फोन नम्बर",
    phonePlaceholder: "98XXXXXXXX",
    save: "सुरक्षित गर्नुहोस्",
    saving: "सुरक्षित गर्दै...",
    cancel: "रद्द गर्नुहोस्",
    edit: "सम्पादन",
    delete: "हटाउनुहोस्",
    deleteConfirm: "के तपाईं यो परिवारको सदस्य हटाउन निश्चित हुनुहुन्छ?",
    loginRequired: "कृपया परिवारका सदस्यहरू व्यवस्थापन गर्न लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    errorLoading: "परिवारका सदस्यहरू लोड गर्न असफल",
    errorSaving: "परिवारको सदस्य सुरक्षित गर्न असफल",
    successAdded: "परिवारको सदस्य थपियो!",
    successUpdated: "परिवारको सदस्य अपडेट भयो!",
    successDeleted: "परिवारको सदस्य हटाइयो!",
    required: "आवश्यक",
    selectRelation: "सम्बन्ध छान्नुहोस्",
    selectGender: "लिङ्ग छान्नुहोस्",
    selectBloodGroup: "रक्त समूह छान्नुहोस्",
    relations: {
      SELF: "आफू",
      SPOUSE: "पति/पत्नी",
      CHILD: "बच्चा",
      PARENT: "अभिभावक",
      SIBLING: "दाजुभाइ/दिदीबहिनी",
      OTHER: "अन्य",
    },
    genders: {
      male: "पुरुष",
      female: "महिला",
      other: "अन्य",
    },
  },
};

export default function FamilyMembersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRelation, setFormRelation] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formGender, setFormGender] = useState("");
  const [formBloodGroup, setFormBloodGroup] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/patient/family-members");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setMembers(data.family_members || []);
    } catch (err) {
      console.error("Error fetching family members:", err);
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t.errorLoading]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchMembers();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus, fetchMembers]);

  const resetForm = () => {
    setFormName("");
    setFormRelation("");
    setFormDob("");
    setFormGender("");
    setFormBloodGroup("");
    setFormPhone("");
    setFormErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (member: FamilyMember) => {
    setFormName(member.name);
    setFormRelation(member.relation);
    setFormDob(member.date_of_birth ? member.date_of_birth.split("T")[0] : "");
    setFormGender(member.gender || "");
    setFormBloodGroup(member.blood_group || "");
    setFormPhone(member.phone || "");
    setFormErrors({});
    setEditingId(member.id);
    setShowForm(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = t.required;
    if (!formRelation) errors.relation = t.required;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSaving(true);
    setError(null);

    const payload = {
      name: formName.trim(),
      relation: formRelation,
      date_of_birth: formDob || null,
      gender: formGender || null,
      blood_group: formBloodGroup || null,
      phone: formPhone || null,
    };

    try {
      const url = editingId
        ? `/api/patient/family-members/${editingId}`
        : "/api/patient/family-members";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t.errorSaving);
      }

      setSuccess(editingId ? t.successUpdated : t.successAdded);
      setTimeout(() => setSuccess(null), 4000);
      resetForm();
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorSaving);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const res = await fetch(`/api/patient/family-members/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setSuccess(t.successDeleted);
      setTimeout(() => setSuccess(null), 4000);
      fetchMembers();
    } catch (err) {
      console.error("Error deleting family member:", err);
      setError("Failed to delete family member");
    }
  };

  const getRelationLabel = (relation: string) => {
    return t.relations[relation as keyof typeof t.relations] || relation;
  };

  const getGenderLabel = (gender: string) => {
    return t.genders[gender as keyof typeof t.genders] || gender;
  };

  const formatDob = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading
  if (sessionStatus === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card decorator="blue" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-primary-blue/20 rounded-full mx-auto mb-4" />
                <div className="h-4 bg-foreground/10 rounded w-48 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{t.loginRequired}</p>
              <Link href={`/${lang}/login?callbackUrl=/${lang}/dashboard/family`}>
                <Button variant="primary">{t.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{t.title}</h1>
            <p className="text-foreground/70">{t.subtitle}</p>
          </div>
          {!showForm && (
            <Button
              variant="primary"
              onClick={openAddForm}
              className="mt-4 sm:mt-0"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.addMember}
            </Button>
          )}
        </div>

        {/* Success toast */}
        {success && (
          <div className="fixed top-20 right-4 z-50 bg-verified text-white px-6 py-4 border-4 border-black shadow-[4px_4px_0_0_#121212] flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-bold">{success}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-primary-red/10 border-2 border-primary-red text-primary-red">
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <Card decorator="blue" decoratorPosition="top-left" className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-bold text-foreground">
                {editingId ? t.editMember : t.addMember}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                      {t.name} <span className="text-primary-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      className={`w-full px-4 py-3 bg-white border-4 ${
                        formErrors.name ? "border-primary-red" : "border-foreground"
                      } focus:outline-none focus:border-primary-blue placeholder:text-foreground/40`}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-primary-red mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Relation */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                      {t.relation} <span className="text-primary-red">*</span>
                    </label>
                    <select
                      value={formRelation}
                      onChange={(e) => setFormRelation(e.target.value)}
                      className={`w-full px-4 py-3 bg-white border-4 ${
                        formErrors.relation ? "border-primary-red" : "border-foreground"
                      } focus:outline-none focus:border-primary-blue`}
                    >
                      <option value="">{t.selectRelation}</option>
                      {RELATIONS.map((rel) => (
                        <option key={rel} value={rel}>
                          {getRelationLabel(rel)}
                        </option>
                      ))}
                    </select>
                    {formErrors.relation && (
                      <p className="text-xs text-primary-red mt-1">{formErrors.relation}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                      {t.dateOfBirth}
                    </label>
                    <input
                      type="date"
                      value={formDob}
                      onChange={(e) => setFormDob(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                      {t.gender}
                    </label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue"
                    >
                      <option value="">{t.selectGender}</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {getGenderLabel(g)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                      {t.bloodGroup}
                    </label>
                    <select
                      value={formBloodGroup}
                      onChange={(e) => setFormBloodGroup(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue"
                    >
                      <option value="">{t.selectBloodGroup}</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                      {t.phone}
                    </label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder={t.phonePlaceholder}
                      className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button type="submit" variant="primary" disabled={formSaving}>
                    {formSaving ? t.saving : t.save}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {t.cancel}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Members List */}
        {members.length === 0 && !showForm ? (
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-blue/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">{t.noMembers}</h3>
              <p className="text-foreground/60 mb-6">{t.noMembersDesc}</p>
              <Button variant="primary" onClick={openAddForm}>
                {t.addMember}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <Card
                key={member.id}
                decorator="blue"
                decoratorPosition="top-left"
              >
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Member Info */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0 border-2 border-foreground">
                        <span className="text-white font-bold text-lg">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground">{member.name}</h3>
                          <span className="px-2 py-0.5 text-xs font-bold bg-primary-blue/10 text-primary-blue border border-primary-blue/30">
                            {getRelationLabel(member.relation)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-foreground/60">
                          {member.date_of_birth && (
                            <span>{formatDob(member.date_of_birth)}</span>
                          )}
                          {member.gender && (
                            <span>{getGenderLabel(member.gender)}</span>
                          )}
                          {member.blood_group && (
                            <span>{member.blood_group}</span>
                          )}
                          {member.phone && (
                            <span>{member.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 sm:flex-col">
                      <button
                        onClick={() => openEditForm(member)}
                        className="px-3 py-1.5 text-sm font-bold border-2 border-foreground/30 hover:border-foreground transition-colors"
                      >
                        {t.edit}
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="px-3 py-1.5 text-sm font-bold text-primary-red border-2 border-primary-red/30 hover:border-primary-red hover:bg-primary-red/5 transition-colors"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
