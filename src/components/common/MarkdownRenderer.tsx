import React from 'react';
import { cn } from '@/lib/utils';
import { Brain, HeartPulse, Lightbulb, MessageCircle, AlertTriangle } from 'lucide-react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    if (!content) return null;

    // 辅助函数：检测文本类型并返回对应样式和图标
    const getStructuredStyle = (text: string) => {
        if (text.includes('情绪倾向') || text.includes('情绪状态')) {
            return {
                bg: 'bg-indigo-50 dark:bg-indigo-900/10',
                border: 'border-indigo-100 dark:border-indigo-900/20',
                icon: <HeartPulse className="w-5 h-5 text-indigo-500 mt-0.5" />,
                titleColor: 'text-indigo-700 dark:text-indigo-300'
            };
        }
        if (text.includes('负面') || text.includes('风险') || text.includes('抑郁') || text.includes('焦虑')) {
            return {
                bg: 'bg-amber-50 dark:bg-amber-900/10',
                border: 'border-amber-100 dark:border-amber-900/20',
                icon: <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />,
                titleColor: 'text-amber-700 dark:text-amber-300'
            };
        }
        if (text.includes('建议') || text.includes('对策') || text.includes('疏导')) {
            return {
                bg: 'bg-emerald-50 dark:bg-emerald-900/10',
                border: 'border-emerald-100 dark:border-emerald-900/20',
                icon: <Lightbulb className="w-5 h-5 text-emerald-500 mt-0.5" />,
                titleColor: 'text-emerald-700 dark:text-emerald-300'
            };
        }
        if (text.includes('语言') || text.includes('特征') || text.includes('分析')) {
            return {
                bg: 'bg-blue-50 dark:bg-blue-900/10',
                border: 'border-blue-100 dark:border-blue-900/20',
                icon: <Brain className="w-5 h-5 text-blue-500 mt-0.5" />,
                titleColor: 'text-blue-700 dark:text-blue-300'
            };
        }
        // 默认样式
        return {
            bg: 'bg-slate-50 dark:bg-slate-900',
            border: 'border-slate-100 dark:border-slate-800',
            icon: <MessageCircle className="w-5 h-5 text-slate-400 mt-0.5" />,
            titleColor: 'text-slate-700 dark:text-slate-200'
        };
    };

    const processContent = (text: string) => {
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let listItems: React.ReactNode[] = [];
        let inUnorderedList = false;

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            // 先闭合可能存在的无序列表
            if (inUnorderedList && !trimmedLine.startsWith('- ') && !trimmedLine.startsWith('* ')) {
                elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-4 space-y-1">{listItems}</ul>);
                listItems = [];
                inUnorderedList = false;
            }

            // 1. 处理标题 H3
            if (line.startsWith('### ')) {
                elements.push(
                    <h3 key={`h3-${index}`} className="text-base font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full inline-block"></span>
                        {processInlineStyles(line.replace('### ', ''))}
                    </h3>
                );
                return;
            }

            // 2. 处理标题 H2
            if (line.startsWith('## ')) {
                elements.push(
                    <h2 key={`h2-${index}`} className="text-lg font-black mt-6 mb-3 text-slate-900 dark:text-white border-b pb-2 border-slate-100 dark:border-slate-800">
                        {processInlineStyles(line.replace('## ', ''))}
                    </h2>
                );
                return;
            }

            // 3. 处理有序列表 (1. **标题**: 内容) - 转换为结构化卡片
            // 匹配 "数字. " 开头的行
            const orderedListMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
            if (orderedListMatch) {
                const content = orderedListMatch[2];
                const style = getStructuredStyle(content);

                // 尝试分离 标题 和 内容 (例如: **情绪倾向**：内容)
                // 匹配 "**Title**" 或 "Title:" 结构
                const splitMatch = content.match(/^(\*\*.*?\*\*|.*?)[:：]\s*(.*)/);

                let titleNode: React.ReactNode;
                let bodyNode: React.ReactNode;

                if (splitMatch) {
                    // 有明确的标题分隔
                    const rawTitle = splitMatch[1].replace(/\*\*/g, ''); // 去除加粗标记
                    const rawBody = splitMatch[2];
                    titleNode = rawTitle;
                    bodyNode = processInlineStyles(rawBody);
                } else {
                    // 没有明确分隔，整个作为内容
                    titleNode = `分析点 ${orderedListMatch[1]}`;
                    bodyNode = processInlineStyles(content);
                }

                elements.push(
                    <div key={`card-${index}`} className={cn(
                        "mb-3 p-3 rounded-xl border flex gap-3 items-start transition-all hover:shadow-sm",
                        style.bg,
                        style.border
                    )}>
                        <div className="shrink-0 pt-0.5">
                            {style.icon}
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className={cn("text-sm font-bold", style.titleColor)}>
                                {titleNode}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {bodyNode}
                            </div>
                        </div>
                    </div>
                );
                return;
            }

            // 4. 处理无序列表
            if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                inUnorderedList = true;
                listItems.push(
                    <li key={`li-${index}`} className="text-slate-600 dark:text-slate-300 pl-1">
                        {processInlineStyles(trimmedLine.substring(2))}
                    </li>
                );
                return;
            }

            // 5. 处理引用/引言 (以 "根据" 开头，或者 ">" 开头)
            if (trimmedLine.startsWith('> ') || trimmedLine.startsWith('根据用户引用')) {
                const content = trimmedLine.startsWith('> ') ? trimmedLine.substring(2) : trimmedLine;
                elements.push(
                    <div key={`quote-${index}`} className="my-3 pl-4 border-l-4 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 py-2 pr-3 rounded-r-lg italic text-slate-500 dark:text-slate-400 text-sm">
                        {processInlineStyles(content)}
                    </div>
                );
                return;
            }

            // 6. 普通段落
            if (trimmedLine !== '') {
                elements.push(
                    <p key={`p-${index}`} className="mb-2 leading-relaxed text-slate-600 dark:text-slate-300 text-sm">
                        {processInlineStyles(line)}
                    </p>
                );
            }
        });

        if (inUnorderedList) {
            elements.push(<ul key="ul-end" className="list-disc pl-5 mb-4 space-y-1">{listItems}</ul>);
        }

        return elements;
    };

    const processInlineStyles = (text: string): React.ReactNode[] => {
        const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
        return parts.map((part, i) => {
            // 加粗
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
            }
            // 代码/高亮
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono text-primary">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };

    return (
        <div className={cn("markdown-content w-full", className)}>
            {processContent(content)}
        </div>
    );
};
