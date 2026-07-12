import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request) {
  try {
    const data = await request.json();
    const { templateName, slug, coupleName, groomName, brideName, pin } = data;

    // Kunci Rahasia untuk mengakses WIM Online
    if (pin !== 'STORYKAMI123') {
      return NextResponse.json({ error: 'PIN salah! Anda tidak berhak membuat undangan.' }, { status: 403 });
    }

    if (!templateName || !slug || !coupleName || !groomName || !brideName) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi.' }, { status: 400 });
    }

    // Insert ke Supabase
    const { data: insertData, error } = await supabase
      .from('invitations')
      .insert([
        {
          slug: slug,
          template_name: templateName,
          data: {
            coupleName,
            groomName,
            brideName,
            showLoveStory: true, // Default
            showGift: true,      // Default
          }
        }
      ])
      .select();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `Slug '${slug}' sudah dipakai. Silakan gunakan yang lain.` }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sukses! Undangan langsung online di https://storykami.my.id/${slug}` 
    });

  } catch (error) {
    console.error('WIM API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
