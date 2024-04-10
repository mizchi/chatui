import { useMicVAD } from "@ricky0123/vad-react"
import { utils } from "@ricky0123/vad-web"
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChatMessage, runOpenAI, transcript } from "./api";
import { SYSTEM_PROMPT } from "./data";
import { OPENAI_API_KEY, loadHistory, loadOrPromptOpenAIApiKey, saveHistory } from "./storage";
import { createAsyncQueue, createTextSplitter } from "./utils";
import { playClick, voicevox } from "./audio";

function App() {
  const [started, setStarted] = useState(false);
  const [inintialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const onClickStart = async () => {
    const apiKey = await loadOrPromptOpenAIApiKey(OPENAI_API_KEY);
    if (apiKey) {
      setStarted(true);
    }
  }
  useEffect(() => {
    (async () => {
      const apiKey = await loadOrPromptOpenAIApiKey(OPENAI_API_KEY);
      const history = await loadHistory();
      console.log(apiKey);
      if (apiKey) {
        setStarted(true);
        setInitialMessages(history);
      }
    })();
  }, [setStarted]);
  const [isActive, setIsActive] = useState(true);
  if (!started) {
    return <div>
      <h1>OpenAI API Key is required</h1>
      <button type='button' onClick={onClickStart}>Start</button>
    </div>
  }
  return (
    <>
      <button type='button' onClick={() => setIsActive(!isActive)}>Toggle</button>
      {isActive && <div>
        <VoiceChat initialMessages={inintialMessages} />
      </div>}
    </>
  );
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

function VoiceChat(props: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(props.initialMessages);
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
  const onSpeechEnd = useCallback(async (audio: Float32Array) => {
    setListening(false);
    if (locked) return;
    playClick();
    setLocked(true);
    const wavBuffer = utils.encodeWAV(audio);
    const result = await transcript(wavBuffer);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: result.text,
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
          content: result.text,
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

  const onClickReset = async () => {
    setMessages([]);
    await saveHistory([]);
  }
  return (
    <>
      <div>
        <button type='button' onClick={onClickReset}>Reset</button>
        {
          !locked &&
          <MicListener onSpeechStart={onSpeechStart} onSpeechEnd={onSpeechEnd} />
        }
      </div>
      <ChatView messages={messages} />
    </>
  );
}

function ChatView({ messages }: { messages: ChatMessage[] }) {
  return (
    <div>
      {messages.map((message, index) => (
        <div key={index}>
          <div>{message.role}: {message.content}</div>
        </div>
      ))}
    </div>
  );
}



createRoot(document.getElementById('root')!).render(<App />);