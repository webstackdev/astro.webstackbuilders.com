import { randomUUID } from 'node:crypto'
import { and, db, dsarRequests, eq, gt, isNull } from 'astro:db'
import type {
  CreateDsarRequestInput,
  DsarRequestRecord,
  DSARRequest,
  DsarVerifyResult,
  RequestType,
} from '@actions/gdpr/@types'
import { deleteNewsletterConfirmationsByEmail } from '@actions/newsletter/domain'
import {
  deleteConsentRecordsByEmail,
  findConsentRecordsByEmail,
} from '@actions/gdpr/entities/consent'
import { handleActionsFunctionError } from '@actions/utils/errors'
import { purgeContact } from '@actions/utils/hubspot'

export async function findActiveRequestByEmail(
  email: string,
  requestType: RequestType
): Promise<DsarRequestRecord | undefined> {
  const [record] = await db
    .select()
    .from(dsarRequests)
    .where(
      and(
        eq(dsarRequests.email, email),
        eq(dsarRequests.requestType, requestType),
        isNull(dsarRequests.fulfilledAt),
        gt(dsarRequests.expiresAt, new Date())
      )
    )
    .limit(1)

  return record
}

export async function createDsarRequest(input: CreateDsarRequestInput): Promise<DsarRequestRecord> {
  const [record] = await db
    .insert(dsarRequests)
    .values({
      id: randomUUID(),
      token: input.token,
      email: input.email,
      requestType: input.requestType,
      expiresAt: input.expiresAt,
      createdAt: new Date(),
    })
    .returning()

  if (!record) {
    throw new Error('Failed to create DSAR request')
  }

  return record
}

export async function findDsarRequestByToken(
  token: string
): Promise<DsarRequestRecord | undefined> {
  const [record] = await db
    .select()
    .from(dsarRequests)
    .where(eq(dsarRequests.token, token))
    .limit(1)
  return record
}

export async function markDsarRequestFulfilled(token: string): Promise<void> {
  await db
    .update(dsarRequests)
    .set({ fulfilledAt: new Date() })
    .where(eq(dsarRequests.token, token))
}

export async function verifyDsarToken(token: string): Promise<DsarVerifyResult> {
  const dbRequest = await findDsarRequestByToken(token)

  if (!dbRequest) {
    return { status: 'invalid' }
  }

  const dsarRequest: DSARRequest = {
    id: dbRequest.id,
    token: dbRequest.token,
    email: dbRequest.email,
    requestType: dbRequest.requestType as DSARRequest['requestType'],
    expiresAt: dbRequest.expiresAt.toISOString(),
    createdAt: dbRequest.createdAt.toISOString(),
    ...(dbRequest.fulfilledAt && { fulfilledAt: dbRequest.fulfilledAt.toISOString() }),
  }

  if (dsarRequest.fulfilledAt) {
    return { status: 'already-completed' }
  }

  if (new Date(dsarRequest.expiresAt) < new Date()) {
    return { status: 'expired' }
  }

  const email = dsarRequest.email
  const requestType = dsarRequest.requestType

  if (requestType === 'ACCESS') {
    const consentRecords = await findConsentRecordsByEmail(email)
    await markDsarRequestFulfilled(token)

    const exportData = {
      email,
      requestDate: dsarRequest.createdAt,
      consentRecords: consentRecords.map(({ ipAddress: _ip, ...record }) => ({
        ...record,
        createdAt:
          record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
      })),
      legalDisclosures: {
        retentionPeriods: {
          consentRecords:
            'Retained for 7 years from the date of consent to meet legal compliance and audit requirements.',
          contactFormSubmissions:
            'Retained for 3 years from the date of submission for legitimate business correspondence purposes.',
          newsletterSubscriptions:
            'Retained until you unsubscribe, plus 12 months thereafter for audit purposes.',
          downloadRecords:
            'Retained for 2 years from the date of download for business records purposes.',
        },
        thirdPartyRecipients: [
          {
            name: 'Resend',
            category: 'Email delivery service',
            purpose:
              'Delivers transactional and marketing emails on our behalf. Receives your email address and name.',
            privacyPolicy: 'https://resend.com/privacy',
          },
          {
            name: 'HubSpot',
            category: 'Customer relationship management (CRM) and marketing platform',
            purpose:
              'Stores contact details and newsletter subscription status for marketing communications. Receives your email address and name when you subscribe to the newsletter or submit the contact form with marketing consent.',
            privacyPolicy: 'https://legal.hubspot.com/privacy-policy',
          },
          {
            name: 'Upstash',
            category: 'Rate-limiting and caching service',
            purpose:
              'Stores anonymised request fingerprints to enforce rate limits. Does not receive personally identifiable information.',
            privacyPolicy: 'https://upstash.com/privacy',
          },
          {
            name: 'Sentry',
            category: 'Error monitoring service',
            purpose:
              'Captures application error reports which may include request metadata. Configured to scrub personally identifiable information from error payloads.',
            privacyPolicy: 'https://sentry.io/privacy/',
          },
          {
            name: 'Vercel',
            category: 'Hosting and infrastructure provider',
            purpose:
              'Hosts and serves this website. All web requests are processed through Vercel infrastructure.',
            privacyPolicy: 'https://vercel.com/legal/privacy-policy',
          },
        ],
        yourRights: {
          summary:
            'Under the UK GDPR and EU GDPR you have the following rights regarding your personal data.',
          rights: [
            {
              article: 'Article 15',
              right: 'Right of access',
              description:
                'You have the right to obtain a copy of the personal data we hold about you and supplementary information about how it is processed.',
            },
            {
              article: 'Article 16',
              right: 'Right to rectification',
              description:
                'You have the right to request correction of inaccurate personal data we hold about you.',
            },
            {
              article: 'Article 17',
              right: 'Right to erasure',
              description:
                "You have the right to request deletion of your personal data ('right to be forgotten'). Use the Delete My Data form at https://www.webstackbuilders.com/privacy/my-data to submit a deletion request.",
            },
            {
              article: 'Article 18',
              right: 'Right to restriction of processing',
              description:
                'You have the right to request that we restrict the processing of your personal data in certain circumstances.',
            },
            {
              article: 'Article 20',
              right: 'Right to data portability',
              description:
                'You have the right to receive your personal data in a structured, commonly used, machine-readable format (such as this JSON file) and to transmit it to another controller.',
            },
            {
              article: 'Article 21',
              right: 'Right to object',
              description:
                'You have the right to object to the processing of your personal data for direct marketing purposes at any time.',
            },
          ],
          howToExercise:
            'To exercise any of these rights, contact us at privacy@webstackbuilders.com. We will respond within 30 days.',
          supervisoryAuthority:
            "You have the right to lodge a complaint with a supervisory authority. In the UK this is the Information Commissioner's Office (ICO): https://ico.org.uk. In the EU, contact the supervisory authority in your country of residence.",
        },
        dataSource:
          'All personal data in this export was collected directly from you through first-party form submissions on webstackbuilders.com. No data has been obtained from third-party sources.',
      },
    }

    return {
      status: 'download',
      filename: `my-data-${Date.now()}.json`,
      json: JSON.stringify(exportData, null, 2),
    }
  }

  if (requestType === 'DELETE') {
    await deleteConsentRecordsByEmail(email)
    await deleteNewsletterConfirmationsByEmail(email)
    try {
      await purgeContact(email)
    } catch (hubspotError) {
      // Log and report to Sentry but do not block the GDPR deletion — local
      // data has already been removed and the request must be marked fulfilled.
      handleActionsFunctionError(hubspotError, {
        route: '/_actions/gdpr/dsar',
        operation: 'hubspotPurgeContact',
      })
    }
    await markDsarRequestFulfilled(token)
    return { status: 'deleted' }
  }

  return { status: 'error' }
}
