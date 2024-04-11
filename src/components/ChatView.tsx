import { useEffect, useRef } from "react";
import { ChatMessage } from "../api";

export function ChatView({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<null | HTMLDivElement>(null); // 末尾にスクロールするためのref
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" }); // メッセージが更新されるたびに末尾にスクロール
  }, [messages]); // 依存配列にmessagesを設定
  return (
    <div className="w-full h-full overflow-y-auto p-6 bg-gray-900">
      <div className="max-w-xl mx-auto">
        {messages.length === 0 && (
          <div className="text-center text-gray-400">No messages yet</div>
        )}
        {messages.map((message, index) => (
          <div key={index} className="mb-4">
            <div
              className={`px-4 py-2 rounded-lg ${message.role === 'user'
                ? 'bg-blue-800 text-blue-100'
                : 'bg-gray-700 text-gray-300'
                }`}
            >
              <p>{message.content}</p>
              {message.generating && (
                <p className="text-xs text-gray-500">Generating...</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} /> {/* スクロール位置のマーカー */}
      </div>
    </div>
  );
}
