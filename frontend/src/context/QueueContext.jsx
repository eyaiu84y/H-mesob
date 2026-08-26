/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const QueueContext = createContext(null);

// ─── Token prefix mapping from organization id ────────────────────
const TOKEN_PREFIXES = {
  electric: 'EEU',
  revenue: 'REV',
  justice: 'MOJ',
  cbe: 'CBE',
  ethiotel: 'ETL',
  ethiopost: 'EPS',
  investment: 'INV',
  labor: 'LAB',
  trade: 'TRD',
  construction: 'CON',
  fayda: 'NID',
  'sidama-bank': 'SDB',
};

function getPrefix(institutionId) {
  return TOKEN_PREFIXES[institutionId] || institutionId.slice(0, 3).toUpperCase();
}

// ─── localStorage helpers ─────────────────────────────────────────
const STORAGE_KEY = 'mesob_queue';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { myTickets: [], tokenCounters: {} };
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// ─── Provider ─────────────────────────────────────────────────────
export function QueueProvider({ children }) {
  const [myTickets, setMyTickets] = useState(() => loadFromStorage().myTickets);
  const [tokenCounters, setTokenCounters] = useState(() => loadFromStorage().tokenCounters);

  // Persist state changes
  useEffect(() => {
    saveToStorage({ myTickets, tokenCounters });
  }, [myTickets, tokenCounters]);

  // ── Queue updates are manual through employee actions ──
  // Automatic advancement removed - employees control queue progression
  // Citizens see real-time status through manual callNextToken updates

  // ── Register for a queue ───────────────────────────────────────
  const registerForQueue = useCallback((institutionId, institutionName, serviceName) => {
    const prefix = getPrefix(institutionId);

    // Get next token number for this institution
    const currentCount = tokenCounters[institutionId] || 0;
    const nextNumber = currentCount + 1;

    // Simulate a "currently serving" number (some tickets before ours)
    const peopleAhead = Math.floor(Math.random() * 8) + 3; // 3–10 people ahead
    const servingNumber = Math.max(1, nextNumber - peopleAhead);

    const ticket = {
      id: `${institutionId}-${Date.now()}`,
      institutionId,
      institutionName,
      serviceName,
      token: `${prefix}-${String(nextNumber).padStart(3, '0')}`,
      status: 'waiting',
      currentServing: `${prefix}-${String(servingNumber).padStart(3, '0')}`,
      peopleAhead,
      createdAt: new Date().toISOString(),
      calledAt: null,
      completedAt: null,
    };

    setMyTickets(prev => [ticket, ...prev]);
    setTokenCounters(prev => ({ ...prev, [institutionId]: nextNumber }));

    return ticket;
  }, [tokenCounters]);

  // ── Cancel / leave queue ───────────────────────────────────────
  const cancelTicket = useCallback((ticketId) => {
    setMyTickets(prev =>
      prev.map(t =>
        t.id === ticketId && (t.status === 'waiting' || t.status === 'called')
          ? { ...t, status: 'cancelled', completedAt: new Date().toISOString() }
          : t
      )
    );
  }, []);

  // ── Derived helpers ────────────────────────────────────────────
  const getActiveTickets = useCallback(() => {
    return myTickets.filter(t => t.status === 'waiting' || t.status === 'called');
  }, [myTickets]);

  const getTicketHistory = useCallback(() => {
    return myTickets.filter(t => t.status === 'completed' || t.status === 'cancelled');
  }, [myTickets]);

  // ── Employee queue operations ───────────────────────────────────
  const getInstitutionQueue = useCallback((institutionId) => {
    return myTickets.filter(t => 
      t.institutionId === institutionId && 
      (t.status === 'waiting' || t.status === 'called')
    ).sort((a, b) => {
      // Sort by token number to maintain queue order
      const aNum = parseInt(a.token.split('-')[1], 10);
      const bNum = parseInt(b.token.split('-')[1], 10);
      return aNum - bNum;
    });
  }, [myTickets]);

  const getCurrentServing = useCallback((institutionId) => {
    return myTickets.find(t => 
      t.institutionId === institutionId && 
      t.status === 'called'
    );
  }, [myTickets]);

  const callNextToken = useCallback((institutionId) => {
    setMyTickets(prev => {
      // Find the current serving token and complete it
      const currentServing = prev.find(t => 
        t.institutionId === institutionId && 
        t.status === 'called'
      );

      // Find the next waiting token
      const waitingTokens = prev
        .filter(t => t.institutionId === institutionId && t.status === 'waiting')
        .sort((a, b) => {
          const aNum = parseInt(a.token.split('-')[1], 10);
          const bNum = parseInt(b.token.split('-')[1], 10);
          return aNum - bNum;
        });

      const nextToken = waitingTokens[0]; // Get the first in line

      return prev.map(ticket => {
        // Complete the current serving token
        if (currentServing && ticket.id === currentServing.id) {
          return {
            ...ticket,
            status: 'completed',
            completedAt: new Date().toISOString(),
          };
        }
        
        // Call the next token
        if (nextToken && ticket.id === nextToken.id) {
          return {
            ...ticket,
            status: 'called',
            calledAt: new Date().toISOString(),
          };
        }

        return ticket;
      });
    });
  }, []);

  const completeCurrentToken = useCallback((institutionId) => {
    setMyTickets(prev => 
      prev.map(t => 
        t.institutionId === institutionId && t.status === 'called'
          ? { ...t, status: 'completed', completedAt: new Date().toISOString() }
          : t
      )
    );
  }, []);

  return (
    <QueueContext.Provider
      value={{
        myTickets,
        registerForQueue,
        cancelTicket,
        getActiveTickets,
        getTicketHistory,
        getInstitutionQueue,
        getCurrentServing,
        callNextToken,
        completeCurrentToken,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error('useQueue must be used inside QueueProvider');
  return ctx;
}
