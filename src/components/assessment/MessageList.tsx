import { Image as ImageIcon, Loader2, Mic, Video } from 'lucide-react';
import { memo, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    type?: 'text' | 'image' | 'voice' | 'video';
    timestamp: Date;
    analysis?: any;
}

interface MessageListProps {
    messages: Message[];
    loading: boolean;
}

function MessageList({ messages, loading }: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages, loading]);

    return (
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="max-w-3xl mx-auto space-y-4 pb-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                        >
                            {message.type && message.type !== 'text' && (
                                <Badge variant="outline" className="mb-2">
                                    {message.type === 'image' && <ImageIcon className="w-3 h-3 mr-1" />}
                                    {message.type === 'voice' && <Mic className="w-3 h-3 mr-1" />}
                                    {message.type === 'video' && <Video className="w-3 h-3 mr-1" />}
                                    {message.type === 'image' && '图片'}
                                    {message.type === 'voice' && '语音'}
                                    {message.type === 'video' && '视频'}
                                </Badge>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-60 mt-1">
                                {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}

export default memo(MessageList);
