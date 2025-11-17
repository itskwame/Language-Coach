
import React, { useRef, useEffect } from 'react';
import { type Message } from '../types';

interface ConversationViewProps {
  conversation: Message[];
}

const getSpeakerStyles = (speaker: Message['speaker']) => {
  switch (speaker) {
    case 'user':
      return 'bg-blue-600 self-end rounded-br-none';
    case 'coach':
      return 'bg-slate-700 self-start rounded-bl-none';
    case 'system':
      return 'bg-red-800 self-center text-xs';
    default:
      return 'bg-gray-500 self-start';
  }
};

const getSpeakerLabel = (speaker: Message['speaker']) => {
    switch (speaker) {
      case 'user':
        return 'You';
      case 'coach':
        return 'Lingua Coach';
      case 'system':
        return 'System';
      default:
        return 'Unknown';
    }
}

export const ConversationView: React.FC<ConversationViewProps> = ({ conversation }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  return (
    <div className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-800/50">
      {conversation.map((msg, index) => (
        <div key={index} className={`flex flex-col ${msg.speaker === 'user' ? 'items-end' : 'items-start'}`}>
            <span className={`text-xs text-slate-400 mb-1 px-1 ${msg.speaker === 'user' ? 'mr-2' : 'ml-2'}`}>
                {getSpeakerLabel(msg.speaker)}
            </span>
            <div
            className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl text-white shadow-md ${getSpeakerStyles(msg.speaker)}`}
            >
            <p className="whitespace-pre-wrap">{msg.text || '...'}</p>
            </div>
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};
