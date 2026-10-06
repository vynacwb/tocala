import { Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="mx-auto mt-24 max-w-[400px] px-5 pb-32 lg:max-w-[1200px] lg:px-6 lg:pb-8">
      <div className="flex flex-col gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/45 lg:text-sm">© 2026 TocaLá. Todos os direitos reservados.</p>
        <div className="flex items-center gap-3" aria-label="Redes sociais">
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-white/55 transition hover:border-[#BA3BE7] hover:text-[#D6A0FF]" aria-label="Instagram">
            <Instagram className="size-5" strokeWidth={1.8} />
          </a>
          <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-white/55 transition hover:border-[#BA3BE7] hover:text-[#D6A0FF]" aria-label="YouTube">
            <Youtube className="size-5" strokeWidth={1.8} />
          </a>
        </div>
      </div>
    </footer>
  );
}
