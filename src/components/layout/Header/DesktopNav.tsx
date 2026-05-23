import { NavLink, useLocation } from "react-router-dom";
import {
  Archive,
  Bookmark,
  Briefcase,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  FolderOpen,
  PlusCircle,
  ReceiptText,
  Search,
  Send,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaceStore } from "@/lib/workspaceState";
import { resolveActiveWorkspace } from "@/lib/workspaceRoutes";

type Workspace = "client" | "freelancer";

interface DropdownItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

interface NavItem {
  label: string;
  href?: string;
  children?: DropdownItem[];
}

const CLIENT_NAV: NavItem[] = [
  { label: "Post Project", href: "/jobs/new" },
  {
    label: "My Projects",
    children: [
      { label: "Active Projects", href: "/client/jobs?tab=active", icon: FolderOpen, description: "Manage live briefs and hiring" },
      { label: "Drafts", href: "/client/jobs?tab=all", icon: Clock3, description: "All your posted projects" },
      { label: "Finished", href: "/client/jobs?tab=finished", icon: Archive, description: "Review completed project history" },
    ],
  },
  {
    label: "Freelancers",
    children: [
      { label: "Browse Talent", href: "/find-freelancers", icon: Users, description: "Find skilled Tunisian freelancers" },
      { label: "Saved Profiles", href: "/saved", icon: Star, description: "Return to shortlisted talent" },
    ],
  },
  { label: "Contracts", href: "/contracts" },
  { label: "Wallet", href: "/wallet" },
];

const FREELANCER_NAV: NavItem[] = [
  {
    label: "Find Work",
    children: [
      { label: "Browse Jobs", href: "/jobs", icon: Briefcase, description: "Explore open local projects" },
      { label: "Best Matches", href: "/jobs?sort=best-match", icon: Search, description: "Opportunities tuned to your profile" },
      { label: "Saved Jobs", href: "/jobs?sort=saved", icon: Bookmark, description: "Track roles you want to revisit" },
    ],
  },
  { label: "Proposals", href: "/my-proposals" },
  { label: "Contracts", href: "/contracts" },
  {
    label: "Wallet",
    children: [
      { label: "Overview", href: "/wallet", icon: Wallet, description: "Balance and payment status" },
      { label: "Withdraw", href: "/wallet?tab=withdraw", icon: CreditCard, description: "Move earnings to your account" },
      { label: "Transactions", href: "/wallet?tab=transactions", icon: ReceiptText, description: "Review payout activity" },
    ],
  },
];

function accentClass(workspace: Workspace) {
  return workspace === "freelancer" ? "text-purple-400" : "text-amber-400";
}

function SimpleNavItem({ item, workspace }: { item: NavItem; workspace: Workspace }) {
  if (!item.href) return null;

  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        [
          "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium",
          "transition-colors duration-150 whitespace-nowrap",
          isActive
            ? accentClass(workspace)
            : "text-white/55 hover:text-white hover:bg-white/[0.05]",
        ].join(" ")
      }
    >
      {item.label}
    </NavLink>
  );
}

function DropdownMenu({ items }: { items: DropdownItem[] }) {
  return (
    <div className="absolute top-full left-0 mt-1 w-56 z-50 rounded-xl border border-white/[0.08] bg-[#111111] shadow-2xl shadow-black/50 py-1.5 overflow-hidden invisible opacity-0 translate-y-1 pointer-events-none transition-all duration-150 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto">
      {items.map((subItem) => (
        <NavLink
          key={subItem.label}
          to={subItem.href}
          end
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors duration-100"
        >
          <subItem.icon className="w-4 h-4 text-white/30 flex-shrink-0" />
          <div>
            <p className="font-medium text-white/80">{subItem.label}</p>
            {subItem.description && (
              <p className="text-xs text-white/35 mt-0.5">{subItem.description}</p>
            )}
          </div>
        </NavLink>
      ))}
    </div>
  );
}

function DropdownNavItem({
  item,
  pathname,
  workspace,
}: {
  item: NavItem;
  pathname: string;
  workspace: Workspace;
}) {
  const children = item.children ?? [];
  const isActive = children.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`));

  return (
    <div className="relative group">
      <button
        type="button"
        className={[
          "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium",
          "transition-colors duration-150 whitespace-nowrap",
          isActive ? accentClass(workspace) : "text-white/55 hover:text-white hover:bg-white/[0.05]",
        ].join(" ")}
      >
        {item.label}
        <ChevronDown className="w-3.5 h-3.5 text-white/35 group-hover:text-white/70 group-focus-within:text-white/70 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>
      <DropdownMenu items={children} />
    </div>
  );
}

export function WorkspaceNav() {
  const { profile, freelancerProfile } = useAuth();
  const { activeWorkspace } = useWorkspaceStore();
  const { pathname } = useLocation();
  const workspace = resolveActiveWorkspace(profile, freelancerProfile, activeWorkspace);
  const items = workspace === "freelancer" ? FREELANCER_NAV : CLIENT_NAV;

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) =>
        item.children ? (
          <DropdownNavItem key={item.label} item={item} pathname={pathname} workspace={workspace} />
        ) : (
          <SimpleNavItem key={item.label} item={item} workspace={workspace} />
        )
      )}
    </nav>
  );
}
