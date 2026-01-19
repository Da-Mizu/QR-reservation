import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// Normalise API URL
const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost/QR-reservation/backend-php';
const API_BASE = RAW_API_URL
  .replace(/\/$/, '')
  .replace(/\/index\.php\/?$/, '')
  .replace(/\/api\/?$/, '');
const API_URL = `${API_BASE}/api`;
const STREAM_URL = `${API_BASE}`;

/**
 * Hook for KDS data management: SSE with polling fallback
 */
export const useKDSData = () => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useSSE, setUseSSE] = useState(true);
  
  const eventSourceRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Fetch orders via regular API
  const fetchOrders = useCallback(async () => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_URL}/commandes`, config);
      const allOrders = res.data || [];
      
      // Filter active orders only
      const activeOrders = allOrders.filter(o => 
        ['en_attente', 'en_preparation', 'prete'].includes(o.statut)
      );
      
      setOrders(activeOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Connect to SSE stream
  const connectSSE = useCallback(() => {
    if (!token) return;

    try {
      // Encode token for query param safely
      const streamUrl = `${STREAM_URL}/endpoints/commandes_stream.php?token=${encodeURIComponent(token)}`;
      const es = new EventSource(streamUrl);

      es.onopen = () => {
        console.log('SSE connection opened');
        setUseSSE(true);
        setError(null);
      };

      es.addEventListener('initial_state', (event) => {
        try {
          const data = JSON.parse(event.data);
          setOrders(Array.isArray(data) ? data : []);
          setLoading(false);
        } catch (err) {
          console.error('Error parsing initial state:', err);
        }
      });

      es.addEventListener('orders_update', (event) => {
        try {
          const data = JSON.parse(event.data);
          setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('Error parsing orders update:', err);
        }
      });

      es.onerror = (err) => {
        console.error('SSE error, falling back to polling:', err);
        setUseSSE(false);
        es.close();
        eventSourceRef.current = null;
        // Start polling fallback
        startPolling();
      };

      eventSourceRef.current = es;
    } catch (err) {
      console.error('SSE connection failed:', err);
      setUseSSE(false);
      startPolling();
    }
  }, [token]);

  // Polling fallback (every 5 seconds)
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    
    pollingIntervalRef.current = setInterval(() => {
      fetchOrders();
    }, 5000);
  }, [fetchOrders]);

  // Initialize connection on mount
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Try SSE first
    connectSSE();

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [token, connectSSE]);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.patch(
        `${API_URL}/commandes/${orderId}/statut`,
        { statut: newStatus },
        config
      );

      // Optimistic update
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId ? { ...o, statut: newStatus, updated_at: new Date().toISOString() } : o
        )
      );

      // Refresh from server after a short delay
      setTimeout(() => fetchOrders(), 500);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Erreur lors de la mise à jour du statut');
      // Revert optimistic update
      fetchOrders();
    }
  }, [token, fetchOrders]);

  // Assign order to station
  const assignStation = useCallback(async (orderId, station) => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      // Using commandes endpoint with a station field (or create new endpoint if needed)
      await axios.patch(
        `${API_URL}/commandes/${orderId}`,
        { station },
        config
      );

      setOrders(prev =>
        prev.map(o =>
          o.id === orderId ? { ...o, station } : o
        )
      );
    } catch (err) {
      console.error('Error assigning station:', err);
    }
  }, [token]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    useSSE,
    updateOrderStatus,
    assignStation,
    refresh,
  };
};
