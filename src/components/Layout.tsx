// Layout.tsx
interface LayoutProps {
  main: React.ReactNode;
  editor: React.ReactNode;
  editorTools: React.ReactNode;
  tools: React.ReactNode;
  dialogOpened: boolean;
  isEditorOpen: boolean;
}

export function Layout({ main, editor, tools, dialogOpened, editorTools, isEditorOpen }: LayoutProps) {
  // stop window scroll
  return (
    <div className="flex flex-col h-screen bg-gray-800">
      <div className="flex-1 overflow-y-auto">{main}</div>
      {isEditorOpen && <div className="flex-1 overflow-y-auto">{editor}</div>}
      <footer className="bg-gray-800 text-white p-1 flex items-center justify-between w-full fixed bottom-0 z-10">
        <div>{dialogOpened && tools}</div>
        <div>{editorTools}</div>
      </footer>
    </div>
  );
}