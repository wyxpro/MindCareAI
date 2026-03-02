-- ==========================================
-- 确保数据库支持中文用户名
-- ==========================================
-- Supabase PostgreSQL 默认使用 UTF-8 编码，此迁移文件用于验证和记录

-- 验证数据库编码设置
DO $$
DECLARE
  db_encoding text;
BEGIN
  SELECT pg_encoding_to_char(encoding) INTO db_encoding
  FROM pg_database
  WHERE datname = current_database();
  
  IF db_encoding != 'UTF8' THEN
    RAISE EXCEPTION 'Database encoding is %, expected UTF8', db_encoding;
  END IF;
  
  RAISE NOTICE '✓ Database encoding verified: %', db_encoding;
END $$;

-- 验证 profiles.username 字段可以存储中文
-- 测试插入中文字符（将在事务结束时回滚）
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
BEGIN
  -- 测试插入中文用户名
  INSERT INTO profiles (id, username, role, created_at, updated_at)
  VALUES (test_id, '测试中文用户名', 'user', now(), now());
  
  -- 验证可以正确读取
  PERFORM username FROM profiles WHERE id = test_id AND username = '测试中文用户名';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to store or retrieve Chinese username';
  END IF;
  
  -- 清理测试数据
  DELETE FROM profiles WHERE id = test_id;
  
  RAISE NOTICE '✓ Chinese username storage verified';
END $$;

-- 为 profiles.username 字段添加注释说明支持中文
COMMENT ON COLUMN profiles.username IS '用户名，支持中文、英文、数字、下划线和连字符（2-20个字符）';

-- 验证完成提示
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE '中文用户名支持验证完成';
  RAISE NOTICE '- 数据库编码: UTF-8 ✓';
  RAISE NOTICE '- 中文存储: 支持 ✓';
  RAISE NOTICE '- username字段: 已更新注释';
  RAISE NOTICE '==========================================';
END $$;
