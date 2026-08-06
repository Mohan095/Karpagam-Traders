import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, ShieldOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../api';

const Login = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = await apiService.login(values.username, values.password);
      onLoginSuccess();
      message.success('Authenticated successfully. Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      message.error(
        err.response?.data?.detail || 'Authentication failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <ShieldOutlined style={{ fontSize: 40, color: 'var(--primary-gold)', marginBottom: 16 }} />
          <h2>Admin Access</h2>
          <p>Sign in with your secure credentials to manage inquiries.</p>
        </div>

        <Form
          name="admin_login"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />} 
              placeholder="Username" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />} 
              placeholder="Password" 
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block 
              loading={loading}
              style={{ 
                background: 'var(--primary-gold-gradient)', 
                border: 'none', 
                color: 'var(--text-dark)',
                fontWeight: 700
              }}
            >
              Authenticate Portal
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
