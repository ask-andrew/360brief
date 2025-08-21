import { NextResponse } from 'next/server';
import { PythonShell } from 'python-shell';
import path from 'path';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { messages, projectId } = await request.json();

    if (!messages || !Array.isArray(messages) || !projectId) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const options = {
      mode: 'text' as const,
      pythonPath: process.env.PYTHON_PATH || 'python3',
      pythonOptions: ['-u'], // unbuffered output
      scriptPath: path.join(process.cwd(), 'services'),
      args: [
        '--messages', JSON.stringify(messages),
        '--project-id', projectId
      ]
    };

    const pyshell = new PythonShell('summarize.py', options);
    let summary = '';
    let error = '';

    pyshell.on('message', function (message) {
      summary += message;
    });

    pyshell.on('error', function (err) {
      error += err.toString();
    });

    return new Promise<NextResponse>((resolve) => {
      pyshell.end(async function (err) {
        if (err || error) {
          console.error('PythonShell error:', err || error);
          return resolve(
            NextResponse.json(
              {
                error: 'Failed to generate summary',
                details: (err || error).toString()
              },
              { status: 500 }
            )
          );
        }

        try {
          const result = JSON.parse(summary);
          resolve(NextResponse.json(result));
        } catch (e: any) {
          console.error('Failed to parse Python output:', e);
          resolve(
            NextResponse.json(
              {
                error: 'Failed to process summary',
                details: e?.message || 'Unknown error occurred'
              },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error: unknown) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
