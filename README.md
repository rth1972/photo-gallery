# PixelBox

A privacy-first photo gallery web application that keeps your memories safe — automatically.

## Features

- **Photo Management**: Upload, view, and organize your photos with automatic thumbnail generation
- **Albums**: Create personal albums and shared albums with collaborate support
- **AI-Powered Search**: Find photos by searching for people, places, pets, or objects using AI-generated tags
- **Map View**: View your photos on a map based on geolocation data
- **Timeline**: Browse photos by date taken
- **Favorites & Archive**: Star your best photos and archive others
- **Shared Albums**: Share albums with others via unique links
- **Storage Management**: 15GB free storage per user

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Image Processing**: Sharp
- **Maps**: Leaflet with React-Leaflet
- **AI Image Tagging**: Ollama with llava model

## Prerequisites

- Node.js 18+
- npm or bun
- [Ollama](https://ollama.ai) with llava model for AI image tagging

## Installation

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Ollama (optional, for AI image tagging)**

   Download and install Ollama from [https://ollama.ai](https://ollama.ai), then pull the llava model:
   ```bash
   ollama pull llava
   ```

   Make sure Ollama is running when uploading photos to enable AI tagging.

4. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET=your-secret-key-change-this
   NEXTAUTH_URL=http://localhost:3000
   ```
   
   Generate a secure secret key:
   ```bash
   openssl rand -base64 32
   ```

5. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open the app**
   
   Visit [http://localhost:3000](http://localhost:3000)

## Usage

1. **Register**: Create an account at `/register`
2. **Upload Photos**: Click the upload button to add photos
3. **Organize**: Create albums to group related photos
4. **Search**: Use the search bar to find photos by AI-generated tags
5. **Share**: Create shared albums and share with friends via link

## Project Structure

```
photo-gallery/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/         # API routes
│   │   ├── albums/      # Albums pages
│   │   ├── photos/      # Photos pages
│   │   ├── map/         # Map view
│   │   └── ...
│   ├── components/      # React components
│   ├── lib/             # Utility functions
│   └── types/           # TypeScript types
├── prisma/
│   └── schema.prisma    # Database schema
└── public/              # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting

## License

MIT
