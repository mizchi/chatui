import "../gfm-dark.css";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "../types";
import { compileMarkdown } from "../utils/markdown";

export function ChatView({ messages, generating }: { messages: ChatMessage[], generating: boolean }) {
  const bottomRef = useRef<null | HTMLDivElement>(null); // 末尾にスクロールするためのref
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" }); // メッセージが更新されるたびに末尾にスクロール
  }, [messages]);
  return (
    <div className="w-full h-full overflow-y-auto px-6 py-6 pb-10 bg-gray-900">
      <div className="max-w-xl mx-auto">
        {messages.length === 0 && (
          <>
            <div className="text-center text-gray-400">Let's chat!</div>
            <ol className="list-decimal text-white p-3">
              <li>
                <b>Enter</b> to post message.
              </li>
              <li>
                Activate microphone and start speaking.
              </li>
            </ol>
          </>
        )}
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          return <Message
            key={index}
            message={message}
            isGenerating={isLast && generating}
            onCompiled={isLast ? () => {
              setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" })
              }, 32);
            } : undefined}
          />
        })}
        {/* 末尾 */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// import {  } from 'shiki'

function Message(props: { message: ChatMessage, isGenerating: boolean, onCompiled?: () => void }) {
  const [el, setEl] = useState<React.ReactNode | null>(null);
  useEffect(() => {
    compileMarkdown(props.message.content).then(async (compiled) => {
      // console.log('compiled', compiled);
      setEl(compiled.result);
      props.onCompiled?.();
      // setCompiled(compiled);
      // const el = await htmlToReact(compiled);
      // setEl(el.result);
    });
  }, [props.message, props.onCompiled]);

  return (
    <div className="mb-4">
      <div
        className={`px-4 py-2 rounded-lg ${props.message.role === 'user'
          ? 'bg-gray-700 text-gray-400'
          : 'bg-gray-800 text-gray-200'
          }`
        }
      >
        {props.isGenerating ? (
          <>
            <p className="whitespace-pre-wrap">{props.message.content || '...'}</p>
            <p className="text-xs text-gray-500">Generating...</p>
          </>
        ) : (
          <>
            {
              el
                ? <div className="markdown-body p-2 rounded">{el}</div>
                : <p className="whitespace-pre-wrap">{props.message.content}</p>
            }
          </>
        )}
      </div>
    </div>
  );
}