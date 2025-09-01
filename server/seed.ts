import { db } from "./db";
import { domains, pages, faqs, domainSettings } from "@shared/schema";
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
      const allPages = await db.select().from(pages).where(eq(pages.domainId, domainId));
      
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
            }
          ]).onConflictDoNothing();
        }
      }


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