# ChatPDF Web Frontend

This is a [Next.js](https://nextjs.org) project that provides a modern web interface for processing PDF documents and extracting topics.

## Features

### 🎨 Enhanced User Experience

- **Drag & Drop Upload**: Intuitive file upload with visual feedback
- **Auto-refresh**: Job status updates automatically without manual refresh
- **Status Badges**: Color-coded status indicators (pending, running, succeeded, failed)
- **Progress Bars**: Visual progress tracking for job execution
- **Tooltips**: Helpful hints on complex configuration options
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode Support**: Full dark/light theme support

### 📋 Pages

- **Home** (`/`): Upload PDFs and create new jobs with comprehensive configuration options
- **Jobs List** (`/jobs`): View all jobs with auto-refresh and status filtering
- **Job Detail** (`/jobs/[id]`): Real-time job tracking with download capabilities

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Structure

```
app/
├── page.tsx              # Home page with upload form
├── layout.tsx            # Root layout with header/footer
├── jobs/
│   ├── page.tsx          # Jobs list with auto-refresh
│   └── [id]/page.tsx     # Job detail with progress tracking
components/
├── UploadForm.tsx        # Drag & drop upload component
lib/
└── api.ts               # API client utilities
```

## Key Improvements (Latest Update)

### Upload Experience
- Drag & drop area with visual feedback
- File validation and size display
- Easy file replacement

### Job Monitoring
- Auto-refresh every 5s on jobs list
- Auto-refresh every 3s on job detail
- Animated status badges and progress bars
- Improved error display

### Visual Design
- Better color scheme and spacing
- Helpful tooltips on configuration fields
- Feature cards highlighting capabilities
- Quick start guide on homepage

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
