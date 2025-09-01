import {
  users,
  domains,
  pages,
  domainSettings,
  seoSettings,
  faqs,
  posts,
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
  type InsertFaq,
  type InsertPost,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
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
  getPageBySlug(slug: string): Promise<Page | undefined>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: number, page: Partial<InsertPage>): Promise<Page>;
  deletePage(id: number): Promise<void>;

  // Domain settings operations
  getDomainSettings(domainId: number): Promise<DomainSettings | undefined>;
  upsertDomainSettings(settings: InsertDomainSettings): Promise<DomainSettings>;

  // SEO settings operations
  getSeoSettings(domainId: number): Promise<SeoSettings | undefined>;
  updateSeoSettings(domainId: number, data: InsertSeoSettings): Promise<SeoSettings>;

  // FAQ operations
  getFaqsByPage(pageId: number): Promise<any[]>; // Assuming 'any[]' for now, replace with actual type later
  createFaq(data: InsertFaq): Promise<any>; // Assuming 'any' for now
  updateFaq(id: number, data: Partial<InsertFaq>): Promise<any>; // Assuming 'any' for now
  deleteFaq(id: number): Promise<void>;
  updatePageFaqsEnabled(pageId: number, enabled: boolean): Promise<any>; // Assuming 'any' for now

  // Post operations
  getPostsByPage(pageId: number): Promise<any[]>; // Assuming 'any[]' for now
  createPost(data: InsertPost): Promise<any>; // Assuming 'any' for now
  updatePost(id: number, data: Partial<InsertPost>): Promise<any>; // Assuming 'any' for now
  deletePost(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
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

  async getPageBySlug(slug: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.slug, slug));
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
    const [settings] = await db.select().from(seoSettings).where(eq(seoSettings.domainId, domainId));
    return settings;
  }

  async updateSeoSettings(domainId: number, data: InsertSeoSettings): Promise<SeoSettings> {
    const existing = await this.getSeoSettings(domainId);

    if (existing) {
      const updated = await db.update(seoSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(seoSettings.domainId, domainId))
        .returning();
      return updated[0];
    } else {
      const created = await db.insert(seoSettings)
        .values({ ...data, domainId })
        .returning();
      return created[0];
    }
  }

  // FAQ operations
  async getFaqsByPage(pageId: number): Promise<any[]> {
    return await db.select().from(faqs)
      .where(eq(faqs.pageId, pageId))
      .orderBy(faqs.sortOrder, faqs.createdAt);
  }

  async createFaq(data: InsertFaq): Promise<any> {
    const created = await db.insert(faqs).values(data).returning();
    return created[0];
  }

  async updateFaq(id: number, data: Partial<InsertFaq>): Promise<any> {
    const updated = await db.update(faqs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(faqs.id, id))
      .returning();
    return updated[0];
  }

  async deleteFaq(id: number): Promise<void> {
    await db.delete(faqs).where(eq(faqs.id, id));
  }

  async updatePageFaqsEnabled(pageId: number, enabled: boolean): Promise<any> {
    const updated = await db.update(pages)
      .set({ faqsEnabled: enabled, updatedAt: new Date() })
      .where(eq(pages.id, pageId))
      .returning();
    return updated[0];
  }

  // Post operations
  async getPostsByPage(pageId: number): Promise<any[]> {
    return await db.select().from(posts)
      .where(eq(posts.pageId, pageId))
      .orderBy(posts.sortOrder, posts.createdAt);
  }

  async createPost(data: InsertPost): Promise<any> {
    const created = await db.insert(posts).values(data).returning();
    return created[0];
  }

  async updatePost(id: number, data: Partial<InsertPost>): Promise<any> {
    const updated = await db.update(posts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updated[0];
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }
}

export const storage = new DatabaseStorage();