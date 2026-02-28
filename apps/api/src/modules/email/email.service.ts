import { Injectable } from "@nestjs/common";

export interface TaskAssignmentEmail {
  to: string;
  taskName: string;
  projectName: string;
  description: string;
  dueDate: string | null;
  accessLink: string;
}

@Injectable()
export class EmailService {
  async sendTaskAssignment(data: TaskAssignmentEmail): Promise<boolean> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || "noreply@pgmonitor.app";
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    if (!resendApiKey) {
      console.log("[EmailService] RESEND_API_KEY not set, logging email instead:");
      console.log(JSON.stringify(data, null, 2));
      return true;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef; }
    .task-card { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4f46e5; }
    .btn { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { padding: 15px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">You've been assigned a task</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have been assigned a new task in the project <strong>${data.projectName}</strong>.</p>

      <div class="task-card">
        <h2 style="margin-top: 0;">${data.taskName}</h2>
        <p>${data.description || "No description provided."}</p>
        ${data.dueDate ? `<p><strong>Due:</strong> ${data.dueDate}</p>` : ""}
      </div>

      <p>Click the button below to view and update your task status. No login required!</p>

      <p style="text-align: center; margin: 25px 0;">
        <a href="${data.accessLink}" class="btn">View & Update Task</a>
      </p>

      <p style="font-size: 13px; color: #6b7280;">
        Or copy this link: <a href="${data.accessLink}">${data.accessLink}</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent by PG MONITOR. If you didn't expect this email, you can ignore it.</p>
    </div>
  </div>
</body>
</html>`;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: data.to,
          subject: `Task Assigned: ${data.taskName} - ${data.projectName}`,
          html
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("[EmailService] Failed to send email:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[EmailService] Error sending email:", error);
      return false;
    }
  }
}
