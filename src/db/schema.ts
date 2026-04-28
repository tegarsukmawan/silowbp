import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleValues = [
  "Superadmin",
  "Admin",
  "Petugas Pintu 3",
  "Petugas Ruangan",
] as const;

export const assignmentValues = [
  "Pintu 3",
  "Administrasi",
  "Klinik",
  "Registrasi",
  "Kunjungan",
] as const;

export const destinationValues = ["Klinik", "Registrasi", "Kunjungan"] as const;

export const movementStatusValues = [
  "Transit",
  "Tiba",
  "Selesai",
  "Kembali",
] as const;

export const movementEventTypeValues = [
  "Dispatch",
  "Arrival",
  "Complete",
  "Return",
  "WbpCreated",
  "WbpUpdated",
  "WbpDeleted",
  "Bootstrap",
  "Auth",
] as const;

export const roleEnum = pgEnum("role", roleValues);
export const assignmentEnum = pgEnum("assignment", assignmentValues);
export const destinationEnum = pgEnum("destination", destinationValues);
export const movementStatusEnum = pgEnum("movement_status", movementStatusValues);
export const movementEventTypeEnum = pgEnum(
  "movement_event_type",
  movementEventTypeValues,
);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    role: roleEnum("role").notNull().default("Admin"),
    assignment: assignmentEnum("assignment"),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("user_email_unique").on(table.email),
    roleIndex: index("user_role_idx").on(table.role),
  }),
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    tokenUnique: uniqueIndex("session_token_unique").on(table.token),
    userIndex: index("session_user_idx").on(table.userId),
  }),
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
    userIndex: index("account_user_idx").on(table.userId),
  }),
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }),
    updatedAt: timestamp("updatedAt", { withTimezone: true }),
  },
  (table) => ({
    identifierIndex: index("verification_identifier_idx").on(table.identifier),
  }),
);

export const wbpRecord = pgTable(
  "wbpRecord",
  {
    id: text("id").primaryKey(),
    registrationNumber: text("registrationNumber").notNull(),
    fullName: text("fullName").notNull(),
    roomBlock: text("roomBlock").notNull(),
    roomNumber: text("roomNumber").notNull(),
    photoUrl: text("photoUrl"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdByUserId: text("createdByUserId").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedByUserId: text("updatedByUserId").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    registrationUnique: uniqueIndex("wbp_registration_unique").on(
      table.registrationNumber,
    ),
    nameIndex: index("wbp_full_name_idx").on(table.fullName),
  }),
);

export const movement = pgTable(
  "movement",
  {
    id: text("id").primaryKey(),
    wbpId: text("wbpId")
      .notNull()
      .references(() => wbpRecord.id, { onDelete: "cascade" }),
    origin: text("origin").notNull(),
    destination: destinationEnum("destination").notNull(),
    status: movementStatusEnum("status").notNull(),
    departureAt: timestamp("departureAt", { withTimezone: true }).notNull(),
    arrivedAt: timestamp("arrivedAt", { withTimezone: true }),
    completedAt: timestamp("completedAt", { withTimezone: true }),
    returnedAt: timestamp("returnedAt", { withTimezone: true }),
    doorOfficerId: text("doorOfficerId")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    roomOfficerId: text("roomOfficerId").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedByUserId: text("updatedByUserId").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    wbpIndex: index("movement_wbp_idx").on(table.wbpId),
    statusIndex: index("movement_status_idx").on(table.status),
    destinationIndex: index("movement_destination_idx").on(table.destination),
  }),
);

export const movementEvent = pgTable(
  "movementEvent",
  {
    id: text("id").primaryKey(),
    movementId: text("movementId")
      .notNull()
      .references(() => movement.id, { onDelete: "cascade" }),
    wbpId: text("wbpId")
      .notNull()
      .references(() => wbpRecord.id, { onDelete: "cascade" }),
    eventType: movementEventTypeEnum("eventType").notNull(),
    eventLabel: text("eventLabel").notNull(),
    destination: destinationEnum("destination").notNull(),
    status: movementStatusEnum("status").notNull(),
    operatorId: text("operatorId").references(() => user.id, {
      onDelete: "set null",
    }),
    operatorName: text("operatorName").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .notNull()
      .defaultNow(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  },
  (table) => ({
    movementIndex: index("movement_event_movement_idx").on(table.movementId),
    timestampIndex: index("movement_event_timestamp_idx").on(table.timestamp),
  }),
);

export const auditLog = pgTable(
  "auditLog",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actorUserId").references(() => user.id, {
      onDelete: "set null",
    }),
    actorName: text("actorName").notNull(),
    actorRole: roleEnum("actorRole"),
    action: text("action").notNull(),
    entityType: text("entityType").notNull(),
    entityId: text("entityId"),
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    actionIndex: index("audit_log_action_idx").on(table.action),
    createdAtIndex: index("audit_log_created_at_idx").on(table.createdAt),
  }),
);

export type UserRow = typeof user.$inferSelect;
export type WbpRecordRow = typeof wbpRecord.$inferSelect;
export type MovementRow = typeof movement.$inferSelect;
export type MovementEventRow = typeof movementEvent.$inferSelect;
