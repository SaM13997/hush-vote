import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const supabaseClient = () => {
	const cookiesStore = cookies()

	return createServerClient(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_ANON_KEY!,
		{
			cookies: {
				async getAll() {
					return (await cookiesStore).getAll()
				},
				async setAll(cookiesToSet) {
					try {
						const resolvedCookiesStore = await cookiesStore

						cookiesToSet.forEach(({ name, value, options }) =>
							resolvedCookiesStore.set(name, value, options)
						)
					} catch {}
				},
			},
		}
	)
}
