import { NextResponse } from "next/server";
import { signToken } from "../../../../lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body.email || '').toString().trim();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    // Issue a demo token (no password check since users are stored client-side)
    const token = signToken({ email });
    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
