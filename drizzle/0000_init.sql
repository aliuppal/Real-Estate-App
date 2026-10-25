CREATE TABLE "agencies" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"logo" text DEFAULT '' NOT NULL,
	"cover" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"founded_year" integer NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"website" text,
	"service_areas" text[] DEFAULT '{}' NOT NULL,
	"verification" text DEFAULT 'pending' NOT NULL,
	"rating" real DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"user_id" text NOT NULL,
	"agency_id" text,
	"name" text NOT NULL,
	"photo" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"specialties" text[] NOT NULL,
	"purposes" text[] NOT NULL,
	"service_areas" text[] NOT NULL,
	"languages" text[] NOT NULL,
	"rating" real DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"deals_closed" integer DEFAULT 0 NOT NULL,
	"deals_by_purpose" jsonb NOT NULL,
	"avg_response_mins" integer NOT NULL,
	"years_experience" integer NOT NULL,
	"price_bands" jsonb NOT NULL,
	"verification" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"listing_ids" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text,
	"participant_ids" text[] NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"seeker_id" text,
	"listing_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"stage" text NOT NULL,
	"source" text NOT NULL,
	"budget" bigint,
	"notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"purpose" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"price" bigint NOT NULL,
	"area_sqft" integer NOT NULL,
	"plot_sqft" integer,
	"beds" integer NOT NULL,
	"baths" integer NOT NULL,
	"furnished" boolean NOT NULL,
	"pets_allowed" boolean NOT NULL,
	"parking" integer NOT NULL,
	"amenities" text[] NOT NULL,
	"images" text[] NOT NULL,
	"floor_plan" text,
	"video_url" text,
	"address" text NOT NULL,
	"neighbourhood_id" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"year_built" integer,
	"listed_by" text NOT NULL,
	"owner_id" text,
	"agent_id" text,
	"agency_id" text,
	"verified" boolean DEFAULT false NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"enquiries" integer DEFAULT 0 NOT NULL,
	"price_history" jsonb NOT NULL,
	"deposit_months" integer,
	"advance_months" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"read_by" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neighbourhoods" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"scores" jsonb NOT NULL,
	"avg_sale_per_sqft" integer NOT NULL,
	"avg_rent_per_sqft" integer NOT NULL,
	CONSTRAINT "neighbourhoods_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"href" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"seeker_id" text NOT NULL,
	"kind" text NOT NULL,
	"amount" bigint NOT NULL,
	"message" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"reporter_id" text,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"author_id" text,
	"author_name" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb NOT NULL,
	"alerts_enabled" boolean DEFAULT true NOT NULL,
	"last_checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"role" text NOT NULL,
	"avatar" text,
	"phone" text,
	"agent_id" text,
	"agency_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "viewings" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"seeker_id" text NOT NULL,
	"agent_id" text,
	"start" timestamp with time zone NOT NULL,
	"end" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "agents_agency_idx" ON "agents" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "collections_user_idx" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "leads_agent_idx" ON "leads" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "listings_status_idx" ON "listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listings_neighbourhood_idx" ON "listings" USING btree ("neighbourhood_id");--> statement-breakpoint
CREATE INDEX "listings_agent_idx" ON "listings" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "listings_owner_idx" ON "listings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "listings_agency_idx" ON "listings" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "offers_listing_idx" ON "offers" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "offers_seeker_idx" ON "offers" USING btree ("seeker_id");--> statement-breakpoint
CREATE INDEX "reviews_target_idx" ON "reviews" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "saved_searches_user_idx" ON "saved_searches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "viewings_agent_idx" ON "viewings" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "viewings_seeker_idx" ON "viewings" USING btree ("seeker_id");--> statement-breakpoint
CREATE INDEX "viewings_listing_idx" ON "viewings" USING btree ("listing_id");