const banned = [
  /child\s*sexual/i, /explosive|bomb|napalm/i, /terror(ist|ism)/i
];
export default function safety(req, res, next){
  const text = (req.body?.message || '').toString();
  if (!text) return res.status(400).json({ message:'Message is required' });
  if (text.length > 4000) return res.status(413).json({ message:'Message too long' });
  for (const re of banned) {
    if (re.test(text)) return res.status(400).json({ message:'Blocked by safety policy' });
  }
  // minimal prompt-injection scrub
  req.body.message = text.replace(/(ignore|bypass).*?(rules|instructions)/gi, '[filtered]');
  next();
}
