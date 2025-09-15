import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Python analysis service integration...')
    
    // Call our Python intelligence service
    const analysisResponse = await fetch('http://localhost:8001/generate-brief', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'test@example.com',
        days_back: 7,
        filter_marketing: true,
        emails: [
          {
            id: 'test-1',
            subject: 'Q4 Revenue Report - Urgent Review Needed',
            from: 'ceo@company.com',
            to: ['test@example.com'],
            date: '2025-01-14T09:00:00Z',
            body: 'The Q4 revenue numbers are in and we need to discuss them urgently. Our growth is below projections by 15%. Please review the attached report and prepare recommendations for the board meeting tomorrow.',
            labels: ['important', 'urgent']
          }
        ]
      })
    })
    
    if (!analysisResponse.ok) {
      throw new Error(`Python service responded with status ${analysisResponse.status}`)
    }
    
    const analysisResult = await analysisResponse.json()
    console.log(`✅ Python analysis successful: ${analysisResult.success}`)
    
    if (analysisResult) {
      // The intelligence service returns the brief directly
      return NextResponse.json({
        success: true,
        message: 'Python intelligence service integration working!',
        dataSource: analysisResult.dataSource || 'python_intelligence_service',
        userId: analysisResult.userId,
        executiveSummary: analysisResult.executiveSummary,
        keyInsights: analysisResult.keyInsights,
        priorityItems: analysisResult.priorityItems,
        businessSignals: analysisResult.businessSignals,
        processing_metadata: analysisResult.processing_metadata,
        intelligenceBrief: analysisResult
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