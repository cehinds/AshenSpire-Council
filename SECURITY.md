# Security

- Never commit API keys, `.env.local`, meeting databases, or generated audio.
- The browser receives only application data and generated audio URLs; the OpenAI key stays server-side.
- Canonical task IDs are reference pointers, not credentials or callable authority.
- Report suspected secret exposure privately to the repository owner and rotate the affected credential before further testing.
