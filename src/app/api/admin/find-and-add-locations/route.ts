import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  return NextResponse.json({ message: 'This endpoint is not used in the manual approach.' }, { status: 404 });
}
