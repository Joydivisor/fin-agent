import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@vercel/kv';

// 初始化邮件客户端
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // 新增接收前端传来的 password 字段
        const { action, email, code, password } = body;

        const emailValue = typeof email === 'string' ? email.trim() : '';
        const passwordValue = typeof password === 'string' ? password : '';
        const codeValue = typeof code === 'string' ? code : '';
        const kvUrl = process.env.finagent2_KV_REST_API_URL || process.env.KV_REST_API_URL;
        const kvToken = process.env.finagent2_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;
        const kvClient = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null;
        const hasKv = Boolean(kvClient);

        // 🌟 1. 发送验证码 (仅限新用户注册时触发)
        if (action === 'send') {
            if (!emailValue) {
                return NextResponse.json({ error: '邮箱不能为空。' }, { status: 400 });
            }
            const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // 存入数据库，10分钟过期
            if (hasKv) {
                await kvClient!.set(`verify:${emailValue}`, generatedCode, { ex: 600 });
            }

            if (resend) {
                await resend.emails.send({
                    from: 'Fin-Agent <onboarding@resend.dev>',
                    to: emailValue,
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
            if (!emailValue) {
                return NextResponse.json({ error: '邮箱不能为空。' }, { status: 400 });
            }
            if (!passwordValue) {
                return NextResponse.json({ error: '密码不能为空。' }, { status: 400 });
            }
            let isValid = false;

            if (hasKv) {
                const savedCode = await kvClient!.get(`verify:${emailValue}`);
                // 验证通过，或者使用万能开发者密码 123456
                if (String(savedCode) === String(codeValue) || codeValue === '123456') {
                    isValid = true;
                    await kvClient!.del(`verify:${emailValue}`); // 阅后即焚
                    
                    // 🎉 注册成功，把用户的密码一并存入云端数据库！
                    await kvClient!.set(`user:${emailValue}`, { email: emailValue, password: passwordValue, joinedAt: Date.now(), status: 'active' });
                }
            } else if (codeValue === '123456') {
                isValid = true; // 无 KV 也允许通过万能码完成注册流程
            }

            if (isValid) return NextResponse.json({ success: true });
            return NextResponse.json({ error: '验证码不正确或已过期，请重新发送。' }, { status: 400 });
        }

        // 🌟 3. 密码直接登录 (老用户专属，秒进主页)
        if (action === 'login') {
            if (!emailValue) {
                return NextResponse.json({ error: '邮箱不能为空。' }, { status: 400 });
            }
            if (!passwordValue) {
                return NextResponse.json({ error: '密码不能为空。' }, { status: 400 });
            }

            if (hasKv) {
                // 去数据库查询该用户
                const user: any = await kvClient!.get(`user:${emailValue}`);
                
                if (!user) {
                    return NextResponse.json({ error: '账号不存在，请先注册 (Sign up)。' }, { status: 404 });
                }

                if (!user.password) {
                    // Legacy users without a password can set it on first login.
                    await kvClient!.set(`user:${emailValue}`, { ...user, email: emailValue, password: passwordValue, status: 'active' });
                    return NextResponse.json({ success: true });
                }

                if (user.password !== passwordValue) {
                    return NextResponse.json({ error: '密码错误，请重试。' }, { status: 401 });
                }
                
                // 密码核对无误，直接放行！
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json({ error: '登录需要 KV 数据库支持，请配置 KV。' }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Auth Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}