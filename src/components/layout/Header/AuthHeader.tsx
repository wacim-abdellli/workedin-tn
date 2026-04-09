import { useTranslation } from "@/i18n";
import { Logo } from "@/components/ui/Logo";

interface AuthHeaderProps {
  onHome: () => void;
  dir: "rtl" | "ltr";
}

export function AuthHeader({ onHome, dir }: AuthHeaderProps) {
  const { tx } = useTranslation();

  return (
    <>
      <header
        dir={dir}
        className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-center bg-transparent"
      >
        <button
          onClick={onHome}
          className="flex items-center justify-center"
          aria-label={tx("header.a11y.goHome", undefined, "Go to homepage")}
        >
          <Logo variant="mark" size="sm" mode="client" />
        </button>
      </header>
      <div className="h-16" />
    </>
  );
}
