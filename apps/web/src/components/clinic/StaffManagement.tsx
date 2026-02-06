"use client";

import { useState, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClinicStaffRole } from "@swasthya/database";

interface StaffMember {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: ClinicStaffRole;
  roleLabel: string;
  joinedAt: string;
  invitedBy: string | null;
}

interface StaffManagementProps {
  initialStaff: StaffMember[];
  currentUserId: string;
  currentUserRole: ClinicStaffRole;
  lang: string;
}

const translations = {
  en: {
    title: "Staff Management",
    subtitle: "Manage your clinic's staff members and their roles",
    inviteStaff: "Invite Staff",
    name: "Name",
    email: "Email",
    role: "Role",
    joined: "Joined",
    actions: "Actions",
    noStaff: "No staff members found",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    remove: "Remove",
    changeRole: "Change Role",
    you: "(You)",
    inviteTitle: "Invite New Staff",
    emailPlaceholder: "Enter email address",
    selectRole: "Select Role",
    sending: "Sending...",
    invite: "Send Invitation",
    confirmRemove: "Are you sure you want to remove this staff member?",
    removed: "Staff member removed",
    invited: "Staff member invited successfully",
    roleUpdated: "Role updated successfully",
    errorLoading: "Failed to load staff",
    errorInvite: "Failed to invite staff",
    errorRemove: "Failed to remove staff",
    errorUpdate: "Failed to update role",
    close: "Close",
    roles: {
      OWNER: "Owner",
      ADMIN: "Administrator",
      DOCTOR: "Doctor",
      RECEPTIONIST: "Receptionist",
      BILLING: "Billing Staff",
      LAB: "Lab Technician",
      PHARMACY: "Pharmacy Staff",
      NURSE: "Nurse",
    },
    roleDescriptions: {
      OWNER: "Full access to all clinic features",
      ADMIN: "Full access except clinic deletion",
      DOCTOR: "Consultations, prescriptions, clinical notes",
      RECEPTIONIST: "Reception, appointments, patients",
      BILLING: "Invoices, payments, reports",
      LAB: "Lab orders and results",
      PHARMACY: "POS, inventory, suppliers",
      NURSE: "Vitals, basic clinical notes",
    },
  },
  ne: {
    title: "कर्मचारी व्यवस्थापन",
    subtitle: "तपाईंको क्लिनिकका कर्मचारी र तिनीहरूको भूमिकाहरू व्यवस्थापन गर्नुहोस्",
    inviteStaff: "कर्मचारी आमन्त्रित गर्नुहोस्",
    name: "नाम",
    email: "इमेल",
    role: "भूमिका",
    joined: "सामेल भएको",
    actions: "कार्यहरू",
    noStaff: "कुनै कर्मचारी भेटिएनन्",
    loading: "लोड हुँदैछ...",
    save: "सेभ गर्नुहोस्",
    cancel: "रद्द गर्नुहोस्",
    remove: "हटाउनुहोस्",
    changeRole: "भूमिका परिवर्तन गर्नुहोस्",
    you: "(तपाईं)",
    inviteTitle: "नयाँ कर्मचारी आमन्त्रित गर्नुहोस्",
    emailPlaceholder: "इमेल ठेगाना प्रविष्ट गर्नुहोस्",
    selectRole: "भूमिका छान्नुहोस्",
    sending: "पठाउँदै...",
    invite: "आमन्त्रण पठाउनुहोस्",
    confirmRemove: "के तपाईं यो कर्मचारीलाई हटाउन निश्चित हुनुहुन्छ?",
    removed: "कर्मचारी हटाइयो",
    invited: "कर्मचारीलाई सफलतापूर्वक आमन्त्रित गरियो",
    roleUpdated: "भूमिका सफलतापूर्वक अपडेट गरियो",
    errorLoading: "कर्मचारी लोड गर्न असफल भयो",
    errorInvite: "कर्मचारी आमन्त्रित गर्न असफल भयो",
    errorRemove: "कर्मचारी हटाउन असफल भयो",
    errorUpdate: "भूमिका अपडेट गर्न असफल भयो",
    close: "बन्द गर्नुहोस्",
    roles: {
      OWNER: "मालिक",
      ADMIN: "प्रशासक",
      DOCTOR: "डाक्टर",
      RECEPTIONIST: "रिसेप्सनिस्ट",
      BILLING: "बिलिङ कर्मचारी",
      LAB: "ल्याब प्राविधिक",
      PHARMACY: "फार्मेसी कर्मचारी",
      NURSE: "नर्स",
    },
    roleDescriptions: {
      OWNER: "क्लिनिकका सबै सुविधाहरूमा पूर्ण पहुँच",
      ADMIN: "क्लिनिक मेटाउने बाहेक पूर्ण पहुँच",
      DOCTOR: "परामर्श, प्रेस्क्रिप्सन, क्लिनिकल नोटहरू",
      RECEPTIONIST: "रिसेप्सन, अपोइन्टमेन्ट, बिरामीहरू",
      BILLING: "इनभ्वाइस, भुक्तानी, रिपोर्टहरू",
      LAB: "ल्याब अर्डर र परिणामहरू",
      PHARMACY: "POS, इन्भेन्टरी, आपूर्तिकर्ताहरू",
      NURSE: "भाइटल, आधारभूत क्लिनिकल नोटहरू",
    },
  },
};

// Roles that can be assigned (excluding OWNER for non-owners)
const assignableRoles: ClinicStaffRole[] = [
  ClinicStaffRole.ADMIN,
  ClinicStaffRole.DOCTOR,
  ClinicStaffRole.RECEPTIONIST,
  ClinicStaffRole.BILLING,
  ClinicStaffRole.LAB,
  ClinicStaffRole.PHARMACY,
  ClinicStaffRole.NURSE,
];

export function StaffManagement({
  initialStaff,
  currentUserId,
  currentUserRole,
  lang,
}: StaffManagementProps) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ClinicStaffRole | "">("");
  const [isInviting, setIsInviting] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<ClinicStaffRole | "">("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const t = translations[lang as keyof typeof translations] || translations.en;
  const isOwner = currentUserRole === ClinicStaffRole.OWNER;

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteRole) return;

    setIsInviting(true);
    try {
      const response = await fetch("/api/clinic/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorInvite);
      }

      setStaff((prev) => [...prev, data.staff]);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("");
      showMessage("success", t.invited);
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : t.errorInvite);
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (staffId: string) => {
    if (!editingRole) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/clinic/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editingRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorUpdate);
      }

      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? data.staff : s))
      );
      setEditingRoleId(null);
      setEditingRole("");
      showMessage("success", t.roleUpdated);
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : t.errorUpdate);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (staffId: string, staffName: string) => {
    if (!confirm(`${t.confirmRemove}\n\n${staffName}`)) return;

    try {
      const response = await fetch(`/api/clinic/staff/${staffId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorRemove);
      }

      setStaff((prev) => prev.filter((s) => s.id !== staffId));
      showMessage("success", t.removed);
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : t.errorRemove);
    }
  };

  const canEditRole = (member: StaffMember): boolean => {
    // Can't edit your own role
    if (member.userId === currentUserId) return false;
    // Only OWNER can edit OWNER or ADMIN roles
    if (
      (member.role === ClinicStaffRole.OWNER || member.role === ClinicStaffRole.ADMIN) &&
      !isOwner
    ) {
      return false;
    }
    return true;
  };

  const canRemove = (member: StaffMember): boolean => {
    // Can't remove yourself
    if (member.userId === currentUserId) return false;
    // Only OWNER can remove OWNER or ADMIN
    if (
      (member.role === ClinicStaffRole.OWNER || member.role === ClinicStaffRole.ADMIN) &&
      !isOwner
    ) {
      return false;
    }
    return true;
  };

  const getAvailableRoles = (): ClinicStaffRole[] => {
    if (isOwner) {
      return [ClinicStaffRole.OWNER, ...assignableRoles];
    }
    return assignableRoles;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-foreground/60 mt-1">{t.subtitle}</p>
        </div>
        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          {t.inviteStaff}
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 border-2 border-foreground ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Staff Table */}
      <Card decorator="blue" decoratorPosition="top-left">
        <CardContent className="py-0 px-0">
          {staff.length === 0 ? (
            <div className="py-12 text-center text-foreground/60">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-foreground/20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p>{t.noStaff}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-foreground/10">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-foreground/60">
                      {t.name}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-foreground/60">
                      {t.email}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-foreground/60">
                      {t.role}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-foreground/60">
                      {t.joined}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-foreground/60">
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-foreground/5 hover:bg-foreground/2"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue font-bold border-2 border-foreground/10 overflow-hidden">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (member.name || member.email || "?").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">
                              {member.name || (member.email ? member.email.split("@")[0] : "—")}
                              {member.userId === currentUserId && (
                                <span className="ml-2 text-xs font-normal text-primary-blue">
                                  {t.you}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground/70">{member.email}</td>
                      <td className="px-6 py-4">
                        {editingRoleId === member.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editingRole}
                              onChange={(e) =>
                                setEditingRole(e.target.value as ClinicStaffRole)
                              }
                              className="px-3 py-1.5 border-2 border-foreground text-sm font-bold uppercase"
                              disabled={isUpdating}
                            >
                              <option value="">{t.selectRole}</option>
                              {getAvailableRoles().map((role) => (
                                <option key={role} value={role}>
                                  {t.roles[role]}
                                </option>
                              ))}
                            </select>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateRole(member.id)}
                              disabled={!editingRole || isUpdating}
                            >
                              {t.save}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingRoleId(null);
                                setEditingRole("");
                              }}
                              disabled={isUpdating}
                            >
                              {t.cancel}
                            </Button>
                          </div>
                        ) : (
                          <span
                            className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 ${
                              member.role === ClinicStaffRole.OWNER
                                ? "bg-primary-red/10 text-primary-red border-primary-red/30"
                                : member.role === ClinicStaffRole.ADMIN
                                ? "bg-primary-blue/10 text-primary-blue border-primary-blue/30"
                                : member.role === ClinicStaffRole.DOCTOR
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-foreground/5 text-foreground/70 border-foreground/20"
                            }`}
                          >
                            {t.roles[member.role]}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-foreground/60 text-sm">
                        {formatDate(member.joinedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEditRole(member) && editingRoleId !== member.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingRoleId(member.id);
                                setEditingRole(member.role);
                              }}
                              title={t.changeRole}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </Button>
                          )}
                          {canRemove(member) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemove(
                                  member.id,
                                  member.name || member.email || "this member"
                                )
                              }
                              className="text-primary-red hover:bg-primary-red/10"
                              title={t.remove}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
          <Card decorator="blue" decoratorPosition="top-right" className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">{t.inviteTitle}</h2>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                    setInviteRole("");
                  }}
                  className="text-foreground/60 hover:text-foreground"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full px-4 py-3 border-2 border-foreground focus:ring-2 focus:ring-primary-blue outline-none"
                  disabled={isInviting}
                />
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  {t.role}
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as ClinicStaffRole)}
                  className="w-full px-4 py-3 border-2 border-foreground focus:ring-2 focus:ring-primary-blue outline-none"
                  disabled={isInviting}
                >
                  <option value="">{t.selectRole}</option>
                  {getAvailableRoles().map((role) => (
                    <option key={role} value={role}>
                      {t.roles[role]} - {t.roleDescriptions[role]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || !inviteRole || isInviting}
                >
                  {isInviting ? t.sending : t.invite}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                    setInviteRole("");
                  }}
                  disabled={isInviting}
                >
                  {t.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
