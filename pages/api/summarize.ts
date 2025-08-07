import { NextApiRequest, NextApiResponse } from 'next';
import { PythonShell } from 'python-shell';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, projectId } = req.body;

  if (!messages || !Array.isArray(messages) || !projectId) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
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

    return new Promise((resolve) => {
      pyshell.end(function (err) {
        if (err || error) {
          console.error('PythonShell error:', err || error);
          return resolve(
            res.status(500).json({
              error: 'Failed to generate summary',
              details: (err || error).toString()
            })
          );
        }

        try {
          const result = JSON.parse(summary);
          resolve(res.status(200).json(result));
        } catch (e) {
          console.error('Failed to parse Python output:', e);
          resolve(
            res.status(500).json({
              error: 'Failed to process summary',
              details: e.message
            })
          );
        }
      });
    });
  } catch (error) {
    console.error('Summarization error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
