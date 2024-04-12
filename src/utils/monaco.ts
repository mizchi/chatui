import * as monaco from 'monaco-editor';

// @ts-ignore
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
// @ts-ignore
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
// @ts-ignore
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
// @ts-ignore
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
// @ts-ignore
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}
export function initMonaco(el: HTMLDivElement, initialValue: string = '') {
  const model = monaco.editor.createModel('', 'markdown');
  const editor = monaco.editor.create(el, {
    model: model,
    scrollBeyondLastLine: false,
    scrollBeyondLastColumn: 0,
    language: 'markdown',
    theme: 'vs-dark',
    automaticLayout: true,
    lineNumbers: 'off',
    fontSize: 18,
    tabSize: 2,
    hover: {
      delay: 100,
    },
    padding: {
      top: 0,
      bottom: 70,
    },
    glyphMargin: false,
    folding: false,
    lineDecorationsWidth: 8,
    lineNumbersMinChars: 0,
    renderLineHighlight: "none",
    wordWrap: "off",
    minimap: {
      enabled: false
    },
    cursorBlinking: 'solid',
    overviewRulerLanes: 0,
    overviewRulerBorder: false,
    readOnly: true,
    insertSpaces: true,
  });
  model.updateOptions({ indentSize: 2 });
  editor.layout();
  editor.focus();
  setTimeout(() => {
    editor.updateOptions({
      readOnly: false
    });
    editor.setValue(initialValue);
    editor.focus();
    editor.setPosition({
      column: model.getLineLength(model.getLineCount()) + 1,
      lineNumber: model.getLineCount(),
    });
  }, 32);
  return editor;
}

export function bindMonacoActions(editor: monaco.editor.IStandaloneCodeEditor, onChange: (text: string) => void) {
  const d = editor.addAction({
    id: 'send',
    label: 'Submit',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    run: (editor) => {
      const value = editor.getValue();
      editor.setValue('');
      onChange(value);
    },
  });
  return () => d.dispose();
}