import { CallTemplateFunctionArgs, Context, PluginDefinition } from '@yaakapp/api';
import { createSigner } from 'fast-jwt';

const ALGORITHM = 'HS256';

export const plugin: PluginDefinition = {
  templateFunctions: [{
    name: 'SupabaseJWT',
    args: [
        { label: 'User email', placeholder: 'john.doe@example.com', type: 'text', name: 'email' },
        { label: 'User id', placeholder: '30e07a18-aaeb-4811-9577-10551d06ac8a', type: 'text', name: 'sub' },
        { label: 'Expiration time', placeholder: '60', type: 'text', defaultValue:'60', name: 'expTime' },
        { label: 'Role', placeholder: 'authenticated', type: 'text', defaultValue:'authenticated', name: 'role' },
        { label: 'Project URL', placeholder: 'https://prvhsxchzjacchh6ynmsh.supabase.co/auth/v1', type: 'text', name: 'projectUrl' },
        { label: 'JWT secret', placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30', type: 'text', name: 'jwtSecret' },

    ],
    async onRender(_ctx: Context, args: CallTemplateFunctionArgs): Promise<string | null> {
        const email = args.values.email as string;
        const sub = args.values.sub as string;
        const expMin = parseInt(args.values.expTime as string, 10) || 60;
        const role = args.values.role as string || 'authenticated';
        const iss = args.values.projectUrl as string;
        const jwtSecret = args.values.jwtSecret as string;

        const iat = Math.floor(new Date().getTime() / 1000);
        const exp = iat + expMin * 60;

        const signer = createSigner({ key: jwtSecret, algorithm: ALGORITHM });

        const payload = {
            iss,
            aud: role,
            iat,
            exp,
            sub,
            email,
            role: role,
            app_metadata: {
                provider: "email"
            },
            user_metadata: null,
            aal: "aal1",
            amr: [
                {
                    method: "password",
                    timestamp: iat
                }
            ],
            is_anonymous: false
        };
        return signer(payload);
    }
  }],
};