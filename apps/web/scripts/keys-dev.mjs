import { generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
});

process.stdout.write(
  `${JSON.stringify({
    privateKey: privateKey.export({ format: 'jwk' }),
    publicKey: publicKey.export({ format: 'jwk' }),
  })}\n`,
);
