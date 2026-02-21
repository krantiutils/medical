import { NextRequest, NextResponse } from "next/server";
import { prisma, AppointmentStatus } from "@swasthya/database";
import {
  sendAppointmentReminderEmail,
  sendPostVisitFollowUpEmail,
} from "@/lib/email";

/**
 * GET /api/cron/appointment-emails
 *
 * Called hourly by crontab. Sends:
 * 1. 24h reminders for tomorrow's appointments
 * 2. Post-visit follow-up for appointments completed >24h ago
 *
 * Secured by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { reminders: 0, followups: 0, errors: 0 };

  try {
    // ── 24h Reminders ─────────────────────────────────────────────
    // Find appointments scheduled for tomorrow that haven't been reminded
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const appointmentsToRemind = await prisma.appointment.findMany({
      where: {
        appointment_date: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        status: AppointmentStatus.SCHEDULED,
        reminder_sent: false,
      },
      include: {
        patient: { select: { full_name: true, email: true } },
        doctor: { select: { full_name: true, type: true } },
        clinic: { select: { name: true, address: true } },
      },
      take: 100, // Process in batches to avoid timeout
    });

    for (const appt of appointmentsToRemind) {
      if (!appt.patient.email) {
        // Mark as sent even without email to avoid re-processing
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminder_sent: true },
        });
        continue;
      }

      try {
        const dateFormatted = new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Asia/Kathmandu",
        }).format(appt.appointment_date);

        await sendAppointmentReminderEmail(
          appt.patient.email,
          {
            patientName: appt.patient.full_name,
            doctorName: appt.doctor.full_name,
            doctorType: appt.doctor.type,
            clinicName: appt.clinic.name,
            clinicAddress: appt.clinic.address,
            date: dateFormatted,
            timeSlot: `${appt.time_slot_start} - ${appt.time_slot_end}`,
            tokenNumber: appt.token_number,
          },
          "en"
        );

        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminder_sent: true },
        });
        results.reminders++;
      } catch (err) {
        console.error(`[Cron] Failed reminder for appointment ${appt.id}:`, err);
        results.errors++;
      }
    }

    // ── Post-Visit Follow-ups ─────────────────────────────────────
    // Find appointments completed >24h ago that haven't been followed up
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const appointmentsToFollowUp = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.COMPLETED,
        updated_at: { lt: oneDayAgo },
        followup_sent: false,
      },
      include: {
        patient: { select: { full_name: true, email: true } },
        doctor: { select: { full_name: true, slug: true } },
      },
      take: 100,
    });

    for (const appt of appointmentsToFollowUp) {
      if (!appt.patient.email) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { followup_sent: true },
        });
        continue;
      }

      try {
        await sendPostVisitFollowUpEmail(
          appt.patient.email,
          {
            patientName: appt.patient.full_name,
            doctorName: appt.doctor.full_name,
            doctorSlug: appt.doctor.slug,
          },
          "en"
        );

        await prisma.appointment.update({
          where: { id: appt.id },
          data: { followup_sent: true },
        });
        results.followups++;
      } catch (err) {
        console.error(`[Cron] Failed follow-up for appointment ${appt.id}:`, err);
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[Cron] appointment-emails failed:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }
}
