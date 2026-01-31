-- 添加知识库内容
INSERT INTO healing_contents (title, description, category, content_type, duration, author, view_count, like_count, is_active) VALUES
  ('认识抑郁症:症状与诊断', '了解抑郁症的常见症状、诊断标准和治疗方法', 'knowledge', 'article', 0, '灵愈医疗团队', 1250, 89, true),
  ('如何应对焦虑情绪', '学习有效的焦虑管理技巧和应对策略', 'knowledge', 'article', 0, '心理咨询师李医生', 980, 67, true),
  ('睡眠与心理健康', '探索睡眠质量对心理健康的重要影响', 'knowledge', 'video', 1200, '睡眠专家王教授', 2100, 156, true),
  ('正念冥想入门指南', '从零开始学习正念冥想的基础知识和练习方法', 'knowledge', 'video', 900, '冥想导师张老师', 1800, 134, true),
  ('抑郁症康复之路', '真实的康复故事分享,给你带来希望和力量', 'knowledge', 'audio', 1800, '康复者小明', 3200, 245, true),
  ('认知行为疗法(CBT)介绍', '了解CBT如何帮助改变负面思维模式', 'knowledge', 'article', 0, '心理治疗师陈医生', 1500, 98, true),
  ('运动与心理健康', '科学证据表明运动对心理健康的积极作用', 'knowledge', 'video', 600, '运动心理学专家', 1100, 78, true),
  ('家人如何支持抑郁症患者', '给家属的实用建议和沟通技巧', 'knowledge', 'article', 0, '家庭治疗师刘医生', 890, 56, true)
ON CONFLICT DO NOTHING;

-- 更新现有冥想内容的content_type
UPDATE healing_contents SET content_type = 'audio' WHERE content_type IS NULL OR content_type = '';

-- 添加更多冥想内容
INSERT INTO healing_contents (title, description, category, content_type, duration, is_active) VALUES
  ('专注力训练', '提升注意力和工作效率的专注训练', 'focus', 'audio', 600, true),
  ('身体扫描冥想', '通过身体扫描释放紧张和压力', 'relax', 'audio', 900, true),
  ('睡前放松引导', '帮助你快速进入深度睡眠的放松练习', 'sleep', 'audio', 1200, true),
  ('焦虑缓解呼吸法', '通过呼吸练习快速缓解焦虑情绪', 'relief', 'audio', 300, true)
ON CONFLICT DO NOTHING;