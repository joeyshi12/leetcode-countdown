export async function onRequestGet() {
  const query =
    'query { activeDailyCodingChallengeQuestion { date link question { title titleSlug difficulty } } }';

  let upstream;
  try {
    upstream = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (compatible; leetcode-countdown)',
      },
      body: JSON.stringify({ query }),
    });
  } catch (err) {
    return json({ error: 'fetch failed' }, 502);
  }

  if (!upstream.ok) {
    return json({ error: 'upstream ' + upstream.status }, 502);
  }

  const data = await upstream.json();
  const q = data && data.data && data.data.activeDailyCodingChallengeQuestion;
  if (!q || !q.link) {
    return json({ error: 'no daily problem in response' }, 502);
  }

  return json(
    {
      date: q.date || null,
      link: 'https://leetcode.com' + q.link,
      title: (q.question && q.question.title) || null,
      slug: (q.question && q.question.titleSlug) || null,
      difficulty: (q.question && q.question.difficulty) || null,
    },
    200,
  );
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Cache at the edge so we don't hammer LeetCode; refreshes well
      // within the daily reset window.
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
