import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

interface ApproveBody {
  code?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  let adminAuth: ReturnType<typeof getAdminAuth>;
  let adminDb: ReturnType<typeof getAdminDb>;
  try {
    adminAuth = getAdminAuth();
    adminDb = getAdminDb();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured. Missing Firebase Admin credentials." },
      { status: 500 }
    );
  }

  // 1. Verify the caller is an authenticated StudioX user
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let firebaseUID: string;
  try {
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    firebaseUID = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
  }

  // 2. Parse body
  let body: ApproveBody;
  try {
    body = (await request.json()) as ApproveBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }

  // 3. Look up the pairing record
  const pairingRef = adminDb.collection("claw_pairings").doc(code);
  const pairingSnap = await pairingRef.get();

  if (!pairingSnap.exists) {
    return NextResponse.json({ error: "Code not found. Generate a new one with /pair." }, { status: 404 });
  }

  const pairing = pairingSnap.data()!;

  // 4. Check expiry
  if (new Date(pairing["expiresAt"] as string) < new Date()) {
    return NextResponse.json({ error: "Code has expired. Generate a new one with /pair." }, { status: 410 });
  }

  // 5. Check not already used
  if (pairing["status"] === "approved") {
    return NextResponse.json({ error: "Code already used." }, { status: 409 });
  }

  const channelType = pairing["channelType"] as string;
  const channelUserId = pairing["channelUserId"] as string;
  const chatId = pairing["chatId"] as string;

  // 6. Atomic batch: approve pairing + create user link
  const batch = adminDb.batch();

  // Mark pairing as approved
  batch.update(pairingRef, { status: "approved", approvedAt: new Date().toISOString(), approvedBy: firebaseUID });

  // Create user link: channelType:channelUserId → firebaseUID
  const linkId = `${channelType}:${channelUserId}`;
  const linkRef = adminDb.collection("claw_user_links").doc(linkId);
  batch.set(linkRef, {
    firebaseUID,
    channelType,
    channelUserId,
    chatId,
    linkedAt: new Date().toISOString(),
  });

  await batch.commit();

  return NextResponse.json({
    success: true,
    channelType,
    channelUserId,
    message: "Account linked successfully",
  });
}
