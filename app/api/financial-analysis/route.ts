import { NextResponse } from 'next/server';
import { FinancialModeler } from '../../lib/financial-modeler';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, params } = body;

        switch (type) {
            case 'wacc': {
                const result = FinancialModeler.calculateWACC(params);
                return NextResponse.json({ success: true, type: 'wacc', result });
            }

            case 'dcf': {
                const result = FinancialModeler.calculateDCF(params);
                return NextResponse.json({ success: true, type: 'dcf', result });
            }

            case 'sensitivity': {
                const { dcfInputs, waccRange, growthRange } = params;
                const result = FinancialModeler.sensitivityAnalysis(dcfInputs, waccRange, growthRange);
                return NextResponse.json({ success: true, type: 'sensitivity', result });
            }

            case 'three_statement': {
                const result = FinancialModeler.buildThreeStatementModel(params);
                return NextResponse.json({ success: true, type: 'three_statement', result });
            }

            case 'black_scholes': {
                const result = FinancialModeler.blackScholes(params);
                return NextResponse.json({ success: true, type: 'black_scholes', result });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown analysis type: ${type}. Valid types: wacc, dcf, sensitivity, three_statement, black_scholes` },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        console.error('Financial Analysis API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
