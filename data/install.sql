CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at timestamptz,
    nickname VARCHAR(255),
    avatar_url VARCHAR(255),
    locale VARCHAR(50),
    signin_type VARCHAR(50),
    signin_ip VARCHAR(255),
    signin_provider VARCHAR(50),
    signin_openid VARCHAR(255),
    invite_code VARCHAR(255) NOT NULL default '',
    updated_at timestamptz,
    invited_by VARCHAR(255) NOT NULL default '',
    is_affiliate BOOLEAN NOT NULL default false,
    UNIQUE (email, signin_provider)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(255) UNIQUE NOT NULL,
    created_at timestamptz,
    user_uuid VARCHAR(255) NOT NULL DEFAULT '',
    user_email VARCHAR(255) NOT NULL DEFAULT '',
    amount INT NOT NULL,
    interval VARCHAR(50),
    expired_at timestamptz,
    status VARCHAR(50) NOT NULL,
    stripe_session_id VARCHAR(255),
    credits INT NOT NULL,
    currency VARCHAR(50),
    sub_id VARCHAR(255),
    sub_interval_count int,
    sub_cycle_anchor int,
    sub_period_end int,
    sub_period_start int,
    sub_times int,
    product_id VARCHAR(255),
    product_name VARCHAR(255),
    valid_months int,
    order_detail TEXT,
    paid_at timestamptz,
    paid_email VARCHAR(255),
    paid_detail TEXT
);


CREATE TABLE apikeys (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(100),
    user_uuid VARCHAR(255) NOT NULL,
    created_at timestamptz,
    status VARCHAR(50)
);

CREATE TABLE credits (
    id SERIAL PRIMARY KEY,
    trans_no VARCHAR(255) UNIQUE NOT NULL,
    created_at timestamptz,
    user_uuid VARCHAR(255) NOT NULL,
    trans_type VARCHAR(50) NOT NULL,
    credits INT NOT NULL,
    order_no VARCHAR(255),
    expired_at timestamptz
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    content TEXT,
    created_at timestamptz,
    updated_at timestamptz,
    status VARCHAR(50),
    cover_url VARCHAR(255),
    author_name VARCHAR(255),
    author_avatar_url VARCHAR(255),
    locale VARCHAR(50)
);

create table affiliates (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    created_at timestamptz,
    status VARCHAR(50) NOT NULL default '',
    invited_by VARCHAR(255) NOT NULL,
    paid_order_no VARCHAR(255) NOT NULL default '',
    paid_amount INT NOT NULL default 0,
    reward_percent INT NOT NULL default 0,
    reward_amount INT NOT NULL default 0
);

CREATE TABLE feedbacks (
    id SERIAL PRIMARY KEY,
    created_at timestamptz,
    status VARCHAR(50),
    user_uuid VARCHAR(255),
    content TEXT,
    rating INT
);


-- 添加到 data/install.sql
CREATE TABLE ai_usage_records (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255), -- 登录用户的UUID，未登录用户为NULL
    session_id VARCHAR(255), -- 未登录用户的会话标识
    ip_address VARCHAR(255), -- IP地址作为备用标识
    service_type VARCHAR(50) NOT NULL, -- 服务类型：'keyword_generation'
    created_at timestamptz DEFAULT NOW(),
    user_agent TEXT -- 用户代理信息
);

-- 创建索引提高查询性能
CREATE INDEX idx_ai_usage_user_uuid ON ai_usage_records(user_uuid);
CREATE INDEX idx_ai_usage_session_id ON ai_usage_records(session_id);
CREATE INDEX idx_ai_usage_ip_created ON ai_usage_records(ip_address, created_at);