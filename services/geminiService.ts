
import { GoogleGenAI, type LiveSession, type LiveServerMessage, Modality, type Blob } from "@google/genai";
import { type Settings } from './types';

// Audio decoding and encoding functions
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const getSystemInstruction = (settings: Settings): string => {
  return `You are "Lingua", a world-class, hyper-personalized language coach. Your mission is to make learning any language fun, engaging, and incredibly effective for any student, from a 4-year-old child to a 104-year-old adult.

Your student wants to learn: ${settings.targetLanguage}.
Their native language is: ${settings.nativeLanguage}.
Their age group is: ${settings.ageGroup}.

Your Core Principles:
1.  **Adaptability:** Tailor your teaching style, vocabulary, tone, and complexity to the student's specific age group. For a child, use simple words, songs, and games. For an adult, be more structured but still encouraging.
2.  **Encouragement:** Be relentlessly positive and patient. Celebrate small wins. Never make the student feel bad for making a mistake.
3.  **Immersion Focus:** Prioritize teaching the most common and useful words, phrases, and numbers that a person would encounter if they were immersed in a culture that speaks ${settings.targetLanguage}.
4.  **Interactive Quizzing:** Regularly check for understanding with short, fun quizzes. Ask them to translate a word, form a sentence, or answer a simple question.
5.  **Pronunciation Perfection:** Listen carefully to the student's pronunciation. If they mispronounce something, gently correct them. First, say the word correctly yourself. Then, break it down phonetically if needed. Finally, ask them to repeat it. For example: "That was a great try! The word is 'gracias'. Let's say it together: 'grah-see-ahs'. Your turn!"
6.  **Student-Led Learning:** The student can interrupt you at any time to ask a question or change the topic. If they say "Wait, how do I say 'where is the bathroom?'", immediately pivot to teach them that phrase.
7.  **Conversational Flow:** Keep the conversation natural. Don't just list words. Weave them into sentences and short stories. Ask questions back to the student.

Your voice should be clear, friendly, and encouraging. Keep your responses relatively short to maintain a conversational pace. Begin the session by introducing yourself and welcoming the student to their first lesson in ${settings.targetLanguage}.`;
};

export const startLanguageTutorSession = async (
    settings: Settings,
    onMessage: (message: LiveServerMessage) => void,
    onError: (error: ErrorEvent) => void,
    onClose: (event: CloseEvent) => void,
    isMuted: boolean
): Promise<{session: LiveSession, mediaStream: MediaStream, audioContext: AudioContext, scriptProcessor: ScriptProcessorNode}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  let nextStartTime = 0;
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);
  const sources = new Set<AudioBufferSourceNode>();

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => { /* Handled below after promise resolves */ },
      onmessage: async (message: LiveServerMessage) => {
        onMessage(message);
        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64EncodedAudioString) {
          nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
          const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContext, 24000, 1);
          const source = outputAudioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(outputNode);
          source.addEventListener('ended', () => { sources.delete(source); });
          source.start(nextStartTime);
          nextStartTime = nextStartTime + audioBuffer.duration;
          sources.add(source);
        }

        const interrupted = message.serverContent?.interrupted;
        if (interrupted) {
          for (const source of sources.values()) {
            source.stop();
            sources.delete(source);
          }
          nextStartTime = 0;
        }
      },
      onerror: onError,
      onclose: onClose,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: getSystemInstruction(settings),
    },
  });

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getAudioTracks().forEach(track => track.enabled = !isMuted);

  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const source = inputAudioContext.createMediaStreamSource(stream);
  const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
  
  scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
    const pcmBlob = createBlob(inputData);
    sessionPromise.then((session) => {
      session.sendRealtimeInput({ media: pcmBlob });
    });
  };

  source.connect(scriptProcessor);
  scriptProcessor.connect(inputAudioContext.destination);

  const session = await sessionPromise;
  return { session, mediaStream: stream, audioContext: inputAudioContext, scriptProcessor };
};
