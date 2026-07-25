/**
 * One-off migration to the per-user sharing data model:
 *
 *   1. /investments/{pushId}            -> /investments/{userId}/{pushId}
 *   2. /users/{uid}/sharedPortfolios    -> array of codes becomes { ownerUid: code }
 *   3. /shareCodeIndex/{code}           -> { uid, displayName } created for every user
 *
 * publicProfiles is intentionally left empty: nobody is listed on the
 * Everyone tab until they opt in via the Share Portfolio modal.
 *
 * Run BEFORE deploying the new database rules (firebase-admin bypasses rules,
 * so order only matters for keeping the old app working until the deploy):
 *
 *   pnpm add -D firebase-admin
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/migrate-sharing-model.mjs https://<project>-default-rtdb.<region>.firebasedatabase.app
 *
 * Then deploy rules + app:  firebase deploy --only database
 *
 * The script is idempotent: already-migrated records are left untouched.
 */
import admin from 'firebase-admin';

const databaseURL = process.argv[2];
if (!databaseURL) {
  console.error('Usage: node scripts/migrate-sharing-model.mjs <databaseURL>');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL,
});

const db = admin.database();

const [usersSnap, investmentsSnap] = await Promise.all([
  db.ref('users').get(),
  db.ref('investments').get(),
]);

const users = usersSnap.val() ?? {};
const investments = investmentsSnap.val() ?? {};

// Map share codes to their owners so old sharedPortfolios arrays can be converted.
const codeToUid = {};
for (const [uid, user] of Object.entries(users)) {
  if (user.shareCode) codeToUid[user.shareCode] = uid;
}

const updates = {};

// Some older records stored amounts as strings ("1000" rather than 1000).
// Arithmetic coerces them, so the app mostly appeared to work, but the
// database rules require real numbers and would reject any later write to
// such a record. Normalise while the data is being moved anyway.
const NUMERIC_FIELDS = ['buyPrice', 'investmentAmount', 'quantity', 'purchaseDate', 'createdAt'];

let coercedFields = 0;

const normaliseInvestment = (key, value) => {
  const normalised = { ...value };

  for (const field of NUMERIC_FIELDS) {
    const raw = normalised[field];
    if (typeof raw !== 'string') continue;

    const parsed = Number(raw);
    if (raw.trim() !== '' && Number.isFinite(parsed)) {
      normalised[field] = parsed;
      coercedFields += 1;
    } else {
      console.warn(`  ${key}: leaving ${field}=${JSON.stringify(raw)} alone, it is not a number`);
    }
  }

  // Rules accept only the seven supported codes, in upper case.
  if (typeof normalised.currency === 'string') {
    normalised.currency = normalised.currency.toUpperCase();
  }

  return normalised;
};

// 1. Move flat investment records under their owner's uid.
// Old records live at /investments/{pushId} and have a userId field;
// migrated records live at /investments/{uid}/{pushId} (no userId at the top level).
let movedInvestments = 0;
for (const [key, value] of Object.entries(investments)) {
  if (typeof value?.userId === 'string') {
    updates[`investments/${value.userId}/${key}`] = normaliseInvestment(key, value);
    updates[`investments/${key}`] = null;
    movedInvestments += 1;
  }
}

// 2. + 3. Per-user conversions.
let convertedShareLists = 0;
let indexEntries = 0;
for (const [uid, user] of Object.entries(users)) {
  if (user.shareCode) {
    updates[`shareCodeIndex/${user.shareCode}`] = {
      uid,
      displayName: user.displayName || 'Anonymous',
    };
    indexEntries += 1;
  }

  // RTDB stores arrays as objects with numeric keys; a code-keyed map has
  // 8-char alphanumeric keys, so numeric-keyed string values = old format.
  const shared = user.sharedPortfolios;
  if (shared && Object.values(shared).length > 0 && Object.keys(shared).every((k) => /^\d+$/.test(k))) {
    const converted = {};
    for (const code of Object.values(shared)) {
      const ownerUid = codeToUid[code];
      if (ownerUid) converted[ownerUid] = code;
      else console.warn(`  skipping unresolvable share code ${code} for user ${uid}`);
    }
    updates[`users/${uid}/sharedPortfolios`] = converted;
    convertedShareLists += 1;
  }
}

if (Object.keys(updates).length === 0) {
  console.log('Nothing to migrate.');
} else {
  await db.ref().update(updates);
  console.log(`Moved ${movedInvestments} investments, wrote ${indexEntries} share-code index entries, converted ${convertedShareLists} joined-portfolio lists, coerced ${coercedFields} string amounts to numbers.`);
}

process.exit(0);
