CREATE TYPE "public"."assignment" AS ENUM('Pintu 3', 'Administrasi', 'Klinik', 'Registrasi', 'Kunjungan');--> statement-breakpoint
CREATE TYPE "public"."destination" AS ENUM('Klinik', 'Registrasi', 'Kunjungan');--> statement-breakpoint
CREATE TYPE "public"."movement_event_type" AS ENUM('Dispatch', 'Arrival', 'Complete', 'Return', 'WbpCreated', 'WbpUpdated', 'WbpDeleted', 'Bootstrap', 'Auth');--> statement-breakpoint
CREATE TYPE "public"."movement_status" AS ENUM('Transit', 'Tiba', 'Selesai', 'Kembali');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('Superadmin', 'Admin', 'Petugas Pintu 3', 'Petugas Ruangan');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"actorUserId" text,
	"actorName" text NOT NULL,
	"actorRole" "role",
	"action" text NOT NULL,
	"entityType" text NOT NULL,
	"entityId" text,
	"description" text NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movement" (
	"id" text PRIMARY KEY NOT NULL,
	"wbpId" text NOT NULL,
	"origin" text NOT NULL,
	"destination" "destination" NOT NULL,
	"status" "movement_status" NOT NULL,
	"departureAt" timestamp with time zone NOT NULL,
	"arrivedAt" timestamp with time zone,
	"completedAt" timestamp with time zone,
	"returnedAt" timestamp with time zone,
	"doorOfficerId" text NOT NULL,
	"roomOfficerId" text,
	"updatedByUserId" text,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movementEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"movementId" text NOT NULL,
	"wbpId" text NOT NULL,
	"eventType" "movement_event_type" NOT NULL,
	"eventLabel" text NOT NULL,
	"destination" "destination" NOT NULL,
	"status" "movement_status" NOT NULL,
	"operatorId" text,
	"operatorName" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "role" DEFAULT 'Admin' NOT NULL,
	"assignment" "assignment",
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wbpRecord" (
	"id" text PRIMARY KEY NOT NULL,
	"registrationNumber" text NOT NULL,
	"fullName" text NOT NULL,
	"roomBlock" text NOT NULL,
	"roomNumber" text NOT NULL,
	"photoUrl" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdByUserId" text,
	"updatedByUserId" text
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditLog" ADD CONSTRAINT "auditLog_actorUserId_user_id_fk" FOREIGN KEY ("actorUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_wbpId_wbpRecord_id_fk" FOREIGN KEY ("wbpId") REFERENCES "public"."wbpRecord"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_doorOfficerId_user_id_fk" FOREIGN KEY ("doorOfficerId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_roomOfficerId_user_id_fk" FOREIGN KEY ("roomOfficerId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_updatedByUserId_user_id_fk" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movementEvent" ADD CONSTRAINT "movementEvent_movementId_movement_id_fk" FOREIGN KEY ("movementId") REFERENCES "public"."movement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movementEvent" ADD CONSTRAINT "movementEvent_wbpId_wbpRecord_id_fk" FOREIGN KEY ("wbpId") REFERENCES "public"."wbpRecord"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movementEvent" ADD CONSTRAINT "movementEvent_operatorId_user_id_fk" FOREIGN KEY ("operatorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wbpRecord" ADD CONSTRAINT "wbpRecord_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wbpRecord" ADD CONSTRAINT "wbpRecord_updatedByUserId_user_id_fk" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique" ON "account" USING btree ("providerId","accountId");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "auditLog" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "auditLog" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "movement_wbp_idx" ON "movement" USING btree ("wbpId");--> statement-breakpoint
CREATE INDEX "movement_status_idx" ON "movement" USING btree ("status");--> statement-breakpoint
CREATE INDEX "movement_destination_idx" ON "movement" USING btree ("destination");--> statement-breakpoint
CREATE INDEX "movement_event_movement_idx" ON "movementEvent" USING btree ("movementId");--> statement-breakpoint
CREATE INDEX "movement_event_timestamp_idx" ON "movementEvent" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "wbp_registration_unique" ON "wbpRecord" USING btree ("registrationNumber");--> statement-breakpoint
CREATE INDEX "wbp_full_name_idx" ON "wbpRecord" USING btree ("fullName");