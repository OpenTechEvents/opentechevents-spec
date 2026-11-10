/**
 * What makes an adopter logo URL unusable as a registry value.
 *
 * The registry is a permanent record rendered by opentechevents.org; a logo URL in it has
 * to answer the same image in a year. Some URLs are built not to: GitHub's upload links —
 * what you get when you drop an image into an issue and copy the address — are pre-signed
 * S3 URLs with `X-Amz-Expires=300`. They work while the person is filling the form and are
 * 403 five minutes later. PR #51 registered one: the logo was broken before the PR merged.
 *
 * Shared by scripts/register-adopter.mjs (which mirrors these into docs/logos/ instead of
 * storing them) and scripts/validate.mjs (which fails the build if one ever lands anyway,
 * whether through the pipeline or a hand-edited PR).
 */

/* Query parameters that say "this URL is a time-limited grant", not "this is where the
   image lives": AWS SigV4, Azure SAS, and the generic token/expiry spellings. */
const SIGNING_PARAMS =
  /^(x-amz-(signature|expires|credential|security-token)|x-goog-signature|sig|se|signature|expires|expiry|token|jwt|key-pair-id)$/i;

/* Hosts that only ever serve ephemeral copies, even when the URL carries no visible
   expiry: GitHub's user-asset buckets redirect-sign on every read. */
const EPHEMERAL_HOSTS = [/^github-production-[\w-]*user-asset[\w.-]*\.s3[\w.-]*\.amazonaws\.com$/i];

/**
 * @returns {string|null} why the URL expires, in a phrase a report can embed — or null
 *   if it looks like a durable address. Not a URL validity check: a value that doesn't
 *   parse as an absolute http(s) URL is someone else's problem (null here).
 */
export function expiringLogoReason(logo) {
  let url;
  try {
    url = new URL(logo);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (EPHEMERAL_HOSTS.some((re) => re.test(url.hostname))) {
    return `\`${url.hostname}\` only serves temporary copies of uploaded files`;
  }
  const signed = [...url.searchParams.keys()].filter((k) => SIGNING_PARAMS.test(k));
  if (signed.length) {
    return `the URL is signed and time-limited (${signed.map((k) => `\`${k}\``).join(", ")})`;
  }
  return null;
}

/** Stable file name for a mirrored logo: the community name, slugified. */
export function logoSlug(name) {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "adopter"
  );
}
