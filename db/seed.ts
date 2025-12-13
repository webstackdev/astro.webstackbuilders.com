import { randomUUID } from 'node:crypto'
import { and, consentEvents, db, eq, rateLimitWindows } from 'astro:db'

// https://astro.build/db/seed
export default async function seed() {

	const now = new Date()

	// Ensure idempotent seeding by removing prior seed rows before re-inserting
	const seededSubjects = [
		'00000000-0000-0000-0000-000000000001',
		'00000000-0000-0000-0000-000000000002',
	]

	for (const subjectId of seededSubjects) {
		await db.delete(consentEvents).where(eq(consentEvents.dataSubjectId, subjectId))
	}

	await db
		.delete(rateLimitWindows)
		.where(and(eq(rateLimitWindows.scope, 'seed'), eq(rateLimitWindows.identifier, 'local')))

	/*
	 * Provide a pair of consent records so GDPR endpoints, dashboard pages, and local tests
	 * always have deterministic data to read without depending on real submissions.
	 */
	await db.insert(consentEvents).values([
		{
			id: randomUUID(),
			dataSubjectId: '00000000-0000-0000-0000-000000000001',
			email: 'seed@example.com',
			purposes: ['analytics', 'contact'],
			source: 'seed_script',
			userAgent: 'seed-agent',
			ipAddress: '127.0.0.1',
			privacyPolicyVersion: 'seed',
			consentText: 'Seeded consent record',
			verified: true,
			createdAt: now,
		},
		{
			id: randomUUID(),
			dataSubjectId: '00000000-0000-0000-0000-000000000002',
			email: null,
			purposes: ['marketing'],
			source: 'seed_script',
			userAgent: 'seed-agent',
			ipAddress: null,
			privacyPolicyVersion: 'seed',
			consentText: null,
			verified: false,
			createdAt: now,
		},
	])

	/*
	 * Pre-populate a rate-limit window so the Astro DB-backed limiter logic immediately
	 * has a known scope/identifier to work with when exercising API routes locally.
	 */
	await db.insert(rateLimitWindows).values([
		{
			id: randomUUID(),
			scope: 'seed',
			identifier: 'local',
			hits: 0,
			limit: 1,
			windowMs: 60000,
			windowExpiresAt: Date.now() + 60000,
			updatedAt: now,
		},
	])
}
