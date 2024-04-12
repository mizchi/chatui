import { useCallback, useEffect, useRef, useState } from "react";
import { runOpenAI, transcript } from "../api";
import { defaultAppState, loadAppState, saveAppState } from "../storage";
import { createAsyncQueue, createTextSplitter } from "../utils";
import { SPEAKERS, SYSTEMS } from "../data";
import { utils } from "@ricky0123/vad-web";
import { Dialog, createNewDialog, db, updateMessages } from "../db";
import { playClick as playClickSound, voicevox } from "../audio";
import { AppState, ChatMessage } from "../types";

type SetAppState = React.Dispatch<React.SetStateAction<AppState>>;

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

export function useApp() {
  const [app, setAppState] = useState<AppState>(defaultAppState);

  useEffect(() => {
    (async () => {
      const appState = await loadAppState();
      if (!appState.openaiApiKey) {
        appState.openaiApiKey = prompt("Enter OpenAI API Key");
      }
      if (!appState.anthropicApiKey) {
        appState.anthropicApiKey = prompt("Enter Anthropic API Key");
      }
      setAppState(appState);
    })();
  }, []);

  useThrottle(() => {
    saveAppState(app).then(() => {
      // console.log("Saved", app)
    });
  }, 500, [app, app.messages, app]);
  const actions = useActions(app, setAppState);

  useKeyEvents(app, setAppState, actions);

  return { app, actions };
}

function useActions(app: AppState, setApp: SetAppState) {
  const setIsEditorOpen = useCallback((isEditorOpen: boolean) => {
    setApp(old => ({
      ...old,
      isEditorOpen,
    }));
  }, []);

  const selectDialog = useCallback((dialog: Dialog) => {
    setApp({
      ...app,
      ctxId: dialog.id!,
      messages: dialog.messages,
    });
  }, [app])

  const addMessage = useCallback(async (input: string) => {
    setIsEditorOpen(false);
    let currentMessages: ChatMessage[] = [
      ...app.messages,
      {

        role: "user",
        content: input,
      },
    ];
    setApp({
      ...app,
      messages: currentMessages,
    });
    const processVoicevox = async (text: string) => {
      const speaker = SPEAKERS.find(s => s.id === app.speaker);
      if (speaker?.type === 'voicevox') {
        await voicevox(text, speaker);
      }
    };
    const asyncQueue = createAsyncQueue<string>(processVoicevox);
    currentMessages = [
      ...currentMessages,
      {
        role: "assistant",
        content: '',
      }
    ]
    setApp({
      ...app,
      messages: currentMessages
    });

    const splitter = /[。|?|？|!|！]/
    const textSplitter = createTextSplitter('', splitter);
    const systemContent = SYSTEMS.find(s => s.id === app.system)?.content;
    const answer = await runOpenAI({
      apiKey: app.openaiApiKey!,
      model: app.model!,
      messages: [
        ...currentMessages.map(t => ({ role: t.role, content: t.content })),
        {
          role: "user",
          content: input,
        },
      ],
      system: systemContent!,
      onUpdate: (text, delta) => {
        const lines = textSplitter.update(delta);
        for (const line of lines) {
          asyncQueue.enqueue(line);
        }
        currentMessages = [
          ...currentMessages.slice(0, -1),
          {
            role: "assistant",
            content: text,
          },
        ];
        setApp(old => ({
          ...old,
          generating: true,

          messages: currentMessages.slice(),
        }));
      }
    });
    const remainingText = textSplitter.drain();
    for (const line of remainingText) {
      asyncQueue.enqueue(line);
    }
    await asyncQueue.drain();
    currentMessages = [
      ...currentMessages.slice(0, -1),
      {
        role: "assistant",
        content: answer,
      },
    ];
    setApp(old => ({
      ...old,
      draft: '',
      locked: false,
      generating: false,
      messages: currentMessages.slice(),
    }));
    await updateMessages(app.ctxId!, currentMessages);
  }, [app, setApp, app.isEditorOpen, app.locked, app.messages, setIsEditorOpen]);

  const backToTop = useCallback(async () => {
    // if (app.locked) return;
    if (app.messages.length === 0) {
      try {
        await db.dialog.delete(app.ctxId!);
      } catch (e) {
        console.error(e);
      }
    }
    setApp({
      ...app,
      messages: [],
      ctxId: null,
    });
  }, [setApp, app]);

  const toggleMic = () => {
    setApp({
      ...app,
      micActive: !app.micActive,
    });
  }

  const onSpeechStart = useCallback(() => {
    console.log("User started talking");
    // setListening(true);
    setApp({
      ...app,
      listening: true,
    });
  }, [app, setApp]);

  const onSpeechEnd = useCallback(async (audio: Float32Array) => {
    setApp({
      ...app,
      listening: false,
    });
    if (app.locked) return;
    playClickSound();
    setApp({
      ...app,
      locked: true,
    });
    const wavBuffer = utils.encodeWAV(audio);
    const result = await transcript(wavBuffer, { apiKey: app.openaiApiKey! });
    addMessage(result.text);
  }, [app, addMessage]);

  const onChangeListening = (listening: boolean) => {
    setApp({
      ...app,
      listening,
    });
  }

  const selectModel = useCallback((model: string) => {
    setApp({
      ...app,
      model,
    });
  }, [app]);

  const onChangeDraft = useCallback((newDraft: string) => {
    setApp({
      ...app,
      draft: newDraft,
    });
  }, [app]);

  const setOpenAiApiKey = useCallback((openaiApiKey?: string) => {
    if (openaiApiKey) {
      setApp({
        ...app,
        openaiApiKey,
      });
    }
    const newApiKey = prompt("Enter OpenAI API Key");
    if (newApiKey) {
      setApp({
        ...app,
        openaiApiKey: newApiKey,
      });
    }
  }, [app]);

  const setAnthropicApiKey = useCallback((anthropicApiKey?: string) => {
    if (anthropicApiKey) {
      setApp({
        ...app,
        anthropicApiKey,
      });
    }
    const newApiKey = prompt("Enter Anthropic API Key");
    if (newApiKey) {
      setApp({
        ...app,
        anthropicApiKey: newApiKey,
      });
    }
  }, [app]);

  const selectSystemId = useCallback((system: string) => {
    setApp({
      ...app,
      system,
    });
  }, [app]);
  const selectSpeakerId = useCallback((speaker: string) => {
    setApp({
      ...app,
      speaker,
    });
  }, [app]);

  return {
    setAnthropicApiKey,
    setOpenAiApiKey,
    backToTop,
    addMessage,
    toggleMic,
    onSpeechEnd,
    onSpeechStart,
    selectDialog,
    onChangeListening,
    onChangeDraft,
    selectModel,
    setIsEditorOpen,
    selectSystem: selectSystemId,
    selectSpeaker: selectSpeakerId,
  }
}


function useKeyEvents(app: AppState, setAppState: SetAppState, actions: ReturnType<typeof useActions>) {
  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape' && app.isEditorOpen) {
        setAppState(old => {
          return {
            ...old,
            isEditorOpen: false,
          }
        });
        return;
      }
      // chat => open
      if (e.key === 'Escape' && !app.isEditorOpen) {
        actions.backToTop();
        return;
      }
      if (e.key === 'Enter' && app.ctxId == null) {
        const dialog = await createNewDialog();
        actions.selectDialog(dialog!);
        return;
      }

      if (e.key === 'Enter' && !app.isEditorOpen) {
        setAppState(old => ({
          ...old,
          isEditorOpen: true,
        }));
        return;
      }

      // post message
      if (app.isEditorOpen && e.key === 'Enter' && e.metaKey) {
        console.log("Post message", app);
        setAppState(old => ({
          ...old,
          isEditorOpen: false,
          draft: '',
        }));
        actions.addMessage(app.draft);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [app, setAppState, actions.addMessage, actions.backToTop]);
}