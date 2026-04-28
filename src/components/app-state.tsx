"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  Assignment,
  Destination,
  MovementLog,
  MovementRecord,
  Role,
  WbpRecord,
} from "@/lib/domain";

interface SessionActor {
  id: string;
  name: string;
  email: string;
  role: Role;
  assignment?: Assignment | null;
  isActive: boolean;
}

interface UpsertWbpPayload {
  originalRegistrationNumber?: string;
  registrationNumber: string;
  fullName: string;
  roomBlock: string;
  roomNumber: string;
  photoUrl?: string;
}

interface AppStateValue {
  now: Date;
  actor: SessionActor | null;
  wbps: WbpRecord[];
  movements: MovementRecord[];
  logs: MovementLog[];
  isLoading: boolean;
  isAuthenticating: boolean;
  error: string | null;
  clearError: () => void;
  signIn: (payload: { email: string; password: string }) => Promise<boolean>;
  signUp: (payload: {
    name: string;
    email: string;
    password: string;
    role: Exclude<Role, "Superadmin">;
    assignment?: Destination | "Pintu 3" | "Administrasi";
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
  sendToDestination: (wbpId: string, destination: Destination) => Promise<boolean>;
  confirmArrival: (movementId: string) => Promise<boolean>;
  completeAndReturn: (movementId: string) => Promise<boolean>;
  confirmReturned: (movementId: string) => Promise<boolean>;
  upsertWbp: (payload: UpsertWbpPayload) => Promise<boolean>;
  deleteWbp: (registrationNumber: string) => Promise<boolean>;
}

interface ApiMovementItem {
  id: string;
  origin: string;
  destination: Destination;
  status: MovementRecord["status"];
  departureAt: string;
  arrivedAt?: string | null;
  completedAt?: string | null;
  returnedAt?: string | null;
  updatedAt: string;
  wbp: WbpRecord;
  doorOfficer?: { name: string } | null;
  roomOfficer?: { name: string } | null;
}

interface ApiLogItem {
  id: string;
  movementId: string;
  wbpId: string;
  eventLabel: string;
  destination: Destination;
  status: MovementRecord["status"];
  timestamp: string;
  operatorName: string;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function getErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "Terjadi kesalahan saat memproses permintaan.";
}

async function parseResponse<T>(response: Response) {
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T | { error?: string; message?: string }) : null;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload as T;
}

function normalizeMovement(item: ApiMovementItem): MovementRecord {
  return {
    id: item.id,
    wbpId: item.wbp.id,
    origin: item.origin,
    destination: item.destination,
    status: item.status,
    departureAt: item.departureAt,
    arrivedAt: item.arrivedAt ?? undefined,
    completedAt: item.completedAt ?? undefined,
    returnedAt: item.returnedAt ?? undefined,
    doorOfficer: item.doorOfficer?.name ?? "Petugas Pintu 3",
    roomOfficer: item.roomOfficer?.name ?? undefined,
    updatedAt: item.updatedAt,
  };
}

function normalizeLog(item: ApiLogItem): MovementLog {
  return {
    id: item.id,
    movementId: item.movementId,
    wbpId: item.wbpId,
    event: item.eventLabel,
    destination: item.destination,
    status: item.status,
    timestamp: item.timestamp,
    operator: item.operatorName,
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [wbps, setWbps] = useState<WbpRecord[]>([]);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [logs, setLogs] = useState<MovementLog[]>([]);
  const [actor, setActor] = useState<SessionActor | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  async function fetchSession() {
    const response = await fetch("/api/session", {
      cache: "no-store",
      credentials: "include",
    });

    if (response.status === 401) {
      return null;
    }

    const payload = await parseResponse<{
      actor: SessionActor;
    }>(response);

    return payload.actor;
  }

  async function fetchAppData() {
    const [wbpsResponse, movementsResponse, logsResponse] = await Promise.all([
      fetch("/api/wbps", {
        cache: "no-store",
        credentials: "include",
      }),
      fetch("/api/movements", {
        cache: "no-store",
        credentials: "include",
      }),
      fetch("/api/logs?limit=200", {
        cache: "no-store",
        credentials: "include",
      }),
    ]);

    if (
      wbpsResponse.status === 401 ||
      movementsResponse.status === 401 ||
      logsResponse.status === 401
    ) {
      setActor(null);
      setWbps([]);
      setMovements([]);
      setLogs([]);
      return false;
    }

    const [wbpsPayload, movementsPayload, logsPayload] = await Promise.all([
      parseResponse<{ items: WbpRecord[] }>(wbpsResponse),
      parseResponse<{ items: ApiMovementItem[] }>(movementsResponse),
      parseResponse<{ items: ApiLogItem[] }>(logsResponse),
    ]);

    setWbps(
      wbpsPayload.items.map((item) => ({
        id: item.id,
        registrationNumber: item.registrationNumber,
        fullName: item.fullName,
        roomBlock: item.roomBlock,
        roomNumber: item.roomNumber,
        photoUrl: item.photoUrl,
      })),
    );
    setMovements(movementsPayload.items.map(normalizeMovement));
    setLogs(logsPayload.items.map(normalizeLog));
    return true;
  }

  async function hydrateApp(showLoading = false) {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const nextActor = await fetchSession();
      setActor(nextActor);

      if (!nextActor) {
        setWbps([]);
        setMovements([]);
        setLogs([]);
        return;
      }

      await fetchAppData();
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Gagal memuat data aplikasi.",
      );
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    void hydrateApp(true);
  }, []);

  useEffect(() => {
    if (!actor) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchAppData().catch((caughtError) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Gagal menyegarkan data dashboard.",
        );
      });
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [actor]);

  async function mutate(
    input: RequestInfo | URL,
    init?: RequestInit,
    refreshAfter = true,
  ) {
    try {
      const response = await fetch(input, {
        credentials: "include",
        ...init,
      });

      if (response.status === 401) {
        setActor(null);
        setWbps([]);
        setMovements([]);
        setLogs([]);
        setError("Sesi berakhir. Silakan login kembali.");
        return false;
      }

      await parseResponse<unknown>(response);

      if (refreshAfter) {
        await fetchAppData();
      }

      setError(null);
      return true;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Aksi tidak dapat diselesaikan.",
      );
      return false;
    }
  }

  async function signIn(payload: { email: string; password: string }) {
    setIsAuthenticating(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      await parseResponse<unknown>(response);
      await hydrateApp(false);
      return true;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Login gagal. Periksa email dan password.",
      );
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function signUp(payload: {
    name: string;
    email: string;
    password: string;
    role: Exclude<Role, "Superadmin">;
    assignment?: Destination | "Pintu 3" | "Administrasi";
  }) {
    if (payload.password.trim().length < 8) {
      setError("Sandi harus minimal 8 karakter.");
      return false;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const signUpResponse = await fetch("/api/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: payload.role,
          assignment: payload.assignment,
        }),
      });

      await parseResponse<unknown>(signUpResponse);

      const signInResponse = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
        }),
      });

      await parseResponse<unknown>(signInResponse);
      await hydrateApp(false);
      return true;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Registrasi gagal. Coba gunakan data yang berbeda.",
      );
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function signOut() {
    await mutate(
      "/api/auth/sign-out",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
      false,
    );

    setActor(null);
    setWbps([]);
    setMovements([]);
    setLogs([]);
  }

  const value = useMemo<AppStateValue>(
    () => ({
      now,
      actor,
      wbps,
      movements,
      logs,
      isLoading,
      isAuthenticating,
      error,
      clearError: () => setError(null),
      signIn,
      signUp,
      signOut,
      refreshData: async () => {
        await fetchAppData();
      },
      sendToDestination: async (wbpId, destination) =>
        mutate("/api/movements/dispatch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wbpId,
            destination,
          }),
        }),
      confirmArrival: async (movementId) =>
        mutate(`/api/movements/${movementId}/arrive`, {
          method: "POST",
        }),
      completeAndReturn: async (movementId) =>
        mutate(`/api/movements/${movementId}/complete`, {
          method: "POST",
        }),
      confirmReturned: async (movementId) =>
        mutate(`/api/movements/${movementId}/return`, {
          method: "POST",
        }),
      upsertWbp: async (payload) => {
        const method = payload.originalRegistrationNumber ? "PATCH" : "POST";
        const url = payload.originalRegistrationNumber
          ? `/api/wbps/${encodeURIComponent(payload.originalRegistrationNumber)}`
          : "/api/wbps";

        return mutate(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            registrationNumber: payload.registrationNumber,
            fullName: payload.fullName,
            roomBlock: payload.roomBlock,
            roomNumber: payload.roomNumber,
            photoUrl: payload.photoUrl,
          }),
        });
      },
      deleteWbp: async (registrationNumber) =>
        mutate(`/api/wbps/${encodeURIComponent(registrationNumber)}`, {
          method: "DELETE",
        }),
    }),
    [actor, error, isAuthenticating, isLoading, logs, movements, now, wbps],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
