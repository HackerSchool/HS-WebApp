import { useCallback, useEffect, useRef, useState } from 'react';
import { getHacknightStatus } from '../services/hacknightService';
import API_CONFIG from '../config/api.config';

const DEFAULT_POLLING_INTERVAL = 15000;

export const useHacknightStatus = (options = {}) => {
    const { eventDate = undefined, pollingInterval = DEFAULT_POLLING_INTERVAL } = options;
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const pollingRef = useRef(null);
    const isMountedRef = useRef(false);
    const websocketRef = useRef(null);
    const refreshTimeoutRef = useRef(null);

    const fetchStatus = useCallback(async () => {
        try {
            setError(null);
            const data = await getHacknightStatus(eventDate);
            if (isMountedRef.current) {
                setStatus(data);
            }
            return data;
        } catch (err) {
            if (isMountedRef.current) {
                setError(err);
            }
            console.error('Erro ao carregar estado do HackNight:', err);
            throw err;
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [eventDate]);

    const scheduleRefresh = useCallback(() => {
        if (!isMountedRef.current) {
            return;
        }
        if (refreshTimeoutRef.current) {
            return;
        }
        refreshTimeoutRef.current = setTimeout(async () => {
            refreshTimeoutRef.current = null;
            try {
                await fetchStatus();
            } catch (err) {
                // handled in fetchStatus
            }
        }, 250);
    }, [fetchStatus]);

    useEffect(() => {
        isMountedRef.current = true;
        setLoading(true);
        fetchStatus();

        if (pollingInterval > 0) {
            pollingRef.current = setInterval(fetchStatus, pollingInterval);
        }

        const websocketUrl = API_CONFIG.WEBSOCKET_URL;
        try {
            const ws = new WebSocket(websocketUrl);
            websocketRef.current = ws;

            ws.onmessage = (event) => {
                if (!isMountedRef.current) {
                    return;
                }
                try {
                    const payload = JSON.parse(event.data);
                    if (!payload) {
                        return;
                    }

                    if (
                        payload.type?.startsWith('hacknight') ||
                        (payload.type === 'admin_data_update' && payload.data?.type === 'hacknight')
                    ) {
                        scheduleRefresh();
                    }
                } catch (parseError) {
                    // ignore malformed messages
                }
            };

            ws.onerror = () => {
                // fallback to polling only
            };
        } catch (err) {
            console.error('Erro ao abrir WebSocket para HackNight:', err);
        }

        return () => {
            isMountedRef.current = false;
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
            if (websocketRef.current) {
                try {
                    websocketRef.current.close();
                } catch (err) {
                    // ignore
                }
                websocketRef.current = null;
            }
        };
    }, [fetchStatus, pollingInterval, scheduleRefresh]);

    return {
        status,
        setStatus,
        loading,
        error,
        refresh: fetchStatus,
    };
};

export default useHacknightStatus;

