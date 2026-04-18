export class HMAC {
  #digest: Bun.DigestEncoding;
  #hasher: Bun.CryptoHasher;

  constructor(
    algorithm: Bun.SupportedCryptoAlgorithms,
    digest: Bun.DigestEncoding,
    secret: string | NodeJS.TypedArray
  ) {
    this.#digest = digest;
    this.#hasher = new Bun.CryptoHasher(algorithm, secret);
  }

  hash(data: Bun.BlobOrStringOrBuffer) {
    return this.#hasher.copy().update(data).digest(this.#digest);
  }

  verify(digest: string, data: Bun.BlobOrStringOrBuffer) {
    return digest === this.hash(data);
  }
}
