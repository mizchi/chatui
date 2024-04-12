import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// 入力エリアコンポーネント
export function Editor({ initialValue, onChange, disabled }: { disabled: boolean, initialValue: string, onChange: (text: string) => void }) {
  const [inputValue, setInputValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isDisabled, setIsDisabled] = useState(true);

  useLayoutEffect(() => {
    if (!ref.current) return;
    setIsDisabled(false);
    setTimeout(() => {
      ref.current!.focus()
      ref.current!.setSelectionRange(initialValue.length, initialValue.length);
    }, 0);
  }, [ref]);

  const onChangeTextarea = useCallback((ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = (ev.target as any).value;
    console.log('value', value);
    setInputValue(value);
    onChange(value);
  }, [onChange, setInputValue]);

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      if (ev.metaKey && ev.key === 'Enter') {
        setInputValue('');
      }
    }
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    }
  }, [setInputValue]);

  return (
    <div className="p-1 bg-gray-800 flex h-full w-full flex-col">
      <textarea
        value={inputValue}
        onChange={onChangeTextarea}
        autoComplete="off"
        disabled={isDisabled || disabled}
        ref={ref}
        className={`flex-1 p-2 bg-gray-700 text-white resize-none outline-none border-none rounded ${disabled ? 'cursor-not-allowed' : 'cursor-text'}`}
        placeholder={disabled ? 'Locked...' : "Type your message here..."}
      />
    </div>
  );
}
