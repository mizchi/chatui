import { useEffect, useRef } from "react";
import { ChatMessage } from "../types";

export function ChatView({ messages, generating }: { messages: ChatMessage[], generating: boolean }) {
  const bottomRef = useRef<null | HTMLDivElement>(null); // 末尾にスクロールするためのref
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" }); // メッセージが更新されるたびに末尾にスクロール
  }, [messages]);
  return (
    <div className="w-full h-full overflow-y-auto px-6 py-6 pb-10 bg-gray-900">
      <div className="max-w-xl mx-auto">
        {messages.length === 0 && (
          <div className="text-center text-gray-400">No messages yet</div>
        )}
        {messages.map((message, index) => (
          <div key={index} className="mb-4">
            <div
              className={`px-4 py-2 rounded-lg ${message.role === 'user'
                ? 'bg-gray-800 text-gray-400'
                : 'bg-gray-800 text-gray-200'
                }`
              }
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {index === messages.length - 1 && generating && (
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
