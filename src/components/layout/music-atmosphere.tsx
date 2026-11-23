import { AudioLines, Headphones, Mic2, Music2 } from "lucide-react";

export function MusicAtmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden text-[#D6A0FF]" aria-hidden="true">
      <Music2 className="music-ambient-symbol absolute left-[3%] top-[24%] size-8 -rotate-12 opacity-[0.055] sm:size-10" />
      <Mic2 className="music-ambient-symbol music-ambient-symbol-delay absolute right-[3%] top-[47%] size-9 rotate-12 opacity-[0.05] sm:size-11" />
      <AudioLines className="music-ambient-symbol music-ambient-symbol-slow absolute bottom-[19%] left-[4%] size-10 opacity-[0.045] sm:size-12" />
      <Headphones className="music-ambient-symbol music-ambient-symbol-delay absolute bottom-[12%] right-[5%] hidden size-14 -rotate-6 opacity-[0.04] lg:block" />
    </div>
  );
}
