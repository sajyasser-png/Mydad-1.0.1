import { useRef, useEffect, RefObject } from 'react';
import { Loader2 } from 'lucide-react';
import { MessageItem } from './MessageItem';
import { AIMessage } from '../../services/aiService';

export const MessageList = ({ 
  messages,
  handleAIRecitation,
  stopRecitation,
  isGeneratingAudio,
  sendMessage,
  copyToClipboard,
  shareMessage,
  copyFeedback,
  audioUrls,
  downloadAudioFile,
  selectedVoice,
  onRegenerate,
  onEdit,
  isLoading,
  selectedModel,
  providerName,
  scrollRef: externalScrollRef,
  onScroll
}: {
  messages: AIMessage[],
  handleAIRecitation: (text: string, id: number) => void,
  stopRecitation: () => void,
  isGeneratingAudio: string | null,
  sendMessage: (text: string) => void,
  copyToClipboard: (text: string, id: string) => void,
  shareMessage: (text: string) => void,
  copyFeedback: string | null,
  audioUrls: Record<string, string>,
  downloadAudioFile: (url: string, prefix: string) => void,
  selectedVoice: string,
  onRegenerate: (index: number) => void,
  onEdit: (index: number) => void,
  isLoading: boolean,
  selectedModel: string,
  providerName: string,
  isZenMode?: boolean,
  scrollRef?: RefObject<HTMLDivElement | null>,
  onScroll?: () => void
}) => {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef || internalScrollRef;

  useEffect(() => {
    if (!externalScrollRef && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, externalScrollRef, scrollRef]);

  return (
    <div 
      ref={scrollRef}
      onScroll={onScroll}
      style={{ overflowAnchor: 'none' }}
      className="flex-1 overflow-y-auto overscroll-contain px-2.5 sm:px-6 py-4 custom-scrollbar"
    >
      <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-5 pb-6">
        {messages.map((m, idx) => (
          <MessageItem 
            key={idx}
            m={m}
            index={idx}
            handleAIRecitation={handleAIRecitation}
            stopRecitation={stopRecitation}
            isGeneratingAudio={isGeneratingAudio}
            sendMessage={sendMessage}
            copyToClipboard={copyToClipboard}
            shareMessage={shareMessage}
            copyFeedback={copyFeedback}
            audioUrl={audioUrls[idx]}
            downloadAudioFile={downloadAudioFile}
            selectedVoice={selectedVoice}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
            selectedModel={selectedModel}
            providerName={providerName}
            isStreaming={isLoading && idx === messages.length - 1 && m.role === 'assistant'}
          />
        ))}
        
        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="bg-white/95 dark:bg-[#171412]/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 shadow-xs flex items-center gap-2.5">
              <Loader2 size={15} className="animate-spin text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-medium text-amber-800/80 dark:text-amber-200/80 font-sans" dir="rtl">جاري استحضار المدد...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
