import { useMicVAD } from "@ricky0123/vad-react"
import { utils } from "@ricky0123/vad-web"
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage, runOpenAI, transcript } from "../api";
import { SYSTEM_PROMPT } from "../data";
import { OPENAI_API_KEY, loadHistory, loadOrPromptOpenAIApiKey, saveHistory } from "../storage";
import { createAsyncQueue, createTextSplitter } from "../utils";
import { playClick, voicevox } from "../audio";
import { InputArea } from "./InputArea";
import { Layout } from "./Layout";

export function App() {
  // const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [locked, setLocked] = useState(false);
  const [listening, setListening] = useState(false);

  useThrottle(() => {
    console.log("Saving history");
    saveHistory(messages);
  }, 500, [messages]);
  // const [generating, setGenerating] = useState(false);
  const onSpeechStart = useCallback(() => {
    console.log("User started talking");
    setListening(true);
  }, [setLocked]);
  const addUserMessage = useCallback(async (input: string) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: input,
      },
    ]);

    const processVoicevox = async (text: string) => {
      await voicevox(text);
    };
    const asyncQueue = createAsyncQueue<string>(processVoicevox);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: '',
        generating: true,
      }
    ]);

    const splitter = /[。|?|？|!|！]/
    const textSplitter = createTextSplitter('', splitter);
    const answer = await runOpenAI({
      messages: [
        ...messages,
        {
          role: "user",
          content: input,
        },
      ],
      system: SYSTEM_PROMPT,
      model: "gpt-4-turbo",
      onUpdate: (text, delta) => {
        // consume(text);
        const lines = textSplitter.update(delta);
        for (const line of lines) {
          asyncQueue.enqueue(line);
        }
        // console.log(lines);
        setMessages((prev) => {
          return [
            ...prev.slice(0, -1),
            {
              role: "assistant",
              content: text,
              generating: true,
            },
          ]
        });
      }
    });
    const remainingText = textSplitter.drain();
    for (const line of remainingText) {
      asyncQueue.enqueue(line);
    }
    // consume(answer, true);
    await asyncQueue.drain();
    setLocked(false);
    setMessages((prev) => {
      return [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: answer,
        },
      ]
    });
  }, [setMessages, messages, setLocked, locked, listening]);

  const onSpeechEnd = useCallback(async (audio: Float32Array) => {
    setListening(false);
    if (locked) return;
    playClick();
    setLocked(true);
    const wavBuffer = utils.encodeWAV(audio);
    const result = await transcript(wavBuffer);
    addUserMessage(result.text);
  }, [setMessages, messages, setLocked, locked, listening, addUserMessage]);


  useEffect(() => {
    (async () => {
      const apiKey = await loadOrPromptOpenAIApiKey(OPENAI_API_KEY);
      const history = await loadHistory();
      console.log(apiKey);
      if (apiKey) {
        // setStarted(true);
        setMessages(history);
      }
    })();
  }, []);
  const [isActive, setIsActive] = useState(true);
  const onClickReset = async () => {
    if (confirm("Destroy all history?") === false) {
      return;
    }
    setMessages([]);
    await saveHistory([]);
  }

  // mainContentは VoiceChat であることを想定しています。
  const mainContent = (
    <>
      {
        !locked &&
        <MicListener onSpeechStart={onSpeechStart} onSpeechEnd={onSpeechEnd} />
      }
      <div className="flex-1 overflow-y-auto">
        <ChatView messages={messages} />
      </div>
    </>
  );
  const sidebarContent = (
    <InputArea onSubmit={(newText: string) => {
      addUserMessage(newText);
    }} />
  );

  const tools = (
    <>
      &nbsp;
      <button type='button' onClick={onClickReset} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
        ☠
      </button>
    </>
  );
  return (
    <Layout main={mainContent} sidebar={sidebarContent} tools={tools} />
  );

  // return (
  //   <Layout>
  //     <header className="text-white p-4">
  //       <h1 className="text-xl font-bold">Voice Chat</h1>
  //     </header>
  //     <VoiceChat initialMessages={inintialMessages} />
  //   </Layout>
  // );
}

function MicListener(props: {
  onSpeechStart: () => void,
  onSpeechEnd: (audio: Float32Array) => void,
}) {
  const vad = useMicVAD({
    startOnLoad: true,
    minSpeechFrames: 5,
    onSpeechStart: props.onSpeechStart,
    onSpeechEnd: props.onSpeechEnd,
  });

  return (
    <div>
      {vad.userSpeaking ? "🎤...." : ""}
    </div>
  );
}

function useThrottle(callback: () => void, delay: number, keys: any[] = []) {
  const lastRan = useRef(Date.now());
  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        callback();
        lastRan.current = Date.now();
      }
    }, delay - (Date.now() - lastRan.current));
    return () => {
      clearTimeout(handler);
    }
  }, [keys]);
}
function ChatView({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<null | HTMLDivElement>(null); // 末尾にスクロールするためのref

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" }); // メッセージが更新されるたびに末尾にスクロール
  }, [messages]); // 依存配列にmessagesを設定
  return (
    <div className="w-full h-full overflow-y-auto p-6 bg-gray-900">
      <div className="max-w-xl mx-auto">
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
