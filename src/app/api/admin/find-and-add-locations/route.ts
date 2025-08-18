import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'This endpoint is not used in the manual approach.' }, { status: 404 });
}
