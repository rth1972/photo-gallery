"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search, Wand2, Shield, Share2, Upload,
  ChevronDown, ArrowRight, Check,
} from "lucide-react";

// ─── Rotating headline words ──────────────────────────────────────────────────

const CYCLING_WORDS = ["editing", "organization", "search", "photos"];

function CyclingWord() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % CYCLING_WORDS.length);
        setVisible(true);
      }, 350);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      style={{
        display: "inline-block",
        color: "#1a73e8",
        fontStyle: "italic",
        transition: "opacity 0.35s ease, transform 0.35s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        minWidth: "6ch",
      }}
    >
      {CYCLING_WORDS[idx]}
    </span>
  );
}

// ─── Shared section components ────────────────────────────────────────────────

function SectionPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "#e8f0fe",
        color: "#1a73e8",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.08em",
        padding: "4px 12px",
        borderRadius: 20,
        marginBottom: 16,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #f0f0f0",
        borderRadius: 20,
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 8px 40px rgba(0,0,0,0.1)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "#202124",
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 14, color: "#5f6368", lineHeight: 1.7 }}>
          {body}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid #e8eaed",
        padding: "20px 0",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 500, color: "#202124" }}>{q}</span>
        <ChevronDown
          style={{
            flexShrink: 0,
            transition: "transform 0.25s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "#5f6368",
          }}
          size={20}
        />
      </button>
      <div
        style={{
          maxHeight: open ? 200 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <p style={{ fontSize: 14, color: "#5f6368", lineHeight: 1.8, paddingTop: 12 }}>
          {a}
        </p>
      </div>
    </div>
  );
}

// ─── Mosaic photo grid ─────────────────────────────────────────────────────────

const MOSAIC_PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    alt: "Mountains",
    style: { gridColumn: "1 / 3", gridRow: "1 / 2" },
  },
  {
    src: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&q=80",
    alt: "Couple",
    style: { gridColumn: "3 / 4", gridRow: "1 / 2" },
  },
  {
    src: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80",
    alt: "Shoes",
    style: { gridColumn: "1 / 2", gridRow: "2 / 3" },
  },
  {
    src: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80",
    alt: "Travel",
    style: { gridColumn: "2 / 4", gridRow: "2 / 3" },
  },
  {
    src: "https://images.unsplash.com/photo-1494790108375-be9c29c29305?w=600&q=80",
    alt: "Person",
    style: { gridColumn: "1 / 2", gridRow: "3 / 4" },
  },
  {
    src: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80",
    alt: "Dog",
    style: { gridColumn: "2 / 3", gridRow: "3 / 4" },
  },
  {
    src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    alt: "Food",
    style: { gridColumn: "3 / 4", gridRow: "3 / 4" },
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Redirect logged-in users to photos
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/photos");
    }
  }, [status, router]);
  
  // Show loading while checking session
  if (status === "loading") {
    return (
      <div style={{ background: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  // If logged in, don't render the page (will redirect)
  if (status === "authenticated") {
    return null;
  }
  
  const handleSearchClick = (example: string) => {
    const query = example.replace(/"/g, "").toLowerCase();
    router.push(`/photos?search=${encodeURIComponent(query)}`);
  };
  
  return (
    <div style={{ background: "#fff", color: "#202124", minHeight: "100vh", overflowX: "hidden" }}>
      {/* ── Navbar ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e8eaed",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          height: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Google Photos-style colourful icon */}
          <Image src="/icon.png" alt="PixelBox" width={36} height={36} className="rounded-xl" />
          <span style={{ fontSize: 18, fontWeight: 500, color: "#202124", letterSpacing: "-0.01em" }}>
            PixelBox
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/login"
            style={{
              padding: "8px 20px",
              borderRadius: 24,
              fontSize: 14,
              fontWeight: 500,
              color: "#202124",
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.background = "#f1f3f4")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "transparent")}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            style={{
              padding: "8px 20px",
              borderRadius: 24,
              fontSize: 14,
              fontWeight: 500,
              background: "#1a73e8",
              color: "#fff",
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.background = "#1557b0")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "#1a73e8")}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "80px 24px 60px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(40px, 7vw, 72px)",
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "#202124",
            marginBottom: 28,
            fontFamily: "Chango",
          }}
        >
          Makes <CyclingWord /> feel like magic
        </h1>
        <p
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: "#5f6368",
            maxWidth: 560,
            margin: "0 auto 40px",
            lineHeight: 1.7,
            fontWeight: 400,
          }}
        >
          Back up your life's memories on all your devices. The privacy-first
          photo gallery that keeps your memories safe — automatically, at no cost.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              borderRadius: 28,
              background: "#1a73e8",
              color: "#fff",
              fontWeight: 500,
              fontSize: 15,
              textDecoration: "none",
              transition: "background 0.15s, box-shadow 0.15s",
              boxShadow: "0 1px 3px rgba(26,115,232,0.4)",
            }}
          >
            Get started free
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              borderRadius: 28,
              background: "#fff",
              color: "#1a73e8",
              fontWeight: 500,
              fontSize: 15,
              textDecoration: "none",
              border: "1.5px solid #dadce0",
              transition: "background 0.15s",
            }}
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Hero mosaic grid ── */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(3, 200px)",
            gap: 8,
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          {MOSAIC_PHOTOS.map((p, i) => (
            <div key={i} style={{ ...p.style, overflow: "hidden" }}>
              <img
                src={p.src}
                alt={p.alt}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Sticky subnav ── */}
      <nav
        style={{
          position: "sticky",
          top: 64,
          zIndex: 90,
          background: "#fff",
          borderBottom: "1px solid #e8eaed",
          display: "flex",
          justifyContent: "center",
          gap: 0,
          overflowX: "auto",
        }}
      >
        {["Search", "Edit", "Organize", "Share", "Safety"].map((label) => (
          <a
            key={label}
            href={`#${label.toLowerCase()}`}
            style={{
              padding: "14px 20px",
              fontSize: 14,
              fontWeight: 500,
              color: "#5f6368",
              textDecoration: "none",
              whiteSpace: "nowrap",
              borderBottom: "3px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = "#1a73e8";
              (e.target as HTMLElement).style.borderBottomColor = "#1a73e8";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = "#5f6368";
              (e.target as HTMLElement).style.borderBottomColor = "transparent";
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      {/* ── Create section ── */}
      <section id="create" style={{ padding: "80px 24px", background: "#fff", display:"none" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <SectionPill>Create</SectionPill>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, lineHeight: 1.2, color: "#202124", marginBottom: 20 }}>
              Discover new ways to create
            </h2>
            <p style={{ fontSize: 16, color: "#5f6368", lineHeight: 1.8, marginBottom: 28 }}>
              Got the perfect selfie? Remix it into different styles. Took an
              action pic? Bring it to life as a video. Had an epic trip? Make it
              a collage. Explore all these tools and more.
            </p>
            <Link
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#1a73e8",
                fontWeight: 500,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Create now <ArrowRight size={15} />
            </Link>
          </div>
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              aspectRatio: "4/3",
              background: "#f8f9fa",
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1542038374977-8da046c879eb?w=800&q=80"
              alt="Create"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      </section>

      {/* ── Storage callout ── */}
      <section style={{ background: "#f8f9fa", padding: "72px 24px" }}>
        <div
          style={{
            maxWidth: 840,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
          }}
        >
          <div
            style={{
              background: "#e8f0fe",
              borderRadius: 20,
              padding: "40px 36px",
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 300, color: "#1a73e8", marginBottom: 8 }}>15 GB</div>
            <div style={{ fontSize: 16, color: "#202124", fontWeight: 500, marginBottom: 8 }}>
              Free storage
            </div>
            <p style={{ fontSize: 14, color: "#5f6368", lineHeight: 1.7 }}>
              That's 3× more than many other cloud storage services. Back up and
              keep your memories safe automatically — at no cost.
            </p>
          </div>
          <div
            style={{
              background: "#fce8e6",
              borderRadius: 20,
              padding: "40px 36px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "#ea4335",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Wand2 size={24} color="#fff" />
            </div>
            <div style={{ fontSize: 16, color: "#202124", fontWeight: 500, marginBottom: 8 }}>
              AI-powered tools
            </div>
            <p style={{ fontSize: 14, color: "#5f6368", lineHeight: 1.7 }}>
              Edit, organize, search, and more — all with the power of on-device
              AI that keeps your photos private.
            </p>
          </div>
        </div>
      </section>

      {/* ── Search section ── */}
      <section id="search" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionPill>Search</SectionPill>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, lineHeight: 1.2, color: "#202124" }}>
              Search made simple
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {[
              { emoji: "🌍", label: "Travel highlights", example: "Best photos from my trips" },
              { emoji: "🐾", label: "People & pets", example: "Photos of Maria" },
              { emoji: "🍕", label: "Your favorite things", example: "Search by emoji" },
              { emoji: "📍", label: "Places", example: "Photos taken in Paris" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "#f8f9fa",
                  borderRadius: 16,
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  cursor: "pointer",
                }}
                onClick={() => handleSearchClick(item.example)}
              >
                <span style={{ fontSize: 36 }}>{item.emoji}</span>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#202124" }}>{item.label}</div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#5f6368",
                    background: "#fff",
                    border: "1px solid #e8eaed",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontStyle: "italic",
                  }}
                >
                  "{item.example}"
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Edit section ── */}
      <section id="edit" style={{ padding: "80px 24px", background: "#202124" }}>
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            alignItems: "center",
          }}
        >
          <div>
            <SectionPill>Edit</SectionPill>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 400,
                lineHeight: 1.2,
                color: "#fff",
                marginBottom: 32,
              }}
            >
              Photos enhanced with AI
            </h2>
            {[
              { icon: "✨", title: "Edit by asking", body: "Describe edits and watch them appear instantly." },
              { icon: "🪄", title: "Magic Eraser", body: "Remove distractions from your photos with one tap." },
              { icon: "🔆", title: "Photo Unblur", body: "Go from blurry to breathtaking automatically." },
            ].map((f) => (
              <div key={f.title} style={{ display: "flex", gap: 16, marginBottom: 28 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: "#9aa0a6", lineHeight: 1.7 }}>{f.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "16/9" }}>
              <img
                src="https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=800&q=80"
                alt="Before edit"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "16/9", filter: "saturate(1.4) contrast(1.05)" }}>
              <img
                src="https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=800&q=80"
                alt="After edit"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#9aa0a6", background: "#2d2d2d", borderRadius: 8, padding: "6px 0" }}>Before</div>
              <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#1a73e8", background: "#2d2d2d", borderRadius: 8, padding: "6px 0" }}>After</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Organize section ── */}
      <section id="organize" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 56px" }}>
            <SectionPill>Organize</SectionPill>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, lineHeight: 1.2, color: "#202124", marginBottom: 16 }}>
              Organized with the help of AI
            </h2>
            <p style={{ fontSize: 16, color: "#5f6368", lineHeight: 1.7 }}>
              Your photos are automatically organized, so you can spend more time
              enjoying your memories and less time arranging them.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            <FeatureCard
              icon={<Search size={24} color="#fff" />}
              color="#4285f420"
              title="Smart Search"
              body="Find any photo by searching for people, places, pets, or objects. Just type what you remember."
            />
            <FeatureCard
              icon={<Upload size={24} color="#fff" />}
              color="#34a85320"
              title="Auto Backup"
              body="Every photo you take is automatically backed up to your private gallery in full resolution."
            />
            <FeatureCard
              icon={<Share2 size={24} color="#fff" />}
              color="#fbbc0520"
              title="Shared Albums"
              body="Create shared albums and collaborate with friends. Everyone can add and view photos together."
            />
          </div>
        </div>
      </section>

      {/* ── Memories full-bleed ── */}
      <section style={{ background: "#f8f9fa", padding: "0 0 80px" }}>
        <div style={{ position: "relative", height: 400, overflow: "hidden" }}>
          <img
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80"
            alt="Memories"
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.65)" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 24px",
            }}
          >
            <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 400, color: "#fff", marginBottom: 16 }}>
              Stroll down memory lane
            </h2>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", maxWidth: 520, lineHeight: 1.7 }}>
              Easily revisit your favorite memories. Your top shots are curated
              for you so you can share them with the people who made those moments special.
            </p>
          </div>
        </div>
      </section>

      {/* ── Share section ── */}
      <section id="share" style={{ padding: "80px 24px", background: "#fff" }}>
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            alignItems: "center",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80",
              "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&q=80",
              "https://images.unsplash.com/photo-1507003213669-56e2cf9617e4?w=400&q=80",
              "https://images.unsplash.com/photo-1494790108375-be9c29c29305?w=400&q=80",
            ].map((src, i) => (
              <div key={i} style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "1" }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
          <div>
            <SectionPill>Share</SectionPill>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, lineHeight: 1.2, color: "#202124", marginBottom: 20 }}>
              Share every smile
            </h2>
            <p style={{ fontSize: 16, color: "#5f6368", lineHeight: 1.8, marginBottom: 24 }}>
              Easily share photos, videos, and albums with any of your contacts —
              even if they don't use PixelBox.
            </p>
            {[
              "Share to everyday apps like WhatsApp and Instagram",
              "Create shareable links for anyone",
              "Automatically share with trusted contacts",
              "Shared albums everyone can contribute to",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#34a853",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Check size={12} color="#fff" strokeWidth={3} />
                </div>
                <span style={{ fontSize: 14, color: "#5f6368", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Safety section ── */}
      <section id="safety" style={{ padding: "80px 24px", background: "#f0f4ff" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 56px" }}>
            <SectionPill>Safety</SectionPill>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, lineHeight: 1.2, color: "#202124", marginBottom: 16 }}>
              A safe home for your life's memories
            </h2>
            <p style={{ fontSize: 16, color: "#5f6368", lineHeight: 1.7 }}>
              Your data is yours. Everything you add belongs to you, and we never
              sell your personal information to anyone.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {[
              {
                icon: <Shield size={24} color="#1a73e8" />,
                bg: "#e8f0fe",
                title: "Your memories are safe",
                body: "We operate advanced security infrastructure to help keep your photos and videos protected.",
              },
              {
                icon: <Check size={24} color="#34a853" />,
                bg: "#e6f4ea",
                title: "No ads. Ever.",
                body: "PixelBox never sells your photos, videos, or personal information, and we don't use your photos for advertising.",
              },
              {
                icon: <Upload size={24} color="#fbbc05" />,
                bg: "#fef3cd",
                title: "Export anytime",
                body: "Download all your photos at any time. Your content, your rules — no lock-in.",
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{ background: "#fff", borderRadius: 20, padding: "32px 28px", border: "1.5px solid #e8eaed" }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: card.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  {card.icon}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#202124", marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontSize: 14, color: "#5f6368", lineHeight: 1.7 }}>{card.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 400, color: "#202124", marginBottom: 8, textAlign: "center" }}>
            Frequently asked questions
          </h2>
          <p style={{ fontSize: 15, color: "#5f6368", textAlign: "center", marginBottom: 48 }}>
            Everything you need to know about PixelBox.
          </p>
          <FaqItem
            q="How much storage do I get?"
            a="Every account comes with 15 GB of free storage for your photos and videos. You can upgrade to a paid plan to get even more storage."
          />
          <FaqItem
            q="Is my data private?"
            a="Absolutely. Your photos are encrypted and private by default. We never sell your personal data or use your photos for advertising."
          />
          <FaqItem
            q="Can I use PixelBox on all my devices?"
            a="Yes — PixelBox works on iOS, Android, and any modern web browser. Your photos stay in sync across all your devices automatically."
          />
          <FaqItem
            q="How do I back up my photos?"
            a="Once you sign up and install the app, your camera roll is backed up automatically whenever you're on Wi-Fi. You can also enable mobile data backup in settings."
          />
          <FaqItem
            q="Can I share albums with people who don't have an account?"
            a="Yes. You can create a shareable link for any album or photo that anyone can open in a browser — no account required."
          />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        style={{
          padding: "80px 24px",
          background: "linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 400, color: "#fff", marginBottom: 16 }}>
          Start your free gallery today
        </h2>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 36 }}>
          No credit card required. Get started in seconds.
        </p>
        <Link
          href="/register"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "16px 36px",
            borderRadius: 32,
            background: "#fff",
            color: "#1a73e8",
            fontWeight: 600,
            fontSize: 16,
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            transition: "transform 0.15s",
          }}
        >
          <Upload size={18} />
          Create Your Gallery
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid #e8eaed",
          padding: "32px 48px",
          background: "#fff",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <path d="M16 9.5a6.5 6.5 0 0 1 6.5 6.5H16V9.5z" fill="#4285F4"/>
            <path d="M22.5 16a6.5 6.5 0 0 1-6.5 6.5V16h6.5z" fill="#34A853"/>
            <path d="M16 22.5a6.5 6.5 0 0 1-6.5-6.5H16v6.5z" fill="#FBBC05"/>
            <path d="M9.5 16a6.5 6.5 0 0 1 6.5-6.5V16H9.5z" fill="#EA4335"/>
          </svg>
          <span style={{ fontSize: 14, color: "#5f6368" }}>PixelBox</span>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {["Privacy", "Terms", "Help", "About"].map((l) => (
            <a key={l} href="#" style={{ fontSize: 13, color: "#5f6368", textDecoration: "none" }}>
              {l}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
