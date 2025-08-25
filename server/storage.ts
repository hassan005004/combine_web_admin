import {
  users,
  domains,
  pages,
  domainSettings,
  seoSettings,
  type User,
  type UpsertUser,
  type Domain,
  type InsertDomain,
  type Page,
  type InsertPage,
  type DomainSettings,
  type InsertDomainSettings,
  type SeoSettings,
  type InsertSeoSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Domain operations
  getDomains(): Promise<Domain[]>;
  getDomain(id: number): Promise<Domain | undefined>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  updateDomain(id: number, domain: Partial<InsertDomain>): Promise<Domain>;
  deleteDomain(id: number): Promise<void>;

  // Page operations
  getPagesByDomain(domainId: number): Promise<Page[]>;
  getPage(id: number): Promise<Page | undefined>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: number, page: Partial<InsertPage>): Promise<Page>;
  deletePage(id: number): Promise<void>;

  // Domain settings operations
  getDomainSettings(domainId: number): Promise<DomainSettings | undefined>;
  upsertDomainSettings(settings: InsertDomainSettings): Promise<DomainSettings>;

  // SEO settings operations
  getSeoSettings(domainId: number): Promise<SeoSettings | undefined>;
  upsertSeoSettings(settings: InsertSeoSettings): Promise<SeoSettings>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Domain operations
  async getDomains(): Promise<Domain[]> {
    return await db.select().from(domains);
  }

  async getDomain(id: number): Promise<Domain | undefined> {
    const [domain] = await db.select().from(domains).where(eq(domains.id, id));
    return domain;
  }

  async createDomain(domain: InsertDomain): Promise<Domain> {
    const [newDomain] = await db.insert(domains).values(domain).returning();
    return newDomain;
  }

  async updateDomain(id: number, domain: Partial<InsertDomain>): Promise<Domain> {
    const [updatedDomain] = await db
      .update(domains)
      .set({ ...domain, updatedAt: new Date() })
      .where(eq(domains.id, id))
      .returning();
    return updatedDomain;
  }

  async deleteDomain(id: number): Promise<void> {
    await db.delete(domains).where(eq(domains.id, id));
  }

  // Page operations
  async getPagesByDomain(domainId: number): Promise<Page[]> {
    return await db.select().from(pages).where(eq(pages.domainId, domainId));
  }

  async getPage(id: number): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.id, id));
    return page;
  }

  async createPage(page: InsertPage): Promise<Page> {
    const [newPage] = await db.insert(pages).values(page).returning();
    return newPage;
  }

  async updatePage(id: number, page: Partial<InsertPage>): Promise<Page> {
    const [updatedPage] = await db
      .update(pages)
      .set({ ...page, updatedAt: new Date() })
      .where(eq(pages.id, id))
      .returning();
    return updatedPage;
  }

  async deletePage(id: number): Promise<void> {
    await db.delete(pages).where(eq(pages.id, id));
  }

  // Domain settings operations
  async getDomainSettings(domainId: number): Promise<DomainSettings | undefined> {
    const [settings] = await db
      .select()
      .from(domainSettings)
      .where(eq(domainSettings.domainId, domainId));
    return settings;
  }

  async upsertDomainSettings(settings: InsertDomainSettings): Promise<DomainSettings> {
    const [upsertedSettings] = await db
      .insert(domainSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: domainSettings.domainId,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedSettings;
  }

  // SEO settings operations
  async getSeoSettings(domainId: number): Promise<SeoSettings | undefined> {
    const [settings] = await db
      .select()
      .from(seoSettings)
      .where(eq(seoSettings.domainId, domainId));
    return settings;
  }

  async upsertSeoSettings(settings: InsertSeoSettings): Promise<SeoSettings> {
    const [upsertedSettings] = await db
      .insert(seoSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: seoSettings.domainId,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedSettings;
  }
}

export const storage = new DatabaseStorage();
