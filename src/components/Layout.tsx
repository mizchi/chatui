import { useEffect, useState } from "react";

// Layout.tsx
interface LayoutProps {
  main: React.ReactNode;
  sidebar: React.ReactNode;
  tools: React.ReactNode;
  // isSidebarOpen: boolean;
}

export function Layout({ main, sidebar, tools }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === `Escape`) {
        setIsSidebarOpen(false);
      }
      if (!e.metaKey && e.key === `Enter`) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isSidebarOpen, setIsSidebarOpen]);
  return (
    <div className={`flex h-screen bg-gray-800 ${isSidebarOpen ? 'justify-center' : ''}`}>
      <header className="bg-gray-800 text-white p-1 flex items-center justify-between w-full fixed top-0 z-10">
        <h1 className="text-xl font-bold">&nbsp;</h1>
        <div>
          {tools}
          &nbsp;
          {isSidebarOpen ? (
            <button type='button' className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              →
            </button>
          ) : (
            <button type='button' className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              📝
            </button>
          )}

        </div>
      </header>

      <div className="flex-1 overflow-y-auto mt-8">
        {main}
      </div>
      {isSidebarOpen && (
        <div className="flex-1 overflow-y-auto mt-8">
          {sidebar}
        </div>
      )}
    </div>
  );
}