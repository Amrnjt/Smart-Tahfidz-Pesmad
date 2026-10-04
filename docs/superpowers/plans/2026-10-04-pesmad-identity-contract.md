# Pesmad Internal Identity Contract

Companion contract for `2026-10-04-pesmad-app-v1-implementation.md`. This file removes ambiguity from the cross-repository username → Firebase internal-email mapping used by both `Amrnjt/Pesmad-App` and `Amrnjt/Sistem-Kinerja-Pesmad`.

## Canonical Username

```ts
normalizePesmadUsername(username: string): string
```

Algorithm:

1. `trim()` the input.
2. Convert to lowercase with JavaScript `toLowerCase()`.
3. Reject an empty result.

No display name or role is part of the canonical username.

## Internal Firebase Email

```ts
internalAuthEmail(username: string): string
```

Algorithm:

1. Compute `normalized = normalizePesmadUsername(username)`.
2. Compute SHA-256 over the UTF-8 bytes of `normalized`.
3. Encode the digest as lowercase hexadecimal.
4. Take the first 32 hexadecimal characters.
5. Return `pesmad.<hash32>@auth.tahfidzpesmad.my.id`.

The internal email is an implementation identifier only. It must not be presented as the user's login name, stored as a replacement for the user's legacy username, or written to application logs unless redacted.

## Required Test Vectors

```text
username: anas
normalized: anas
internal email: pesmad.1df38cbe202365fc6f2265391ef6aad4@auth.tahfidzpesmad.my.id

username: ustadz01
normalized: ustadz01
internal email: pesmad.d81a4d3803f6ea754d98716b28716fef@auth.tahfidzpesmad.my.id

username: "  ADMIN  "
normalized: admin
internal email: pesmad.8c6976e5b5410415bde908bd4dee15df@auth.tahfidzpesmad.my.id
```

Both repositories must include these vectors in unit tests. A change to this algorithm is a breaking identity migration and must not be made independently in one repository.
