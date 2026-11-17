"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

const MOBILE_HEADER_OFFSET = 142;
const FOCUS_SEARCH_KEY = "tocala-focus-search";

export function MobileSearchShortcut() {
  const pathname = usePathname();
  const [homeSearchHidden, setHomeSearchHidden] = useState(false);
  const visible = pathname !== "/" || homeSearchHidden;

  useEffect(() => {
    if (pathname !== "/") return;

    const searchBar = document.querySelector<HTMLElement>("[data-search-bar]");
    if (!searchBar) return;

    let focusTimer: number | undefined;
    if (window.sessionStorage.getItem(FOCUS_SEARCH_KEY)) {
      window.sessionStorage.removeItem(FOCUS_SEARCH_KEY);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      focusTimer = window.setTimeout(() => {
        document.getElementById("busca")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        (document.getElementById("busca-talentos") as HTMLInputElement | null)?.focus({ preventScroll: true });
      }, reduceMotion ? 0 : 180);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHomeSearchHidden(!entry.isIntersecting && entry.boundingClientRect.bottom < MOBILE_HEADER_OFFSET);
      },
      {
        rootMargin: `-${MOBILE_HEADER_OFFSET}px 0px 0px 0px`,
        threshold: [0, 1],
      },
    );

    observer.observe(searchBar);
    return () => {
      observer.disconnect();
      if (focusTimer !== undefined) window.clearTimeout(focusTimer);
    };
  }, [pathname]);

  function handleSearchClick(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== "/") {
      window.sessionStorage.setItem(FOCUS_SEARCH_KEY, "true");
      return;
    }

    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("busca")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.setTimeout(
      () => (document.getElementById("busca-talentos") as HTMLInputElement | null)?.focus({ preventScroll: true }),
      reduceMotion ? 0 : 420,
    );
  }

  const label = pathname === "/" ? "Voltar para a busca" : "Ir para a busca de artistas";

  return (
    <div
      aria-hidden={!visible}
      className={`mobile-search-shortcut pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+82px)] z-[70] mx-auto flex w-full max-w-[400px] justify-end px-4 transition-[opacity,transform] duration-200 lg:hidden ${visible ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-95 opacity-0"}`}
    >
      <Link
        href="/#busca"
        onClick={handleSearchClick}
        aria-label={label}
        title={label}
        tabIndex={visible ? 0 : -1}
        className={`flex size-11 items-center justify-center rounded-full border border-[#D6A0FF]/35 bg-[#6C1EE7] text-white shadow-lg shadow-[#6C1EE7]/40 backdrop-blur-xl transition active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6A0FF] ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <Search className="size-5" strokeWidth={2.25} aria-hidden="true" />
      </Link>
    </div>
  );
}
