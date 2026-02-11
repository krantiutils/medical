"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HMSRoomProvider,
  useHMSStore,
  useHMSActions,
  useVideo,
  useAVToggle,
  selectPeers,
  selectIsConnectedToRoom,
  selectLocalPeer,
  selectRemotePeers,
} from "@100mslive/react-sdk";

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  slug: string;
  specialties: string[];
}

interface Patient {
  id: string;
  name: string | null;
  email: string;
}

interface Consultation {
  id: string;
  type: string;
  status: string;
  scheduled_at: string | null;
  room_id: string | null;
  room_url: string | null;
  fee: string;
  payment_status: string;
  chief_complaint: string | null;
  notes: string | null;
  prescription: string | null;
  doctor: Doctor;
  patient: Patient;
}

// Translations
const translations = {
  en: {
    title: "Video Consultation",
    waitingRoom: "Waiting Room",
    waitingForDoctor: "Waiting for Dr. {{name}} to join...",
    waitingForPatient: "Waiting for patient to join...",
    joinCall: "Join Call",
    connecting: "Connecting...",
    connected: "Connected",
    endCall: "End Call",
    mute: "Mute",
    unmute: "Unmute",
    videoOn: "Camera On",
    videoOff: "Camera Off",
    back: "Back to Consultation",
    notes: "Consultation Notes",
    notesPlaceholder: "Add your notes about this consultation...",
    prescription: "Prescription",
    prescriptionPlaceholder: "Write prescription here...",
    saveNotes: "Save Notes",
    saving: "Saving...",
    chiefComplaint: "Patient's Chief Complaint",
    callEnded: "Call Ended",
    callEndedDesc: "The video consultation has ended.",
    viewSummary: "View Summary",
    loginRequired: "Please log in to join this call",
    login: "Login",
    notFound: "Consultation not found",
    notReady: "This consultation is not ready for a video call yet",
    errorLoading: "Failed to load consultation",
    errorRoom: "Failed to create video room",
    errorEndCall: "Failed to end call",
    tips: "Tips for a good video consultation:",
    tip1: "Ensure good lighting on your face",
    tip2: "Use headphones for better audio",
    tip3: "Find a quiet, private space",
    tip4: "Have your questions ready",
  },
  ne: {
    title: "भिडियो परामर्श",
    waitingRoom: "प्रतीक्षा कक्ष",
    waitingForDoctor: "डा. {{name}} जडान हुनको लागि पर्खँदै...",
    waitingForPatient: "बिरामी जडान हुनको लागि पर्खँदै...",
    joinCall: "कलमा जडान",
    connecting: "जडान गर्दै...",
    connected: "जडान भयो",
    endCall: "कल समाप्त",
    mute: "म्युट",
    unmute: "अनम्युट",
    videoOn: "क्यामेरा अन",
    videoOff: "क्यामेरा अफ",
    back: "परामर्शमा फर्कनुहोस्",
    notes: "परामर्श नोटहरू",
    notesPlaceholder: "यो परामर्शको बारेमा नोटहरू थप्नुहोस्...",
    prescription: "प्रेस्क्रिप्सन",
    prescriptionPlaceholder: "प्रेस्क्रिप्सन यहाँ लेख्नुहोस्...",
    saveNotes: "नोटहरू सुरक्षित गर्नुहोस्",
    saving: "सुरक्षित गर्दै...",
    chiefComplaint: "बिरामीको मुख्य समस्या",
    callEnded: "कल समाप्त भयो",
    callEndedDesc: "भिडियो परामर्श समाप्त भयो।",
    viewSummary: "सारांश हेर्नुहोस्",
    loginRequired: "कृपया यो कलमा जडान हुन लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    notFound: "परामर्श फेला परेन",
    notReady: "यो परामर्श अझै भिडियो कलको लागि तयार छैन",
    errorLoading: "परामर्श लोड गर्न असफल",
    errorRoom: "भिडियो कोठा बनाउन असफल",
    errorEndCall: "कल समाप्त गर्न असफल",
    tips: "राम्रो भिडियो परामर्शको लागि सुझावहरू:",
    tip1: "आफ्नो अनुहारमा राम्रो उज्यालो सुनिश्चित गर्नुहोस्",
    tip2: "राम्रो अडियोको लागि हेडफोन प्रयोग गर्नुहोस्",
    tip3: "शान्त, निजी ठाउँ खोज्नुहोस्",
    tip4: "आफ्ना प्रश्नहरू तयार राख्नुहोस्",
  },
};

// Video tile component for a single peer
function PeerVideo({ peer, isLocal }: { peer: { id: string; name: string; videoTrack?: string }; isLocal: boolean }) {
  const { videoRef } = useVideo({ trackId: peer.videoTrack });

  return (
    <div className={isLocal
      ? "absolute bottom-4 right-4 w-48 h-36 bg-foreground/80 border-2 border-white/30 overflow-hidden z-10"
      : "absolute inset-0 bg-black/80 flex items-center justify-center"
    }>
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal}
        playsInline
        className={isLocal
          ? "w-full h-full object-cover mirror"
          : "w-full h-full object-cover"
        }
        style={isLocal ? { transform: "scaleX(-1)" } : undefined}
      />
      <div className={isLocal
        ? "absolute bottom-1 left-2 text-white text-xs bg-black/50 px-1"
        : "absolute bottom-4 left-4 text-white text-sm bg-black/50 px-2 py-1"
      }>
        {peer.name} {isLocal ? "(You)" : ""}
      </div>
    </div>
  );
}

// The actual video call UI that runs inside HMSRoomProvider
function VideoCallInner({
  consultation,
  role,
  authToken,
  lang,
  userName,
}: {
  consultation: Consultation;
  role: "patient" | "doctor";
  authToken: string;
  lang: string;
  userName: string;
}) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const localPeer = useHMSStore(selectLocalPeer);
  const remotePeers = useHMSStore(selectRemotePeers);
  const { isLocalAudioEnabled, isLocalVideoEnabled, toggleAudio, toggleVideo } = useAVToggle();

  const [callState, setCallState] = useState<"waiting" | "connecting" | "connected" | "ended">("waiting");
  const [notes, setNotes] = useState(consultation.notes || "");
  const [prescription, setPrescription] = useState(consultation.prescription || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [endingCall, setEndingCall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasJoined = useRef(false);

  const tr = translations[lang as keyof typeof translations] || translations.en;

  // Sync connection state with callState
  useEffect(() => {
    if (isConnected && callState === "connecting") {
      setCallState("connected");
    }
  }, [isConnected, callState]);

  // Leave room on unmount
  useEffect(() => {
    return () => {
      if (hasJoined.current) {
        hmsActions.leave();
      }
    };
  }, [hmsActions]);

  const joinCall = async () => {
    if (hasJoined.current) return;
    setCallState("connecting");
    setError(null);

    try {
      // Update consultation status if doctor joins
      if (role === "doctor" && consultation.status !== "IN_PROGRESS") {
        await fetch(`/api/telemedicine/consultations/${consultation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        });
      }

      await hmsActions.join({
        userName,
        authToken,
      });
      hasJoined.current = true;
    } catch (err) {
      console.error("Error joining 100ms room:", err);
      setError(tr.errorRoom);
      setCallState("waiting");
    }
  };

  const endCall = async () => {
    setEndingCall(true);
    setError(null);

    try {
      if (role === "doctor") {
        await fetch(`/api/telemedicine/consultations/${consultation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "COMPLETED",
            notes: notes || null,
            prescription: prescription || null,
          }),
        });
      }

      await hmsActions.leave();
      hasJoined.current = false;
      setCallState("ended");
    } catch (err) {
      console.error("Error ending call:", err);
      setError(tr.errorEndCall);
    } finally {
      setEndingCall(false);
    }
  };

  const saveNotes = async () => {
    if (role !== "doctor") return;
    setSavingNotes(true);
    setError(null);

    try {
      await fetch(`/api/telemedicine/consultations/${consultation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes || null,
          prescription: prescription || null,
        }),
      });
    } catch (err) {
      console.error("Error saving notes:", err);
      setError("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // Call ended
  if (callState === "ended") {
    return (
      <main className="min-h-screen bg-foreground flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-verified rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">{tr.callEnded}</h1>
          <p className="text-white/70 mb-8">{tr.callEndedDesc}</p>
          <Link href={`/${lang}/dashboard/consultations/${consultation.id}`}>
            <Button variant="primary">{tr.viewSummary}</Button>
          </Link>
        </div>
      </main>
    );
  }

  // Waiting room
  if (callState === "waiting") {
    const waitingText =
      role === "patient"
        ? tr.waitingForDoctor.replace("{{name}}", consultation.doctor.full_name.replace(/^Dr\.\s*/, ""))
        : tr.waitingForPatient;

    return (
      <main className="min-h-screen bg-foreground py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href={`/${lang}/dashboard/consultations/${consultation.id}`}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {tr.back}
          </Link>

          <div className="bg-foreground/50 border-4 border-white/20 p-8">
            <h1 className="text-3xl font-bold text-white text-center mb-2">{tr.waitingRoom}</h1>
            <p className="text-white/70 text-center mb-8">{waitingText}</p>

            {error && (
              <div className="mb-6 p-3 bg-primary-red/20 border border-primary-red text-white text-sm text-center">
                {error}
              </div>
            )}

            <div className="aspect-video bg-black/50 border-2 border-white/20 mb-6 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary-blue rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white">
                  <span className="text-white text-4xl font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-white font-bold">{userName}</p>
                <p className="text-white/60 text-sm">Camera preview</p>
              </div>
            </div>

            <div className="text-center">
              <Button variant="primary" size="lg" onClick={joinCall}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {tr.joinCall}
              </Button>
            </div>

            <div className="mt-8 p-4 bg-white/5 border border-white/10">
              <h3 className="text-white font-bold mb-2">{tr.tips}</h3>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• {tr.tip1}</li>
                <li>• {tr.tip2}</li>
                <li>• {tr.tip3}</li>
                <li>• {tr.tip4}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Connecting
  if (callState === "connecting" && !isConnected) {
    return (
      <main className="min-h-screen bg-foreground flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold">{tr.connecting}</h2>
        </div>
      </main>
    );
  }

  // Connected — real video call
  const remotePeer = remotePeers[0];

  return (
    <main className="min-h-screen bg-foreground flex flex-col">
      {/* Video area */}
      <div className="flex-1 relative">
        {/* Remote peer video (main view) */}
        {remotePeer ? (
          <PeerVideo peer={remotePeer} isLocal={false} />
        ) : (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-primary-blue rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white">
                <span className="text-white text-5xl font-bold">
                  {role === "patient"
                    ? consultation.doctor.full_name.charAt(0).toUpperCase()
                    : (consultation.patient.name || "P").charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-white text-xl font-bold">
                {role === "patient" ? consultation.doctor.full_name : consultation.patient.name || "Patient"}
              </p>
              <p className="text-white/60 mt-2">
                {role === "patient" ? tr.waitingForDoctor.replace("{{name}}", consultation.doctor.full_name.replace(/^Dr\.\s*/, "")) : tr.waitingForPatient}
              </p>
            </div>
          </div>
        )}

        {/* Local peer video (picture-in-picture) */}
        {localPeer && <PeerVideo peer={localPeer} isLocal={true} />}

        {/* Status indicator */}
        <div className="absolute top-4 left-4 bg-foreground/80 px-4 py-2 border border-white/20 z-10">
          <div className="flex items-center gap-2 text-white text-sm">
            <span className="w-2 h-2 bg-primary-red rounded-full animate-pulse" />
            <span className="font-bold">LIVE</span>
          </div>
        </div>

        {error && (
          <div className="absolute top-4 right-4 bg-primary-red/90 px-4 py-2 text-white text-sm z-10">
            {error}
          </div>
        )}
      </div>

      {/* Doctor's notes panel */}
      {role === "doctor" && (
        <div className="bg-foreground/50 border-t-2 border-white/20 p-4 max-h-64 overflow-y-auto">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
            {consultation.chief_complaint && (
              <div className="md:col-span-2 bg-white/5 p-3 border border-white/10">
                <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">
                  {tr.chiefComplaint}
                </h4>
                <p className="text-white text-sm">{consultation.chief_complaint}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1">
                {tr.notes}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tr.notesPlaceholder}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary-blue text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1">
                {tr.prescription}
              </label>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder={tr.prescriptionPlaceholder}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary-blue text-sm resize-none font-mono"
              />
            </div>

            <div className="md:col-span-2 text-right">
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="px-4 py-1 bg-primary-blue text-white text-sm font-bold hover:bg-primary-blue/80 disabled:opacity-50"
              >
                {savingNotes ? tr.saving : tr.saveNotes}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-foreground border-t-2 border-white/20 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          {/* Mute */}
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
              !isLocalAudioEnabled
                ? "bg-primary-red border-primary-red text-white"
                : "bg-white/10 border-white/30 text-white hover:bg-white/20"
            }`}
            title={isLocalAudioEnabled ? tr.mute : tr.unmute}
          >
            {!isLocalAudioEnabled ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Video */}
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
              !isLocalVideoEnabled
                ? "bg-primary-red border-primary-red text-white"
                : "bg-white/10 border-white/30 text-white hover:bg-white/20"
            }`}
            title={isLocalVideoEnabled ? tr.videoOff : tr.videoOn}
          >
            {!isLocalVideoEnabled ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* End call */}
          <button
            onClick={endCall}
            disabled={endingCall}
            className="w-14 h-14 bg-primary-red rounded-full flex items-center justify-center text-white hover:bg-primary-red/80 disabled:opacity-50 transition-all"
            title={tr.endCall}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}

// Outer wrapper that handles auth, fetching consultation, and providing HMSRoomProvider
export default function VideoCallPage() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams<{ lang: string; id: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";
  const consultationId = params?.id;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tr = translations[lang as keyof typeof translations] || translations.en;

  const fetchConsultationAndRoom = useCallback(async () => {
    if (!consultationId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch consultation details
      const consultRes = await fetch(`/api/telemedicine/consultations/${consultationId}`);
      const consultData = await consultRes.json();

      if (!consultRes.ok) {
        setError(consultData.error || tr.errorLoading);
        return;
      }

      const c = consultData.consultation;
      setConsultation(c);
      setRole(consultData.role);

      // Check if consultation is in a valid state for video call
      if (
        !["CONFIRMED", "WAITING", "IN_PROGRESS"].includes(c.status) ||
        c.payment_status !== "PAID"
      ) {
        setError(tr.notReady);
        return;
      }

      // Get or create room + auth token
      const roomRes = await fetch(`/api/telemedicine/consultations/${consultationId}/room`, {
        method: "POST",
      });
      const roomData = await roomRes.json();

      if (!roomRes.ok) {
        setError(roomData.error || tr.errorRoom);
        return;
      }

      setAuthToken(roomData.authToken);
    } catch (err) {
      console.error("Error loading consultation:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [consultationId, tr.errorLoading, tr.notReady, tr.errorRoom]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchConsultationAndRoom();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus, fetchConsultationAndRoom]);

  // Loading
  if (sessionStatus === "loading" || loading) {
    return (
      <main className="min-h-screen bg-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="h-4 bg-white/10 rounded w-48 mx-auto" />
          </div>
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/dashboard/consultations/${consultationId}/call`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Error or not found
  if (error || !consultation || !authToken) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <h3 className="text-xl font-bold mb-4">{error || tr.notFound}</h3>
              <Link href={`/${lang}/dashboard/consultations/${consultationId}`}>
                <Button variant="primary">{tr.back}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <HMSRoomProvider>
      <VideoCallInner
        consultation={consultation}
        role={role}
        authToken={authToken}
        lang={lang}
        userName={session.user?.name || "User"}
      />
    </HMSRoomProvider>
  );
}
