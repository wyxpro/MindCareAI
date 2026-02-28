import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, ClipboardList, Download, Info, Printer, Send, Smile, Stethoscope, History, FileText, Calendar, AlertCircle, Activity } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { getKnowledgeBase } from '@/db/api';
import { volcResponses } from '@/db/volc';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  avatar?: string;
}

interface HistoryAssessment {
  id: string;
  date: Date;
  scaleTypes: string[];
  riskLevel: 'low' | 'medium' | 'high';
  score: number;
  summary: string;
  messages: Message[];
  reportData: {
    score: number;
    riskLevel: 'low' | 'medium' | 'high';
    suggestion: string;
  };
}

interface ScaleStepProps {
  onComplete: (data: any) => void;
  userId: string;
}

type ScaleJson = { type: 'scale'; scale_id: string; name: string; description?: string; questions: { text: string }[] }
const SCALES = [
  { id: 'PHQ-9', name: '患者健康问卷', total: 9, description: '用于筛查抑郁症状及其严重程度' },
  { id: 'HAMD-17', name: '汉密尔顿抑郁量表', total: 17, description: '临床评估抑郁状态的标准量表' },
  { id: 'SDS-20', name: '自评抑郁量表', total: 20, description: '直观反映抑郁的主观感受' },
];

// 常用表情列表
const EMOJI_LIST = [
  '😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗',
  '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨',
  '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞',
  '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫',
  '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥',
  '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐',
  '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲',
  '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
  '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍',
  '👎', '👏', '🙌', '👐', '🤝', '🙏', '✌️', '🤞',
  '🤟', '🤘', '🤙', '💪', '🦾', '🖕', '✍️', '🤳',
  '💅', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠',
  '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'
];

// 医生默认头像 - 使用本地图片
const DOCTOR_AVATAR = '/srcs/img/doctor.png';

// 模拟历史评估数据 - 包含完整的题目和对话
const MOCK_HISTORY_ASSESSMENTS: HistoryAssessment[] = [
  {
    id: 'assess-001',
    date: new Date(2024, 0, 15, 14, 30),
    scaleTypes: ['PHQ-9'],
    riskLevel: 'low',
    score: 8,
    summary: '整体心理状态良好，偶尔有轻微焦虑情绪，建议保持规律作息。',
    messages: [
      { role: 'assistant', content: '你好！我是灵愈AI助手。接下来我们将进行 PHQ-9 评估。我会以温暖、共情的方式引导你逐步完成，每一步都会解释目的。如果任何回答不确定，我会帮你澄清。我们开始吧？', timestamp: new Date(2024, 0, 15, 14, 30), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '好的，我准备好了', timestamp: new Date(2024, 0, 15, 14, 31) },
      { role: 'assistant', content: '【第1题】在过去两周内，你是否经常感到心情低落、沮丧或绝望？', timestamp: new Date(2024, 0, 15, 14, 31), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '偶尔会有这样的感觉，大概一周有2-3天吧', timestamp: new Date(2024, 0, 15, 14, 32) },
      { role: 'assistant', content: '【第2题】你是否对平时感兴趣的事情失去了兴趣或乐趣？', timestamp: new Date(2024, 0, 15, 14, 32), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '还好，平时喜欢的运动和阅读还是挺有兴趣的', timestamp: new Date(2024, 0, 15, 14, 33) },
      { role: 'assistant', content: '【第3题】你是否感到入睡困难、睡不安稳或睡眠过多？', timestamp: new Date(2024, 0, 15, 14, 33), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '有时候入睡会比较慢，大概需要30分钟左右', timestamp: new Date(2024, 0, 15, 14, 34) },
      { role: 'assistant', content: '【第4题】你是否感到疲倦或没有活力？', timestamp: new Date(2024, 0, 15, 14, 34), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '工作日下午会有点累，但周末休息后就恢复了', timestamp: new Date(2024, 0, 15, 14, 35) },
      { role: 'assistant', content: '【第5题】你是否食欲不振或吃太多？', timestamp: new Date(2024, 0, 15, 14, 35), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '食欲正常，没有特别的变化', timestamp: new Date(2024, 0, 15, 14, 36) },
      { role: 'assistant', content: '【第6题】你是否觉得自己很糟，或觉得自己很失败，或让自己或家人失望？', timestamp: new Date(2024, 0, 15, 14, 36), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '偶尔会有这种想法，但不会持续太久', timestamp: new Date(2024, 0, 15, 14, 37) },
      { role: 'assistant', content: '【第7题】你是否难以集中注意力，例如阅读报纸或看电视时？', timestamp: new Date(2024, 0, 15, 14, 37), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '有时候会有点分心，但总体还好', timestamp: new Date(2024, 0, 15, 14, 38) },
      { role: 'assistant', content: '【第8题】你是否动作或说话速度缓慢到别人已经察觉？或者正好相反——烦躁或坐立不安、动来动去的情况更胜于平常？', timestamp: new Date(2024, 0, 15, 14, 38), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '没有这种情况', timestamp: new Date(2024, 0, 15, 14, 39) },
      { role: 'assistant', content: '【第9题】你是否有过不如死掉或用某种方式伤害自己的念头？', timestamp: new Date(2024, 0, 15, 14, 39), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '从来没有', timestamp: new Date(2024, 0, 15, 14, 40) },
      { role: 'assistant', content: '感谢你的配合！PHQ-9评估已完成。根据你的回答，你的得分是8分，属于低风险范围。整体心理状态良好，建议继续保持规律作息和适度运动。', timestamp: new Date(2024, 0, 15, 14, 41), avatar: DOCTOR_AVATAR }
    ],
    reportData: {
      score: 8,
      riskLevel: 'low',
      suggestion: '您的得分反映出心理状态相对健康，请继续保持积极的生活方式。'
    }
  },
  {
    id: 'assess-002',
    date: new Date(2024, 0, 22, 10, 15),
    scaleTypes: ['PHQ-9', 'HAMD-17'],
    riskLevel: 'medium',
    score: 15,
    summary: '存在一定程度的抑郁倾向，建议通过运动、社交等方式调节情绪。',
    messages: [
      { role: 'assistant', content: '你好！今天我们将进行 PHQ-9, HAMD-17 综合评估。这将帮助我们更全面地了解你的心理状态。准备好了吗？', timestamp: new Date(2024, 0, 22, 10, 15), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '嗯，可以开始', timestamp: new Date(2024, 0, 22, 10, 16) },
      { role: 'assistant', content: '【PHQ-9 第1题】最近两周，你的睡眠质量如何？是否有入睡困难或早醒的情况？', timestamp: new Date(2024, 0, 22, 10, 16), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '睡眠确实不太好，经常要一两个小时才能入睡', timestamp: new Date(2024, 0, 22, 10, 17) },
      { role: 'assistant', content: '【PHQ-9 第2题】你是否感到心情低落、沮丧或绝望？', timestamp: new Date(2024, 0, 22, 10, 17), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '是的，最近工作压力很大，经常感到沮丧', timestamp: new Date(2024, 0, 22, 10, 18) },
      { role: 'assistant', content: '【PHQ-9 第3题】你是否对平时感兴趣的事情失去了兴趣？', timestamp: new Date(2024, 0, 22, 10, 18), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '有时候，以前喜欢的游戏现在玩得少了', timestamp: new Date(2024, 0, 22, 10, 19) },
      { role: 'assistant', content: '【HAMD-17 第1题】抑郁情绪：你是否感到悲伤、沮丧或绝望？程度如何？', timestamp: new Date(2024, 0, 22, 10, 20), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '比较明显，尤其是晚上一个人时', timestamp: new Date(2024, 0, 22, 10, 21) },
      { role: 'assistant', content: '【HAMD-17 第2题】罪恶感：你是否感到内疚或自责？', timestamp: new Date(2024, 0, 22, 10, 21), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '偶尔会觉得对不起家人，没能给他们更好的生活', timestamp: new Date(2024, 0, 22, 10, 22) },
      { role: 'assistant', content: '【HAMD-17 第3题】自杀意念：你是否有过自杀的念头？', timestamp: new Date(2024, 0, 22, 10, 22), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '没有，虽然难过但不会想伤害自己', timestamp: new Date(2024, 0, 22, 10, 23) },
      { role: 'assistant', content: '【HAMD-17 第4题】入睡困难：你入睡需要多长时间？', timestamp: new Date(2024, 0, 22, 10, 23), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '通常需要1-2小时', timestamp: new Date(2024, 0, 22, 10, 24) },
      { role: 'assistant', content: '【HAMD-17 第5题】睡眠不深：你是否容易醒来或睡眠很浅？', timestamp: new Date(2024, 0, 22, 10, 24), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '是的，半夜经常会醒，然后很难再入睡', timestamp: new Date(2024, 0, 22, 10, 25) },
      { role: 'assistant', content: '感谢你的坦诚回答。综合评估已完成，你的得分是15分，属于中度风险。建议通过运动、社交和充足睡眠来调节情绪。', timestamp: new Date(2024, 0, 22, 10, 26), avatar: DOCTOR_AVATAR }
    ],
    reportData: {
      score: 15,
      riskLevel: 'medium',
      suggestion: '您的得分反映出存在一定的心理压力，可以通过运动、社交和充足睡眠来调节。'
    }
  },
  {
    id: 'assess-003',
    date: new Date(2024, 1, 5, 16, 45),
    scaleTypes: ['SDS-20'],
    riskLevel: 'low',
    score: 6,
    summary: '心理状态稳定，情绪管理良好，继续保持当前的生活节奏。',
    messages: [
      { role: 'assistant', content: '你好！我们今天将进行 SDS-20 自评抑郁量表评估。这个量表能帮助你更直观地了解自己的情绪状态。', timestamp: new Date(2024, 1, 5, 16, 45), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '好的，开始吧', timestamp: new Date(2024, 1, 5, 16, 46) },
      { role: 'assistant', content: '【SDS-20 第1题】我感到情绪沮丧，郁闷', timestamp: new Date(2024, 1, 5, 16, 46), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '很少有这种感觉', timestamp: new Date(2024, 1, 5, 16, 47) },
      { role: 'assistant', content: '【SDS-20 第2题】我感到早晨心情最好', timestamp: new Date(2024, 1, 5, 16, 47), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '是的，早上精神最好', timestamp: new Date(2024, 1, 5, 16, 48) },
      { role: 'assistant', content: '【SDS-20 第3题】我要哭或想哭', timestamp: new Date(2024, 1, 5, 16, 48), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '几乎没有', timestamp: new Date(2024, 1, 5, 16, 49) },
      { role: 'assistant', content: '【SDS-20 第4题】我夜间睡眠不好', timestamp: new Date(2024, 1, 5, 16, 49), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '睡眠还可以，偶尔做梦', timestamp: new Date(2024, 1, 5, 16, 50) },
      { role: 'assistant', content: '【SDS-20 第5题】我吃饭像平时一样多', timestamp: new Date(2024, 1, 5, 16, 50), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '是的，食欲正常', timestamp: new Date(2024, 1, 5, 16, 51) },
      { role: 'assistant', content: '评估进展顺利。根据目前的回答，你的情绪状态很稳定。SDS-20评估已完成，得分6分，属于低风险范围。', timestamp: new Date(2024, 1, 5, 16, 55), avatar: DOCTOR_AVATAR }
    ],
    reportData: {
      score: 6,
      riskLevel: 'low',
      suggestion: '您的得分反映出心理状态相对健康，请继续保持积极的生活方式。'
    }
  },
  {
    id: 'assess-004',
    date: new Date(2024, 1, 18, 9, 20),
    scaleTypes: ['PHQ-9'],
    riskLevel: 'high',
    score: 22,
    summary: '检测到明显的抑郁症状，强烈建议及时寻求专业心理咨询或医疗帮助。',
    messages: [
      { role: 'assistant', content: '你好！感谢你选择进行心理评估。我会陪伴你完成整个过程，请放松心情，真实表达你的感受。', timestamp: new Date(2024, 1, 18, 9, 20), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '最近状态很不好，想做个评估看看', timestamp: new Date(2024, 1, 18, 9, 21) },
      { role: 'assistant', content: '【第1题】我理解你的感受。过去两周，你是否经常感到心情低落、沮丧或绝望？', timestamp: new Date(2024, 1, 18, 9, 21), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '是的，几乎每天都有这种感觉', timestamp: new Date(2024, 1, 18, 9, 22) },
      { role: 'assistant', content: '【第2题】你是否对平时感兴趣的事情失去了兴趣或乐趣？', timestamp: new Date(2024, 1, 18, 9, 22), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '是的，以前喜欢的事情现在完全不想做', timestamp: new Date(2024, 1, 18, 9, 23) },
      { role: 'assistant', content: '【第3题】你是否感到疲倦或没有活力？', timestamp: new Date(2024, 1, 18, 9, 23), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '是的，每天都感觉很累，做什么都提不起劲', timestamp: new Date(2024, 1, 18, 9, 24) },
      { role: 'assistant', content: '【第4题】你是否食欲不振或吃太多？', timestamp: new Date(2024, 1, 18, 9, 24), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '最近吃得很少，没什么胃口', timestamp: new Date(2024, 1, 18, 9, 25) },
      { role: 'assistant', content: '【第5题】你是否觉得自己很糟，或觉得自己很失败？', timestamp: new Date(2024, 1, 18, 9, 25), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '是的，觉得自己很没用', timestamp: new Date(2024, 1, 18, 9, 26) },
      { role: 'assistant', content: '【第6题】你是否难以集中注意力？', timestamp: new Date(2024, 1, 18, 9, 26), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '是的，很难集中注意力工作', timestamp: new Date(2024, 1, 18, 9, 27) },
      { role: 'assistant', content: '【第7题】你是否动作或说话速度缓慢，或者烦躁坐立不安？', timestamp: new Date(2024, 1, 18, 9, 27), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '动作变慢了，朋友也说我最近很安静', timestamp: new Date(2024, 1, 18, 9, 28) },
      { role: 'assistant', content: '【第8题】你是否有过不如死掉或用某种方式伤害自己的念头？', timestamp: new Date(2024, 1, 18, 9, 28), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '有时候会有这种想法...', timestamp: new Date(2024, 1, 18, 9, 29) },
      { role: 'assistant', content: '【安全预警】检测到您可能存在自杀风险。我们非常关心您的安全。如果您正处于危险中，请立即拨打心理援助热线 400-161-9995 或联系紧急联系人。', timestamp: new Date(2024, 1, 18, 9, 29), avatar: DOCTOR_AVATAR },
      { role: 'assistant', content: '【第9题】这些症状是否影响到你的工作、学习或人际关系？', timestamp: new Date(2024, 1, 18, 9, 30), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '影响很大，已经请假在家休息了', timestamp: new Date(2024, 1, 18, 9, 31) },
      { role: 'assistant', content: '评估已完成。你的得分是22分，属于高风险范围。我强烈建议你尽快寻求专业心理咨询或医疗帮助。请记住，寻求帮助是勇敢的表现，你并不孤单。', timestamp: new Date(2024, 1, 18, 9, 32), avatar: DOCTOR_AVATAR }
    ],
    reportData: {
      score: 22,
      riskLevel: 'high',
      suggestion: '您的得分反映出显著的抑郁倾向，建议尽快咨询专业医生进行干预。'
    }
  },
  {
    id: 'assess-005',
    date: new Date(2024, 1, 25, 14, 0),
    scaleTypes: ['HAMD-17', 'SDS-20'],
    riskLevel: 'medium',
    score: 13,
    summary: '情绪波动较大，需要关注压力来源，建议加强自我调节和放松训练。',
    messages: [
      { role: 'assistant', content: '你好！今天我们将进行 HAMD-17, SDS-20 综合评估。这将从不同维度了解你的心理状态。', timestamp: new Date(2024, 1, 25, 14, 0), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '好的，麻烦了', timestamp: new Date(2024, 1, 25, 14, 1) },
      { role: 'assistant', content: '【HAMD-17 第1题】抑郁情绪：最近一周你的情绪状态如何？', timestamp: new Date(2024, 1, 25, 14, 1), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '情绪起伏比较大，时好时坏', timestamp: new Date(2024, 1, 25, 14, 2) },
      { role: 'assistant', content: '【HAMD-17 第2题】工作兴趣：你对工作的热情如何？', timestamp: new Date(2024, 1, 25, 14, 2), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '工作热情不如以前，有时候会拖延', timestamp: new Date(2024, 1, 25, 14, 3) },
      { role: 'assistant', content: '【HAMD-17 第3题】精神性焦虑：你是否经常感到紧张、担忧？', timestamp: new Date(2024, 1, 25, 14, 3), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '是的，经常担心各种事情', timestamp: new Date(2024, 1, 25, 14, 4) },
      { role: 'assistant', content: '【SDS-20 第1题】我感到情绪沮丧，郁闷', timestamp: new Date(2024, 1, 25, 14, 5), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '有时候会有这种感觉', timestamp: new Date(2024, 1, 25, 14, 6) },
      { role: 'assistant', content: '【SDS-20 第2题】我感到早晨心情最好', timestamp: new Date(2024, 1, 25, 14, 6), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '不一定，有时候早上也很低落', timestamp: new Date(2024, 1, 25, 14, 7) },
      { role: 'assistant', content: '【SDS-20 第3题】我要哭或想哭', timestamp: new Date(2024, 1, 25, 14, 7), avatar: DOCTOR_AVATAR },
      { role: 'user', content: '偶尔会想哭，但忍住了', timestamp: new Date(2024, 1, 25, 14, 8) },
      { role: 'assistant', content: '综合评估已完成，你的得分是13分，属于中度风险。情绪波动较大，建议关注压力来源，适当进行放松训练。', timestamp: new Date(2024, 1, 25, 14, 10), avatar: DOCTOR_AVATAR }
    ],
    reportData: {
      score: 13,
      riskLevel: 'medium',
      suggestion: '您的得分反映出存在一定的心理压力，可以通过运动、社交和充足睡眠来调节。'
    }
  }
];

export default function ScaleStep({ onComplete, userId }: ScaleStepProps) {
  const { user, profile } = useAuth();
  const [selectedScales, setSelectedScales] = useState<string[]>(['PHQ-9']);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(9);
  const [showReport, setShowReport] = useState(false);
  const [score, setScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [questionBank, setQuestionBank] = useState<string[]>([]);
  
  // 历史评估相关状态
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<HistoryAssessment | null>(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  const [showHistoryReport, setShowHistoryReport] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const listeningRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const asrBusyRef = useRef(false);
  const asrErrorCountRef = useRef(0);
  const webSpeechRef = useRef<any>(null);
  const prefixRef = useRef('');
  const finalTranscriptRef = useRef('');

  // 获取用户头像
  const getUserAvatar = () => {
    if (profile?.avatar_url) {
      // 处理预设头像格式
      if (profile.avatar_url.startsWith('preset:')) {
        return undefined; // 使用fallback显示emoji
      }
      return profile.avatar_url;
    }
    return undefined;
  };

  // 获取用户显示名称的首字母
  const getUserInitial = () => {
    if (profile?.full_name) {
      return profile.full_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // 格式化历史记录的日期
  const formatHistoryDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 获取风险等级的显示信息
  const getRiskLevelInfo = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return { label: '高风险', color: 'text-rose-500', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' };
      case 'medium':
        return { label: '中风险', color: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' };
      case 'low':
        return { label: '低风险', color: 'text-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' };
    }
  };

  // 智能生成最后的保底回复
  const generateSmartFallback = (userResponse: string, nextQuestion: string): string => {
    const response = userResponse.toLowerCase();
    let empathyPrefix = '';
    
    // 根据用户回答内容智能匹配共情回应
    if (response.includes('经常') || response.includes('总是') || response.includes('每天')) {
      empathyPrefix = '听起来你最近承受着不小的压力，这种持续性的状态确实需要关注。';
    } else if (response.includes('偶尔') || response.includes('有时') || response.includes('不太')) {
      empathyPrefix = '看得出来这种情况是间歇性的，你能够觉察到这一点很好。';
    } else if (response.includes('没有') || response.includes('不会') || response.includes('很少')) {
      empathyPrefix = '这方面你保持得不错，继续保持这样的状态。';
    } else if (response.includes('不确定') || response.includes('不知道')) {
      empathyPrefix = '这个问题可能需要仔细回想，没关系，我们慢慢来。';
    } else if (response.includes('失眠') || response.includes('睡不着')) {
      empathyPrefix = '睡眠问题确实会影响日常生活，这需要我们特别关注。';
    } else if (response.includes('压力') || response.includes('焦虑')) {
      empathyPrefix = '能够觉察到压力和焦虑是很重要的第一步。';
    } else if (response.includes('难过') || response.includes('伤心') || response.includes('沮丧')) {
      empathyPrefix = '你的感受我能理解，允许自己有这样的情绪是正常的。';
    } else if (response.length > 20) {
      // 用户回答较长，说明愿意分享
      empathyPrefix = '感谢你愿意分享这些细节，这对评估很有帮助。';
    } else {
      // 其他情况
      empathyPrefix = '你的回答我记下了，让我们继续了解更多。';
    }
    
    return `${empathyPrefix} 下面我们继续：${nextQuestion}`;
  };

  // 处理表情选择
  const handleEmojiSelect = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 常见回答选项
  const QUICK_RESPONSES = ['是的', '不是', '有时候', '不确定', '经常', '很少'];

  // 处理快捷回答点击 - 直接发送
  const handleQuickResponse = async (response: string) => {
    if (loading) return;
    
    // 创建用户消息
    const userMsg: Message = { 
      role: 'user', 
      content: response, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // 构建RAG上下文（简版）
      let kbText = '';
      try {
        const kb = await getKnowledgeBase('assessment');
        kbText = (kb || []).slice(0, 5)
          .map(k => `【${k.title}】\n${(k.content || '').slice(0, 400)}`)
          .join('\n\n');
      } catch {}

      const nextQ = questionBank[currentQuestionIndex] || '请详细描述一下您最近两周的心情与兴趣变化。';
      
      // 构建完整的对话历史上下文（最近3轮）
      const recentMessages = messages.slice(-6); // 最近3轮对话（用户+AI各3条）
      const conversationHistory = recentMessages.map(m => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: [{ type: 'input_text' as const, text: m.content }]
      }));

      const systemPrompt = `你是一位温暖、专业的心理咨询师，正在进行${selectedScales.join('、')}抑郁量表对话评估。

【重要】你必须生成一个完整的回复，包含两个部分：

第一部分 - 共情回应（30-50字）：
针对用户刚才的回答，生成具体的、个性化的共情反馈。
- 如果用户提到具体时间/频率（如"一周2-3天"），你需要在回复中提到这个具体信息
- 如果用户表达负面情绪，你要表达理解和支持
- 如果用户表达正面状态，你要给予肯定和鼓励
- 避免使用"好的"、"我理解了"、"我知道了"、"我能感受到"等空泛表达
- 必须让用户感到你真正在倾听和理解他们的具体情况

第二部分 - 引导下一题：
用"下面我们继续："或"接下来："自然过渡到下一题："${nextQ}"

【正确示例】
用户："偶尔会有，一周2-3天吧"
✓ 正确："一周有2-3天出现这种情况，说明你的状态整体还算稳定，这是个好的信号。下面我们继续：${nextQ}"
✗ 错误："好的，我理解了。下面我们继续：${nextQ}"

用户："经常失眠，每天都要很久才能睡着"
✓ 正确："每天都受到睡眠困扰确实很辛苦，长期的失眠会影响白天的状态，我们需要重点关注这一点。下面我们继续：${nextQ}"
✗ 错误："我能感受到你的状态。下面我们继续：${nextQ}"

【知识库参考】
${kbText || '暂无相关知识库'}`;

      const aiResponse = await volcResponses({
        model: 'doubao-seed-1-8-251228',
        input: [
          { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
          ...conversationHistory,
          {
            role: 'user' as const,
            content: [
              { type: 'input_text' as const, text: response }
            ]
          }
        ]
      });

      let aiContent = aiResponse?.text || '';
      
      // 如果AI回复为空、过短或包含禁用词，重新生成个性化回复
      const isFallbackNeeded = !aiContent 
        || aiContent.length < 20 
        || /好的|我理解了|我知道了|我能感受到/.test(aiContent);
      
      if (isFallbackNeeded) {
        // 使用简化prompt强制AI生成个性化回复
        const fallbackPrompt = `你是心理咨询师。用户刚回答："${response}"

请用30-50字给出具体的、个性化的共情回应，然后说"下面我们继续："。

要求：
1. 必须针对用户回答的具体内容进行回应
2. 禁止使用"好的"、"我理解了"、"我能感受到"等空泛词汇
3. 如果用户提到具体细节（时间/频率/程度），必须在回复中体现
4. 体现专业的心理咨询师的共情能力`;

        try {
          const fallbackResponse = await volcResponses({
            model: 'doubao-seed-1-8-251228',
            input: [
              { 
                role: 'system', 
                content: [{ type: 'input_text', text: '你是专业的心理咨询师，擅长共情式沟通。' }] 
              },
              {
                role: 'user' as const,
                content: [{ type: 'input_text' as const, text: fallbackPrompt }]
              }
            ]
          });
          
          if (fallbackResponse?.text && fallbackResponse.text.length >= 20) {
            aiContent = `${fallbackResponse.text} ${nextQ}`;
          } else {
            // 最后的保底：根据回答内容智能匹配
            aiContent = generateSmartFallback(response, nextQ);
          }
        } catch (error) {
          console.error('Fallback AI generation failed:', error);
          aiContent = generateSmartFallback(response, nextQ);
        }
      }
      
      // 模拟问题进度增加
      if (currentQuestionIndex < totalQuestions) {
        setCurrentQuestionIndex(prev => prev + 1);
      }

      const aiMsg: Message = { 
        role: 'assistant', 
        content: aiContent, 
        timestamp: new Date(),
        avatar: DOCTOR_AVATAR 
      };
      setMessages(prev => [...prev, aiMsg]);

      // 情感与安全检测
      const distress = /(崩溃|绝望|无助|很痛|难受|不想活|自杀|死亡)/.test(response);
      if (distress) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '【安全预警】检测到您可能存在自杀风险。我们非常关心您的安全。如果您正处于危险中，请立即拨打心理援助热线 400-161-9995 或联系紧急联系人。',
          timestamp: new Date(),
          avatar: DOCTOR_AVATAR
        }]);
      }

      // 澄清不确定回答
      if (/(不确定|不太清楚|说不清|不知道)/.test(response)) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '为了更准确评估，我来帮你澄清一下：在过去两周，出现该情况的频率更接近"几天"还是"超过一半天"？',
          timestamp: new Date(),
          avatar: DOCTOR_AVATAR
        }]);
      }

      // 如果完成所有题目
      if (currentQuestionIndex + 1 >= totalQuestions) {
        handleComplete();
      }

    } catch (error) {
      console.error('Quick response error:', error);
      toast.error('服务暂时不可用，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 点击外部关闭表情面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        // 检查点击的是否是表情按钮
        const target = event.target as HTMLElement;
        const isEmojiButton = target.closest('button[aria-label="选择表情"]');
        if (!isEmojiButton) {
          setShowEmojiPicker(false);
        }
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      try {
        stopRequestedRef.current = true;
        listeningRef.current = false;
        webSpeechRef.current?.stop?.();
      } catch {}
    };
  }, []);

  const stopVoiceInput = () => {
    stopRequestedRef.current = true;
    listeningRef.current = false;
    setListening(false);
    try {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
    } catch {}
  };

  const startVoiceInput = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mr;

      stopRequestedRef.current = false;
      listeningRef.current = true;
      setListening(true);
      prefixRef.current = inputText ? `${inputText} ` : '';
      finalTranscriptRef.current = '';

      mr.ondataavailable = async (e) => {
        if (!listeningRef.current) return;
        if (e.data?.size > 0 && !asrBusyRef.current) {
          asrBusyRef.current = true;
          try {
            const { transcribeAudio } = await import('@/db/siliconflow');
            const { convertWebmToWav } = await import('@/utils/audio');
            const wavBlob = await convertWebmToWav(e.data);
            const res = await transcribeAudio(wavBlob, 'TeleAI/TeleSpeechASR');
            const text = res?.text || '';
            if (text) setInputText(prev => `${prev}${text}`.trimStart());
            asrErrorCountRef.current = 0;
          } catch (err) {
            asrErrorCountRef.current += 1;
            if (asrErrorCountRef.current >= 2) {
              // fallback to Web Speech for immediate UX
              try { startWebSpeechFallback(); } catch {}
            }
          }
          asrBusyRef.current = false;
        }
      };

      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start(800);
    } catch (e: any) {
      // fallback if MediaRecorder unavailable
      try { startWebSpeechFallback(); } catch {}
    }
  };

  function startWebSpeechFallback() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('浏览器不支持实时识别且语音服务不可用');
      return;
    }
    const rec = new SpeechRecognition();
    webSpeechRef.current = rec;
    listeningRef.current = true; setListening(true);
    rec.continuous = true; rec.interimResults = true; rec.lang = 'zh-CN';
    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]; const text = res?.[0]?.transcript || '';
        if (res.isFinal) setInputText(prev => `${prev}${text}`.trimStart()); else interim += text;
      }
      if (interim) setInputText(prev => `${prev}${interim}`.trimStart());
    };
    rec.onend = () => { if (listeningRef.current) rec.start(); };
    try { rec.start(); } catch {}
  }

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else {
      setNextButtonDisabled(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    (async () => {
      try {
        const kb = await getKnowledgeBase('assessment');
        const scales = kb.map(k => {
          try { 
            const json = JSON.parse(k.content || '{}');
            return { ...json, id: k.id, title: k.title } as any;
          } catch { return null }
        }).filter(Boolean);
        
        if (scales.length > 0) {
          const selected = scales.filter(s => selectedScales.includes(s.scale_id) || selectedScales.some(id => s.title?.includes(id)));
          const qs = selected.flatMap(s => (s.questions || []).map((q: any) => q.text));
          if (qs.length > 0) {
            setQuestionBank(qs);
            setTotalQuestions(qs.length);
          }
        }
      } catch (error) {
        console.error('Failed to load scales from KB:', error);
      }
    })();
  }, [selectedScales]);

  const startAssessment = () => {
    if (selectedScales.length === 0) {
      toast.error('请至少选择一个量表');
      return;
    }
    
    if (questionBank.length === 0) {
      const total = SCALES.filter(s => selectedScales.includes(s.id)).reduce((acc, s) => acc + s.total, 0);
      setTotalQuestions(total);
    }
    setStarted(true);
    setMessages([
      {
        role: 'assistant',
        content: `你好！我是灵愈AI助手。接下来我们将进行 ${selectedScales.join(', ')} 评估。我会以温暖、共情的方式引导你逐步完成,每一步都会解释目的。如果任何回答不确定，我会帮你澄清。我们开始吧？`,
        timestamp: new Date(),
        avatar: DOCTOR_AVATAR
      }
    ]);
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    if (listening) stopVoiceInput();

    const userMsg: Message = { role: 'user', content: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // 构建RAG上下文（简版）
      let kbText = '';
      try {
        const kb = await getKnowledgeBase('assessment');
        kbText = (kb || []).slice(0, 5)
          .map(k => `【${k.title}】\n${(k.content || '').slice(0, 400)}`)
          .join('\n\n');
      } catch {}

      const nextQ = questionBank[currentQuestionIndex] || '请详细描述一下您最近两周的心情与兴趣变化。';
      
      // 构建完整的对话历史上下文（最近3轮）
      const recentMessages = messages.slice(-6); // 最近3轮对话（用户+AI各3条）
      const conversationHistory = recentMessages.map(m => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: [{ type: 'input_text' as const, text: m.content }]
      }));

      const systemPrompt = `你是一位温暖、专业的心理咨询师，正在进行${selectedScales.join('、')}抑郁量表对话评估。

【重要】你必须生成一个完整的回复，包含两个部分：

第一部分 - 共情回应（30-50字）：
针对用户刚才的回答，生成具体的、个性化的共情反馈。
- 如果用户提到具体时间/频率（如"一周2-3天"），你需要在回复中提到这个具体信息
- 如果用户表达负面情绪，你要表达理解和支持
- 如果用户表达正面状态，你要给予肯定和鼓励
- 避免使用"好的"、"我理解了"、"我知道了"、"我能感受到"等空泛表达
- 必须让用户感到你真正在倾听和理解他们的具体情况

第二部分 - 引导下一题：
用"下面我们继续："或"接下来："自然过渡到下一题："${nextQ}"

【正确示例】
用户："偶尔会有，一周2-3天吧"
✓ 正确："一周有2-3天出现这种情况，说明你的状态整体还算稳定，这是个好的信号。下面我们继续：${nextQ}"
✗ 错误："好的，我理解了。下面我们继续：${nextQ}"

用户："经常失眠，每天都要很久才能睡着"
✓ 正确："每天都受到睡眠困扰确实很辛苦，长期的失眠会影响白天的状态，我们需要重点关注这一点。下面我们继续：${nextQ}"
✗ 错误："我能感受到你的状态。下面我们继续：${nextQ}"

【知识库参考】
${kbText || '暂无相关知识库'}`;

      const response = await volcResponses({
        model: 'doubao-seed-1-8-251228',
        input: [
          { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
          ...conversationHistory,
          {
            role: 'user' as const,
            content: [
              { type: 'input_text' as const, text: inputText }
            ]
          }
        ]
      });

      let aiContent = response?.text || '';
      
      // 如果AI回复为空、过短或包含禁用词，重新生成个性化回复
      const isFallbackNeeded = !aiContent 
        || aiContent.length < 20 
        || /好的|我理解了|我知道了|我能感受到/.test(aiContent);
      
      if (isFallbackNeeded) {
        // 使用简化prompt强制AI生成个性化回复
        const fallbackPrompt = `你是心理咨询师。用户刚回答："${inputText}"

请用30-50字给出具体的、个性化的共情回应，然后说"下面我们继续："。

要求：
1. 必须针对用户回答的具体内容进行回应
2. 禁止使用"好的"、"我理解了"、"我能感受到"等空泛词汇
3. 如果用户提到具体细节（时间/频率/程度），必须在回复中体现
4. 体现专业的心理咨询师的共情能力`;

        try {
          const fallbackResponse = await volcResponses({
            model: 'doubao-seed-1-8-251228',
            input: [
              { 
                role: 'system', 
                content: [{ type: 'input_text', text: '你是专业的心理咨询师，擅长共情式沟通。' }] 
              },
              {
                role: 'user' as const,
                content: [{ type: 'input_text' as const, text: fallbackPrompt }]
              }
            ]
          });
          
          if (fallbackResponse?.text && fallbackResponse.text.length >= 20) {
            aiContent = `${fallbackResponse.text} ${nextQ}`;
          } else {
            // 最后的保底：根据回答内容智能匹配
            aiContent = generateSmartFallback(inputText, nextQ);
          }
        } catch (error) {
          console.error('Fallback AI generation failed:', error);
          aiContent = generateSmartFallback(inputText, nextQ);
        }
      }
      
      // 模拟问题进度增加
      if (currentQuestionIndex < totalQuestions) {
        setCurrentQuestionIndex(prev => prev + 1);
      }

      const aiMsg: Message = { role: 'assistant', content: aiContent, timestamp: new Date(), avatar: DOCTOR_AVATAR };
      setMessages(prev => [...prev, aiMsg]);

      // 情感与安全检测
      const text = inputText;
      const distress = /(崩溃|绝望|无助|很痛|难受|不想活|自杀|死亡)/.test(text);
      if (distress) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '【安全预警】检测到您可能存在自杀风险。我们非常关心您的安全。如果您正处于危险中，请立即拨打心理援助热线 400-161-9995 或联系紧急联系人。',
          timestamp: new Date(),
          avatar: DOCTOR_AVATAR
        }]);
      }

      // 澄清不确定回答
      if (/(不确定|不太清楚|说不清|不知道)/.test(text)) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '为了更准确评估，我来帮你澄清一下：在过去两周，出现该情况的频率更接近"几天"还是"超过一半天"？',
          timestamp: new Date(),
          avatar: DOCTOR_AVATAR
        }]);
      }

      // 如果完成所有题目
      if (currentQuestionIndex + 1 >= totalQuestions) {
        handleComplete();
      }

    } catch (error) {
      console.error('Scale assessment error:', error);
      toast.error('服务暂时不可用，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    // 模拟评分
    const mockScore = Math.floor(Math.random() * 27);
    setScore(mockScore);
    
    let level: 'low' | 'medium' | 'high' = 'low';
    if (mockScore >= 20) level = 'high';
    else if (mockScore >= 10) level = 'medium';
    
    setRiskLevel(level);
    setShowReport(true);

    if (level === 'high' || level === 'medium') {
      setNextButtonDisabled(true);
      setCountdown(10);
    }
  };

  if (!started) {
    return (
      <div className="pt-28 px-4 max-w-md mx-auto space-y-8 pb-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">AI主动式对话量表评估</h2>
              <p className="text-slate-500 text-sm mt-1">您可以选择一个或多个量表进行综合评估</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowHistoryDialog(true)}
              className="rounded-2xl w-12 h-12 shrink-0 shadow-sm hover:shadow-md transition-all border-slate-200 dark:border-slate-800"
              aria-label="查看历史评估"
            >
              <History className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {SCALES.map(scale => (
            <motion.div
              key={scale.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedScales(prev => 
                  prev.includes(scale.id) 
                    ? prev.filter(id => id !== scale.id)
                    : [...prev, scale.id]
                );
              }}
              className={`
                p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden
                ${selectedScales.includes(scale.id) 
                  ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}
              `}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{scale.id} {scale.name}</h3>
                  <p className="text-xs text-slate-400">{scale.description}</p>
                </div>
                {selectedScales.includes(scale.id) && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Badge variant="outline" className="text-[10px] py-0">{scale.total} 题</Badge>
                <Badge variant="outline" className="text-[10px] py-0">约 5 分钟</Badge>
              </div>
            </motion.div>
          ))}
        </div>

        <Button 
          onClick={startAssessment}
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
        >
          开始评估 <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        {/* 历史评估列表弹窗 */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] p-0 overflow-hidden rounded-[24px] border-none">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <History className="w-6 h-6 text-primary" />
                历史评估记录
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                查看你的过往评估记录和分析报告
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[500px] px-6 py-4">
              <div className="space-y-3">
                {MOCK_HISTORY_ASSESSMENTS.map((assessment) => {
                  const riskInfo = getRiskLevelInfo(assessment.riskLevel);
                  return (
                    <motion.div
                      key={assessment.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedHistory(assessment);
                        setShowHistoryDialog(false);
                        setShowHistoryDetail(true);
                      }}
                      className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <ClipboardList className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                              {assessment.scaleTypes.join(' + ')}
                            </h3>
                            <Badge className={`${riskInfo.bgColor} ${riskInfo.color} border-0 text-xs font-bold`}>
                              {riskInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatHistoryDate(assessment.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              得分: {assessment.score}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {assessment.summary}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* 历史评估详情弹窗 */}
        <Dialog open={showHistoryDetail} onOpenChange={(open) => {
          setShowHistoryDetail(open);
          if (!open) {
            setSelectedHistory(null);
            setShowHistoryDialog(true);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden rounded-[24px] border-none">
            {selectedHistory && (
              <>
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-2xl font-black">
                        {selectedHistory.scaleTypes.join(' + ')} 评估记录
                      </DialogTitle>
                      <DialogDescription className="text-sm text-slate-500 mt-1">
                        {formatHistoryDate(selectedHistory.date)}
                      </DialogDescription>
                    </div>
                    <Button
                      onClick={() => setShowHistoryReport(true)}
                      className="rounded-xl px-4 h-10 shadow-md"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      查看报告
                    </Button>
                  </div>
                </DialogHeader>

                <ScrollArea className="h-[600px] px-6 py-4">
                  <div className="space-y-4">
                    {selectedHistory.messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <Avatar className="w-9 h-9 shrink-0 border-2 border-slate-100 dark:border-slate-800 overflow-hidden">
                            <AvatarImage 
                              src={msg.avatar || DOCTOR_AVATAR} 
                              className="object-cover w-full h-full"
                              alt="医生头像"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                              <Stethoscope className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className="flex flex-col">
                          <div className={`
                            max-w-[70vw] p-4 rounded-3xl text-sm font-medium leading-relaxed
                            ${msg.role === 'user' 
                              ? 'bg-primary text-white shadow-lg shadow-primary/10 rounded-tr-none' 
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-800 rounded-tl-none'}
                          `}>
                            {msg.content}
                          </div>
                        </div>

                        {msg.role === 'user' && (
                          <Avatar className="w-9 h-9 shrink-0 border-2 border-primary/20">
                            <AvatarImage src={getUserAvatar()} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-sm font-bold">
                              {getUserInitial()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* 历史评估报告弹窗 - 与 FusionReport 量表评估报告样式一致 */}
        <Dialog open={showHistoryReport} onOpenChange={setShowHistoryReport}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 border-0 bg-white rounded-2xl mx-auto w-[calc(100%-3rem)]">
            {selectedHistory && (
              <>
                {/* 头部 */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">量表评估报告</h2>
                      </div>
                      <p className="text-white/80 mt-2 text-sm">PHQ-9 抑郁症筛查量表详细得分与分析</p>
                      <p className="text-white/60 text-xs mt-1">{formatHistoryDate(selectedHistory.date)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-6" id={`history-report-card-${selectedHistory.id}`}>
                  {/* 得分卡片 */}
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-600 font-medium">PHQ-9 总分</span>
                      <Badge className={`${
                        selectedHistory.reportData.riskLevel === 'high' ? 'bg-[#F97316]' : 
                        selectedHistory.reportData.riskLevel === 'medium' ? 'bg-[#8B5CF6]' : 'bg-[#10B981]'
                      } text-white px-3 py-1`}>
                        {selectedHistory.reportData.riskLevel === 'high' ? '高风险' : 
                         selectedHistory.reportData.riskLevel === 'medium' ? '中风险' : '低风险'}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-900">{selectedHistory.reportData.score}</span>
                      <span className="text-slate-400 text-lg">/ 27</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                      根据您的量表回答，您的抑郁倾向处于<span className="font-semibold text-slate-700">
                        {selectedHistory.reportData.riskLevel === 'high' ? '高风险' : 
                         selectedHistory.reportData.riskLevel === 'medium' ? '中风险' : '低风险'}
                      </span>水平。
                    </p>
                  </div>
                   
                  {/* 各维度得分 */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      各维度得分详情
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedHistory.reportData.dimensionScores && selectedHistory.reportData.dimensionScores.length > 0 ? (
                        selectedHistory.reportData.dimensionScores.map((item: any, idx: number) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-slate-100">
                            <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-lg font-bold ${item.score >= 2 ? 'text-amber-500' : item.score >= 1 ? 'text-blue-500' : 'text-emerald-500'}`}>
                                {item.score}
                              </span>
                              <span className="text-xs text-slate-400">/ {item.max || 3}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        // 默认维度
                        [
                          { label: '兴趣丧失', score: 2, max: 3 },
                          { label: '情绪低落', score: 2, max: 3 },
                          { label: '睡眠问题', score: 1, max: 3 },
                          { label: '疲劳感', score: 2, max: 3 },
                          { label: '食欲变化', score: 1, max: 3 },
                          { label: '自我评价', score: 1, max: 3 },
                          { label: '注意力', score: 2, max: 3 },
                          { label: '动作迟缓', score: 1, max: 3 },
                          { label: '自杀意念', score: 0, max: 3 },
                        ].map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-slate-100">
                            <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-lg font-bold ${item.score >= 2 ? 'text-amber-500' : item.score >= 1 ? 'text-blue-500' : 'text-emerald-500'}`}>
                                {item.score}
                              </span>
                              <span className="text-xs text-slate-400">/ {item.max}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* AI 建议 */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      AI 专业建议
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {selectedHistory.reportData.riskLevel === 'high' 
                        ? '您的得分反映出显著的抑郁倾向，建议尽快咨询专业医生进行干预。' 
                        : selectedHistory.reportData.riskLevel === 'medium' 
                          ? '您的得分反映出存在一定的心理压力，可以通过运动、社交和充足睡眠来调节。' 
                          : '您的得分反映出心理状态相对健康，请继续保持积极的生活方式。'}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        const el = document.getElementById(`history-report-card-${selectedHistory.id}`);
                        if (!el) return;
                        const html2canvas = (await import('html2canvas')).default;
                        const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
                        const imgData = canvas.toDataURL('image/png');
                        const { jsPDF } = await import('jspdf');
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const pageHeight = pdf.internal.pageSize.getHeight();
                        const imgWidth = pageWidth;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        const y = Math.max(10, (pageHeight - imgHeight) / 2);
                        pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
                        pdf.save(`assessment-report-${selectedHistory.id}.pdf`);
                      }}
                      className="rounded-xl h-11 px-6"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出报告
                    </Button>
                    <Button 
                      onClick={() => setShowHistoryReport(false)}
                      className="rounded-xl h-11 px-6 bg-slate-900 hover:bg-slate-800"
                    >
                      关闭
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col z-40 pb-20">
      {/* 沉浸式顶部 */}
      <div className="pt-20 px-4 pb-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-md mx-auto space-y-3 mt-3">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</span>
            <span className="text-sm font-black text-primary">{currentQuestionIndex} / {totalQuestions}</span>
          </div>
          <Progress value={(currentQuestionIndex / totalQuestions) * 100} className="h-2 rounded-full" />
        </div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="max-w-md mx-auto space-y-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI消息左侧头像 */}
                {msg.role === 'assistant' && (
                  <Avatar className="w-9 h-9 shrink-0 border-2 border-slate-100 dark:border-slate-800 overflow-hidden">
                    <AvatarImage 
                      src={msg.avatar || DOCTOR_AVATAR} 
                      className="object-cover w-full h-full"
                      alt="医生头像"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                      <Stethoscope className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="flex flex-col">
                  <div className={`
                    max-w-[75vw] p-4 rounded-3xl text-sm font-medium leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-primary text-white shadow-lg shadow-primary/10 rounded-tr-none' 
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-800 rounded-tl-none'}
                  `}>
                    {msg.content}
                  </div>
                </div>

                {/* 用户消息右侧头像 */}
                {msg.role === 'user' && (
                  <Avatar className="w-9 h-9 shrink-0 border-2 border-primary/20">
                    <AvatarImage src={getUserAvatar()} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-sm font-bold">
                      {getUserInitial()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 输入区域 */}
      <div
        className="fixed left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4rem)' }}
      >
        <div className="max-w-md mx-auto space-y-2">
          {/* 表情选择面板 - 位于最上方 */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                ref={emojiPickerRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 max-h-48 overflow-y-auto"
              >
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_LIST.slice(0, 64).map((emoji, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-lg hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-1 transition-colors"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 快捷回答按钮 - 始终位于输入框上方 */}
          <div className="flex flex-wrap gap-2">
            {QUICK_RESPONSES.map((response) => (
              <motion.button
                key={response}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickResponse(response)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all
                  ${inputText === response 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}
                `}
              >
                {response}
              </motion.button>
            ))}
          </div>

          {/* 输入框区域 */}
          <div className="flex gap-2">
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="请在此输入您的回答..."
              readOnly={false}
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 ring-primary transition-all outline-none"
            />
            <Button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              size="icon"
              variant="outline"
              className={`rounded-2xl w-12 h-12 shadow-sm ${showEmojiPicker ? 'border-primary text-primary bg-primary/10' : ''}`}
              aria-pressed={showEmojiPicker}
              aria-label="选择表情"
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Button 
              onClick={handleSend}
              disabled={!inputText.trim() || loading}
              size="icon" 
              className="rounded-2xl w-12 h-12 shadow-lg shadow-primary/20"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 报告弹窗 */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[32px] border-none">
          <div className="bg-gradient-to-br from-primary to-primary-foreground p-8 text-center text-white space-y-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
              <ClipboardList className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black">评估完成</h2>
              <p className="text-white/70 text-sm">基于您的多轮对话回答生成的报告</p>
            </div>
          </div>

          <div className="p-8 space-y-8 bg-white dark:bg-slate-950" id="assessment-report-card">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
                <p className="text-3xl font-black text-primary">{score}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk</span>
                <p className={`text-lg font-black ${
                  riskLevel === 'high' ? 'text-rose-500' : 
                  riskLevel === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中风险' : '低风险'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> AI 建议
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                您的得分反映出{riskLevel === 'high' ? '显著的抑郁倾向，建议尽快咨询专业医生进行干预。' : 
                riskLevel === 'medium' ? '存在一定的心理压力，可以通过运动、社交和充足睡眠来调节。' : 
                '心理状态相对健康，请继续保持积极的生活方式。'}
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12 border-slate-100 dark:border-slate-800"
                  onClick={async () => {
                    const el = document.getElementById('assessment-report-card');
                    if (!el) return;
                    const html2canvas = (await import('html2canvas')).default;
                    const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
                    const imgData = canvas.toDataURL('image/png');
                    const { jsPDF } = await import('jspdf');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    const imgWidth = pageWidth;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    const y = Math.max(10, (pageHeight - imgHeight) / 2);
                    pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
                    pdf.save('assessment-report.pdf');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" /> PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12 border-slate-100 dark:border-slate-800"
                  onClick={async () => {
                    const el = document.getElementById('assessment-report-card');
                    if (!el) return;
                    const html2canvas = (await import('html2canvas')).default;
                    const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = 'assessment-report.png';
                    a.click();
                  }}
                >
                  <Printer className="w-4 h-4 mr-2" /> PNG
                </Button>
              </div>
              <Button 
                onClick={() => {
                  setShowReport(false);
                  onComplete({ score, riskLevel });
                }}
                disabled={nextButtonDisabled}
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
              >
                {nextButtonDisabled ? `请阅读 (${countdown}s)` : '下一步：语音情绪识别'}
              </Button>
              <p className="text-[10px] text-center text-slate-400 leading-relaxed px-4">
                免责声明：本评估由 AI 生成，仅供参考。不代表临床诊断。如感不适请及时就医。
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
