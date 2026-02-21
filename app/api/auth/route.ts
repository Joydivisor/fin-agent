import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { kv } from '@vercel/kv';

// 初始化邮件客户端
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // 新增接收前端传来的 password 字段
        const { action, email, code, password } = body;

        // 🌟 1. 发送验证码 (仅限新用户注册时触发)
        if (action === 'send') {
            const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // 存入数据库，10分钟过期
            if (process.env.KV_REST_API_URL) {
                await kv.set(`verify:${email}`, generatedCode, { ex: 600 });
            }

            if (resend) {
                await resend.emails.send({
                    from: 'Fin-Agent <onboarding@resend.dev>',
                    to: email,
                    subject: '【FIN-AGENT】您的系统注册验证码',
                    html: `
                    <div style="font-family: sans-serif; padding: 30px; background-color: #f8fafc; border-radius: 16px; max-width: 500px;">
                        <h2 style="color: #4f46e5; margin-bottom: 5px;">Welcome to FIN-AGENT</h2>
                        <p style="color: #334155; font-weight: bold;">您的专属数字终端注册验证码是：</p>
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

            console.log(`✉️ [Real Auth] Sent to ${email}`);
            return NextResponse.json({ success: true });
        }

        // 🌟 2. 验证并注册入库 (保存账号和密码)
        if (action === 'verify') {
            let isValid = false;

            if (process.env.KV_REST_API_URL) {
                const savedCode = await kv.get(`verify:${email}`);
                // 验证通过，或者使用万能开发者密码 123456
                if (String(savedCode) === String(code) || code === '123456') {
                    isValid = true;
                    await kv.del(`verify:${email}`); // 阅后即焚
                    
                    // 🎉 核心修改：注册成功，把用户的密码一并存入云端数据库！
                    await kv.set(`user:${email}`, { email, password, joinedAt: Date.now(), status: 'active' });
                }
            } else if (code === '123456') {
                isValid = true; // 本地未连接数据库时的保底机制
            }

            if (isValid) return NextResponse.json({ success: true });
            return NextResponse.json({ error: '验证码不正确或已过期，请重新发送。' }, { status: 400 });
        }

        // 🌟 3. 密码直接登录 (老用户专属，秒进主页)
        if (action === 'login') {
            if (process.env.KV_REST_API_URL) {
                // 去数据库查询该用户
                const user: any = await kv.get(`user:${email}`);
                
                if (!user) {
                    return NextResponse.json({ error: '账号不存在，请先注册 (Sign up)。' }, { status: 404 });
                }
                if (user.password !== password) {
                    return NextResponse.json({ error: '密码错误，请重试。' }, { status: 401 });
                }
                
                // 密码核对无误，直接放行！
                return NextResponse.json({ success: true });
            } else {
                // 本地未连接数据库时的保底机制
                if (password === '123456') return NextResponse.json({ success: true });
                return NextResponse.json({ error: '请连接 KV 数据库或使用测试密码 123456' }, { status: 401 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Auth Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}