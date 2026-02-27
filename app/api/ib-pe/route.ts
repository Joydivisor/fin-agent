import { NextResponse } from 'next/server';
import { IBPEEngine } from '../../lib/ib-pe-engine';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, params } = body;

        switch (type) {
            case 'cim': {
                const result = IBPEEngine.generateCIM(params);
                return NextResponse.json({ success: true, type: 'cim', result });
            }

            case 'deal_score': {
                const result = IBPEEngine.scoreDeal(params);
                return NextResponse.json({ success: true, type: 'deal_score', result });
            }

            case 'lbo': {
                const result = IBPEEngine.calculateLBO(params);
                return NextResponse.json({ success: true, type: 'lbo', result });
            }

            case 'comps': {
                const result = IBPEEngine.comparableAnalysis(params);
                return NextResponse.json({ success: true, type: 'comps', result });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown IB/PE operation: ${type}. Valid: cim, deal_score, lbo, comps` },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        console.error('IB/PE API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
