-- ============================================
-- 手动创建知识文档存储桶和策略
-- 在Supabase Dashboard的SQL Editor中执行此脚本
-- ============================================

-- 1. 扩展knowledge_base表（如果字段不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='knowledge_base' AND column_name='content_type') THEN
    ALTER TABLE public.knowledge_base 
    ADD COLUMN content_type TEXT DEFAULT 'text',
    ADD COLUMN file_url TEXT,
    ADD COLUMN file_name TEXT,
    ADD COLUMN file_size INTEGER,
    ADD COLUMN file_mime_type TEXT;
    
    CREATE INDEX idx_knowledge_base_content_type ON knowledge_base(content_type);
    CREATE INDEX idx_knowledge_base_file_url ON knowledge_base(file_url) WHERE file_url IS NOT NULL;
  END IF;
END $$;

-- 2. 创建knowledge-documents存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-documents',
  'knowledge-documents',
  true,
  52428800,  -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "医生可以上传知识文档" ON storage.objects;
DROP POLICY IF EXISTS "所有人可以查看知识文档" ON storage.objects;
DROP POLICY IF EXISTS "医生可以删除知识文档" ON storage.objects;

-- 4. 创建存储策略
CREATE POLICY "医生可以上传知识文档"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-documents' 
  AND (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('doctor', 'admin'))
  )
);

CREATE POLICY "所有人可以查看知识文档"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'knowledge-documents');

CREATE POLICY "医生可以删除知识文档"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'knowledge-documents'
  AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('doctor', 'admin'))
);

-- 5. 插入示例数据（可选）
INSERT INTO public.knowledge_base (title, content, category, tags, content_type, file_name, is_active, created_by)
VALUES
-- 治疗方法示例
(
  '认知行为疗法(CBT)核心技术指南',
  '认知行为疗法(CBT)是一种结构化、短期、以目标为导向的心理治疗方法。核心原则：1. 情绪由思维决定 2. 识别负面自动思维 3. 挑战非理性信念 4. 建立适应性认知模式。常用技术包括：思维记录表、行为激活、暴露疗法、问题解决训练、放松训练等。适用人群：抑郁症、焦虑症、强迫症等多种心理障碍患者。通常需要12-16次疗程。',
  'therapy',
  ARRAY['CBT', '认知行为疗法', '治疗技术'],
  'text',
  '认知行为疗法指南.txt',
  true,
  (SELECT id FROM profiles WHERE role IN ('doctor', 'admin') LIMIT 1)
),
(
  '抑郁症药物治疗循证指南2024',
  '本指南基于最新循证医学研究。一线药物：SSRI类(舍曲林、氟西汀)、SNRI类(文拉法辛)。用药原则：低剂量起始、足量足疗程、个体化调整。常见副作用管理：消化道反应、性功能障碍、停药综合征。特殊人群用药注意事项：孕妇权衡利弊首选舍曲林，老年人起始剂量减半，青少年密切监测自杀风险。',
  'therapy',
  ARRAY['药物治疗', '抑郁症', 'SSRI', '循证指南'],
  'text',
  '药物治疗指南.pdf',
  true,
  (SELECT id FROM profiles WHERE role IN ('doctor', 'admin') LIMIT 1)
),
-- 研究资料示例
(
  '青少年抑郁症干预研究Meta分析',
  'Meta分析：青少年抑郁症心理干预效果评估。纳入2018-2023年42项RCT研究，样本量5823例。主要发现：心理治疗总体效果显著(ES=0.67)，CBT效果最佳(ES=0.75)。家庭干预可提升疗效30%。数字化干预(APP、在线咨询)依从性更高。临床启示：青少年抑郁治疗应优先考虑心理治疗，尤其是CBT和IPT。',
  'research',
  ARRAY['Meta分析', '青少年', '干预研究', 'RCT'],
  'text',
  'Meta分析_青少年抑郁.pdf',
  true,
  (SELECT id FROM profiles WHERE role IN ('doctor', 'admin') LIMIT 1)
),
(
  '神经影像学在抑郁症诊断中的应用',
  '神经影像学技术在抑郁症中的研究进展。fMRI研究发现：默认网络活动增强、执行控制网络减弱、前额叶活动降低、杏仁核过度激活。PET-CT显示5-HT受体密度降低、葡萄糖代谢异常。sMRI发现海马体积缩小、前额叶皮层厚度减少。生物标志物可辅助诊断、预测治疗反应、监测病情。未来方向：机器学习整合多模态影像数据。',
  'research',
  ARRAY['神经影像', '生物标志物', 'fMRI', 'PET'],
  'text',
  '神经影像学研究.docx',
  true,
  (SELECT id FROM profiles WHERE role IN ('doctor', 'admin') LIMIT 1)
),
(
  '抑郁症遗传学研究进展2024',
  '全基因组关联研究(GWAS)发现：抑郁症具有多基因遗传特征，遗传度约37%。已识别出178个风险基因位点，涉及神经递质系统、神经发育、免疫炎症等通路。重要基因包括：5-HTT(血清素转运体)、BDNF(脑源性神经营养因子)、COMT(儿茶酚-O-甲基转移酶)。表观遗传学研究显示：早期应激可导致DNA甲基化改变，影响HPA轴调节。基因-环境交互作用：携带风险基因者在经历负性生活事件后抑郁风险显著增加。临床应用：遗传筛查有助于早期识别高危人群、指导个体化治疗方案选择、预测药物反应性。精准医学时代，基因检测将成为抑郁症诊疗的重要工具。',
  'research',
  ARRAY['遗传学', 'GWAS', '基因', '精准医学'],
  'text',
  '抑郁症遗传学研究.pdf',
  true,
  (SELECT id FROM profiles WHERE role IN ('doctor', 'admin') LIMIT 1)
),
(
  '肠道菌群与抑郁症：脑-肠轴研究',
  '脑-肠轴是中枢神经系统与肠道菌群的双向通讯系统。研究发现抑郁症患者肠道菌群失调：拟杆菌门减少、厚壁菌门增加、微生物多样性下降。机制研究：(1)神经通路：迷走神经传递信号；(2)免疫途径：肠道菌群影响促炎因子水平；(3)代谢产物：短链脂肪酸、色氨酸代谢产物调节神经递质合成；(4)HPA轴：菌群调节应激反应。临床证据：益生菌干预(如双歧杆菌、乳酸杆菌)可改善抑郁症状，效应量中等(ES=0.53)。粪菌移植(FMT)在动物模型中显示抗抑郁效果。膳食干预：地中海饮食、富含益生元食物可促进有益菌生长。未来方向：开发新型精神益生菌(psychobiotics)、个体化菌群调节方案。脑-肠轴为抑郁症治疗提供了全新视角。',
  'research',
  ARRAY['肠道菌群', '脑肠轴', '益生菌', '微生物'],
  'text',
  '脑肠轴与抑郁症.pdf',
  true,
  (SELECT id FROM profiles WHERE role IN ('doctor', 'admin') LIMIT 1)
),
(
  '运动干预对抑郁症的治疗效果：系统综述',
  '系统综述纳入89项随机对照试验，共计4728名抑郁症患者。主要发现：(1)有氧运动：中等强度运动(每周3-5次，每次30-45分钟)显著改善抑郁症状(SMD=-0.62)，效果接近抗抑郁药物；(2)抗阻训练：力量训练同样有效(SMD=-0.49)，特别适合老年患者；(3)联合运动：有氧+抗阻联合效果最佳(SMD=-0.72)；(4)剂量反应关系：运动量与疗效呈正相关，每周150分钟中等强度运动为最优；(5)依从性：团体运动、户外运动依从性更高。机制探讨：(1)神经生物学：促进BDNF分泌、改善神经可塑性；(2)神经化学：增加内啡肽、5-HT、多巴胺水平；(3)心理社会：增强自我效能感、社交支持、作息规律。实践建议：将运动作为抑郁症治疗的一线辅助手段，根据患者偏好选择运动类型，逐步增加运动强度，鼓励长期坚持。运动是安全、经济、有效的抗抑郁干预。',
  'research',
  ARRAY['运动干预', '有氧运动', '系统综述', '非药物治疗'],
  'text',
  '运动与抑郁症.pdf',
  true,
  (SELECT id FROM profiles WHERE role IN ('doctor', 'admin') LIMIT 1)
),
(
  '数字心理健康：移动应用在抑郁症管理中的应用',
  '数字心理健康(Digital Mental Health)是利用信息技术提供心理健康服务的新模式。现状分析：全球已有超过10,000款心理健康APP，但仅5%基于循证证据。有效性研究：(1)CBT类APP(如Moodpath、Woebot)：RCT显示中等效果量(d=0.56)，适合轻中度抑郁；(2)正念冥想APP(如Headspace、Calm)：减轻焦虑抑郁症状(d=0.39)；(3)情绪追踪APP：提高患者自我觉察，辅助临床决策。核心功能：(1)症状监测：实时记录情绪、睡眠、活动；(2)干预模块：提供心理教育、技能训练、放松练习；(3)社会支持：在线社区、同伴支持；(4)危机干预：识别自杀风险、提供紧急资源。优势：便捷性、匿名性、成本低、可扩展性强。挑战：数据隐私、监管不足、依从性问题、效果持续性。融合模式：APP+传统治疗的混合模式(blended care)效果最优。未来趋势：AI聊天机器人、个性化推荐算法、可穿戴设备整合、远程医疗平台。数字疗法有望成为抑郁症阶梯治疗的重要组成部分。',
  'research',
  ARRAY['数字疗法', '移动应用', 'APP', '远程医疗'],
  'text',
  '数字心理健康APP.pdf',
  true,
  (SELECT id FROM profiles WHERE role IN ('doctor', 'admin') LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ 知识文档存储桶和策略创建完成！文件大小限制：50MB';
END $$;
