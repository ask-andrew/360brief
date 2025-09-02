import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check the actual schema of user_tokens table
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_tokens'
        ORDER BY ordinal_position;
      `
    });

    if (schemaError) {
      // Fallback: try to describe the table structure differently
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', 'user_tokens');

      return NextResponse.json({
        error: 'Schema query failed',
        schemaError,
        tablesError,
        tableExists: tables ? tables.length > 0 : false,
        fallbackTables: tables || []
      });
    }

    return NextResponse.json({
      success: true,
      schema: schemaData,
      tableName: 'user_tokens'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}