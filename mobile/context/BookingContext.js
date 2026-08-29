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
  getTimeLeftSeconds,
  calculateDistanceKm,
} from '../app/utils/bookings';

const BookingContext = createContext(null);

const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'];

// Rebuild a socket-style request object from a persisted PENDING booking so
// requests that arrived while the fundi was logged out still show up.
function requestFromBooking(booking, coords) {
  return {
    id: booking.id,
    bookingId: booking.id,
    category: booking.category,
    service: booking.service || booking.category,
    description: booking.description,
    address: booking.address,
    location: booking.location || null,
    clientName: booking.clientName,
    clientPhone: booking.clientPhone || '',
    estimatedPrice: booking.proposedPrice || booking.agreedPrice || null,
    expiresAt: booking.expiresAt,
    timeLeft: getTimeLeftSeconds(booking),
    distanceKm:
      booking.distanceKm ?? calculateDistanceKm(coords, booking.location),
    status: 'PENDING',
  };
}

export function BookingProvider({
  children,
  userId,
  userRole,
  authToken,
  fundiCoords,
  onNavigate,
}) {
  const [activeBookings, setActiveBookings] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [fundiLocation, setFundiLocation] = useState(null);
  const onNavigateRef = useRef(onNavigate);
  const fundiCoordsRef = useRef(fundiCoords);

  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  useEffect(() => {
    fundiCoordsRef.current = fundiCoords;
  }, [fundiCoords]);

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

      // Sync in-flight state with the DB — also clears stale entries once a
      // booking is completed/cancelled, so restore always reflects the truth.
      // A client may have several concurrent active bookings, so keep them all
      // instead of only the first, and track the most recent as the primary.
      const actives = list.filter((b) => ACTIVE_STATUSES.includes(b.status));
      setActiveBookings(actives);
      setActiveBooking(
        actives.length
          ? actives.sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            )[0]
          : null,
      );

      // Fundis: restore requests that arrived while logged out. A PENDING
      // booking with no assigned fundi is still a live request for this fundi.
      if (roleKey === 'fundi') {
        const candidate = list.find(
          (b) =>
            b.status === 'PENDING' && !b.fundiId && getTimeLeftSeconds(b) > 0
        );
        if (candidate) {
          const req = requestFromBooking(candidate, fundiCoordsRef.current);
          setPendingRequest((prev) =>
            prev && prev.id === req.id ? prev : req
          );
        } else {
          setPendingRequest(null);
        }
      }

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

        // Keep the active list in sync per-booking so one booking's refresh
        // never wipes out another concurrent active booking.
        setBookings((prev) => {
          const idx = prev.findIndex((b) => b.id === mapped.id);
          if (idx < 0) return [mapped, ...prev];
          const next = [...prev];
          next[idx] = mapped;
          return next;
        });

        setActiveBookings((prev) => {
          const rest = (prev || []).filter((b) => b.id !== mapped.id);
          if (ACTIVE_STATUSES.includes(mapped.status)) {
            const next = [...rest, mapped];
            return next.sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            );
          }
          return rest;
        });

        // Refresh the primary booking too, but only touch it when this is the
        // booking it currently points at (screens hold their own id-keyed copy).
        setActiveBooking((prev) => {
          if (prev && prev.id === mapped.id) {
            return ACTIVE_STATUSES.includes(mapped.status) ? mapped : null;
          }
          return prev;
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
        if (payload?.bookingId) {
          refreshBookingById(payload.bookingId);
          refreshBookings();
        }
      }),
      subscribeSocket('price_update', (payload) => {
        if (payload?.bookingId) refreshBookingById(payload.bookingId);
        const myRoleKey = roleKey === 'customer' ? 'CLIENT' : 'FUNDI';
        if (payload?.priceAgreed) {
          setNotification({
            type: 'success',
            title: 'Price agreed',
            message: 'You can now proceed to payment.',
          });
        } else if (
          payload?.proposedPrice &&
          payload?.proposedBy &&
          payload.proposedBy !== myRoleKey
        ) {
          setNotification({
            type: 'info',
            title: 'New price proposal',
            message: `${
              payload.proposedBy === 'CLIENT' ? 'Client' : 'Fundi'
            } proposed UGX ${Number(payload.proposedPrice).toLocaleString()}.`,
          });
        }
      }),
      subscribeSocket('fundi_location_update', (payload) => {
        if (!payload?.lat || !payload?.lng) return;
        const loc = { lat: payload.lat, lng: payload.lng, updatedAt: payload.updatedAt };
        setFundiLocation(loc);
        const apply = (b) =>
          b?.id === payload.bookingId ? { ...b, fundiLocation: loc } : b;
        setActiveBooking((prev) => apply(prev));
        setActiveBookings((prev) => (prev || []).map(apply));
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
      activeBookings,
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
      activeBookings,
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
