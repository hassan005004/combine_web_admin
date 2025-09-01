import { db } from "./db";
import { domains, pages, faqs, domainSettings, posts } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    // Create test domain if it doesn't exist
    const existingDomains = await db.select().from(domains);

    if (existingDomains.length === 0) {
      const [domain] = await db.insert(domains).values({
        name: "test-domain.com",
        title: "Test Domain",
        description: "A test domain for development",
        isActive: true
      }).returning();

      console.log("Created domain:", domain);

      // Create test pages
      const [homePage] = await db.insert(pages).values({
        domainId: domain.id,
        name: "home",
        title: "Home Page",
        subtitle: "Welcome to our website",
        sectionsJson: { hero: { title: "Welcome", content: "This is the home page" } },
        metaTitle: "Home - Test Domain",
        metaDescription: "Welcome to our test domain homepage",
        status: "published",
        faqsEnabled: true
      }).returning();

      const [aboutPage] = await db.insert(pages).values({
        domainId: domain.id,
        name: "about",
        title: "About Us",
        subtitle: "Learn more about our company",
        sectionsJson: { content: { title: "About", content: "This is the about page" } },
        metaTitle: "About - Test Domain",
        metaDescription: "Learn more about our test domain",
        status: "published",
        faqsEnabled: true
      }).returning();

      const [contactPage] = await db.insert(pages).values({
        domainId: domain.id,
        name: "contact",
        title: "Contact Us",
        subtitle: "Get in touch with us",
        sectionsJson: { contact: { title: "Contact", content: "Contact information" } },
        metaTitle: "Contact - Test Domain",
        metaDescription: "Contact our test domain",
        status: "published",
        faqsEnabled: false
      }).returning();

      console.log("Created pages:", [homePage, aboutPage, contactPage]);

      // Add dummy FAQs for the home page
      const homePageData = await db.query.pages.findFirst({
        where: eq(pages.name, "home")
      });

      if (homePageData) {
        await db.insert(faqs).values([
          {
            pageId: homePageData.id,
            question: "What is this website about?",
            answer: "This is a content management system that helps you create and manage websites with ease.",
            sortOrder: 0,
            isActive: true
          },
          {
            pageId: homePageData.id,
            question: "How do I get started?",
            answer: "Simply create an account, add your domain, and start creating pages with our intuitive interface.",
            sortOrder: 1,
            isActive: true
          },
          {
            pageId: homePageData.id,
            question: "Is there customer support?",
            answer: "Yes! We provide 24/7 customer support through our help desk and live chat.",
            sortOrder: 2,
            isActive: true
          }
        ]).onConflictDoNothing();
      }

      // Add dummy FAQs for other pages if they exist
      const allPages = await db.select().from(pages).where(eq(pages.domainId, domain.id));
      
      for (const page of allPages) {
        if (page.id !== homePageData?.id && page.faqsEnabled) {
          await db.insert(faqs).values([
            {
              pageId: page.id,
              question: `What is ${page.name} about?`,
              answer: `This page provides information about ${page.title || page.name}. Here you can find detailed content and resources.`,
              sortOrder: 0,
              isActive: true
            },
            {
              pageId: page.id,
              question: `How can I use ${page.name}?`,
              answer: `You can navigate through ${page.name} to explore different features and content sections we've prepared for you.`,
              sortOrder: 1,
              isActive: true
            },
            {
              pageId: page.id,
              question: `Is there support available for ${page.name}?`,
              answer: `Yes! We provide comprehensive support and documentation for ${page.name}. Contact us if you need assistance.`,
              sortOrder: 2,
              isActive: true
            }
          ]).onConflictDoNothing();
        }
      }

      // Add dummy posts
      await db.insert(posts).values([
        {
          domainId: domain.id,
          title: "Getting Started with Our Platform",
          slug: "getting-started",
          content: "Welcome to our platform! This comprehensive guide will help you get started with all the features and tools available. Learn how to create your first project, customize your settings, and make the most of our powerful features.",
          excerpt: "A comprehensive guide to help you get started with our platform and its features.",
          metaTitle: "Getting Started Guide - Test Domain",
          metaDescription: "Learn how to get started with our platform in this comprehensive guide.",
          status: "published",
          publishedAt: new Date()
        },
        {
          domainId: domain.id,
          title: "Best Practices for Content Management",
          slug: "content-management-best-practices",
          content: "Effective content management is crucial for any successful website. In this article, we'll explore the best practices for organizing, creating, and maintaining your content. From SEO optimization to user experience, we cover everything you need to know.",
          excerpt: "Learn the best practices for effective content management and organization.",
          metaTitle: "Content Management Best Practices - Test Domain",
          metaDescription: "Discover best practices for content management and organization.",
          status: "published",
          publishedAt: new Date()
        },
        {
          domainId: domain.id,
          title: "Advanced Features Overview",
          slug: "advanced-features",
          content: "Explore the advanced features that make our platform stand out. From custom integrations to advanced analytics, learn how to leverage these powerful tools to enhance your website's performance and user engagement.",
          excerpt: "An overview of the advanced features available on our platform.",
          metaTitle: "Advanced Features - Test Domain",
          metaDescription: "Explore the advanced features available on our platform.",
          status: "published",
          publishedAt: new Date()
        },
        {
          domainId: domain.id,
          title: "SEO Optimization Tips",
          slug: "seo-optimization-tips",
          content: "Maximize your website's visibility with these proven SEO optimization techniques. Learn about keyword research, on-page optimization, technical SEO, and content strategies that drive organic traffic.",
          excerpt: "Proven SEO optimization techniques to improve your website's visibility.",
          metaTitle: "SEO Optimization Tips - Test Domain",
          metaDescription: "Learn proven SEO techniques to improve your website's search visibility.",
          status: "draft"
        },
        {
          domainId: domain.id,
          title: "Understanding Analytics and Insights",
          slug: "analytics-insights",
          content: "Make data-driven decisions with our comprehensive analytics suite. This guide covers how to interpret your website metrics, track user behavior, and use insights to improve your content strategy.",
          excerpt: "Learn how to use analytics and insights to make data-driven decisions.",
          metaTitle: "Analytics and Insights Guide - Test Domain",
          metaDescription: "Learn how to use analytics to make data-driven decisions for your website.",
          status: "published",
          publishedAt: new Date()
        }
      ]).onConflictDoNothing();


      // Create domain settings
      await db.insert(domainSettings).values({
        domainId: domain.id,
        visibleSections: ["hero", "about", "services", "contact"],
        navigationSettings: {
          showLogo: true,
          logoText: "Test Domain",
          menuItems: ["Home", "About", "Contact"]
        },
        footerDescription: "This is a test website footer description. You can customize this text in the domain settings.",
        contactInfo: {
          email: "contact@test-domain.com",
          phone: "+1-555-0123",
          address: "123 Test Street, Test City, TC 12345",
          socialMedia: {
            twitter: "https://twitter.com/testdomain",
            facebook: "https://facebook.com/testdomain",
            linkedin: "https://linkedin.com/company/testdomain"
          }
        }
      });

      console.log("Seed data created successfully!");
    } else {
      console.log("Domain already exists, skipping seed");
    }
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

seed();