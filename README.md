# Restaurant Employee Scheduling Application (RESA)

A modern web application for restaurant owners to manage employee shifts efficiently. Built with **Go (Chi)**, **Next.js**, and **PostgreSQL**, this app allows employers to create schedules manually or use AI-based automation.

## Features

- **Employer & Employee Roles**: Employers manage schedules, employees set availability.
- **Restaurant Management**: Employers create restaurants and set shift requirements.
- **Employee Scheduling**: Drag-and-drop or AI-assisted scheduling (premium feature).
- **Invitations & Join Codes**: Employees can join via invite link or restaurant code.
- **Automated Notifications**: SMS (Twilio) & Email (SendGrid) alerts for weekly schedules.
- **Subscription-Based AI Scheduling**: Premium users get AI-powered shift assignments.

## Tech Stack

- **Frontend**: Next.js (TypeScript, Tailwind CSS, ShadCN UI)
- **Backend**: Go (Chi framework, Clean Architecture, PostgreSQL)
- **APIs**: Twilio (SMS), SendGrid (Email)
- **Database**: PostgreSQL (No ORM)
