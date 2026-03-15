# Scyro Bot Website

This is the web interface for **Scyro**, a multipurpose Discord bot coded in Python designed to help with server management.

## Overview

The Scyro Bot Website provides a user-friendly dashboard for managing and interacting with the Scyro bot. Built with Next.js, it offers features like user authentication, server management tools, and more.

## Tech Stack

- **Framework**: Next.js 16
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/zenoxxbabes/Scyro-bot-Website
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables (create a `.env.local` file):
   ```
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=http://localhost:3000
   # Add other required env vars
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. For HTTPS (if needed):
   ```
   npm run start:https
   ```

## Features

- Secure user login
- Dashboard for bot management
- Responsive design
- Fast loading with Next.js

## Contributing

Contributions are welcome! Please fork the repo and submit a pull request.

## License

MIT License
