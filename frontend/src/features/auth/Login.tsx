import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import itSupportImg from '../../assets/it_support.png';
import axiosInstance from '../../libs/axios';
import { AxiosError } from 'axios';

// ─── Kiểu dữ liệu Response từ API-01 ─────────────────────────────────────────
interface LoginApiResponse {
  token:         string;
  refresh_token: string;
  user: {
    nhan_vien_id: number;
    ho_ten:       string;
    email:        string;
    vai_tro: {
      ma_vai_tro:  string;
      ten_vai_tro: string;
    };
    nhom_ho_tro_id?: number | null;
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface LoginProps {
  onLoginSuccess?: (
    token:        string,
    refreshToken: string,
    user:         LoginApiResponse['user'],
  ) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const [usernameOrEmail,       setUsernameOrEmail]       = useState('');
  const [password,              setPassword]              = useState('');
  const [showPassword,          setShowPassword]          = useState(false);
  const [isLoading,             setIsLoading]             = useState(false);
  const [errorMessage,          setErrorMessage]          = useState<string | null>(null);
  const [successMessage,        setSuccessMessage]        = useState<string | null>(null);
  const [emailValidationError,  setEmailValidationError]  = useState('');
  const [passwordValidationError,setPasswordValidationError] = useState('');

  // ─── Validation helpers ─────────────────────────────────────────────────────
  const validateUsernameOrEmail = (val: string): boolean => {
    if (!val) {
      setEmailValidationError('Vui lòng nhập tên tài khoản hoặc email công ty.');
      return false;
    }
    if (val.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        setEmailValidationError('Email không đúng định dạng. Ví dụ: abc@company.com');
        return false;
      }
    } else {
      if (val.trim().length < 2) {
        setEmailValidationError('Tên tài khoản phải có độ dài tối thiểu 2 ký tự.');
        return false;
      }
    }
    setEmailValidationError('');
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordValidationError('Vui lòng nhập mật khẩu.');
      return false;
    }
    if (val.length < 8) {
      setPasswordValidationError('Mật khẩu phải có độ dài tối thiểu 8 ký tự.');
      return false;
    }
    setPasswordValidationError('');
    return true;
  };

  // ─── Event Handlers ─────────────────────────────────────────────────────────
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsernameOrEmail(val);
    if (emailValidationError) validateUsernameOrEmail(val);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (passwordValidationError) validatePassword(val);
  };

  // ─── Submit: gọi API-01 POST /auth/login ────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const isEmailValid    = validateUsernameOrEmail(usernameOrEmail);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);
    try {
      const response = await axiosInstance.post<LoginApiResponse>('/auth/login', {
        tai_khoan: usernameOrEmail,
        mat_khau:  password,
      });

      const { token, refresh_token, user } = response.data;

      setSuccessMessage(`Đăng nhập thành công! Chào mừng ${user.ho_ten}. Đang vào hệ thống...`);

      if (onLoginSuccess) {
        onLoginSuccess(token, refresh_token, user);
      }

      setTimeout(() => navigate('/dashboard'), 500);

    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const status   = axiosErr.response?.status;

      if (status === 400 || status === 401) {
        setErrorMessage('Tài khoản hoặc mật khẩu không chính xác');
      } else if (status === 403) {
        setErrorMessage('Tài khoản chưa được phân quyền hoặc đã bị tạm khóa');
      } else {
        setErrorMessage('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="login-container">
      <div className="login-card">

        {/* Cột trái: Khối nhận diện thương hiệu IT Helpdesk */}
        <div className="login-left">
          <div className="login-left-pattern"></div>
          <div className="login-left-glow"></div>

          <div className="brand-header">
            <div className="brand-logo-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12v5c0 1.66 1.34 3 3 3h3v-8H4v-2c0-4.41 3.59-8 8-8s8 3.59 8 8v2h-4v8h3c1.66 0 3-1.34 3-3v-5c0-5.52-4.48-10-10-10z" />
              </svg>
            </div>
            <span className="brand-name">IT HELPDESK</span>
          </div>

          <div className="brand-illustration-container">
            <img
              src={itSupportImg}
              alt="Minh họa Hỗ trợ IT nội bộ"
              className="brand-illustration"
            />
            <h1 className="brand-title">Hỗ Trợ IT Nội Bộ</h1>
            <p className="brand-desc">
              Giải pháp tối ưu hóa quy trình xử lý sự cố kỹ thuật, kết nối nhanh chóng nhân sự với bộ phận hỗ trợ IT L1/L2.
            </p>
          </div>

          <div className="brand-footer">
            <span>© 2026 Cổng thông tin vận hành IT doanh nghiệp</span>
          </div>
        </div>

        {/* Cột phải: Thẻ đăng nhập */}
        <div className="login-right">
          <div className="form-wrapper">
            <div className="form-header">
              <h2 className="form-title">Đăng nhập vào hệ thống</h2>
              <p className="form-subtitle">Nhập tài khoản để truy cập Helpdesk</p>
            </div>

            {/* Error Message Alert (Màu #DC2626) */}
            {errorMessage && (
              <div className="error-alert">
                <div className="error-alert-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <p className="error-alert-text">{errorMessage}</p>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="error-alert" style={{ backgroundColor: '#ECFDF5', borderColor: '#10B981' }}>
                <div className="error-alert-icon" style={{ color: '#10B981' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <p className="error-alert-text" style={{ color: '#065F46' }}>{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Username or Email Input */}
              <div className="form-group">
                <label htmlFor="usernameOrEmail" className="form-label">Tên tài khoản hoặc Email công ty</label>
                <div className="input-container">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="usernameOrEmail"
                    className="form-input"
                    placeholder="Tên tài khoản hoặc email công ty"
                    value={usernameOrEmail}
                    onChange={handleEmailChange}
                    onBlur={() => validateUsernameOrEmail(usernameOrEmail)}
                    disabled={isLoading}
                    required
                    autoComplete="username"
                  />
                </div>
                {emailValidationError && (
                  <span className="password-strength-hint" style={{ color: 'var(--color-error)' }}>
                    {emailValidationError}
                  </span>
                )}
              </div>

              {/* Password Input */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="password" className="form-label">Mật khẩu</label>
                <div className="input-container">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => validatePassword(password)}
                    disabled={isLoading}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {passwordValidationError ? (
                  <span className="password-strength-hint" style={{ color: 'var(--color-error)' }}>
                    {passwordValidationError}
                  </span>
                ) : (
                  <span className="password-strength-hint">
                    Tối thiểu 8 ký tự.
                  </span>
                )}
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                className="btn-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Đang xác thực...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            {/* Chân trang thông tin bổ sung */}
            <div className="support-link">
              Liên hệ bộ phận IT khi không thể đăng nhập
            </div>

            <div className="footer-meta">
              Bảo mật | Hỗ trợ nội bộ
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
