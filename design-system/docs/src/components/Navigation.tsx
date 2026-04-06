import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Palette,
  Box,
  Layout,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface NavSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { path: string; label: string }[];
}

const navSections: NavSection[] = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [{ path: "/getting-started", label: "Introduction" }],
  },
  {
    title: "Foundations",
    icon: Palette,
    items: [
      { path: "/foundations/colors", label: "Colors" },
      { path: "/foundations/typography", label: "Typography" },
      { path: "/foundations/spacing", label: "Spacing" },
      { path: "/foundations/shadows", label: "Shadows" },
      { path: "/foundations/animations", label: "Animations" },
    ],
  },
  {
    title: "Components",
    icon: Box,
    items: [
      { path: "/components/button", label: "Button" },
      { path: "/components/input", label: "Input" },
      { path: "/components/badge", label: "Badge" },
      { path: "/components/modal", label: "Modal" },
      { path: "/components/toast", label: "Toast" },
      { path: "/components/loading", label: "Loading States" },
    ],
  },
  {
    title: "Patterns",
    icon: Layout,
    items: [{ path: "/patterns/layout", label: "Layout Patterns" }],
  },
  {
    title: "Resources",
    icon: FileText,
    items: [
      { path: "/resources/migration", label: "Migration Guide" },
      { path: "/resources/changelog", label: "Changelog" },
    ],
  },
];

function NavSection({ section }: { section: NavSection }) {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = section.icon;

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <Icon className="w-4 h-4" />
        <span className="flex-1 text-left">{section.title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <ul className="mt-1 space-y-1">
          {section.items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    "block px-3 py-2 text-sm rounded-lg transition-colors",
                    isActive
                      ? "bg-background-subtle text-brand-primary font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-background-subtle",
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Navigation() {
  return (
    <nav className="w-64 border-r bg-background-base overflow-y-auto sticky top-16 h-[calc(100vh-4rem)]">
      <div className="p-4">
        {navSections.map((section) => (
          <NavSection key={section.title} section={section} />
        ))}
      </div>
    </nav>
  );
}
