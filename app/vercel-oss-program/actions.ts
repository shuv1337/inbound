"use server";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInboundClient } from "@/lib/inbound-client";
import { NOTIFICATION_DOMAIN } from "@/lib/config/app-url";

// Server action to submit Vercel OSS Program application
export async function submitVercelOssApplication(formData: FormData) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      throw new Error("User not authenticated");
    }

    const inbound = getInboundClient();
    
    const response = await inbound.emails.send({
      from: `Vercel OSS Program Applications<noreply@${NOTIFICATION_DOMAIN}>`,
      to: process.env.ADMIN_EMAIL || `admin@${NOTIFICATION_DOMAIN}`,
      subject: 'New Vercel OSS Program Application',
      reply_to: session.user.email,
      text: `User ${session.user.name || session.user.email} has applied for the Vercel OSS Program.\n\nUser Details:\n- ID: ${session.user.id}\n- Email: ${session.user.email}\n- Name: ${session.user.name || 'Not provided'}`,
      html: `
        <h2>New Vercel OSS Program Application</h2>
        <p>User <strong>${session.user.name || session.user.email}</strong> has applied for the Vercel OSS Program.</p>
        
        <h3>User Details:</h3>
        <ul>
          <li><strong>ID:</strong> ${session.user.id}</li>
          <li><strong>Email:</strong> ${session.user.email}</li>
          <li><strong>Name:</strong> ${session.user.name || 'Not provided'}</li>
        </ul>
      `
    });

    console.log('Application email sent:', response.id);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending application email:', error);
    return { success: false };
  }
}
