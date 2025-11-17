
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { type LiveSession } from "@google/genai";
import { type Message, type Speaker, type Settings, SessionState } from './types';
import { SettingsPanel } from './components/SettingsPanel';
import { ConversationView } from './components/ConversationView';
import { ControlPanel } from './components/ControlPanel';
import { startLanguageTutorSession } from './services/geminiService';

export default function App() {
  const [settings, setSettings] = useState<Settings>({
    targetLanguage: 'Spanish',
    nativeLanguage: 'English',
    ageGroup: 'Adult (25-64)',
  });
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.IDLE);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const sessionRef = useRef<LiveSession | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  useEffect(() => {
    const savedSettings = localStorage.getItem('linguaCoachSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('linguaCoachSettings', JSON.stringify(updatedSettings));
  };

  const handleMessage = useCallback((message: any) => {
    if (message.serverContent?.outputTranscription) {
      const text = message.serverContent.outputTranscription.text;
      currentOutputTranscription.current += text;
      setConversation(prev => {
        const newConversation = [...prev];
        const lastMessage = newConversation[newConversation.length - 1];
        if (lastMessage && lastMessage.speaker === 'coach') {
          lastMessage.text = currentOutputTranscription.current;
          return newConversation;
        }
        return [...prev, { speaker: 'coach', text: currentOutputTranscription.current }];
      });
    } else if (message.serverContent?.inputTranscription) {
      const text = message.serverContent.inputTranscription.text;
      currentInputTranscription.current += text;
       setConversation(prev => {
        const newConversation = [...prev];
        const lastMessage = newConversation[newConversation.length - 1];
        if (lastMessage && lastMessage.speaker === 'user') {
          lastMessage.text = currentInputTranscription.current;
          return newConversation;
        }
        return [...prev, { speaker: 'user', text: currentInputTranscription.current }];
      });
    }

    if (message.serverContent?.turnComplete) {
      currentInputTranscription.current = '';
      currentOutputTranscription.current = '';
    }
  }, []);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if(audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
        audioProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    setSessionState(SessionState.IDLE);
  }, []);

  const handleError = useCallback((error: ErrorEvent) => {
    console.error("Session Error:", error);
    setConversation(prev => [...prev, { speaker: 'system', text: 'An error occurred. Session ended.' }]);
    stopSession();
  }, [stopSession]);
  
  const handleClose = useCallback(() => {
    console.log("Session closed.");
    stopSession();
  }, [stopSession]);

  const startSession = useCallback(async () => {
    setSessionState(SessionState.CONNECTING);
    setConversation([]);
    currentInputTranscription.current = '';
    currentOutputTranscription.current = '';

    try {
      const { session, mediaStream, audioContext, scriptProcessor } = await startLanguageTutorSession(
        settings,
        handleMessage,
        handleError,
        handleClose,
        isMuted
      );
      sessionRef.current = session;
      mediaStreamRef.current = mediaStream;
      inputAudioContextRef.current = audioContext;
      audioProcessorRef.current = scriptProcessor;
      setSessionState(SessionState.ACTIVE);
    } catch (error) {
      console.error("Failed to start session:", error);
      setConversation([{ speaker: 'system', text: `Failed to start session. Please check microphone permissions. Error: ${(error as Error).message}` }]);
      setSessionState(SessionState.IDLE);
    }
  }, [settings, handleMessage, handleError, handleClose, isMuted]);

  const toggleMute = () => {
      setIsMuted(prev => !prev);
      if (mediaStreamRef.current) {
          mediaStreamRef.current.getAudioTracks().forEach(track => {
              track.enabled = isMuted; // isMuted is the old value, so it toggles correctly
          });
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans p-4">
      <header className="w-full max-w-4xl mx-auto text-center p-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 text-transparent bg-clip-text">
          Lingua Coach AI
        </h1>
        <p className="text-slate-400 mt-2">Your Personal AI Language Tutor, Ready to Chat</p>
      </header>
      
      <main className="flex-grow w-full max-w-4xl mx-auto flex flex-col bg-slate-800 rounded-2xl shadow-2xl overflow-hidden mt-4">
        {sessionState === SessionState.IDLE ? (
          <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
        ) : (
          <ConversationView conversation={conversation} />
        )}
        <ControlPanel 
          sessionState={sessionState} 
          isMuted={isMuted}
          onStart={startSession} 
          onStop={stopSession}
          onMuteToggle={toggleMute}
        />
      </main>

      <footer className="w-full max-w-4xl mx-auto text-center p-4 mt-4">
        <p className="text-slate-500 text-sm">
          Powered by Gemini AI. Start a session to begin your language journey.
        </p>
      </footer>
    </div>
  );
}
