import { NextResponse } from 'next/server';
import { deleteArticle } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const success = await deleteArticle(id);

    if (success) {
      return NextResponse.json({ success: true, message: 'Artigo movido para a lixeira.' });
    } else {
      return NextResponse.json({ error: 'Falha ao deletar artigo no banco de dados.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro na rota de delete:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
