import * as monaco from 'monaco-editor';
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { bindMonacoActions, initMonaco } from '../utils/monaco';

export function Editor({ initialValue, onChange, openAiApiKey, onSubmit }: {
  initialValue: string,
  openAiApiKey?: string | null,
  onSubmit: (text: string) => void,
  onChange: (text: string) => void
}) {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const editor = initMonaco(ref.current, initialValue);
    // editor.getModel()?.setValue(initialValue);
    setEditor(editor);
    console.log('editor', initialValue);
    editor.setValue(initialValue);
    editor.getModel()?.setValue(initialValue);

    // resize editor
    const resizeObserver = new ResizeObserver(() => {
      editor.layout();
    });
    resizeObserver.observe(ref.current);
    return () => {
      editor.dispose();
      resizeObserver.disconnect();
    };
  }, [ref]);

  useEffect(() => {
    if (!editor) return;
    const d = bindMonacoActions(editor, onSubmit);
    return () => {
      d();
    };
  }, [editor, onSubmit]);

  useEffect(() => {
    if (isInitialized) return;
    if (!editor) return;
    editor.onDidChangeModelContent((changed) => {
      onChange(editor.getValue());
    });

    setIsInitialized(true);
  }, [editor, isInitialized, onChange]);

  return (
    <div className="p-3 flex h-full w-full flex-col items-center" style={{
      background: '#1E1E1E'
    }}>
      {/* <div ref={ref} className="h-full w-full mb-5"></div> */}
      <div ref={ref} className="h-full w-full mb-5 max-w-2xl mx-auto rounded"></div>
    </div>
  );
}
