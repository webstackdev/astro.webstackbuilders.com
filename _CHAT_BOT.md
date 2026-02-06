# AWS Bedrock and Lex

Amazon Lex is a service for building conversational, voice-and-chat interfaces (chatbots) using Natural Language Understanding (NLU), while Amazon Bedrock is a managed service providing API access to foundation models (LLMs) for generating content and reasoning. Lex acts as the conversational "front-end," whereas Bedrock acts as the AI "brain" that powers advanced, generative responses. 

**Key Differences:**

- **Primary Function:** Lex manages intent classification, slot filling (collecting information), and dialogue management (flow). Bedrock provides access to generative models (e.g., Anthropic Claude, Amazon Titan) to answer complex queries or generate text.
- **Use Case:** Use Lex for structured, transactional tasks (e.g., "book a flight" or "check account balance"). Use Bedrock for unstructured, creative, or knowledge-based tasks (e.g., summarizing documents or drafting emails).
- **Control vs. Flexibility:** Lex allows for precise, deterministic control over bot conversations. Bedrock offers flexibility in choosing from multiple, powerful, but non-deterministic models.
- **Integration:** Lex can use Bedrock to power its `QnAIntent` for retrieving answers from company data (via RAG - Retrieval-Augmented Generation). 

**How They Work Together:**
In modern applications, they are often combined, with Lex acting as the user interface and Bedrock providing intelligent, dynamic responses. A Lex bot can handle basic inputs and, when faced with a complex question, call upon Bedrock to generate an answer, thus combining structured dialogue with generative AI, say sources at Amazon Web Services. 

## RAG

As a software engineer already using AWS, the most efficient approach in 2026 is to build a serverless **RAG (Retrieval-Augmented Generation)** application using **Amazon Bedrock**. This bypasses the limitations of HubSpot’s built-in rule-based bots while maintaining full control over your logic and data.

**Architecture Overview**

1. **Frontend:** A lightweight React or vanilla JS chat widget on your site.
2. **Orchestration (AWS Lambda):** Acts as the brain, receiving user input, querying your data, and calling HubSpot's API.
3. **LLM & RAG (Amazon Bedrock):** Uses "Knowledge Bases for Amazon Bedrock" to index your website content (stored in S3) and provide generative answers.
4. **CRM Integration (HubSpot API):** Lambda uses a **Private App Access Token** to create contacts or send internal notifications. 

------

**Step-by-Step Implementation Guide**

**1. Knowledge Retrieval (RAG)**

To answer questions about your site content and availability, use **Knowledge Bases for Amazon Bedrock**:

- **Data Source:** Crawl your website or export your content to an **S3 bucket** as text or PDF files.
- **Vector Database:** Use the "Quick Start" option in Bedrock to set up a managed vector store (like **Amazon OpenSearch Serverless**).
- **Availability Data:** Include a specific "Availability.txt" file in your S3 bucket that you update with your current project status. The LLM will prioritize this context when asked about work. 

**2. Tool Use (Function Calling)**

To allow the bot to "do tasks" like adding contacts, use **Agents for Amazon Bedrock**:

- Define a **JSON Schema** for a tool called `add_hubspot_contact`.
- When the LLM detects an intent to "sign up" or "contact me," it will pause and output the structured data (name, email).
- **Lambda Execution:** Your Lambda function receives this structured output, calls the HubSpot Contacts API, and returns a success message to the LLM. 

**3. Secure HubSpot API Integration**

- **Authentication:** Create a **Private App** in your [HubSpot portal](https://www.hubspot.com/products/crm/chatbot-builder) to get an `access_token`. Store this token in **AWS Secrets Manager**—never hardcode it in Lambda.
- **Contact Creation:** Use the `POST /crm/v3/objects/contacts` endpoint.
- **Internal Messaging:** To notify yourself, you can use the HubSpot Notifications API or simply have the Lambda function send an email via **Amazon SES**. 

**4. Deployment via AWS Lambda URL** 

- Enable a **Function URL** for your Lambda to provide a direct HTTPS endpoint for your website's chat widget.
- **Security:** Implement a simple API key check or verify the origin of requests in your Lambda code to prevent unauthorized use of your LLM tokens. 

**Why this is better than HubSpot's native bot:**

- **Cost:** You pay only for what you use on AWS (Bedrock tokens + Lambda execution) rather than paying for a $450+/month HubSpot Professional seat.
- **Flexibility:** You can switch between models (Claude 3.5, Llama 3, etc.) within Bedrock as better ones are released in 2026.
- **Customization:** You can program complex logic for your "availability" questions that a standard rule-based bot cannot handle. 

[build-your-first-generative-ai-chatbot-with-aws-bedrock](https://builder.aws.com/content/32QI11dOJqOSjbKKlPpXBu8vw1O/build-your-first-generative-ai-chatbot-with-aws-bedrock-in-minutes)

**Amazon Bedrock does not have a traditional "Always Free" tier** based on usage volume. However, as of a major update in **July 2025**, AWS significantly revamped its Free Tier to include **credit-based offers** that effectively allow you to use Bedrock for free as a new customer. 

**1. 2026 Free Credit Offers**

If you create a new AWS account, you can receive up to **$200 in credits** that apply to paid services like Amazon Bedrock: 

- **Sign-up Bonus:** New customers automatically receive **$100 in credits** upon account creation.
- **Builder Quests:** You can earn up to **another $100** by completing five onboarding activities. One of these specific tasks is often based on **Amazon Bedrock** (e.g., submitting a prompt in the text playground).
- **Duration:** These credits are valid for **6 months** from the date of account creation. 

**2. Bedrock Pricing Components to Watch**

Even with credits, you must manage your architecture carefully to avoid high costs, particularly for the project you described:

- **Model Inference:** This is billed per token (input/output). This is typically very low cost for small personal projects.
- **Knowledge Bases (Vector Store):** This is the most expensive part of your proposed "answer from site content" architecture. Using **Amazon OpenSearch Serverless** as the vector store for RAG often has a minimum monthly cost of around **$700/month**.
  - *Alternative:* For a personal project, consider using a cheaper vector store option like **Pinecone's free tier** or an **S3-based** retrieval system to avoid this charge.
- **Agents for Bedrock:** These may incur separate charges based on usage and active resource consumption during tool calls. 

**3. Complementary Always Free Services** 

While Bedrock itself is paid (via credits), the other components of your 2026 architecture are part of the **AWS Always Free** tier: 

- **AWS Lambda:** 1 million requests and 400,000 GB-seconds of compute time per month.
- **Amazon S3:** 5 GB of standard storage (useful for storing your website content files).
- **Amazon DynamoDB:** 25 GB of storage (useful for logging chat history or tracking availability). 

**Summary Table**

| Feature                    | Free Tier Status (2026)                                     |
| :------------------------- | :---------------------------------------------------------- |
| **Foundation Models**      | No "always free" usage; uses up to $200 in sign-up credits. |
| **Prompting Playground**   | No charge during the "Builder Quest" to earn credits.       |
| **Model Import**           | No charge to import a custom model.                         |
| **Orchestration (Lambda)** | **Always Free** within monthly limits.                      |