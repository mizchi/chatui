import { useCallback, useEffect, useRef, useState } from "react";
import { runAnthropicAI, runChatForDebug, runOpenAI, transcript } from "../api";
import { defaultAppState, loadAppState, saveAppState } from "../storage";
import { createAsyncQueue, createTextSplitter } from "../utils";
import { MODELS, SPEAKERS, SYSTEMS } from "../data";
import { utils } from "@ricky0123/vad-web";
import { Dialog, createNewDialog, db, updateMessages } from "../db";
import { playClick as playClickSound, voicevox } from "../audio";
import { AppState, ChatMessage } from "../types";

type SetAppState = React.Dispatch<React.SetStateAction<AppState>>;

const DEBUG_UI = location.search === '?debug';

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
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const appState = await loadAppState();
      // if (!appState.openaiApiKey) {
      //   appState.openaiApiKey = prompt("Enter OpenAI API Key");
      // }
      // if (!appState.anthropicApiKey) {
      //   appState.anthropicApiKey = prompt("Enter Anthropic API Key");
      // }
      setAppState(appState);
    })();
  }, []);

  useThrottle(() => {
    const savingApp: AppState = {
      ...app,
      messages: app.messages.filter(m => {
        return m.content?.trim().length > 0;
      })
    }
    saveAppState(savingApp).then(() => {
      // console.log("Saved", app)
    });
  }, 1000, [app, app.messages, app]);
  const actions = useActions(app, setAppState, isEditorOpen, setIsEditorOpen);

  useKeyEvents(app, actions, isEditorOpen, setIsEditorOpen);

  return { app, actions, isEditorOpen };
}

function useActions(app: AppState, setApp: SetAppState, isEditorOpen: boolean, setIsEditorOpen: React.Dispatch<React.SetStateAction<boolean>>) {
  const selectDialog = useCallback((dialog: Dialog) => {
    setApp({
      ...app,
      ctxId: dialog.id!,
      messages: dialog.messages,
    });
  }, [app])

  const addMessage = useCallback(async (input: string) => {
    const sendingMessages = [
      ...app.messages,
      {
        role: "user",
        content: input,
      },
    ];
    const processVoicevox = async (text: string) => {
      const speaker = SPEAKERS.find(s => s.id === app.speaker);
      if (speaker?.type === 'voicevox') {
        await voicevox(text, speaker);
      }
    };
    const asyncQueue = createAsyncQueue<string>(processVoicevox);

    const splitter = /[。|?|？|!|！]/
    const textSplitter = createTextSplitter('', splitter);
    const systemContent = SYSTEMS.find(s => s.id === app.system)?.content;

    let answer = '';
    let currentMessages: ChatMessage[] = [
      ...app.messages,
      {
        role: "user",
        content: input,
      },
      {
        role: "assistant",
        content: '',
      }
    ];
    setApp({
      ...app,
      messages: currentMessages
    });
    if (DEBUG_UI) {
      answer = await runChatForDebug({
        system: systemContent!,
        messages: sendingMessages,
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
    } else {
      const model = app.model;
      const found = MODELS.find(m => m.id === model);
      if (!found) {
        throw new Error(`Model not found: ${model}`);
        return;
      }
      if (found.service === 'openai') {
        answer = await runOpenAI({
          apiKey: app.openaiApiKey!,
          model: found.id,
          messages: [
            ...app.messages,
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
      } else if (found.service === 'anthropic') {
        answer = await runAnthropicAI({
          apiKey: app.anthropicApiKey!,
          model: 'claude-3-opus-20240229',
          messages: [
            ...app.messages,
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
      }
    }
    const remainingText = textSplitter.drain();
    for (const line of remainingText) {
      asyncQueue.enqueue(line);
    }
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
      generating: false,
      messages: currentMessages.slice(),
    }));
    await asyncQueue.drain();
    setApp(old => ({
      ...old,
      locked: false,
    }));

    await updateMessages(app.ctxId!, currentMessages);
  }, [app]);

  const backToTop = useCallback(async () => {
    // if (app.locked) return;
    if (app.messages.length === 0 && app.ctxId) {
      try {
        await db.dialog.delete(app.ctxId);
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
    try {
      const result = await transcript(wavBuffer, { apiKey: app.openaiApiKey! });
      addMessage(result.text);
    } catch (err) {
      console.error(err);
    }
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

  const toggleEditor = useCallback(() => {
    setIsEditorOpen(old => !old);
  }, [isEditorOpen,]);

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
    setApp,
    setAnthropicApiKey,
    setOpenAiApiKey,
    backToTop,
    addMessage,
    toggleMic,
    onSpeechEnd,
    onSpeechStart,
    selectDialog,
    toggleEditor,
    onChangeListening,
    onChangeDraft,
    selectModel,
    // setIsEditorOpen,
    selectSystem: selectSystemId,
    selectSpeaker: selectSpeakerId,
  }
}


function useKeyEvents(app: AppState, actions: ReturnType<typeof useActions>, isEditorOpen: boolean, setIsEditorOpen: React.Dispatch<React.SetStateAction<boolean>>) {
  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditorOpen) {
        setIsEditorOpen(false);
        return;
      }
      // chat => open
      if (e.key === 'Escape' && !isEditorOpen) {
        actions.backToTop();
        return;
      }
      // open first dialog
      if (e.key === 'Enter' && app.ctxId == null) {
        const first = await db.dialog.orderBy('updatedAt').first();
        if (first) {
          actions.selectDialog(first);
        } else {
          const dialog = await createNewDialog();
          actions.selectDialog(dialog!);
        }
        return;
      }

      // Post message
      if (isEditorOpen && e.key === 'Enter' && e.metaKey) {
        setIsEditorOpen(false);
        actions.addMessage(app.draft);
        return;
      }

      // open editor
      if (e.key === 'Enter' && !isEditorOpen && !app.locked && app.ctxId) {
        console.log('open editor');
        setIsEditorOpen(true);
        // setAppState(old => ({
        //   ...old,
        //   isEditorOpen: true,
        // }));
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [app, actions.addMessage, actions.backToTop, isEditorOpen, setIsEditorOpen]);
}