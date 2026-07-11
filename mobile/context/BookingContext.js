import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  getClientBookings,
  getFundiBookings,
  getClientBookingById,
  getFundiBookingById,
  getErrorMessage,
} from '../services/bookingsApi';
import {
  connectSocket,
  disconnectSocket,
  subscribeSocket,
} from '../services/socketService';
import {
  mapApiBooking,
  mapBookingRequest,
  bookingToActiveJob,
} from '../app/utils/bookings';

const BookingContext = createContext(null);

export function BookingProvider({
  children,
  userId,
  userRole,
  authToken,
  fundiCoords,
  onNavigate,
}) {
  const [activeBooking, setActiveBooking] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [fundiLocation, setFundiLocation] = useState(null);
  const onNavigateRef = useRef(onNavigate);

  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  const roleKey = userRole === 'fundi' ? 'fundi' : 'customer';

  const refreshBookings = useCallback(async () => {
    if (!authToken || !userId) return [];
    setLoading(true);
    try {
      const fetcher = roleKey === 'fundi' ? getFundiBookings : getClientBookings;
      const { data } = await fetcher();
      const list = (data?.bookings || []).map((b) => mapApiBooking(b, roleKey)).filter(Boolean);
      setBookings(list);
      setError('');

      const current =
        list.find((b) =>
          ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(b.status)
        ) || null;
      if (current) setActiveBooking(current);

      return list;
    } catch (e) {
      setError(getErrorMessage(e));
      return [];
    } finally {
      setLoading(false);
    }
  }, [authToken, userId, roleKey]);

  const refreshBookingById = useCallback(
    async (bookingId) => {
      if (!bookingId || !authToken) return null;
      try {
        const fetcher =
          roleKey === 'fundi' ? getFundiBookingById : getClientBookingById;
        const { data } = await fetcher(bookingId);
        if (!data?.booking) return null;
        const mapped = mapApiBooking(data.booking, roleKey);
        if (!mapped) return null;
        setActiveBooking(mapped);
        setBookings((prev) => {
          const idx = prev.findIndex((b) => b.id === mapped.id);
          if (idx < 0) return [mapped, ...prev];
          const next = [...prev];
          next[idx] = mapped;
          return next;
        });
        return mapped;
      } catch (e) {
        setError(getErrorMessage(e));
        return null;
      }
    },
    [authToken, roleKey]
  );

  useEffect(() => {
    if (!authToken || !userId) {
      disconnectSocket();
      return undefined;
    }

    connectSocket(userId);
    refreshBookings();

    const unsubs = [
      subscribeSocket('booking_request', (payload) => {
        if (roleKey !== 'fundi') return;
        const req = mapBookingRequest(payload, fundiCoords);
        if (!req) return;
        setPendingRequest(req);
        setNotification({
          type: 'request',
          title: 'New booking request',
          message: `${req.clientName} · ${req.category}`,
        });
      }),
      subscribeSocket('booking_accepted', (payload) => {
        if (roleKey === 'fundi') {
          setPendingRequest(null);
          if (payload?.bookingId) {
            refreshBookingById(payload.bookingId);
          }
          return;
        }
        setNotification({
          type: 'accepted',
          title: 'Fundi accepted!',
          message: `${payload?.fundiName || 'Your fundi'} accepted your booking.`,
        });
        if (payload?.bookingId) {
          refreshBookingById(payload.bookingId).then((booking) => {
            if (booking) {
              onNavigateRef.current?.('bookingWaiting', { booking });
            }
          });
        }
      }),
      subscribeSocket('booking_declined', () => {
        if (roleKey === 'fundi') {
          setPendingRequest(null);
        }
      }),
      subscribeSocket('no_fundi_available', (payload) => {
        if (roleKey !== 'customer') return;
        setNotification({
          type: 'error',
          title: 'No fundi available',
          message: 'No fundis are available right now. Please try again later.',
        });
        if (payload?.bookingId) refreshBookingById(payload.bookingId);
      }),
      subscribeSocket('booking_cancelled', (payload) => {
        setPendingRequest(null);
        setNotification({
          type: 'cancelled',
          title: 'Booking cancelled',
          message: payload?.reason || 'The booking was cancelled.',
        });
        if (payload?.bookingId) {
          refreshBookingById(payload.bookingId);
          refreshBookings();
        }
      }),
      subscribeSocket('status_on_the_way', (payload) => {
        if (payload?.bookingId) refreshBookingById(payload.bookingId);
        if (roleKey === 'customer') {
          onNavigateRef.current?.('tracking');
        }
      }),
      subscribeSocket('status_arrived', (payload) => {
        if (payload?.bookingId) refreshBookingById(payload.bookingId);
      }),
      subscribeSocket('status_in_progress', (payload) => {
        if (payload?.bookingId) refreshBookingById(payload.bookingId);
        if (roleKey === 'customer') {
          onNavigateRef.current?.('jobInProgress');
        }
      }),
      subscribeSocket('status_completed', (payload) => {
        if (payload?.bookingId) refreshBookingById(payload.bookingId);
      }),
      subscribeSocket('price_update', (payload) => {
        if (payload?.bookingId) refreshBookingById(payload.bookingId);
        if (payload?.priceAgreed) {
          setNotification({
            type: 'success',
            title: 'Price agreed',
            message: 'You can now proceed to payment.',
          });
        }
      }),
      subscribeSocket('fundi_location_update', (payload) => {
        if (!payload?.lat || !payload?.lng) return;
        setFundiLocation({ lat: payload.lat, lng: payload.lng, updatedAt: payload.updatedAt });
        setActiveBooking((prev) =>
          prev?.id === payload.bookingId
            ? { ...prev, fundiLocation: { lat: payload.lat, lng: payload.lng } }
            : prev
        );
      }),
      subscribeSocket('error', (payload) => {
        setError(payload?.message || 'Something went wrong');
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn?.());
    };
  }, [
    authToken,
    userId,
    roleKey,
    fundiCoords,
    refreshBookings,
    refreshBookingById,
  ]);

  const clearNotification = useCallback(() => setNotification(null), []);

  const activeJob = useMemo(
    () => (activeBooking ? bookingToActiveJob(activeBooking) : null),
    [activeBooking]
  );

  const value = useMemo(
    () => ({
      activeBooking,
      activeJob,
      pendingRequest,
      setPendingRequest,
      bookings,
      loading,
      error,
      setError,
      notification,
      clearNotification,
      fundiLocation,
      refreshBookings,
      refreshBookingById,
      setActiveBooking,
    }),
    [
      activeBooking,
      activeJob,
      pendingRequest,
      bookings,
      loading,
      error,
      notification,
      clearNotification,
      fundiLocation,
      refreshBookings,
      refreshBookingById,
    ]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return ctx;
}

export function useBookingOptional() {
  return useContext(BookingContext);
}
