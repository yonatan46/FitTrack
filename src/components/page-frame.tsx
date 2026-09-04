import { AppSidebar } from "@/components/app-sidebar";

export function PageFrame({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow: string }) {
  return <main className="app-shell"><AppSidebar /><section className="main-content"><header className="topbar"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div></header>{children}</section></main>;
}
