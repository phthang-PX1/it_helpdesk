import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ticketService } from '../../services/ticket.service';
import './ReviewPage.css';

export const ReviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Đường dẫn đánh giá không hợp lệ (thiếu token).');
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const res = await ticketService.validateReviewToken(token);
        if (res.valid) {
          setTicketInfo(res.ticket);
        } else {
          setError('Token đánh giá đã hết hạn hoặc không hợp lệ.');
        }
      } catch (err) {
        setError('Lỗi kết nối khi xác thực đường dẫn đánh giá.');
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Vui lòng chọn số sao đánh giá!');
      return;
    }
    setSubmitting(true);
    try {
      await ticketService.submitReview({
        token: token!,
        hai_long: rating >= 4,
        so_sao: rating,
        nhan_xet: feedback
      });
      setSubmitted(true);
    } catch (err: any) {
      alert('Có lỗi xảy ra: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="review-page-container">Đang kiểm tra đường dẫn...</div>;
  }

  if (error) {
    return (
      <div className="review-page-container">
        <div className="review-card">
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 className="review-title">Không thể đánh giá</h2>
          <p className="review-subtitle" style={{ color: '#EF4444' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="review-page-container">
        <div className="review-card">
          <div className="review-success">✓</div>
          <h2 className="review-title">Cảm ơn bạn!</h2>
          <p className="review-subtitle">Đánh giá của bạn đã được ghi nhận. Chúng tôi sẽ tiếp tục cải thiện chất lượng dịch vụ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page-container">
      <div className="review-card">
        <h2 className="review-title">Đánh giá dịch vụ</h2>
        <p className="review-subtitle">Vui lòng đánh giá trải nghiệm hỗ trợ của bạn</p>
        
        {ticketInfo && (
          <div className="ticket-info-box">
            <div className="ticket-info-title">{ticketInfo.tieu_de || 'Phiếu hỗ trợ'}</div>
            <div className="ticket-info-desc">Mã phiếu: {ticketInfo.ma_phieu}</div>
            {ticketInfo.nguoi_ho_tro && (
              <div className="ticket-info-desc">Người hỗ trợ: {ticketInfo.nguoi_ho_tro.ho_ten}</div>
            )}
          </div>
        )}

        <div className="star-rating">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={`star-btn ${rating >= star ? 'active' : ''}`}
              onClick={() => setRating(star)}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="feedback-textarea"
          placeholder="Chia sẻ thêm ý kiến của bạn (không bắt buộc)..."
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
        />

        <button 
          className="btn-submit-review" 
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
        >
          {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </div>
    </div>
  );
};
