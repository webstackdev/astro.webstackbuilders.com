# HubSpot API

[API Docs](https://github.hubspot.com/hubspot-api-nodejs/)

## Add Contact

```typescript
import { Client } from '@hubspot/api-client';
import { SimplePublicObjectInputForCreate } from '@hubspot/api-client/lib/codegen/crm/contacts';

// Initialize the client
const hubspotClient = new Client({ accessToken: 'YOUR_ACCESS_TOKEN' });

async function createContact() {
  try {
    const contactInput: SimplePublicObjectInputForCreate = {
      properties: {
        email: 'janedoe@example.com',
        firstname: 'Jane',
        lastname: 'Doe',
        phone: '555-0123',
        company: 'Example Corp',
        website: 'https://www.example.com'
      }
    };

    // Create the contact
    const apiResponse = await hubspotClient.crm.contacts.basicApi.create(contactInput);
    
    console.log('Contact created successfully. ID:', apiResponse.id);
    console.log('Full response:', JSON.stringify(apiResponse, null, 2));
  } catch (error: any) {
    // Handle API errors
    if (error.response) {
      console.error('API Error:', error.response.body);
    } else {
      console.error('Error:', error.message);
    }
  }
}

createContact();
```

## Contact Enrichment

HubSpot contacts added through the API **are not automatically enriched** by default on a Starter plan. You must manually enable the feature in your settings, and you must have a "Core Seat" to use it without consuming separate credits. 

How Enrichment Works for API Contacts in 2026:

- **Settings Required:** You must navigate to **Settings > Data Management > Data Enrichment** and toggle on **"Automatically enrich new records"**. Once enabled, this applies to records created via integrations (API), forms, or manual entry.
- **Enrichment Credit System:**
  - **Starter Plan:** Includes **500 HubSpot credits** per month for AI and enrichment features.
  - **Cost:** Each enriched record typically costs **10 credits**.
  - **Core Seat Benefit:** As of late 2025, users with a **Core Seat** can often enrich records without consuming these credits, though this remains a setting-dependent feature.
- **Strict Requirements:** To be eligible for enrichment, the contact added via the API **must have a business email address**. Personal addresses (e.g., @gmail.com, @yahoo.com) are generally excluded from automatic enrichment. 

Steps to Enable Enrichment

1. **Configure Access:** Ensure your user has **Super Admin** or **Data enrichment access** permissions.
2. **Enable Auto-Enrichment:** Go to **Settings > Data Management > Data Enrichment** and select the **Settings** tab. Toggle on **"Automatically enrich new records"** for Contacts.
3. **Conversational Enrichment (Optional):** If you are also logging emails via the API, you can enable **"Email Contact Enrichment"** under the **Tools** tab in the same section to extract titles and names from email threads. 

Summary of Plan Benefits (2026)

| Feature                 | Starter Plan                                                |
| :---------------------- | :---------------------------------------------------------- |
| **Included Credits**    | 500 per month                                               |
| **Cost per Enrichment** | 10 credits (unless using a Core Seat)                       |
| **Automation**          | Must be toggled "ON" in Settings                            |
| **Updates**             | Continuous enrichment (monthly refreshes) is also available |

## Delete Contact

To permanently purge a contact and all associated data for privacy compliance, use the GDPR-specific endpoint. This action **cannot be undone**. 

**Code Example:**

```typescript
import { Client } from '@hubspot/api-client';
import type { PublicGdprDeleteInput } from '@hubspot/api-client/lib/codegen/crm/contacts';

// Initialize the client
const hubspotClient = new Client({ accessToken: 'YOUR_ACCESS_TOKEN' });

/**
 * Permanently deletes a contact for GDPR compliance.
 * @param identifier The contact ID or Email address.
 * @param isEmail Boolean indicating if the identifier is an email.
 */
async function permanentlyDeleteContact(identifier: string, isEmail: boolean = false) {
  try {
    const gdprDeleteInput: PublicGdprDeleteInput = {
      objectId: identifier,
      // Optional: specify "email" if deleting by email address
      idProperty: isEmail ? 'email' : undefined 
    };

    // Execute the purge (GDPR delete)
    await hubspotClient.crm.contacts.gdprApi.purge(gdprDeleteInput);
    
    console.log(`Contact ${identifier} has been permanently deleted.`);
  } catch (error: any) {
    console.error('Error during GDPR deletion:', error.response?.body || error.message);
  }
}

// Usage examples:
// 1. Delete by Contact ID
permanentlyDeleteContact('12345');

// 2. Delete by Email Address
permanentlyDeleteContact('user@example.com', true);
```

## Add to Newsletter

adding a contact to a newsletter list via the **@hubspot/api-client** requires a two-step process: first creating (or identifying) the contact, and then adding their ID to a **Static List**. Active lists cannot have members added manually via the API; they rely on filters. 

```typescript
import { Client } from '@hubspot/api-client';

const hubspotClient = new Client({ accessToken: 'YOUR_ACCESS_TOKEN' });

/**
 * Adds a contact to a specific static list.
 * @param listId The internal ID of the static newsletter list.
 * @param contactId The internal ID of the contact record.
 */
async function addContactToList(listId: string, contactId: string) {
  try {
    // The Lists API uses a PUT request to the membership add endpoint
    // The body must be an array of record IDs as strings
    const recordIds: string[] = [contactId];

    await hubspotClient.crm.lists.membershipsApi.add(listId, recordIds);
    
    console.log(`Contact ${contactId} successfully added to list ${listId}`);
  } catch (error: any) {
    console.error('Error adding contact to list:', error.response?.body || error.message);
  }
}

// Usage
addContactToList('45', '101');
```

Critical Implementation Details:

- **List Type:** This method only works for lists with a `processingType` of `MANUAL` (Static) or `SNAPSHOT`. If your "Newsletter List" is an **Active List**, you cannot manually add members; you must instead update a contact property (like a checkbox) that satisfies the list's automatic filters.
- **Required Scopes:** Your private app must have the `crm.lists.write` and `crm.lists.read` scopes.
- **Subscription Status:** Adding a contact to a list does not automatically opt them into emails. To ensure they receive the newsletter, you should also update their communication preferences for that specific subscription type.
- **Batch Adding:** You can add multiple contacts at once by including multiple IDs in the array: `['id1', 'id2', 'id3']`.
- **Permissions:** As of 2026, ensure the user or app has "Write" permissions for lists specifically, even if they have general CRM write access. 

## Hubspot Branding on Newsletters

It is **true** that the Starter plan allows you to remove HubSpot branding from your emails. 

If you are still seeing "Sent by HubSpot" or similar branding on a Starter plan, check your settings:

- **Default Setting:** Even on paid plans, branding might remain enabled by default. You must navigate to **Settings > Marketing > Email** and toggle off the **HubSpot logo** or branding in the "Configuration" or "Footer" section.
- **Feature Limitation:** Branding removal is one of the primary reasons users upgrade from Free to Starter. On the **Free plan**, branding is mandatory and cannot be removed. 

## How to Connect a Static List to your Newsletter

To send your newsletter to a static list, follow these steps in the [HubSpot Marketing Hub](https://www.hubspot.com/company-news/hubspot-launches-marketing-hub-starter):

- **Create Your Email:** Navigate to **Marketing > Email** and click **Create email**.
- **Select Template:** Choose a "Regular" email and pick a newsletter template.
- **Assign Recipients:** In the email editor, go to the **Send or Schedule** tab (the send icon in the left sidebar).
- **Choose Your List:** Under the **Send to** dropdown, select your specific static list.
- **Review and Send:** Once your subscription type and content are set, you can send the email immediately or schedule it for later. 

- **Subscription Types:** You must assign a "Subscription Type" (e.g., "Newsletter") to your email. HubSpot uses this to manage opt-outs.

You can define your own **custom Subscription Types** on a HubSpot Starter plan. While HubSpot provides default types like "Marketing Information," creating your own allows you to segment exactly what content your audience receives (e.g., "Weekly Product Tips" vs. "Monthly Company News"). 

Custom Subscription Types in 2026

- **Customization:** You can create up to **1,000 unique subscription types** to match your business needs.
- **User Experience:** These custom types appear on the **Subscription Preferences** page, where contacts can choose to opt in or out of specific categories rather than unsubscribing from all emails.
- **Plan Eligibility:**
  - **Starter/Pro/Enterprise:** You have full access to create, edit, and archive custom subscription types.
  - **Free Plan:** You are generally restricted to **default types** and cannot create custom categories. 

How to Create a Custom Subscription Type

1. Navigate to **Settings** (gear icon) in your HubSpot navigation bar.
2. In the left sidebar, go to **Marketing > Email**.
3. Click the **Subscription Types** tab.
4. Click **Create subscription type**.
5. Enter a **Name** (public-facing) and a **Description** so your subscribers know what they are signing up for. 

Key Limitations for 2026

- **No Deletion:** Once a subscription type is created, it **cannot be deleted**. You can only **archive** it to hide it from your preference page and forms.
- **Visibility Rules:** On a Starter plan, all active subscription types are visible to everyone on your preference page. Only **Enterprise** users can use "Visibility Rules" to show different subscription types to specific segments of contacts. 

## Unsubscribe Links

You **cannot** fully replace the native HubSpot unsubscribe link with your own custom URL in a marketing email, even on a Starter plan. HubSpot requires at least one functioning native unsubscribe link or "Manage Preferences" token in every marketing email footer to ensure compliance with anti-spam laws like CAN-SPAM and GDPR. 

However, you can achieve your goal using a hybrid approach:

### The Workaround: Dual Links

You can include your own custom preferences page link in the email body or footer, but you **must** keep the HubSpot native link as well. 

- **How to do it:** Add a standard text link in your email (e.g., "Manage your preferences on our site") and link it to your external website URL.
- **The Catch:** If a user clicks your custom link and unsubscribes on your site, you must use the **HubSpot API** to sync that change back to HubSpot immediately so their contact record reflects the opt-out status. 
- Why HubSpot Enforces This

- **Automated Opt-Outs:** HubSpot's native link automatically updates the `unsubscribed from all email` property or specific `subscription types` instantly.
- **One-Click Unsubscribe:** Modern inbox providers (Google and Yahoo) require a **List-Unsubscribe header** for bulk senders. HubSpot generates this header automatically using its own system to prevent your emails from being marked as spam. 
- Customization on Starter Plan

While you can't swap the URL, you **can** customize the experience: 

- **Change the Link Text:** You can change the native link's display text from "Unsubscribe" to something like "Opt-out via HubSpot" to distinguish it from your own link.
- **Custom Branding:** On the Starter plan, you can connect your own domain so that even the HubSpot-hosted preference page appears on your subdomain (e.g., `://info.yourwebsite.com`). 
- Implementation Note for 2026

If you use your own preferences page, ensure your API integration updates the contact's **Communication Preferences** in HubSpot. If a user unsubscribes on your site but your API fails to update HubSpot, you may accidentally send them a marketing email later, which would be a GDPR violation.

### Unsubscribe & Preferences Page Customization 

- **Domain Control:** In the **Free** and **Starter** plans, your preference pages are typically hosted on a HubSpot-branded domain (e.g., `hs-sites.com`). To use your own custom domain (e.g., `preferences.yourcompany.com`), you generally must be on a **Marketing Hub Professional** or **Enterprise** plan.
- **Styling Control:** All plans allow for basic customization through "System Templates". In the **Starter** plan, you can edit these templates in the **Design Manager** to add your logo, change colors, or add custom text and images. However, the actual "Subscription Types" module remains a single, uneditable block of code across lower tiers.

## Removed HubSpot Branding 

On the Free plan, customer-facing assets include a "Powered by HubSpot" or "HubSpot" logo. This branding is removed in the **Starter** plan for: 

- **Marketing Emails:** Removes logos from the footer of all sent emails.
- **Forms:** Removes branding from pop-up, embedded, and standalone forms.
- **Chatbots & Live Chat:** Removes the badge from the bottom of chat widgets.
- **Scheduling Pages:** Removes branding from your meeting booking links. 

## Ticket vs. Deal Pipelines 

HubSpot treats these as separate systems, though they share a similar "board" layout: 

- **Deal Pipeline:** Specifically for the **Sales Hub**. It tracks revenue, sales progress, and closing probabilities.
- **Ticket Pipeline:** Specifically for the **Service Hub**. It tracks customer support issues, inquiries, or internal tasks.
- **Plan Limits:** On Free and Starter plans, you are typically restricted to **one pipeline** per object (one for Deals, one for Tickets). Managing multiple separate pipelines (e.g., "North America Sales" vs. "European Sales") requires a **Professional** subscription. 

### Deal Pipeline

The "Deals" page is the primary dashboard for your sales revenue. 

- **How it works:** Deals move through "stages" (e.g., *Appointment Scheduled* > *Contract Sent* > *Closed Won*).
- **Revenue Forecasting:** Unlike tickets, deals have an **Amount** field and a **Win Probability %** at each stage to predict future income.
- **Deal Management:** You can drag and drop "cards" between stages, customize what information is shown on those cards (like close date), and set "required properties" so reps must enter certain data before moving a deal forward. 

### Ticket Pipeline 

A ticket pipeline is designed to resolve issues rather than make sales. In it, you can: 

- **Track Status:** Move "tickets" through stages like *New*, *In Progress*, *Waiting on Customer*, and *Resolved*.
- **Prioritize Work:** Tag tickets as *Low*, *Medium*, or *High* priority.
- **Basic Automation (Starter):** Automatically send a follow-up email when a ticket is created or change its status when a customer replies.
- **Assign Owners:** Automatically or manually route tickets to specific support agents. 
- The Deals Page 

HubSpot ticket pipelines are versatile and can be customized to fit various business workflows beyond simple customer support. By default, HubSpot provides a support pipeline with four statuses: **New**, **Waiting on contact**, **Waiting on us**, and **Closed**. 

Here are examples of how different industries structure their ticket pipelines to manage specific workflows:

### General IT Help Desk

Focuses on technical resolution and tiered support. 

- **New:** Initial ticket submission.
- **Triage/Level 1:** Initial assessment by help desk.
- **Escalated to Level 2/3:** Complex issues requiring specialized engineers.
- **Pending Vendor:** Waiting on a third-party software/hardware provider.
- **Testing/QA:** Fix is being verified.
- **Resolved/Closed:** Issue is settled. 

### Client Onboarding (SaaS or Professional Services) 

Ensures a smooth transition from a "Closed-Won" deal to an active customer. 

- **Kickoff Scheduled:** Meeting the client to define goals.
- **Technical Setup:** Account provisioning or software installation.
- **Training in Progress:** Educating the client's team on the tool.
- **Post-Onboarding Review:** Final check-in before moving to standard support.
- **Completed/Handoff:** Client is now fully operational. 

### E-commerce Order & Returns

Manages post-purchase issues and fulfillment logistics.

- **Order Inquiry:** Questions about shipping or stock.
- **Return Authorized:** Return label sent to the customer.
- **Item Received:** Warehouse confirms return arrived.
- **Inspection:** Checking item condition for refund eligibility.
- **Refund/Exchange Processed:** Final financial or replacement action. 

### Software Development (Bug Tracking)

Used for internal teams to manage product improvements.

- **Bug Reported:** New issue identified.
- **Reproducing:** Developers confirming the issue exists.
- **In Development:** Actively being fixed.
- **Code Review:** Peer verification of the fix.
- **Deployment:** Pushing the fix to production.

## HubSpot "Events"

HubSpot uses "events" to track and trigger actions based on specific user behaviors. In 2026, they primarily apply to: 

- **Standard Events:** These are built-in and tracked automatically on all plans, including **Free** and **Starter**. They include things like email opens, link clicks, form submissions, and page views.
- **Custom Behavioral Events:** This is a powerful tool for tracking specific actions—such as a user clicking a "Start Free Trial" button or reaching a certain milestone in your app.
  - **Availability:** Creating **Custom Behavioral Events** (manually or via API) is restricted to **Marketing Hub Enterprise**.
- **Usage:** Events are used to:
  - **Segment Contacts:** Create lists of people who performed a specific action (e.g., "Visited the pricing page 3 times").
  - **Trigger Workflows:** Automatically send an email or notify a sales rep when an event occurs (requires **Professional** or higher).
  - **Reporting:** Analyze which specific customer interactions are driving the most revenue. 

>  I want to use my own form for a document download on my website. Can I use an api call to hubspot to notify the system that the user downloaded a document and what the document was on the starter or free plans, or does that require a custom behavioral event?

In 2026, creating **Custom Behavioral Events** via the API remains a feature exclusive to the **Enterprise** tier. However, you can achieve your goal on the **Free** or **Starter** plans by using alternative API methods to log the download activity. 

Recommended Workaround: Forms API

Instead of an "event," you can use the HubSpot Forms API to "submit" your custom form data into HubSpot. 

- **How it works:** When a user downloads the document on your site, your backend makes a server-side API call to HubSpot's form submission endpoint.
- **Tracking the Document:** You can create a **custom contact property** (e.g., `Last Downloaded Asset`) and include it in your API call. This will update the contact's record with the name of the document they just downloaded.
- **Timeline View:** The submission will appear on the contact's activity timeline, providing a clear record of when the download occurred. 

Comparison of Methods

| Feature              | Custom Behavioral Events                  | Forms API (Workaround)                                    |
| :------------------- | :---------------------------------------- | :-------------------------------------------------------- |
| **Plan Required**    | **Enterprise Only**                       | **Free / Starter**                                        |
| **API Availability** | Yes                                       | Yes                                                       |
| **Historical Data**  | Tracks every instance (e.g., 5 downloads) | Typically updates a single property (overwrites previous) |
| **Automation**       | Can trigger complex workflows             | Can trigger "Simple Automation" (Starter plan)            |

Alternative: Tracking Code API 

If you simply want to see the action on the timeline without creating a new contact property, you can use the **HubSpot Tracking Code API** (`_hsq.push`) to track a manual "page view" for a virtual URL that represents the download (e.g., `://yoursite.com`). This does not require an Enterprise plan and will appear in the contact's web activity history. 

**Note on Free Plan Limits (2026):**

Activity data (like form submissions or calls) on the **Free plan** is only visible in the UI for **30 days**. Upgrading to **Starter** removes this limitation, ensuring you can see the download history for the life of the contact. 

## Linkedin - HubSpot Native Integration (Sales Navigator) 

### HubSpot's official integration is built specifically for **LinkedIn Sales Navigator**. 

- **Requirements:** You must have a **Sales Hub Professional** or Enterprise seat **and** a LinkedIn Sales Navigator **Advanced Plus** subscription.
- **Capabilities:** You can view LinkedIn profile details and send InMails directly from a contact record in HubSpot.
- **Message Syncing:** While you can send InMails from HubSpot, they do **not** automatically save to the contact's activity timeline. You must manually log these interactions if you want a permanent record in the CRM.

The native, built-in HubSpot integration (which allows viewing LinkedIn data directly on contact records) requires the Advanced Plus (formerly Enterprise) tier of Sales Navigator. Cheaper plans like Sales Navigator Core ($99.99/mo) or Advanced ($179.99/mo) do not support the native HubSpot CRM sync. All paid Sales Navigator plans include **50 InMail credits per month**.

### Third-Party Extensions (Full Event Sync)

If you want automatic notifications and a full sync of all LinkedIn messages (including standard DMs, not just InMails), you typically need a third-party tool like **Hublead**, **Surfe**, or **LeadCRM**. 

- **Message Sync:** These tools use Chrome extensions to "scrape" and sync your LinkedIn inbox directly into HubSpot.
- **Automation:** They can update custom HubSpot properties like "Last LinkedIn Reply Date".
- **Plan Compatibility:** Unlike the native integration, many of these tools work with **Free** and **Starter** HubSpot plans. 
- LinkedIn Ads Integration (Lead Events)

### Linkedin Ads

If you are running **LinkedIn Ads**, HubSpot's standard LinkedIn integration (available on all plans, including Free) can notify you of specific lead events: 

- **Lead Gen Forms:** When a user submits a form on LinkedIn, it automatically creates a contact in HubSpot and notifies the owner.
- **Ad Interactions:** You can track which contacts are engaging with your ads from within the HubSpot "Ads" tool. 

Summary of Options for 2026

| Feature                | Native HubSpot Integration   | Third-Party (e.g., Hublead) |
| :--------------------- | :--------------------------- | :-------------------------- |
| **HubSpot Plan**       | Sales Professional+          | Any plan (Free/Starter+)    |
| **LinkedIn Plan**      | Sales Navigator Adv. Plus    | Any LinkedIn plan           |
| **Auto-Sync Messages** | No (Manual logging required) | Yes (Automatic sync)        |
| **LinkedIn Ads Sync**  | Yes (Lead forms only)        | Yes (Profile & Msg sync)    |

## HubSpot Sales Hub Professional

Includes all features from the Starter Plan. Costs $100/month paid monthly, but has a steep ($1500) onboarding fee.

Sales Certification Waiver: Historically, HubSpot has occasionally waived onboarding fees if a user completes certain HubSpot Academy certifications before purchasing, though this is subject to current sales representative discretion. 

HubSpot does not officially list a single "magic" certification that automatically waives the **$1,500 onboarding fee**. Instead, fee waivers are typically granted under three conditions:

- **The "Partner" Path:** Purchasing through a **HubSpot Solutions Partner** is the most reliable way to have the fee waived. Partners often substitute HubSpot's standard onboarding with their own specialized services.
- **The "Software Proficiency" Argument:** If you are negotiating with a HubSpot sales rep, they often require proof that you can self-onboard. The two most important certifications to complete beforehand are:
  1. **Sales Hub Software Certification:** Demonstrates you can set up the prospecting workspace, deals, and reports.
  2. **Reporting Certification:** Shows you can build the custom dashboards that are a core part of the Professional tier.
- **The "Startups" Program:** If you are part of a seed-stage startup, you can get a **90% discount** and often a complete waiver of the onboarding fee by joining the HubSpot for Startups program.

### Linkedin Plans

Additional InMail credits have become significantly more expensive as LinkedIn shifts toward "quality over quantity." 

- **Standard Cost:** Individual extra credits typically cost **$10 to $21 per credit**.
- **Bundle Pricing:** Credits are often sold in bundles (e.g., 10 for $100).
- **Roll-over Rules:** Unused monthly credits roll over for up to **90 days**, with a total bank limit (usually 150 for Sales Navigator) before they expire. 

To search specifically by **job title** and **industry** while receiving InMail credits, you have three main "tiers" of plans. **Note:** Only the "Advanced Plus" tier supports the native HubSpot integration.

| Plan                              | Monthly Cost (Est.) | InMail Credits | Search Capabilities                                          |
| :-------------------------------- | :------------------ | :------------- | :----------------------------------------------------------- |
| **Premium Business**              | $59.99              | 15             | Basic filters; limited job title searches.                   |
| **Sales Navigator Core**          | $99.99              | 50             | **Full access** to 40+ advanced filters (title, industry, company size, etc.). |
| **Sales Navigator Advanced**      | $149.99             | 50             | Same filters as Core, plus team collaboration and "Smart Links". |
| **Sales Navigator Advanced Plus** | Custom ($~150+)     | 50             | **Required for native HubSpot CRM sync**. Includes all filters. |
| **Recruiter Lite**                | $170.00             | 30             | Focused on hiring filters (skills, years of experience).     |

**Pro Tip:** If you want the search power of Sales Navigator but can't afford the "Advanced Plus" price for HubSpot syncing, use a third-party bridge like Surfe or Hublead. These allow you to use the **$99/month Core plan** and still sync data to HubSpot.

## Linkedin Search Criteria in Sales Navigator Core

**LinkedIn Sales Navigator Core** includes 50+ advanced filters divided into two primary search types: **Lead Search** (finding specific people) and **Account Search** (finding companies). 

These filters are much more granular than those in Premium Business, allowing for precise targeting of decision-makers within specific company types. 

1. Lead Search Filters (People)

These filters help you pinpoint individuals based on their current role, professional history, and activity on the platform. 

- **Role & Experience:**
  - **Current Job Title:** Specific current role.
  - **Past Job Title:** Experience in previous roles.
  - **Function:** Broad department (e.g., Sales, Engineering).
  - **Seniority Level:** C-Suite, Director, Manager, etc.
  - **Years in Current Company:** Loyalty/tenure at current firm.
  - **Years in Current Position:** How long they have been in their specific role.
  - **Total Years of Experience:** Overall career length.
- **Company & Industry:**
  - **Current Company:** Filter by specific firms.
  - **Past Company:** Find former employees of specific companies.
  - **Company Headcount:** Filter by the size of the company they work for.
  - **Industry:** Granular industry sectors.
  - **Company Type:** Public, private, non-profit, etc.
- **Spotlights (High-Intent Signals):**
  - **Changed Jobs in 90 Days:** Targets new decision-makers who may be looking for new solutions.
  - **Posted on [LinkedIn](https://www.linkedin.com/) in 30 Days:** Identifies active users who are more likely to respond.
  - **Mentioned in News:** Contacts recently featured in media.
  - **Following Your Company:** Warm leads who already know your brand.
  - **Viewed Your Profile:** People who have shown interest in you.
- **Personal & Network:**
  - **Geography:** Detailed location, including specific regions or postal codes.
  - **Connection Degree:** 1st, 2nd, or 3rd+ degree.
  - **Groups:** Members of specific professional groups.
  - **School:** Alumni of specific institutions.
  - **First/Last Name:** Searching for specific individuals. 
- Account Search Filters (Companies)

Used for **Account-Based Marketing (ABM)** to find businesses that fit your Ideal Customer Profile (ICP). 

- **Growth & Revenue:**
  - **Annual Revenue:** Estimated company income.
  - **Company Headcount Growth:** Percentage of growth over the last year.
  - **Department Headcount Growth:** Pinpoints specific departments that are expanding.
- **Company Attributes:**
  - **Number of Followers:** Reach of the company's brand.
  - **Technologies Used:** Finds companies using specific software (e.g., Salesforce, HubSpot).
  - **Job Opportunities:** Filter for companies actively hiring.
  - **Fortune Ranking:** Filter by Fortune 500, 1000, etc.
  - **Headquarters Location:** Where the main office is based. 

Premium Business relies on the **standard search bar** for titles: 

- **Keyword Matching:** You must type the job title into the "Title" field in the "All filters" menu. This matches based on exact keywords found in the user's current or past headline/experience.
- **No Seniority/Function Filters:** You **cannot** filter by "Seniority Level" (e.g., C-Level vs. Manager) or "Function" (e.g., Marketing vs. Engineering) in this plan.
- **Boolean Support:** You can use Boolean operators (e.g., `"Sales Manager" NOT "Retail"`) to improve results, but you lack the 30+ "Lead Filters" found in Sales Navigator that distinguish between a current role and a past one with high accuracy. 

