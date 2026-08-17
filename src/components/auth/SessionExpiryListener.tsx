import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSessionExpiredHandler } from '../../api/sessionExpiry';

export function SessionExpiryListener() {
  const navigate = useNavigate();

  useEffect(() => {
    setSessionExpiredHandler(() => {
      navigate('/login', { replace: true });
    });
    return () => setSessionExpiredHandler(null);
  }, [navigate]);

  return null;
}
