import { Brain, FileText } from 'lucide-react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AssessmentHeaderProps {
    assessmentType: string;
    setAssessmentType: (type: string) => void;
    loading: boolean;
    messagesCount: number;
    onGenerateReport: () => void;
    analysisProgress: number;
}

function AssessmentHeader({
    assessmentType,
    setAssessmentType,
    loading,
    messagesCount,
    onGenerateReport,
    analysisProgress,
}: AssessmentHeaderProps) {
    return (
        <div className="bg-primary text-primary-foreground p-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-xl font-bold flex items-center">
                        <Brain className="w-5 h-5 mr-2" />
                        AI心理评估
                    </h1>
                    <p className="text-sm text-primary-foreground/90">多模态情绪识别与分析</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={assessmentType} onValueChange={setAssessmentType}>
                        <SelectTrigger className="w-32 bg-primary-foreground/10 border-primary-foreground/20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PHQ-9">PHQ-9</SelectItem>
                            <SelectItem value="HAMD-17">HAMD-17</SelectItem>
                            <SelectItem value="SDS-20">SDS-20</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onGenerateReport}
                        disabled={loading || messagesCount < 5}
                    >
                        <FileText className="w-4 h-4 mr-1" />
                        生成报告
                    </Button>
                </div>
            </div>

            {analysisProgress > 0 && (
                <div className="mt-2">
                    <Progress value={analysisProgress} className="h-1" />
                    <p className="text-xs text-primary-foreground/80 mt-1">
                        分析中... {analysisProgress}%
                    </p>
                </div>
            )}
        </div>
    );
}

export default memo(AssessmentHeader);
