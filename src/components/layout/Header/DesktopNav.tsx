import { NavLink, useLocation } from "react-router-dom";
import {
  Archive,
  Bookmark,
  Briefcase,
  ChevronDown,
  Clock3,
  CreditCard,
  FolderOpen,
  ReceiptText,
  Search,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaceStore } from "@/lib/workspaceState";
import { resolveActiveWorkspace } from "@/lib/workspaceRoutes";
import { useTranslation } from "@/i18n";

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

function _accentClass(workspace: Workspace) {
  return workspace === "freelancer" ? "text-purple-400" : "text-amber-400";
}

function SimpleNavItem({ item, workspace: _workspace }: { item: NavItem; workspace: Workspace }) {
  if (!item.href) return null;

  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13.5px] font-medium transition-all duration-200 select-none ${
          isActive
            ? "text-[var(--workspace-primary)] bg-[color-mix(in_srgb,var(--workspace-primary)_9%,transparent)]"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/[0.05]"
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}

function DropdownMenu({ items }: { items: DropdownItem[] }) {
  return (
    <div
      className="absolute top-full left-0 mt-2.5 w-56 z-50 rounded-xl overflow-hidden
        invisible opacity-0 translate-y-1 pointer-events-none
        transition-all duration-200
        group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
        group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto"
      style={{
        background: 'rgba(14, 14, 17, 0.96)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="py-1.5">
        {items.map((subItem) => (
          <NavLink
            key={subItem.label}
            to={subItem.href}
            end
            className="group/item flex items-center gap-3 px-3.5 py-2.5 transition-colors duration-150 hover:bg-white/[0.05]"
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              <subItem.icon className="w-3.5 h-3.5 group-hover/item:text-[var(--workspace-primary)] transition-colors duration-150" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-zinc-200 group-hover/item:text-white leading-tight transition-colors duration-150">{subItem.label}</p>
              {subItem.description && (
                <p className="text-[11px] text-zinc-500 group-hover/item:text-zinc-400 mt-0.5 leading-tight truncate transition-colors duration-150">{subItem.description}</p>
              )}
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function DropdownNavItem({
  item,
  pathname,
  _workspace,
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
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13.5px] font-medium transition-all duration-200 select-none ${
          isActive
            ? "text-[var(--workspace-primary)] bg-[color-mix(in_srgb,var(--workspace-primary)_9%,transparent)]"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/[0.05]"
        }`}
      >
        {item.label}
        <ChevronDown
          className={`w-3.5 h-3.5 ml-0.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180 ${
            isActive ? "opacity-70" : "opacity-40"
          }`}
        />
      </button>
      <DropdownMenu items={children} />
    </div>
  );
}

export function WorkspaceNav() {
  const { profile, freelancerProfile } = useAuth();
  const { activeWorkspace } = useWorkspaceStore();
  const { pathname } = useLocation();
  const { tx } = useTranslation();
  
  const workspace = resolveActiveWorkspace(profile, freelancerProfile, activeWorkspace);

  const clientNav: NavItem[] = [
    { label: tx('nav.postProject', undefined, "Post Project"), href: "/jobs/new" },
    {
      label: tx('nav.myProjects', undefined, "My Projects"),
      children: [
        { label: tx('nav.client.activeProjects', undefined, "Active Projects"), href: "/client/jobs?tab=active", icon: FolderOpen, description: tx('nav.client.activeProjectsDesc', undefined, "Manage live briefs and hiring") },
        { label: tx('nav.client.drafts', undefined, "Drafts"), href: "/client/jobs?tab=all", icon: Clock3, description: tx('nav.client.draftsDesc', undefined, "All your posted projects") },
        { label: tx('nav.client.finished', undefined, "Finished"), href: "/client/jobs?tab=finished", icon: Archive, description: tx('nav.client.finishedDesc', undefined, "Review completed project history") },
      ],
    },
    {
      label: tx('nav.client.freelancers', undefined, "Freelancers"),
      children: [
        { label: tx('nav.client.browseTalent', undefined, "Browse Talent"), href: "/find-freelancers", icon: Users, description: tx('nav.client.browseTalentDesc', undefined, "Find skilled Tunisian freelancers") },
        { label: tx('nav.client.savedProfiles', undefined, "Saved Profiles"), href: "/saved", icon: Star, description: tx('nav.client.savedProfilesDesc', undefined, "Return to shortlisted talent") },
      ],
    },
    { label: tx('nav.contracts', undefined, "Contracts"), href: "/contracts" },
    { label: tx('nav.wallet', undefined, "Wallet"), href: "/wallet" },
  ];

  const freelancerNav: NavItem[] = [
    {
      label: tx('nav.findWork', undefined, "Find Work"),
      children: [
        { label: tx('nav.freelancer.browseJobs', undefined, "Browse Jobs"), href: "/jobs", icon: Briefcase, description: tx('nav.freelancer.browseJobsDesc', undefined, "Explore open local projects") },
        { label: tx('nav.freelancer.bestMatches', undefined, "Best Matches"), href: "/jobs?sort=best-match", icon: Search, description: tx('nav.freelancer.bestMatchesDesc', undefined, "Opportunities tuned to your profile") },
        { label: tx('nav.freelancer.savedJobs', undefined, "Saved Jobs"), href: "/jobs?sort=saved", icon: Bookmark, description: tx('nav.freelancer.savedJobsDesc', undefined, "Track roles you want to revisit") },
      ],
    },
    { label: tx('nav.proposals', undefined, "Proposals"), href: "/my-proposals" },
    { label: tx('nav.contracts', undefined, "Contracts"), href: "/contracts" },
    {
      label: tx('nav.wallet', undefined, "Wallet"),
      children: [
        { label: tx('nav.freelancer.overview', undefined, "Overview"), href: "/wallet", icon: Wallet, description: tx('nav.freelancer.overviewDesc', undefined, "Balance and payment status") },
        { label: tx('nav.freelancer.withdraw', undefined, "Withdraw"), href: "/wallet?tab=withdraw", icon: CreditCard, description: tx('nav.freelancer.withdrawDesc', undefined, "Move earnings to your account") },
        { label: tx('nav.freelancer.transactions', undefined, "Transactions"), href: "/wallet?tab=transactions", icon: ReceiptText, description: tx('nav.freelancer.transactionsDesc', undefined, "Review payout activity") },
      ],
    },
  ];

  const items = workspace === "freelancer" ? freelancerNav : clientNav;

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
