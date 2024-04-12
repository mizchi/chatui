import { useState } from "react";
import { SYSTEMS } from "../data";
export function SystemSelector(props: { system: string, onSelectSystem: (model: string) => void }) {
  const [selectedSystem, setSelectedSystem] = useState(props.system);
  return (
    <div className="inline text-black">
      <select value={selectedSystem} onChange={(e) => {
        // console.log(e.target.value);
        setSelectedSystem(e.target.value);
        props.onSelectSystem(e.target.value);
      }} className="border border-gray-300 rounded-md py-2 px-4">
        {SYSTEMS.map((system) => (
          <option
            key={system.id}
            value={system.id}
          >
            {system.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}