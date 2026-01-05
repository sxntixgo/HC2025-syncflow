import React, { useEffect, useState } from 'react';

const ToastNotification = ({ id, message, type, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss(id); // Notify parent to remove this toast
    }, 3000); // Toast disappears after 3 seconds

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  if (!visible) return null;

  const toastClass = `toast-notification ${type}`;

  return (
    <div className={toastClass}>
      {message}
    </div>
  );
};

export default ToastNotification;