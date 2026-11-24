import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_PUBLICATIONS, INITIAL_PAPERS } from '@/lib/seed-data';
import { computeSHA256 } from '@/lib/crypto';

export async function GET() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('verify_publication_chain');
    if (!error && data) {
      return NextResponse.json(data);
    }
  }

  // Server-side verification fallback
  let prevHash = 'GENESIS';
  const tampered: any[] = [];
  const pubs = [...INITIAL_PUBLICATIONS].sort(
    (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
  );

  for (const pub of pubs) {
    const paper = INITIAL_PAPERS.find((p) => p.paper_id === pub.paper_id);
    const fileHash = paper?.file_hash || '';

    if (pub.prev_block_hash !== prevHash) {
      tampered.push({
        pub_id: pub.pub_id,
        doi: pub.doi_string,
        issue: 'prev_block_hash mismatch',
        expected: prevHash,
        actual: pub.prev_block_hash,
      });
    }

    const payload = `${pub.prev_block_hash}${fileHash}${pub.doi_string}${pub.published_at}`;
    const expectedHash = await computeSHA256(payload);

    if (pub.record_hash !== expectedHash) {
      tampered.push({
        pub_id: pub.pub_id,
        doi: pub.doi_string,
        issue: 'record_hash mismatch',
        expected: expectedHash,
        actual: pub.record_hash,
      });
    }

    prevHash = pub.record_hash;
  }

  return NextResponse.json({
    valid: tampered.length === 0,
    total: pubs.length,
    tampered_count: tampered.length,
    tampered,
    message: tampered.length === 0 ? 'Chain Intact — 0 Tampered Records' : 'Integrity violations detected',
  });
}
