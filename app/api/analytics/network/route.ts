import { NextRequest, NextResponse } from 'next/server';

// Generate mock network analytics instead of relying on Python service
function generateMockNetworkData() {
  return {
    network_connections: [
      { 
        person: "Sarah Johnson", 
        email: "sarah.j@company.com", 
        connection_strength: 0.92,
        interaction_count: 47,
        last_interaction: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        person: "Mike Chen", 
        email: "m.chen@client.com", 
        connection_strength: 0.78,
        interaction_count: 23,
        last_interaction: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        person: "Alex Rivera", 
        email: "alex.r@company.com", 
        connection_strength: 0.65,
        interaction_count: 15,
        last_interaction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    network_metrics: {
      total_contacts: 156,
      active_this_week: 23,
      strong_connections: 8,
      new_connections: 3
    },
    metadata: {
      generated_at: new Date().toISOString(),
      data_source: "nextjs_mock_network_data"
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement direct Gmail integration for network analysis
    // For now, return mock data instead of relying on failing Python service
    console.log('🌐 Using built-in NextJS mock network data');
    
    const data = generateMockNetworkData();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Network API Error:', error);
    
    return NextResponse.json({
      nodes: [],
      connections: [],
      error: 'Network data service unavailable'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  }
}