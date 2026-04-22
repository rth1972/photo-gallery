"use client";

import Image from "next/image";
import { AppShell } from "@/components/AppShell";
import { Users } from "lucide-react";

const PEOPLE = [
  { id: "1", name: "John",  avatar: "https://i.pravatar.cc/150?u=john"  },
  { id: "2", name: "Sarah", avatar: "https://i.pravatar.cc/150?u=sarah" },
  { id: "3", name: "Mike",  avatar: "https://i.pravatar.cc/150?u=mike"  },
];

export default function PeoplePage() {
  return (
    <AppShell title="People" subtitle={`${PEOPLE.length} people`}>
      {PEOPLE.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[--surfaceHover] flex items-center justify-center">
            <Users className="w-7 h-7 opacity-30" />
          </div>
          <p className="text-lg font-medium">No people yet</p>
          <p className="text-sm text-[--text-secondary] max-w-xs">
            Faces in your photos will appear here once detected.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {PEOPLE.map(person => (
            <button
              key={person.id}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-[--surfaceHover] transition-colors group"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[--surfaceHover] ring-2 ring-transparent group-hover:ring-[--accent] transition-all">
                <Image src={person.avatar} alt={person.name} width={64} height={64} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium">{person.name}</span>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}
