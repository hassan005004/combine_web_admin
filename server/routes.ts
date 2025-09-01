import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, loginUser } from "./auth";
import { 
  insertUserSchema, 
  insertDomainSchema, 
  insertPageSchema, 
  insertDomainSettingsSchema, 
  insertSeoSettingsSchema,
  insertFaqSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await loginUser(email, password);
      if (user) {
        (req.session as any).userId = user.id;
        res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Logout failed" });
      } else {
        res.json({ success: true });
      }
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Domain routes
  app.get('/api/domains', isAuthenticated, async (req, res) => {
    try {
      const domains = await storage.getDomains();
      res.json(domains);
    } catch (error) {
      console.error("Error fetching domains:", error);
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  app.post('/api/domains', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDomainSchema.parse(req.body);
      const domain = await storage.createDomain(validatedData);
      res.status(201).json(domain);
    } catch (error) {
      console.error("Error creating domain:", error);
      res.status(400).json({ message: "Failed to create domain" });
    }
  });

  app.put('/api/domains/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDomainSchema.partial().parse(req.body);
      const domain = await storage.updateDomain(id, validatedData);
      res.json(domain);
    } catch (error) {
      console.error("Error updating domain:", error);
      res.status(400).json({ message: "Failed to update domain" });
    }
  });

  app.delete('/api/domains/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDomain(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting domain:", error);
      res.status(400).json({ message: "Failed to delete domain" });
    }
  });

  // Page routes
  app.get('/api/domains/:domainId/pages', isAuthenticated, async (req, res) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const pages = await storage.getPagesByDomain(domainId);
      res.json(pages);
    } catch (error) {
      console.error("Error fetching pages:", error);
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  app.post('/api/domains/:domainId/pages', isAuthenticated, async (req, res) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const validatedData = insertPageSchema.parse({ ...req.body, domainId });
      const page = await storage.createPage(validatedData);
      res.status(201).json(page);
    } catch (error) {
      console.error("Error creating page:", error);
      res.status(400).json({ message: "Failed to create page" });
    }
  });

  app.put('/api/pages/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPageSchema.partial().parse(req.body);
      const page = await storage.updatePage(id, validatedData);
      res.json(page);
    } catch (error) {
      console.error("Error updating page:", error);
      res.status(400).json({ message: "Failed to update page" });
    }
  });

  app.delete('/api/pages/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePage(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(400).json({ message: "Failed to delete page" });
    }
  });

  // Domain settings routes
  app.get('/api/domains/:domainId/settings', isAuthenticated, async (req, res) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const settings = await storage.getDomainSettings(domainId);
      res.json(settings || { domainId, visibleSections: [], navigationSettings: {} });
    } catch (error) {
      console.error("Error fetching domain settings:", error);
      res.status(500).json({ message: "Failed to fetch domain settings" });
    }
  });

  app.put('/api/domains/:domainId/settings', isAuthenticated, async (req, res) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const validatedData = insertDomainSettingsSchema.parse({ ...req.body, domainId });
      const settings = await storage.upsertDomainSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating domain settings:", error);
      res.status(400).json({ message: "Failed to update domain settings" });
    }
  });

  // SEO settings routes
  app.get('/api/domains/:domainId/seo', isAuthenticated, async (req, res) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const settings = await storage.getSeoSettings(domainId);
      res.json(settings || { domainId });
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
      res.status(500).json({ message: "Failed to fetch SEO settings" });
    }
  });

  app.put('/api/domains/:domainId/seo', isAuthenticated, async (req, res) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const validatedData = insertSeoSettingsSchema.parse({ ...req.body, domainId });
      const settings = await storage.upsertSeoSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating SEO settings:", error);
      res.status(400).json({ message: "Failed to update SEO settings" });
    }
  });

  // FAQ routes
  app.get('/api/domains/:domainId/faqs', isAuthenticated, async (req, res) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const faqs = await storage.getFaqsByDomain(domainId);
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  app.post('/api/domains/:domainId/faqs', isAuthenticated, async (req, res) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const validatedData = insertFaqSchema.parse({ ...req.body, domainId });
      const faq = await storage.createFaq(validatedData);
      res.status(201).json(faq);
    } catch (error) {
      console.error("Error creating FAQ:", error);
      res.status(400).json({ message: "Failed to create FAQ" });
    }
  });

  app.put('/api/pages/:pageId/faqs/:faqId', isAuthenticated, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      const faqId = parseInt(req.params.faqId);
      const validatedData = insertFaqSchema.partial().parse(req.body);
      const faq = await storage.updateFaq(pageId, faqId, validatedData);
      res.json(faq);
    } catch (error) {
      console.error("Error updating FAQ:", error);
      res.status(400).json({ message: "Failed to update FAQ" });
    }
  });

  app.delete('/api/pages/:pageId/faqs/:faqId', isAuthenticated, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      const faqId = parseInt(req.params.faqId);
      await storage.deleteFaq(pageId, faqId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      res.status(400).json({ message: "Failed to delete FAQ" });
    }
  });

  // User routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      // Hash password before storing
      const bcrypt = require('bcrypt');
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
      const user = await storage.createUser(validatedData);
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  // Dashboard stats route
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const domains = await storage.getDomains();
      const totalDomains = domains.length;

      let totalPages = 0;
      for (const domain of domains) {
        const pages = await storage.getPagesByDomain(domain.id);
        totalPages += pages.length;
      }

      res.json({
        domains: totalDomains,
        pages: totalPages,
        views: "24.3K", // This would come from analytics integration
        revenue: "$1,247" // This would come from AdSense integration
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}