# Restaurant Employee Scheduling Application (RESA)

A modern, full-stack web application for restaurant owners to streamline employee shift management. Developed with Go (Chi), Next.js, and PostgreSQL, it supports both manual schedule creation and AI-powered generation for optimal staffing.

## Features

- **Employer & Employee Roles**: Employers manage schedules, employees set availability.  
- **Restaurant Management**: Employers create restaurants and set shift requirements.
- **Employee Scheduling**: Drag-and-drop or AI-assisted scheduling. 
- **Invitations & Join Codes**: Employees can join via invite link or restaurant code.
- **Automated Notifications**: SMS (Twilio) & Email (SendGrid) alerts for weekly schedules.
- **Magic Link for Account Confirmation**: Multi-step email confirmation handled through a saga pattern.

## Tech Stack

- **Frontend**: Next.js (TypeScript, Tailwind CSS, ShadCN UI)  
- **Backend (Clean Architecture/Repository Pattern)**: Go (Chi framework)  
- **APIs**: Twilio (SMS), SendGrid (Email) 
- **Database**: PostgreSQL (No ORM)  
