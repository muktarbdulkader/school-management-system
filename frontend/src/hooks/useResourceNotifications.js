import { useEffect, useRef } from 'react';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-hot-toast';

/**
 * Hook to check for new resources assigned to the user
 * Shows toast notifications when new resources are available
 */
export const useResourceNotifications = () => {
  // Use ref to avoid re-renders
  const lastCheckRef = useRef(localStorage.getItem('lastResourceCheck') || new Date().toISOString());
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const checkNewResources = async () => {
      try {
        const token = await GetToken();
        const response = await fetch(
          `${Backend.api}${Backend.digitalResources}?created_after=${encodeURIComponent(lastCheckRef.current)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          const count = result.data.length;
          toast.success(
            `📚 ${count} new resource${count > 1 ? 's' : ''} assigned to you!`,
            { duration: 5000 }
          );
        }

        // Update last check time
        const now = new Date().toISOString();
        localStorage.setItem('lastResourceCheck', now);
        lastCheckRef.current = now;
      } catch (error) {
        console.error('Error checking for new resources:', error);
      }
    };

    // Check immediately on mount
    checkNewResources();

    // Check every 5 minutes
    const interval = setInterval(checkNewResources, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount
};

export default useResourceNotifications;
