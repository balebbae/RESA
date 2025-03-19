# Restaurant Employee Scheduling Application (RESA)

A modern web application for restaurant owners to manage employee shifts efficiently. Built with **Go (Chi)**, **Next.js**, and **PostgreSQL**, this app allows employers to create schedules manually or use AI-based automation.

## Features

- **Employer & Employee Roles**: Employers manage schedules, employees set availability.  
- **Restaurant Management**: Employers create restaurants and set shift requirements.  
- **Employee Scheduling**: Drag-and-drop or AI-assisted scheduling.  
- **Invitations & Join Codes**: Employees can join via invite link or restaurant code.  
- **Automated Notifications**: SMS (Twilio) & Email (SendGrid) alerts for weekly schedules.   
- **Saga Pattern for Account Confirmation**: Multi-step email confirmation handled through a resilient workflow.

## Tech Stack

- **Frontend**: Next.js (TypeScript, Tailwind CSS, ShadCN UI)  
- **Backend**: Go (Chi framework, Clean Architecture, PostgreSQL)  
- **APIs**: Twilio (SMS), SendGrid (Email)  
- **Database**: PostgreSQL (No ORM)  
- **Workflow Orchestration**: Saga Pattern (for robust, multi-step processes)
