import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import type { RootState } from '../redux/store';

export const useExpiringDocuments = () => {
    const [showExpiringToast, setShowExpiringToast] = useState(false);
    const [expiringDocuments, setExpiringDocuments] = useState<any[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    
    const { userInfo } = useSelector((state: RootState) => state.userAuth);
    
    // Type assertion to handle the nested userData structure
    const userData = (userInfo as any)?.userData;

    // Check if we're in HR panel routes
    const isHRPanel = location.pathname.startsWith('/Management') || location.pathname.startsWith('/accounts');

    // Check for expiring documents continuously (only in HR panel)
    useEffect(() => {
        // Only check if we're in HR panel routes
        if (!isHRPanel) {
            setShowExpiringToast(false);
            return;
        }

        console.log('🔍 useExpiringDocuments useEffect triggered (HR panel only)');
        
        const checkExpiringDocuments = async () => {
            // Check both Redux and localStorage for userInfo (fallback for timing issues)
            let effectiveUserInfo = userInfo;
            let effectiveUserData = userData;
            
            if (!effectiveUserInfo) {
                try {
                    const storedUserInfo = localStorage.getItem('userInfo');
                    if (storedUserInfo) {
                        const parsed = JSON.parse(storedUserInfo);
                        if (parsed && parsed.userData) {
                            effectiveUserInfo = parsed;
                            effectiveUserData = parsed.userData;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing userInfo from localStorage:', e);
                }
            }
            
            if (!effectiveUserInfo || !effectiveUserData || !['admin', 'hr', 'superadmin'].includes(effectiveUserData.role)) {
                return;
            }

            try {
                // Check only employee documents (vehicle documents moved to Fleet Maintenance)
                const employeeDocsRes = await import('../axios/api/employeeDocument').then(m => m.getExpiringDocuments(30));
                
                // Handle employee documents
                if (employeeDocsRes && employeeDocsRes.success && employeeDocsRes.data && employeeDocsRes.data.length > 0) {
                    setExpiringDocuments(employeeDocsRes.data);
                    setShowExpiringToast(true);
                } else {
                    setShowExpiringToast(false);
                }
            } catch (error: any) {
                // Silently handle errors - don't crash the app for background checks
                if (error?.response?.status !== 403 && error?.response?.status !== 401) {
                    console.error('❌ Error checking expiring documents:', error);
                }
                setShowExpiringToast(false);
            }
        };

        // Add a small delay before first check to allow Redux state to update after login
        const initialCheckTimeout = setTimeout(() => {
            checkExpiringDocuments();
        }, 500); // 500ms delay

        // Set up interval to check every 30 seconds
        const interval = setInterval(() => {
            checkExpiringDocuments();
        }, 30 * 1000); // 30 seconds

        // Cleanup interval and timeout on unmount
        return () => {
            clearInterval(interval);
            clearTimeout(initialCheckTimeout);
        };
    }, [userInfo, userData, isHRPanel]);

    const handleCloseToast = () => {
        setShowExpiringToast(false);
    };

    const handleViewDocuments = () => {
        setShowExpiringToast(false);
        navigate('/Management/documents');
    };

    return {
        showExpiringToast,
        expiringDocuments,
        setShowExpiringToast,
        handleCloseToast,
        handleViewDocuments
    };
};
