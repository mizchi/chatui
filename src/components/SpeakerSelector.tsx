import { useState } from "react";
import { SPEAKERS } from "../data";

export function SpeakerSelector(props: { speaker: string, onSelectSpeaker: (model: string) => void }) {
  const [selectedSpeaker, setSelectedSpeaker] = useState(props.speaker);
  return (
    <div className="inline text-black">
      <select value={selectedSpeaker} name="model" id="model" onChange={(e) => {
        setSelectedSpeaker(e.target.value);
        props.onSelectSpeaker(e.target.value);
      }} className="bg-white border border-gray-300 rounded-md py-2 px-4">
        {SPEAKERS.map((spekaer) => (
          <option key={spekaer.id} value={spekaer.id}>{spekaer.displayName}</option>
        ))}
      </select>
    </div>
  );
}