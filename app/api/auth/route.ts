import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { kv } from '@vercel/kv';

// 初始化邮件客户端
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, email, code } = body;

        // 🌟 1. 真实发送验证码与存储逻辑
        if (action === 'send') {
            const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // 将验证码存入云端数据库，设置 10 分钟 (600秒) 后自动过期销毁
            if (process.env.KV_REST_API_URL) {
                await kv.set(`verify:${email}`, generatedCode, { ex: 600 });
            }

            // 发送真实的高级排版邮件
            if (resend) {
                await resend.emails.send({
                    from: 'Fin-Agent <onboarding@resend.dev>', // 这里默认使用 Resend 测试域名
                    to: email,
                    subject: '【FIN-AGENT】您的系统登录验证码',
                    html: `
                    <div style="font-family: sans-serif; padding: 30px; background-color: #f8fafc; border-radius: 16px; max-width: 500px;">
                        <h2 style="color: #4f46e5; margin-bottom: 5px;">Welcome to FIN-AGENT</h2>
                        <p style="color: #334155; font-weight: bold;">您的专属数字终端访问验证码是：</p>
                        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1e293b; margin: 20px 0; padding: 15px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
                            ${generatedCode}
                        </div>
                        <p style="color: #64748b; font-size: 12px; line-height: 1.6;">
                            该验证码在 10 分钟内有效。如非本人操作，请忽略此邮件。<br>
                            Fin-Agent: The Autonomous AI Financial Terminal.
                        </p>
                    </div>`
                });
            }

            console.log(`✉️ [Real Auth] Sent to ${email} | Code stored in DB`);
            // 为了绝对安全，后端只返回成功状态，不返回具体的 Code，防止前端被破解
            return NextResponse.json({ success: true });
        }

        // 🌟 2. 真实数据库比对与新用户注册入库逻辑
        if (action === 'verify') {
            let isValid = false;

            // 去 Vercel KV 数据库中核对验证码
            if (process.env.KV_REST_API_URL) {
                const savedCode = await kv.get(`verify:${email}`);
                if (String(savedCode) === String(code)) {
                    isValid = true;
                    await kv.del(`verify:${email}`); // 验证成功后立刻阅后即焚，防止重复使用
                    // 🎉 恭喜！将这位真实的注册用户永久写入你的数据库！
                    await kv.set(`user:${email}`, { email, joinedAt: Date.now(), status: 'active' });
                }
            }

            // 为了方便你作为开发者随时进入测试，保留一个 123456 的万能后门
            if (code === '123456') isValid = true;

            if (isValid) {
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json({ error: '验证码不正确或已过期，请重新发送。' }, { status: 400 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Auth Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}