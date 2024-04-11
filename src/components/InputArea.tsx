import { useEffect, useLayoutEffect, useRef, useState } from "react";

// 入力エリアコンポーネント
const DRAFT_KEY = 'input-draft'
export function InputArea({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [inputValue, setInputValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    const savedValue = localStorage.getItem(DRAFT_KEY);
    if (savedValue) {
      setInputValue(savedValue);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    localStorage.setItem(DRAFT_KEY, e.target.value);
    setInputValue(e.target.value);
  };

  const handleSend = () => {
    if (inputValue.trim() === '') return;
    onSubmit(inputValue); // 親コンポーネントに送信
    setInputValue('');
    localStorage.removeItem(DRAFT_KEY);
  };

  useLayoutEffect(() => {
    if (!ref.current) return;
    setIsDisabled(false);
    setTimeout(() => ref.current!.focus(), 0);

  }, [ref]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && e.metaKey) {
      handleSend();
    }
  }

  return (
    <div className="p-4 bg-gray-800 flex h-full w-full flex-col">
      <textarea
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        ref={ref}
        className="flex-1 p-2 bg-gray-700 text-white resize-none outline-none border-none"
        placeholder="Type your message here..."
        value={inputValue}
        onChange={handleInputChange}
      />
      <button
        disabled={inputValue.trim() === ''}
        type="button"
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all disabled:bg-gray-400 disabled:cursor-not-allowed py-2 px-4 rounded mt-2 w-full"
        onClick={handleSend}
      >
        ✈
      </button>
    </div>
  );
}
