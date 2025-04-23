# Restaurant Employee Scheduling Application (RESA)

A modern, full-stack(Only Backend Complete) web application for restaurant owners to streamline employee shift management. Developed with Go (Chi), Next.js, and PostgreSQL, it supports both manual schedule creation and AI-powered generation for optimal staffing.

## Overview

RESA is a comprehensive solution for restaurant management, focusing on streamlined employee scheduling and workforce management. The application allows restaurant owners to create and manage their establishments, define roles, add employees, create schedules, and automatically notify employees of their work shifts.

## Features

- **Employer & Employee Roles**: Employers manage schedules, employees set availability.
- **Restaurant Management**: Employers create restaurants and set shift requirements.
- **Employee Scheduling**: Drag-and-drop or AI-assisted scheduling.
- **Invitations & Join Codes**: Employees can join via invite link or restaurant code.
- **Automated Notifications**: SMS (Twilio) & Email (SendGrid) alerts for weekly schedules.
- **Magic Link for Account Confirmation**: Secure, passwordless authentication using one-time links sent via email.
- **High Performance**: Redis caching for optimized data retrieval.

## Architecture

### Backend Architecture

RESA follows a clean architecture pattern with clear separation of concerns:

- **API Layer**: HTTP handlers for REST endpoints
- **Service Layer**: Business logic implementation
- **Storage Layer**: Database interactions and caching
- **Infrastructure**: External services integration (email, SMS)

### Key Technical Features

#### Redis Caching System

RESA implements a Redis-based caching system to optimize performance:

- **Entity Caching**: Restaurants and schedules are cached to minimize database queries
- **Cache Invalidation**: Automatic cache updates when entities are modified
- **Configurable**: Redis caching can be enabled/disabled via environment variables
- **Performance Optimization**: Reduces load on the PostgreSQL database for frequently accessed data

#### User Creation Saga Pattern

User registration follows a saga pattern to ensure consistency across distributed operations:

1. **User Registration**: Initial account creation with minimal information
2. **Email Verification**: Magic link sent to verify user email
3. **Account Activation**: User clicks magic link to activate account
4. **Profile Completion**: Guided workflow to complete user profile

This approach ensures that each step is properly completed before proceeding, with compensation actions in case of failures at any stage.

#### Magic Links Authentication

RESA uses a secure, passwordless authentication system with magic links:

- **User Activation**: New users activate accounts via one-time links
- **Secure Tokens**: Time-limited JWT tokens with proper expiration handling
- **Email Delivery**: Integration with SendGrid for reliable delivery
- **Verification**: Server-side validation of token authenticity

## Tech Stack

- **Frontend**: Next.js (TypeScript, Tailwind CSS, ShadCN UI)
- **Backend (Clean Architecture/Repository Pattern)**: Go (Chi framework)
- **APIs**: SendGrid (Email)
- **Database**: PostgreSQL (No ORM)
- **Caching**: Redis
- **Authentication**: JWT Tokens + Magic Links

## Database Schema

The application uses a relational database schema with the following key entities:

- **Users**: Application users (owners and employees)
- **Restaurants**: Restaurant information and ownership
- **Roles**: Employee roles(positions) within restaurants
- **Employees**: Employee information for each restaurant
- **Schedules**: Weekly work schedules
- **Shifts**: Individual work shifts within schedules

## API Documentation

The API is documented using Swagger and is accessible at `/v1/swagger/` with basic authentication.
