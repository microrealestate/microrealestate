export const dynamic = 'force-static';

export async function GET() {
  return new Response('ok', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}
