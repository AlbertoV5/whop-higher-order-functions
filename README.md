# Whop Higher Order Functions (WHOOF)

## Introduction

Whoof aims to provide tools to create templates / frameworks for creating Whop Applications via their SDK.

## Principles

### Authentication As Config

Abstract out Whop authentication and user access methods. Focus on the business logic of your functions and move repetitive tasks out of the way.

### Upgrade The Architecture Easily

Use OpenNext instead of Vercel while keeping resource creation simple via IaC tools. Bypass Vercel and use AWS directly (or other providers), while keeping resources as config.

### Automate The Boring Stuff

Abstract out database config and migrations. Simplify connection configuration and automate migration as much as possible while being able to use both local and remote connections for dev. Improving DevEx and CI/CD.

### App Starts At The Database Level

Don't abstract the database logic. Keep queries as close to SQL via Drizzle. These tools should not be reductionistic with the app's data structure.
