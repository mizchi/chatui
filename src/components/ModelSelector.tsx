import { useState } from "react";
import { MODELS } from "../data/models";
export function ModelSelector(props: { model: string, onSelectModel: (model: string) => void }) {
  const [selectedModel, setSelectedModel] = useState(props.model);
  return (
    <div className="inline text-black">
      <select value={selectedModel} name="model" id="model" onChange={(e) => {
        setSelectedModel(e.target.value);
        props.onSelectModel(e.target.value);
      }} className="bg-white border border-gray-300 rounded-md py-2 px-4">
        {MODELS.map((model) => (
          <option key={model.id} value={model.id}>{model.displayName}</option>
        ))}
      </select>
    </div>
  );
}