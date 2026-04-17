# Newsletter Infrastructure

You can access the list of names in the Newsletter segment and their email addresses via the HubSpot API on a **Starter plan**. However, there is a critical update to keep in mind: HubSpot has fully **deprecated legacy API keys** in favor of **Private Apps**.

To retrieve your newsletter segment (static list), you will need to follow these steps:

1. Create a Private App

Instead of an API key, you must create a Private App within your HubSpot portal to generate an **Access Token**.

- Navigate to **Settings > Integrations > Private Apps**.
- Create a new app and select the necessary **Scopes** (permissions). For your goal, you will at minimum need `crm.lists.read` and `crm.objects.contacts.read`.
- HubSpot will provide an **Access Token** that you will use in your API requests as a Bearer token.

## Retrieve List Memberships

Because you are using a "Newsletter" segment (list), the process is typically a two-step API call:

1. **Get Member IDs**: Use the Lists API to get a list of all contact IDs belonging to your specific static list.

   - **Endpoint:** `GET /crm/v3/lists/{listId}/memberships`

2. **Fetch Contact Details**: Once you have the IDs, use the Contacts API to pull the actual names and email addresses for those specific IDs.

   - **Endpoint:** `POST /crm/v3/objects/contacts/batch/read`

3. Starter Plan Limitations to Watch

- **Rate Limits:** On the Starter plan, you are limited to **100 requests per 10 seconds**.
- **Daily Limit:** You have a generous **250,000 API calls per day**.
- **Pagination:** If your newsletter list is large, the API will return results in "batches" (usually 100-250 at a time). You will need to check the `paging.next.after` value in the response to fetch the next set of contacts.

**✅ Result Summary**

You can use the **HubSpot API** on a **Starter plan** to programmatically extract your newsletter list members. You simply need to swap your old API key for a **Private App Access Token** and use the **Lists and Contacts API endpoints** to gather the names and emails.
