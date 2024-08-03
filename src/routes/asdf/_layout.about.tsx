import { createFileRoute } from '@tanstack/react-router';
import { open } from '@tauri-apps/api/shell';

export const Route = createFileRoute('/asdf/_layout/about')({
  component: Page,
});

function Page() {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    void open(e.currentTarget.href);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <p className="text-secondary-foreground">
        This tool was created by{' '}
        <a href="https://sharath.uk" onClick={handleLinkClick} className="hover:underline">
          sharath.uk
        </a>
      </p>
      <p className="text-secondary-foreground">
        Visit official landing page at{' '}
        <a href="https://sharath.uk/dxup" onClick={handleLinkClick} className="hover:underline">
          sharath.uk/dxup
        </a>
      </p>
    </div>
  );
}
