# Restaurant Employee Scheduling Application (RESA)

A modern web application for restaurant owners to manage employee shifts efficiently. Built with **Go (Chi)**, **Next.js**, and **PostgreSQL**, this app allows employers to create schedules manually or use AI-based automation.

## Features

- **Employer & Employee Roles**: Employers manage schedules, employees set availability.  
- **Restaurant Management**: Employers create restaurants and set shift requirements.  
- **Employee Scheduling**: Drag-and-drop or AI-assisted scheduling (premium feature).  
- **Invitations & Join Codes**: Employees can join via invite link or restaurant code.  
- **Automated Notifications**: SMS (Twilio) & Email (SendGrid) alerts for weekly schedules.  
- **Subscription-Based AI Scheduling**: Premium users get AI-powered shift assignments.  
- **Saga Pattern for Account Confirmation**: Multi-step email confirmation handled through a resilient workflow.

## Tech Stack

- **Frontend**: Next.js (TypeScript, Tailwind CSS, ShadCN UI)  
- **Backend**: Go (Chi framework, Clean Architecture, PostgreSQL)  
- **APIs**: Twilio (SMS), SendGrid (Email)  
- **Database**: PostgreSQL (No ORM)  
- **Workflow Orchestration**: Saga Pattern (for robust, multi-step processes)

---

## Using the Saga Pattern for Account Confirmation

In RESA, when a new user signs up, the application initiates a **Saga** to coordinate each step of the account confirmation process via Gmail (or another email provider). The key steps are:

1. **User Record Creation**  
   - A user entry is created in the database with a status of _“pending confirmation.”_

2. **Send Confirmation Email**  
   - An email containing a unique confirmation link is sent to the new user (via SendGrid or Gmail SMTP).  
   - The link includes a token used to verify the user’s email address.

3. **User Clicks Confirmation Link**  
   - When the user clicks the link, the token is validated, and the user’s status is updated to _“confirmed.”_

4. **Saga Coordination & Recovery**  
   - If **any** step fails (e.g., email delivery error), the Saga can roll back or retry the operation.  
   - This ensures eventual consistency—either the registration completes or the system cleanly rolls back.
