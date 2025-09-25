export class HMAC {
  key: string | NodeJS.TypedArray;
  digest: Bun.DigestEncoding;
  algorithm: Bun.SupportedCryptoAlgorithms;

  constructor(
    key: string | NodeJS.TypedArray,
    algorithm: Bun.SupportedCryptoAlgorithms,
    digest: Bun.DigestEncoding
  ) {
    this.key = key;
    this.algorithm = algorithm;
    this.digest = digest;
  }

  verify(signature: string, data: Bun.BlobOrStringOrBuffer) {
    const hasher = new Bun.CryptoHasher(this.algorithm, this.key);
    const hash = hasher.update(data).digest(this.digest);
    return hash === signature;
  }
}
