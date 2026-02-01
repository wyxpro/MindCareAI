import React from 'react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    if (!content) return null;

    // 简单的 Markdown 解析逻辑
    // 1. 处理标题 (###)
    // 2. 处理加粗 (**)
    // 3. 处理列表 (-)
    // 4. 处理段落 (\n\n)

    const processContent = (text: string) => {
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let listItems: React.ReactNode[] = [];
        let inList = false;

        lines.forEach((line, index) => {
            // 处理标题 H3
            if (line.startsWith('### ')) {
                if (inList) {
                    elements.push(<ul key={`list-${index}`} className="list-disc pl-5 mb-4 space-y-1">{listItems}</ul>);
                    listItems = [];
                    inList = false;
                }
                elements.push(
                    <h3 key={`h3-${index}`} className="text-lg font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100">
                        {processInlineStyles(line.replace('### ', ''))}
                    </h3>
                );
                return;
            }

            // 处理标题 H2
            if (line.startsWith('## ')) {
                if (inList) {
                    elements.push(<ul key={`list-${index}`} className="list-disc pl-5 mb-4 space-y-1">{listItems}</ul>);
                    listItems = [];
                    inList = false;
                }
                elements.push(
                    <h2 key={`h2-${index}`} className="text-xl font-black mt-6 mb-3 text-slate-900 dark:text-white border-b pb-2 border-slate-100 dark:border-slate-800">
                        {processInlineStyles(line.replace('## ', ''))}
                    </h2>
                );
                return;
            }

            // 处理列表
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                inList = true;
                const content = line.trim().substring(2);
                listItems.push(
                    <li key={`li-${index}`} className="text-slate-600 dark:text-slate-300">
                        {processInlineStyles(content)}
                    </li>
                );
                return;
            }

            // 如果不是列表项但之前在列表里，闭合列表
            if (inList && line.trim() !== '') {
                elements.push(<ul key={`list-${index}`} className="list-disc pl-5 mb-4 space-y-1">{listItems}</ul>);
                listItems = [];
                inList = false;
            }

            // 处理普通段落 (空行忽略，或者作为分段)
            if (line.trim() !== '') {
                elements.push(
                    <p key={`p-${index}`} className="mb-2 leading-relaxed text-slate-600 dark:text-slate-300">
                        {processInlineStyles(line)}
                    </p>
                );
            }
        });

        // 处理最后的列表
        if (inList) {
            elements.push(<ul key="list-end" className="list-disc pl-5 mb-4 space-y-1">{listItems}</ul>);
        }

        return elements;
    };

    const processInlineStyles = (text: string): React.ReactNode[] => {
        // 简单的加粗处理 (**text**)
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-slate-800 dark:text-slate-200">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className={`markdown-content ${className}`}>
            {processContent(content)}
        </div>
    );
};
