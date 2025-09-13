import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Python analysis service integration...')
    
    // Call our Python analysis service
    const analysisResponse = await fetch('http://localhost:8001/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        days_back: 7,
        max_results: 50,
        user_email: 'test@example.com'
      })
    })
    
    if (!analysisResponse.ok) {
      throw new Error(`Python service responded with status ${analysisResponse.status}`)
    }
    
    const analysisResult = await analysisResponse.json()
    console.log(`✅ Python analysis successful: ${analysisResult.success}`)
    
    if (analysisResult.success) {
      // Transform the analysis result into brief format
      const briefData = {
        executiveSummary: analysisResult.data.llm_digest,
        keyThemes: analysisResult.data.themes.map((t: any) => ({
          theme: t.keyword,
          frequency: t.frequency,
          description: `Key focus area identified across ${t.frequency} communications`
        })),
        keyPeople: analysisResult.data.key_people.map((p: any) => ({
          name: p.name,
          interactions: p.frequency,
          role: 'Key Contact'
        })),
        keyOrganizations: analysisResult.data.key_organizations.map((o: any) => ({
          name: o.name,
          mentions: o.frequency,
          context: 'Business Partner'
        })),
        emailsAwaitingResponse: analysisResult.data.emails_awaiting_response,
        upcomingMeetings: analysisResult.data.upcoming_meetings,
        metrics: analysisResult.data.executive_summary,
        dataSource: 'python_analysis_test',
        timestamp: new Date().toISOString()
      }
      
      return NextResponse.json({
        success: true,
        message: 'Python analysis service integration working!',
        briefData,
        pythonAnalysisData: analysisResult.data
      })
    }
    
    throw new Error('Python analysis returned unsuccessful response')
    
  } catch (error) {
    console.error('❌ Python analysis integration test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Python analysis service integration failed'
    }, { status: 500 })
  }
}