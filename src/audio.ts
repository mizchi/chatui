import { VoicevoxSpeaker } from "./data";

let audio: HTMLAudioElement | null = null;
export async function playClick() {
  if (!audio) {
    audio = new Audio();
    audio.src = '/click.mp3';
    audio.volume = 0.5;
    // @ts-ignore
    audio.type = 'audio/mp3';
    await new Promise<void>((resolve) => {
      audio!.onload = () => resolve();
    });
    // audio.pause();
    // audio.currentTime = 0;
  } else {
    audio.pause();
    audio.currentTime = 0;
  }
  // const audio = new Audio('/click.mp3');
  await audio.play();
}

function stripCodeBlock(text: string) {
  return text.replaceAll(/```.*?```/gs, 'コード省略。');
}

export async function voicevox(text: string, speaker: VoicevoxSpeaker) {
  const newText = stripCodeBlock(text);
  const encodedText = encodeURIComponent(newText);
  const queryRes = await fetch(`http://localhost:50021/audio_query?speaker=3&text=${encodedText}`, {
    method: 'POST',
  });
  if (!queryRes.ok) {
    console.error(queryRes);
    return;
  }
  const query = await queryRes.json();

  // debugger;
  // speedup
  query.speedScale = speaker.speedScale;
  query.pitchScale = speaker.pitchScale;

  const res = await fetch(`http://localhost:50021/synthesis?speaker=${speaker.speakerId}`, {
    method: 'POST',
    body: JSON.stringify(query),
    mode: "cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
      "Accept": "audio/wav",
    },
  });
  try {
    const url = window.URL.createObjectURL(await res.blob())
    const audio = new Audio();
    // @ts-ignore
    audio.type = 'audio/wav';
    audio.src = url;
    // const now = Date.now();
    console.log('[play]', text);
    await audio.play();
    return new Promise<void>((resolve) => {
      audio.onended = () => {
        console.log('play:end');
        resolve();
      };
    });
    // console.log('play:end', text, Date.now() - now);
  } catch (error) {
    console.log(error);
  }
}
