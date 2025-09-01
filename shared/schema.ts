import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Email/Password Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 50 }).default("admin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Domains table
export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  title: text("title"),
  description: text("description"),
  footerDescription: text("footer_description"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactAddress: text("contact_address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Domain settings table
export const domainSettings = pgTable("domain_settings", {
  id: serial("id").primaryKey(),
  domainId: serial("domain_id").references(() => domains.id),
  visibleSections: jsonb("visible_sections").default([]),
  navigationSettings: jsonb("navigation_settings").default({}),
  footerDescription: text("footer_description"),
  contactInfo: jsonb("contact_info").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SEO settings table
export const seoSettings = pgTable("seo_settings", {
  id: serial("id").primaryKey(),
  domainId: serial("domain_id").references(() => domains.id),
  websiteTitle: text("website_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  googleAnalyticsId: text("google_analytics_id"),
  googleAdsenseConfig: jsonb("google_adsense_config").default({}),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImageUrl: text("og_image_url"),
  twitterCardType: varchar("twitter_card_type", { length: 50 }).default("summary"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pages table
export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  domainId: serial("domain_id").references(() => domains.id),
  name: varchar("name", { length: 255 }).notNull(),
  title: text("title"),
  subtitle: text("subtitle"),
  sectionsJson: jsonb("sections_json").default({}),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  status: varchar("status", { length: 20 }).default("draft"),
  faqsEnabled: boolean("faqs_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FAQs table
export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").references(() => pages.id, { onDelete: "cascade" }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const domainsRelations = relations(domains, ({ many, one }) => ({
  pages: many(pages),
  settings: one(domainSettings),
  seoSettings: one(seoSettings),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  domain: one(domains, {
    fields: [pages.domainId],
    references: [domains.id],
  }),
  faqs: many(faqs),
}));

export const faqsRelations = relations(faqs, ({ one }) => ({
  page: one(pages, {
    fields: [faqs.pageId],
    references: [pages.id],
  }),
}));

export const domainSettingsRelations = relations(domainSettings, ({ one }) => ({
  domain: one(domains, {
    fields: [domainSettings.domainId],
    references: [domains.id],
  }),
}));

export const seoSettingsRelations = relations(seoSettings, ({ one }) => ({
  domain: one(domains, {
    fields: [seoSettings.domainId],
    references: [domains.id],
  }),
}));

// Insert schemas
export const insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateDomainSchema = insertDomainSchema.partial();

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDomainSettingsSchema = createInsertSchema(domainSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeoSettingsSchema = createInsertSchema(seoSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Domain = typeof domains.$inferSelect;
export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
export type DomainSettings = typeof domainSettings.$inferSelect;
export type InsertDomainSettings = z.infer<typeof insertDomainSettingsSchema>;
export type SeoSettings = typeof seoSettings.$inferSelect;
export type InsertSeoSettings = z.infer<typeof insertSeoSettingsSchema>;
export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;