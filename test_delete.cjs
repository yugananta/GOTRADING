async function run() {
  const res = await fetch('http://localhost:3000/api/posts', {
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  console.log("posts:", data.length);
  if (data.length > 0) {
    const p = data[0];
    const res2 = await fetch('http://localhost:3000/api/posts/' + p.id, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: p.userId })
    });
    const d2 = await res2.json();
    console.log("delete:", d2);
  }
}
run();
