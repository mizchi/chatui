import { Dialog, createNewDialog, db } from "../db";
import { useCallback, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

function useActions(onSelectDialog: (dialog: Dialog) => void) {
  const dialogs = useLiveQuery(() => db.dialog.orderBy('updatedAt').reverse().toArray(), []);
  const onClickNew = useCallback(async () => {
    const dialog = await createNewDialog();
    onSelectDialog(dialog!);
  }, [onSelectDialog]);

  const deleteDialog = useCallback(async (id: string) => {
    await db.dialog.delete(id);
  }, [dialogs]);
  return { dialogs, onClickNew, deleteDialog };
}

export function Entrance(props: {
  onSelectDialog: (dialog: Dialog) => void,
  setOpenAiApiKey: () => void,
  setAnthropicApiKey: () => void,
},
) {
  const { dialogs, onClickNew, deleteDialog, } = useActions(props.onSelectDialog);

  if (dialogs == null) {
    // return <div className="text-white text-center">Loading...</div>;
    return (
      <div className="bg-gray-800 text-white p-4 w-full h-full">
        <div className="max-w-xl mx-auto">
          <div className="mb-4 text-center">
            Loading...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 text-white p-4 w-full h-full overflow-y-auto">
      <div className="max-w-xl mx-auto">
        <header className="mb-4">
          <h1 className="text-3xl">ChatUI</h1>
        </header>
        <div>
          <button
            type="button"
            onClick={() => {
              props.setOpenAiApiKey();
            }}
            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
          >
            Set OpenAI KEY
          </button>
          &nbsp;
          <button
            type="button"
            onClick={() => {
              props.setAnthropicApiKey();
            }}
            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
          >
            Set AnthropicAI KEY
          </button>
        </div>
        <hr className="mt-3 mb-3" />
        <div className="mb-4 text-center">
          <button
            type="button"
            onClick={onClickNew}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            New Chat
          </button>
        </div>
        <div className="space-y-2">
          {dialogs.map((dialog) => (
            <div key={dialog.id} className="flex-row flex items-center justify-between w-full">
              <div
                className="bg-gray-700 p-2 rounded flex-1 cursor-pointer"
                onClick={() => {
                  props.onSelectDialog(dialog);
                }}
              >
                <span className="w-full text-left text-white font-bold flex items-center justify-between">
                  <span>
                    {dialog.messages?.[0]?.content.trim().slice(0, 10) ?? dialog.id}
                    <span className="ml-2 text-gray-400">({dialog.messages?.length})</span>
                  </span>
                  <span className="text-gray-400 text-sm">
                    {new Date(dialog.updatedAt).toLocaleString()}
                  </span>
                </span>
              </div>
              <div className="p-1 pb-2">
                <button
                  onClick={() => {
                    deleteDialog(dialog.id!);
                  }}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded float-right"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}