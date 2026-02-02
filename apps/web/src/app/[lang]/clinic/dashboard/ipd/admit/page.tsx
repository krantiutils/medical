"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Ward {
  id: string;
  name: string;
  type: string;
}

interface Patient {
  id: string;
  full_name: string;
  patient_number: string;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
}

interface Doctor {
  id: string;
  full_name: string;
  type: string;
  role: string;
}

interface Bed {
  id: string;
  bed_number: string;
  status: string;
  type: string | null;
  daily_rate: string;
  features: string[];
  ward_id: string;
  ward: Ward;
}

export default function AdmitPatientPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Data
  const [beds, setBeds] = useState<Bed[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [selectedWard, setSelectedWard] = useState("");
  const [admittingDoctorId, setAdmittingDoctorId] = useState("");
  const [attendingDoctorId, setAttendingDoctorId] = useState("");
  const [admissionDiagnosis, setAdmissionDiagnosis] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [notes, setNotes] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Translations
  const t = {
    en: {
      title: "New Admission",
      subtitle: "Admit a patient to the hospital",
      loginRequired: "Please log in to admit patients",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet.",
      registerClinic: "Register Clinic",
      loading: "Loading...",
      errorLoading: "Failed to load data",
      retry: "Retry",
      backToIPD: "Back to IPD",
      step1: "Step 1: Select Patient",
      step2: "Step 2: Select Bed",
      step3: "Step 3: Admission Details",
      searchPatient: "Search patient by name, phone, or patient number",
      searchPlaceholder: "Type to search...",
      searching: "Searching...",
      noResults: "No patients found",
      selectPatient: "Select",
      selectedPatient: "Selected Patient",
      changePatient: "Change",
      patientNumber: "Patient #",
      phone: "Phone",
      gender: "Gender",
      age: "Age",
      selectWard: "Filter by Ward",
      allWards: "All Wards",
      noBeds: "No available beds",
      noBedsDesc: "All beds are currently occupied or unavailable",
      selectedBed: "Selected Bed",
      changeBed: "Change",
      ward: "Ward",
      features: "Features",
      dailyRate: "Daily Rate",
      admittingDoctor: "Admitting Doctor *",
      attendingDoctor: "Attending Doctor",
      selectDoctor: "Select doctor",
      admissionDiagnosis: "Provisional Diagnosis",
      chiefComplaint: "Chief Complaint",
      notes: "Additional Notes",
      admitPatient: "Admit Patient",
      admitting: "Admitting...",
      cancel: "Cancel",
      required: "Required",
      success: "Patient admitted successfully",
      wardTypes: {
        GENERAL: "General",
        SEMI_PRIVATE: "Semi-Private",
        PRIVATE: "Private",
        ICU: "ICU",
        NICU: "Neonatal ICU",
        PICU: "Pediatric ICU",
        CCU: "Cardiac Care Unit",
        EMERGENCY: "Emergency",
        MATERNITY: "Maternity",
        PEDIATRIC: "Pediatric",
      },
    },
    ne: {
      title: "नयाँ भर्ना",
      subtitle: "अस्पतालमा बिरामी भर्ना गर्नुहोस्",
      loginRequired: "बिरामीहरू भर्ना गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      loading: "लोड हुँदैछ...",
      errorLoading: "डेटा लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      backToIPD: "IPD मा फर्कनुहोस्",
      step1: "चरण १: बिरामी छान्नुहोस्",
      step2: "चरण २: बेड छान्नुहोस्",
      step3: "चरण ३: भर्ना विवरण",
      searchPatient: "नाम, फोन, वा बिरामी नम्बरले बिरामी खोज्नुहोस्",
      searchPlaceholder: "खोज्न टाइप गर्नुहोस्...",
      searching: "खोजिरहेको...",
      noResults: "कुनै बिरामी फेला परेन",
      selectPatient: "छान्नुहोस्",
      selectedPatient: "छानिएको बिरामी",
      changePatient: "परिवर्तन गर्नुहोस्",
      patientNumber: "बिरामी #",
      phone: "फोन",
      gender: "लिङ्ग",
      age: "उमेर",
      selectWard: "वार्डले फिल्टर गर्नुहोस्",
      allWards: "सबै वार्डहरू",
      noBeds: "कुनै उपलब्ध बेड छैन",
      noBedsDesc: "सबै बेडहरू हाल व्यस्त वा अनुपलब्ध छन्",
      selectedBed: "छानिएको बेड",
      changeBed: "परिवर्तन गर्नुहोस्",
      ward: "वार्ड",
      features: "सुविधाहरू",
      dailyRate: "दैनिक दर",
      admittingDoctor: "भर्ना गर्ने डाक्टर *",
      attendingDoctor: "उपस्थित डाक्टर",
      selectDoctor: "डाक्टर छान्नुहोस्",
      admissionDiagnosis: "अस्थायी निदान",
      chiefComplaint: "मुख्य समस्या",
      notes: "थप नोटहरू",
      admitPatient: "बिरामी भर्ना गर्नुहोस्",
      admitting: "भर्ना गर्दै...",
      cancel: "रद्द गर्नुहोस्",
      required: "आवश्यक",
      success: "बिरामी सफलतापूर्वक भर्ना भयो",
      wardTypes: {
        GENERAL: "सामान्य",
        SEMI_PRIVATE: "अर्ध-निजी",
        PRIVATE: "निजी",
        ICU: "आइसीयू",
        NICU: "नवजात शिशु आइसीयू",
        PICU: "बाल आइसीयू",
        CCU: "हृदय हेरचाह इकाई",
        EMERGENCY: "आपतकालीन",
        MATERNITY: "प्रसूति",
        PEDIATRIC: "बाल",
      },
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const getWardTypeLabel = (type: string) => {
    return tr.wardTypes[type as keyof typeof tr.wardTypes] || type;
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      // Fetch beds
      const bedsResponse = await fetch("/api/clinic/ipd/beds");
      if (bedsResponse.status === 404) {
        const data = await bedsResponse.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }
      if (!bedsResponse.ok) {
        throw new Error("Failed to fetch beds");
      }
      const bedsData = await bedsResponse.json();
      // Filter to only available beds
      setBeds(bedsData.beds.filter((b: Bed) => b.status === "AVAILABLE"));

      // Fetch doctors
      const doctorsResponse = await fetch("/api/clinic/doctors");
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        setDoctors(doctorsData.doctors || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [tr.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchData]);

  // Patient search
  const searchPatients = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/clinic/patients/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.patients || []);
      }
    } catch (err) {
      console.error("Error searching patients:", err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchPatients(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPatients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedPatient) {
      setFormError("Please select a patient");
      return;
    }
    if (!selectedBed) {
      setFormError("Please select a bed");
      return;
    }
    if (!admittingDoctorId) {
      setFormError("Please select an admitting doctor");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/clinic/ipd/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          bed_id: selectedBed.id,
          admitting_doctor_id: admittingDoctorId,
          attending_doctor_id: attendingDoctorId || null,
          admission_diagnosis: admissionDiagnosis.trim() || null,
          chief_complaint: chiefComplaint.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to admit patient");
      }

      const data = await response.json();
      router.push(
        `/${lang}/clinic/dashboard/ipd/admissions/${data.admission.id}?success=true`
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to admit patient");
    } finally {
      setSubmitting(false);
    }
  };

  // Get unique wards from available beds
  const uniqueWards = beds.reduce((acc, bed) => {
    if (!acc.find((w) => w.id === bed.ward.id)) {
      acc.push(bed.ward);
    }
    return acc;
  }, [] as Ward[]);

  // Filter beds by selected ward
  const filteredBeds = selectedWard
    ? beds.filter((b) => b.ward_id === selectedWard)
    : beds;

  // Loading state
  if (status === "loading" || loading) {
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
              <h1 className="text-3xl font-bold text-foreground">{tr.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.loginRequired}</p>
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/ipd/admit`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // No clinic found
  if (noClinic) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.noClinic}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.noClinicMessage}</p>
              <Link href={`/${lang}/clinic/register`}>
                <Button variant="primary">{tr.registerClinic}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{error}</p>
              <Button variant="primary" onClick={fetchData}>
                {tr.retry}
              </Button>
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
        <div className="mb-8">
          <Link
            href={`/${lang}/clinic/dashboard/ipd`}
            className="text-primary-blue hover:underline text-sm mb-2 inline-block"
          >
            ← {tr.backToIPD}
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
            {tr.title}
          </h1>
          <p className="text-foreground/60">{tr.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {formError && (
            <div className="p-4 bg-primary-red/10 border-2 border-primary-red rounded text-primary-red">
              {formError}
            </div>
          )}

          {/* Step 1: Select Patient */}
          <Card decorator="blue" decoratorPosition="top-left">
            <CardHeader>
              <h2 className="text-xl font-bold text-foreground">{tr.step1}</h2>
            </CardHeader>
            <CardContent>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-4 bg-verified/10 border-2 border-verified rounded">
                  <div>
                    <p className="font-bold text-foreground text-lg">
                      {selectedPatient.full_name}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-foreground/60 mt-1">
                      <span>
                        {tr.patientNumber}: {selectedPatient.patient_number}
                      </span>
                      {selectedPatient.phone && (
                        <span>
                          {tr.phone}: {selectedPatient.phone}
                        </span>
                      )}
                      {selectedPatient.gender && (
                        <span>
                          {tr.gender}: {selectedPatient.gender}
                        </span>
                      )}
                      {selectedPatient.date_of_birth && (
                        <span>
                          {tr.age}: {calculateAge(selectedPatient.date_of_birth)} years
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(null);
                      setSearchQuery("");
                    }}
                  >
                    {tr.changePatient}
                  </Button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    {tr.searchPatient}
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                    placeholder={tr.searchPlaceholder}
                  />

                  {searchLoading && (
                    <p className="text-sm text-foreground/60 mt-2">{tr.searching}</p>
                  )}

                  {searchResults.length > 0 && (
                    <div className="mt-4 border-2 border-foreground rounded divide-y-2 divide-foreground/20">
                      {searchResults.map((patient) => (
                        <div
                          key={patient.id}
                          className="flex items-center justify-between p-3 hover:bg-foreground/5"
                        >
                          <div>
                            <p className="font-bold text-foreground">
                              {patient.full_name}
                            </p>
                            <p className="text-sm text-foreground/60">
                              {patient.patient_number}
                              {patient.phone && ` • ${patient.phone}`}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setSearchQuery("");
                              setSearchResults([]);
                            }}
                          >
                            {tr.selectPatient}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                    <p className="text-sm text-foreground/60 mt-2">{tr.noResults}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Bed */}
          <Card decorator="red" decoratorPosition="top-left">
            <CardHeader>
              <h2 className="text-xl font-bold text-foreground">{tr.step2}</h2>
            </CardHeader>
            <CardContent>
              {selectedBed ? (
                <div className="flex items-center justify-between p-4 bg-verified/10 border-2 border-verified rounded">
                  <div>
                    <p className="font-bold text-foreground text-lg">
                      Bed {selectedBed.bed_number}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-foreground/60 mt-1">
                      <span>
                        {tr.ward}: {selectedBed.ward.name} ({getWardTypeLabel(selectedBed.ward.type)})
                      </span>
                      {parseFloat(selectedBed.daily_rate) > 0 && (
                        <span>
                          {tr.dailyRate}: Rs. {selectedBed.daily_rate}/day
                        </span>
                      )}
                      {selectedBed.features.length > 0 && (
                        <span>
                          {tr.features}: {selectedBed.features.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBed(null)}
                  >
                    {tr.changeBed}
                  </Button>
                </div>
              ) : (
                <div>
                  {/* Ward Filter */}
                  <div className="mb-4">
                    <select
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      className="px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                    >
                      <option value="">{tr.allWards}</option>
                      {uniqueWards.map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.name} ({getWardTypeLabel(ward.type)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {filteredBeds.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-foreground/60">{tr.noBeds}</p>
                      <p className="text-sm text-foreground/40 mt-1">{tr.noBedsDesc}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {filteredBeds.map((bed) => (
                        <button
                          key={bed.id}
                          type="button"
                          onClick={() => setSelectedBed(bed)}
                          className="p-4 border-4 border-foreground rounded bg-verified/10 hover:bg-verified/20 transition-colors text-left"
                        >
                          <p className="font-bold text-foreground">{bed.bed_number}</p>
                          <p className="text-xs text-foreground/60">{bed.ward.name}</p>
                          {parseFloat(bed.daily_rate) > 0 && (
                            <p className="text-xs text-foreground/50 mt-1">
                              Rs. {bed.daily_rate}/day
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Admission Details */}
          <Card decorator="yellow" decoratorPosition="top-left">
            <CardHeader>
              <h2 className="text-xl font-bold text-foreground">{tr.step3}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    {tr.admittingDoctor}
                  </label>
                  <select
                    value={admittingDoctorId}
                    onChange={(e) => setAdmittingDoctorId(e.target.value)}
                    className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                    required
                  >
                    <option value="">{tr.selectDoctor}</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    {tr.attendingDoctor}
                  </label>
                  <select
                    value={attendingDoctorId}
                    onChange={(e) => setAttendingDoctorId(e.target.value)}
                    className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                  >
                    <option value="">{tr.selectDoctor}</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">
                  {tr.chiefComplaint}
                </label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                  placeholder="e.g., Chest pain, fever for 3 days"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">
                  {tr.admissionDiagnosis}
                </label>
                <textarea
                  value={admissionDiagnosis}
                  onChange={(e) => setAdmissionDiagnosis(e.target.value)}
                  className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none resize-none"
                  rows={2}
                  placeholder="Provisional diagnosis at admission"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">
                  {tr.notes}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href={`/${lang}/clinic/dashboard/ipd`} className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                {tr.cancel}
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !selectedPatient || !selectedBed || !admittingDoctorId}
              className="flex-1"
            >
              {submitting ? tr.admitting : tr.admitPatient}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
