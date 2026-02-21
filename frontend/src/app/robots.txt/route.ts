import { headers } from 'next/headers'

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://rdvpriority.fr/sitemap.xml

Host: rdvpriority.fr`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}