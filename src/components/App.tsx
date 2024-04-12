import { useMicVAD } from "@ricky0123/vad-react"
import { Editor } from "./Editor";
import { Layout } from "./Layout";
import { ChatView } from "./ChatView";
import { useApp } from "./hooks";
import { useEffect, useState } from "react";
import { Entrance } from "./Entrance";
import { ModelSelector } from "./ModelSelector";
import { SystemSelector } from "./SystemSelector";
import { SpeakerSelector } from "./SpeakerSelector";

const isMac = navigator.userAgent.includes("Mac");
export function App() {
  const { app, actions } = useApp();

  const canUseMic = app.micActive && !!app.ctxId && !app.loading && !app.locked && !app.generating;
  return (
    <>
      {
        canUseMic &&
        <MicListener
          onChangeListening={actions.onChangeListening}
          onSpeechStart={actions.onSpeechStart}
          onSpeechEnd={actions.onSpeechEnd}
        />
      }
      <Layout
        isEditorOpen={app.isEditorOpen}
        dialogOpened={!!app.ctxId}
        editorTools={
          <>
            {app.isEditorOpen ? (
              <>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded"
                >
                  ✈
                  {
                    isMac ? "(⌘-Enter)" : "(Ctrl-Enter)"
                  }
                </button>
                &nbsp;
                <button
                  type="button"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded"
                  onClick={() => actions.setIsEditorOpen(!app.isEditorOpen)}
                >
                  ↓ (ESC)
                </button>
              </>
            ) : (
              app.ctxId &&
              <>
                <button
                  type="button"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded"
                  onClick={() => actions.setIsEditorOpen(!app.isEditorOpen)}
                >
                  📝 (Enter)
                </button>
                {/* Make summary button */}
                &nbsp;

              </>
            )}
            {/* {

            } */}
          </>
        }
        main={
          <>
            {app.ctxId
              ? <ChatView messages={app.messages} generating={app.generating} />
              : <Entrance onSelectDialog={actions.selectDialog} setOpenAiApiKey={actions.setOpenAiApiKey} setAnthropicApiKey={actions.setAnthropicApiKey} />
            }
          </>
        }
        sidebar={
          <Editor
            disabled={app.generating || app.locked}
            initialValue={app.draft}
            onChange={actions.onChangeDraft}
          />
        }
        tools={
          <>
            {/* back to top */}
            <button type='button' onClick={actions.backToTop} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Back (ESC)
            </button>
            &nbsp;
            {/* mic */}
            <button type='button' onClick={actions.toggleMic} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded">
              {app.micActive ? "🎙 MicOn" : "🚫 MicOff"}
            </button>
            &nbsp;
            {/* model selector */}
            <ModelSelector
              model={app.model!}
              onSelectModel={actions.selectModel}
            />
            &nbsp;
            {/* system selector */}
            <SystemSelector
              system={app.system!}
              onSelectSystem={actions.selectSystem}
            />
            &nbsp;
            {/* speaker */}
            <SpeakerSelector
              speaker={app.speaker!}
              onSelectSpeaker={actions.selectSpeaker}
            />
          </>
        } />
    </>
  );
}

function MicListener(props: {
  onSpeechStart: () => void,
  onSpeechEnd: (audio: Float32Array) => void,
  onChangeListening: (listening: boolean) => void,
}) {
  const [listening, setListening] = useState(false);

  const vad = useMicVAD({
    startOnLoad: true,
    minSpeechFrames: 5,
    onSpeechStart: props.onSpeechStart,
    onSpeechEnd: props.onSpeechEnd,
  });

  useEffect(() => {
    if (vad.listening !== listening) {
      setListening(vad.listening);
      props.onChangeListening(vad.listening);
    }
  }, [vad.listening, props.onChangeListening]);

  return (
    <></>
  );
}
