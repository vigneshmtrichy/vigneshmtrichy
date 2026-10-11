# Tenoo Packaging Studio — AI setup

The Studio has two generation modes:
- **Generate with AI** calls the authenticated server route at `/api/packaging-studio/generate`.
- **Use template generator** works without an AI provider key.

## Enable AI in Vercel Preview

In the Vercel project that owns the Preview deployment, open **Settings → Environment Variables** and add:

- `OPENAI_API_KEY`: a server-side OpenAI API key with API billing enabled. Never use a `NEXT_PUBLIC_` prefix for this key.
- Optional `OPENAI_PACKAGING_MODEL`: defaults to `gpt-4.1-mini`.

Apply it to **Preview** first, then redeploy the feature-branch Preview. Do not add the secret to client code, Git, or screenshots. Production is not required to test this feature.

The endpoint verifies the Supabase bearer session and restricts use to the existing authorized admin email before calling the provider. Provider keys are read only on the server. The generated output is a simple editable 2D vector layout, not a rendered product photo or a guarantee of print/legal compliance.

If the key is absent, the endpoint returns a clear configuration message and the template generator remains available.
