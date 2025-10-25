import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatusBanner, { getErrorMessage } from '../../components/StatusBanner';

describe('StatusBanner', () => {
  it('renders basic banner with message', () => {
    render(<StatusBanner type="info" message="테스트 메시지" />);
    expect(screen.getByText('테스트 메시지')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const mockAction = jest.fn();
    render(
      <StatusBanner
        type="error"
        message="에러 메시지"
        actionLabel="재시도"
        onAction={mockAction}
      />
    );

    const actionButton = screen.getByRole('button', { name: '재시도' });
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('renders close button when onClose provided', () => {
    const mockClose = jest.fn();
    render(
      <StatusBanner
        type="warning"
        message="경고 메시지"
        onClose={mockClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: '배너 닫기' });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('auto closes when autoClose is enabled', async () => {
    const mockClose = jest.fn();
    render(
      <StatusBanner
        type="success"
        message="성공 메시지"
        onClose={mockClose}
        autoClose
        duration={100}
      />
    );

    await waitFor(() => {
      expect(mockClose).toHaveBeenCalledTimes(1);
    }, { timeout: 200 });
  });

  it('applies correct CSS classes for different types', () => {
    const { rerender } = render(<StatusBanner type="error" message="에러" />);
    expect(screen.getByRole('alert')).toHaveClass('banner', 'error');

    rerender(<StatusBanner type="success" message="성공" />);
    expect(screen.getByRole('alert')).toHaveClass('banner', 'success');

    rerender(<StatusBanner type="warning" message="경고" />);
    expect(screen.getByRole('alert')).toHaveClass('banner', 'warning');

    rerender(<StatusBanner type="info" message="정보" />);
    expect(screen.getByRole('alert')).toHaveClass('banner', 'info');
  });
});

describe('getErrorMessage', () => {
  it('returns correct message for 403 errors', () => {
    expect(getErrorMessage(403, 'NOT_ASSIGNED')).toBe('이 레슨은 배정되지 않았습니다.');
    expect(getErrorMessage(403)).toBe('권한이 없습니다.');
  });

  it('returns correct message for 422 errors', () => {
    expect(getErrorMessage(422, 'NOT_STARTED')).toBe('수강 기간이 아닙니다.');
    expect(getErrorMessage(422, 'EXPIRED')).toBe('수강 기간이 아닙니다.');
    expect(getErrorMessage(422, 'ATTEMPT_LIMIT')).toBe('이번 회차 응시 제한에 도달했습니다.');
    expect(getErrorMessage(422, 'ALREADY_PASSED')).toBe('이미 합격한 레슨입니다.');
    expect(getErrorMessage(422, 'PROGRESS_REQUIRED')).toBe('진도율 90% 이상이어야 시험을 응시할 수 있습니다.');
    expect(getErrorMessage(422)).toBe('요청을 처리할 수 없습니다.');
  });

  it('returns correct message for 401 errors', () => {
    expect(getErrorMessage(401)).toBe('로그인이 필요합니다.');
  });

  it('returns default message for unknown errors', () => {
    expect(getErrorMessage(500)).toBe('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  });
});










