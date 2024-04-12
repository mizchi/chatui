import * as monaco from 'monaco-editor';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";


// 入力エリアコンポーネント
export function Editor({ initialValue, onChange, disabled }: { disabled: boolean, initialValue: string, onChange: (text: string) => void }) {
  // const [inputValue, setInputValue] = useState(initialValue);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    // setIsDisabled(false);

    const model = monaco.editor.createModel(initialValue, 'markdown');
    // https://farzadyz.com/blog/single-line-monaco-editor
    const editor = monaco.editor.create(ref.current, {
      value: initialValue,
      model: model,
      scrollBeyondLastColumn: 0,
      language: 'markdown',
      theme: 'vs-dark',
      automaticLayout: true,
      lineNumbers: 'off',
      fontSize: 18,
      tabSize: 2,
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 8,
      lineNumbersMinChars: 0,
      renderLineHighlight: "none",
      wordWrap: "off",
      padding: {
        top: 8,
        bottom: 3,
      },
      minimap: {
        enabled: false
      },
      overviewRulerLanes: 0,
      overviewRulerBorder: false,
      readOnly: true,
      insertSpaces: true,
    });
    model.updateOptions({ indentSize: 2 });
    setEditor(editor);
    editor.layout();
    editor.focus();
    model.setValue(initialValue);
    setTimeout(() => {
      editor.updateOptions({
        readOnly: false
      })
      editor.focus();
      editor.setPosition({
        column: model.getLineLength(model.getLineCount()) + 1,
        lineNumber: model.getLineCount(),
      });
    }, 0);
  }, [ref]);

  useEffect(() => {
    if (isInitialized) return;
    if (!editor) return;
    console.log('editor', editor);
    editor.onDidChangeModelContent((changed) => {
      console.log('editor.getValue()', changed, editor.getValue());
      onChange(editor.getValue());
    });
    setIsInitialized(true);

    // return () => {
    //   console.log('dispose');
    //   handler.dispose();
    // }
  }, [editor, isInitialized, onChange]);

  return (
    <div className="p-1 bg-gray-800 flex h-full w-full flex-col">
      <div ref={ref} className="h-full w-full"></div>
    </div>
  );
}
