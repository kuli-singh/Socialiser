async function check() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.log("No API Key");
    return;
  }
  
  const versions = ['v1', 'v1beta'];
  for (const v of versions) {
    console.log(`--- Testing ${v} ---`);
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/${v}/models?key=${apiKey}`);
      const data = await resp.json();
      if (data.models) {
        data.models.map(m => m.name.split('/').pop()).forEach(name => console.log(name));
      } else {
        console.log(`Error in ${v}:`, data);
      }
    } catch (e) {
      console.log(`Failed to fetch ${v}:`, e.message);
    }
  }
}

check();
