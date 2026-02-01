import { useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, Image as ImageIcon, Camera, StopCircle } from 'lucide-react';

interface ChatInputProps {
    inputText: string;
    setInputText: (text: string) => void;
    loading: boolean;
    isRecording: boolean;
    onSendMessage: () => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleRecording: () => void;
    onOpenCamera: () => void;
}

function ChatInput({
    inputText,
    setInputText,
    loading,
    isRecording,
    onSendMessage,
    onImageUpload,
    onToggleRecording,
    onOpenCamera,
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="border-t border-border p-4 bg-card">
            <div className="max-w-3xl mx-auto">
                <div className="flex gap-2 mb-3 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                    >
                        <ImageIcon className="w-4 h-4 mr-1" />
                        图片
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleRecording}
                        disabled={loading}
                    >
                        {isRecording ? (
                            <>
                                <StopCircle className="w-4 h-4 mr-1" />
                                停止录音
                            </>
                        ) : (
                            <>
                                <Mic className="w-4 h-4 mr-1" />
                                语音
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenCamera}
                        disabled={loading}
                        className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-smooth"
                    >
                        <Camera className="w-4 h-4 mr-1" />
                        摄像头
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onImageUpload}
                    />
                </div>

                <div className="flex gap-2">
                    <Textarea
                        placeholder="输入你的感受和想法..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSendMessage();
                            }
                        }}
                        rows={2}
                        disabled={loading}
                        className="flex-1"
                    />
                    <Button
                        onClick={onSendMessage}
                        disabled={loading || !inputText.trim()}
                        size="icon"
                        className="h-auto"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default memo(ChatInput);
